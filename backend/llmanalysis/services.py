import json
import logging

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

COMPARISON_KEYS = ["이번달", "전월", "같은평수평균", "같은평수_가구원수평균"]

FALLBACK_MESSAGE = "지금은 AI 분석을 불러올 수 없습니다. 잠시 후 다시 시도해주세요."

SYSTEM_PROMPT = """당신은 아파트 관리비 분석 도우미입니다. 간결한 존댓말로 답하세요.
반드시 아래 JSON 스키마로만 응답하고, 스키마 밖의 다른 텍스트는 절대 포함하지 마세요.

{
  "요약": "<이번달 관리비 변화를 한 문장으로 요약>",
  "항목별원인": [
    {"항목": "<항목명>", "비교기준": "<전월 | 같은평수평균 | 같은평수+가구원수평균>", "증감액": <정수>, "증감률": <퍼센트 숫자, 예: 12.5는 12.5%를 의미함 (0.125 아님)>, "설명": "<원인 설명 문장>"}
  ],
  "절약팁": ["<팁1>", "<팁2>"]
}

규칙:
1. 전기세/수도세/가스비(세대별 항목)만 절약팁의 대상입니다. 일반관리비/공동전기료/청소비/경비비/승강기전기료/수선유지비 같은 단지·동 공통 항목은 "단지 전체 요금 인상" 등으로만 설명하고, 이 항목들에 대한 절약팁은 만들지 마세요.
2. 항목별 증감률(전월 또는 평수 평균 대비)이 5% 미만이면 그 항목은 "항목별원인"에 포함하지 말고, 특별한 증가 요인이 없다는 취지로 "요약"을 작성한 뒤 일반적인 절약팁만 제공하세요.
3. 제공되지 않은(누락된) 비교 기준에 대해서는 언급하거나 추측하지 마세요.
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
    return (
        "아래는 한 세대의 이번달 관리비와 비교 데이터입니다. "
        "이번 달 관리비가 왜 늘었는지(혹은 줄었는지) 항목별로 분석하고 절약팁을 제시하세요.\n\n"
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
