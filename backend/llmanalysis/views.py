import re

from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsMemberAuthenticated
from accounts.views import get_current_member
from feemgmt.services import build_summary

from .services import analyze

YEAR_MONTH_RE = re.compile(r"^\d{8}$")


class AnalysisView(APIView):
    permission_classes = [IsMemberAuthenticated]

    def get(self, request):
        year_month = request.query_params.get("year_month", "")
        if not YEAR_MONTH_RE.match(year_month):
            return Response({"detail": "year_month은 YYYYMMDD 형식이어야 합니다."}, status=400)

        member = get_current_member(request)
        summary = build_summary(member, year_month)
        if summary is None:
            return Response({"detail": "해당 월의 관리비 데이터가 없습니다."}, status=404)

        result = analyze(summary)
        return Response(result)
