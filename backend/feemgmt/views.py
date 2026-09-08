import re

from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsMemberAuthenticated
from accounts.views import get_current_member

from .models import ManagementFee
from .services import _serialize_single, build_history, build_summary, derive_common_values

YEAR_MONTH_RE = re.compile(r"^\d{8}$")


class SummaryView(APIView):
    permission_classes = [IsMemberAuthenticated]

    def get(self, request):
        year_month = request.query_params.get("year_month", "")
        if not YEAR_MONTH_RE.match(year_month):
            return Response({"detail": "year_month은 YYYYMMDD 형식이어야 합니다."}, status=400)

        member = get_current_member(request)
        summary = build_summary(member, year_month)
        if summary is None:
            return Response({"detail": "해당 월의 관리비 데이터가 없습니다."}, status=404)
        return Response(summary)


class HistoryView(APIView):
    permission_classes = [IsMemberAuthenticated]

    def get(self, request):
        member = get_current_member(request)
        return Response(build_history(member))


class RegisterView(APIView):
    permission_classes = [IsMemberAuthenticated]

    def post(self, request):
        member = get_current_member(request)
        data = request.data

        year_month = str(data.get("청구년월", ""))
        if not YEAR_MONTH_RE.match(year_month):
            return Response({"detail": "청구년월은 YYYYMMDD 형식이어야 합니다."}, status=400)

        if ManagementFee.objects.filter(회원=member, 청구년월=year_month).exists():
            return Response({"detail": "이미 등록된 청구년월입니다."}, status=409)

        try:
            전기세 = int(data["전기세"])
            수도세 = int(data["수도세"])
            가스비 = int(data["가스비"])
        except (KeyError, ValueError, TypeError):
            return Response({"detail": "전기세/수도세/가스비를 올바르게 입력해주세요."}, status=400)

        납부상태 = bool(data.get("납부상태", True))
        단지공통, 동공통 = derive_common_values(member, year_month)
        합계금액 = 전기세 + 수도세 + 가스비 + sum(단지공통.values()) + sum(동공통.values())

        fee = ManagementFee.objects.create(
            회원=member,
            청구년월=year_month,
            납부상태=납부상태,
            합계금액=합계금액,
            전기세=전기세,
            수도세=수도세,
            가스비=가스비,
            **단지공통,
            **동공통,
        )
        return Response(_serialize_single(fee), status=201)
