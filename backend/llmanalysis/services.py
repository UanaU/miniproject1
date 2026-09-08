import json
import logging

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

COMPARISON_KEYS = ["이번달", "전월", "작년동월", "같은평수평균", "같은평수_가구원수평균"]

FALLBACK_MESSAGE = "지금은 AI 분석을 불러올 수 없습니다. 잠시 후 다시 시도해주세요."

SYSTEM_PROMPT = """당신은 아파트 관리비 분석 전문가입니다. 간결한 존댓말로 답하되, 분석에는 반드시 구체적인
금액(원)과 비율(%)을 함께 제시하세요.
반드시 아래 JSON 스키마로만 응답하고, 스키마 밖의 다른 텍스트는 절대 포함하지 마세요.

{
  "요약": "<이번달 총관리비를 기준으로, '내 관리비 비교'(전월·작년 동월)와 '다른 세대와 비교'(같은 평수 평균·
    같은 평수+가구원수 평균) 결과를 모두 종합해 구체적인 증감액(원)과 증감률(%)을 함께 언급하는 2~3문장의
    종합 분석>",
  "항목별원인": [
    {"항목": "<항목명>", "비교기준": "<전월 | 작년동월 | 같은평수평균 | 같은평수+가구원수평균>", "증감액": <정수>, "증감률": <퍼센트 숫자, 예: 12.5는 12.5%를 의미함 (0.125 아님)>, "설명": "<수치를 근거로 한 원인 설명 문장>"}
  ],
  "절약팁": ["<청구년월의 계절/월에 맞춘 구체적인 절약팁1>", "<팁2>", "<팁3>"]
}

규칙:
1. "요약"은 반드시 제공된 비교 기준을 모두 종합해서 작성하세요 — 내 과거 관리비(전월/작년 동월) 대비
   추세와, 단지 내 다른 세대(같은 평수/같은 평수+가구원수) 대비 위치를 함께 언급해 예를 들어 "내 관리비가
   지난달보다는 늘었지만 이웃 평균보다는 낮다"처럼 균형 잡힌 해석을 숫자와 함께 제시하세요. 제공되지
   않은(누락된) 비교 기준은 언급하거나 추측하지 마세요.
2. 전기세/수도세/가스비(세대별 항목)만 절약팁의 대상입니다. 일반관리비/공동전기료/청소비/경비비/
   승강기전기료/수선유지비 같은 단지·동 공통 항목은 "단지 전체 요금 인상" 등으로만 설명하고, 이 항목들에
   대한 절약팁은 만들지 마세요.
3. "항목별원인"은 항목과 비교 기준의 조합마다 증감률(절대값)이 5% 이상인 경우에만 포함하세요. 같은 항목이
   라도 여러 비교 기준(예: 전월 대비, 같은평수 대비)에서 각각 5% 이상이면 기준마다 별도 항목으로 넣으세요.
   5% 이상인 조합이 하나도 없으면 "항목별원인"은 빈 배열로 두고, "요약"에 특별한 변동 요인이 없다는 취지를
   수치와 함께 담으세요.
4. 데이터의 "이번달"의 "청구년월"(YYYYMMDD) 중 월(MM)을 확인해 계절을 판단하세요 (03~05월: 봄, 06~08월:
   여름, 09~11월: 가을, 12~02월: 겨울). "절약팁"은 반드시 그 계절/월에 맞는 구체적인 조언을 우선
   제시하세요 (예: 여름은 냉방기 전기세, 겨울은 난방 가스비/전기세, 환절기는 결로·누수로 인한 수도세 등).
"""


def build_user_payload(body: dict) -> dict:
    """비교 데이터가 없는(데이터없음) 키는 제외하고 LLM에 전달할 데이터를 구성한다."""
    payload = {}
    for key in COMPARISON_KEYS:
        value = body.get(key)
        if not value or value.get("데이터없음"):
            continue
        payload[key] = value
    return payload


def build_user_prompt(payload: dict) -> str:
    year_month = payload.get("이번달", {}).get("청구년월", "")
    month_hint = f" (청구년월: {year_month})" if year_month else ""
    return (
        f"아래는 한 세대의 이번달 관리비와 비교 데이터{month_hint}입니다. "
        "내 관리비 비교(전월/작년 동월)와 다른 세대와의 비교(같은 평수 평균/같은 평수+가구원수 평균)를 "
        "모두 종합적으로 고려해 이번 달 관리비가 왜 늘었는지(혹은 줄었는지) 수치를 근거로 분석하고, "
        "청구년월의 계절에 맞는 절약팁을 제시하세요.\n\n"
        f"데이터:\n{json.dumps(payload, ensure_ascii=False, indent=2)}"
    )


def call_llm(user_prompt: str) -> dict | None:
    if not settings.GEMINI_API_KEY:
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                http_options=types.HttpOptions(timeout=10000),  # 밀리초
            ),
        )
        parsed = json.loads(response.text)
        if not all(k in parsed for k in ("요약", "항목별원인", "절약팁")):
            raise ValueError("응답에 필수 키가 없습니다.")
        return parsed
    except Exception:
        logger.warning("AI 원인분석 응답 파싱/호출 실패", exc_info=True)
        return None


def analyze(body: dict) -> dict:
    payload = build_user_payload(body)
    user_prompt = build_user_prompt(payload)
    result = call_llm(user_prompt)

    if result is None:
        return {
            "분석결과": None,
            "폴백여부": True,
            "폴백메시지": FALLBACK_MESSAGE,
        }

    return {
        "분석결과": result,
        "생성시각": timezone.now().isoformat(),
        "폴백여부": False,
    }
