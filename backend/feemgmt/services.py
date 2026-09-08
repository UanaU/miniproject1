from django.db.models import Avg

from .models import ManagementFee

세대별_FIELDS = ["전기세", "수도세", "가스비"]
단지공통_FIELDS = ["일반관리비", "공동전기료", "청소비", "경비비"]
동공통_FIELDS = ["승강기전기료", "수선유지비"]
ALL_NUMERIC_FIELDS = ["합계금액"] + 세대별_FIELDS + 단지공통_FIELDS + 동공통_FIELDS


def _shift_year_month(year_month: str, year_delta: int = 0, month_delta: int = 0) -> str:
    year = int(year_month[0:4])
    month = int(year_month[4:6])
    total = year * 12 + (month - 1) + year_delta * 12 + month_delta
    y, m = divmod(total, 12)
    return f"{y}{m + 1:02d}01"


def _no_data(year_month: str) -> dict:
    return {"청구년월": year_month, "데이터없음": True, "메시지": "비교 데이터 없음"}


def _serialize_single(fee: ManagementFee) -> dict:
    return {
        "청구년월": fee.청구년월,
        "합계금액": fee.합계금액,
        "세대별": {f: getattr(fee, f) for f in 세대별_FIELDS},
        "단지공통": {f: getattr(fee, f) for f in 단지공통_FIELDS},
        "동공통": {f: getattr(fee, f) for f in 동공통_FIELDS},
    }


def _serialize_aggregate(agg: dict, extra: dict | None = None) -> dict:
    result = {
        "합계금액": round(agg["합계금액__avg"]),
        "세대별": {f: round(agg[f"{f}__avg"]) for f in 세대별_FIELDS},
        "단지공통": {f: round(agg[f"{f}__avg"]) for f in 단지공통_FIELDS},
        "동공통": {f: round(agg[f"{f}__avg"]) for f in 동공통_FIELDS},
    }
    if extra:
        result.update(extra)
    return result


def build_summary(member, year_month: str) -> dict:
    """CLAUDE.md의 GET /api/managementfee/summary 응답 형식을 그대로 구성한다."""
    this_month = ManagementFee.objects.filter(회원=member, 청구년월=year_month).first()
    if this_month is None:
        return None

    prev_ym = _shift_year_month(year_month, month_delta=-1)
    prev = ManagementFee.objects.filter(회원=member, 청구년월=prev_ym).first()

    last_year_ym = _shift_year_month(year_month, year_delta=-1)
    last_year = ManagementFee.objects.filter(회원=member, 청구년월=last_year_ym).first()

    same_size_qs = ManagementFee.objects.filter(
        청구년월=year_month, 회원__아파트평수=member.아파트평수
    )
    same_size_agg = same_size_qs.aggregate(**{f"{f}__avg": Avg(f) for f in ALL_NUMERIC_FIELDS})

    same_size_household_qs = same_size_qs.filter(회원__가구원수=member.가구원수)
    same_size_household_agg = same_size_household_qs.aggregate(
        **{f"{f}__avg": Avg(f) for f in ALL_NUMERIC_FIELDS}
    )

    return {
        "이번달": _serialize_single(this_month),
        "전월": _serialize_single(prev) if prev else _no_data(prev_ym),
        "같은평수평균": (
            _serialize_aggregate(same_size_agg)
            if same_size_agg["합계금액__avg"] is not None
            else {"데이터없음": True, "메시지": "비교 데이터 없음"}
        ),
        "같은평수_가구원수평균": (
            _serialize_aggregate(
                same_size_household_agg,
                extra={"기준": {"평수": member.아파트평수, "가구원수": member.가구원수}},
            )
            if same_size_household_agg["합계금액__avg"] is not None
            else {
                "데이터없음": True,
                "메시지": "비교 데이터 없음",
                "기준": {"평수": member.아파트평수, "가구원수": member.가구원수},
            }
        ),
        "작년동월": _serialize_single(last_year) if last_year else _no_data(last_year_ym),
    }


def build_history(member) -> list[dict]:
    """해당 회원의 전체 보유 개월 관리비 내역을 청구년월 오름차순으로 반환."""
    records = ManagementFee.objects.filter(회원=member).order_by("청구년월")
    return [
        {
            "청구년월": r.청구년월,
            "합계금액": r.합계금액,
            "전기세": r.전기세,
            "수도세": r.수도세,
            "가스비": r.가스비,
        }
        for r in records
    ]


def derive_common_values(member, year_month: str) -> tuple[dict, dict]:
    """새로 등록할 레코드의 단지공통/동공통 항목값을 기존 데이터에서 유추한다.

    단지공통은 같은 청구년월의 다른 세대 값을 그대로 쓰고(없으면 가장 최근 값),
    동공통은 같은 동의 같은 청구년월 값을 쓰고(없으면 같은 동의 가장 최근 값) 사용한다.
    """
    complex_source = ManagementFee.objects.filter(청구년월=year_month).first()
    if complex_source is None:
        complex_source = ManagementFee.objects.order_by("-청구년월").first()
    단지공통 = (
        {f: getattr(complex_source, f) for f in 단지공통_FIELDS}
        if complex_source
        else {f: 0 for f in 단지공통_FIELDS}
    )

    building_source = ManagementFee.objects.filter(
        청구년월=year_month, 회원__아파트동=member.아파트동
    ).first()
    if building_source is None:
        building_source = (
            ManagementFee.objects.filter(회원__아파트동=member.아파트동)
            .order_by("-청구년월")
            .first()
        )
    동공통 = (
        {f: getattr(building_source, f) for f in 동공통_FIELDS}
        if building_source
        else {f: 0 for f in 동공통_FIELDS}
    )

    return 단지공통, 동공통
