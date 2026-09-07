import json

from django.conf import settings

FALLBACK_RESPONSE = {
    "원인분석": (
        "현재 AI 분석 서비스를 일시적으로 사용할 수 없습니다. "
        "일반적으로 관리비 증가는 전기/수도/가스 사용량 증가나 계절적 요인(냉난방)에서 비롯됩니다."
    ),
    "절약팁": [
        "사용하지 않는 조명·전자기기의 플러그를 뽑아두세요.",
        "냉난방 적정 온도(여름 26도, 겨울 20도)를 유지하세요.",
        "수도 절약형 샤워기 헤드를 사용해보세요.",
    ],
    "fallback": True,
}


def build_prompt(summary: dict) -> str:
    """스펙이 명시한 4개 데이터(이번달/전월/같은평수평균/같은평수_가구원수평균)로 프롬프트 구성."""
    payload = {
        "이번달": summary.get("이번달"),
        "전월": summary.get("전월"),
        "같은평수평균": summary.get("같은평수평균"),
        "같은평수_가구원수평균": summary.get("같은평수_가구원수평균"),
    }
    return (
        "당신은 아파트 관리비 분석 전문가입니다. 아래 JSON 데이터를 참고하여 "
        "이번 달 관리비가 왜 늘었는지(혹은 줄었는지) 항목별로 원인을 분석하고, "
        "실천 가능한 절약 팁을 제시하세요.\n\n"
        f"데이터:\n{json.dumps(payload, ensure_ascii=False, indent=2)}\n\n"
        "반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):\n"
        '{"원인분석": "<항목별 원인 분석 문장>", "절약팁": ["<팁1>", "<팁2>", "<팁3>"]}'
    )


def call_llm(prompt: str) -> dict:
    if not settings.ANTHROPIC_API_KEY:
        return FALLBACK_RESPONSE

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text
        parsed = json.loads(text)
        if "원인분석" not in parsed or "절약팁" not in parsed:
            raise ValueError("응답 형식이 예상과 다릅니다.")
        parsed["fallback"] = False
        return parsed
    except Exception:
        return FALLBACK_RESPONSE


def analyze(summary: dict) -> dict:
    prompt = build_prompt(summary)
    return call_llm(prompt)
