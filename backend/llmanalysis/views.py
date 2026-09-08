from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsMemberAuthenticated

from .services import analyze


class AnalysisView(APIView):
    permission_classes = [IsMemberAuthenticated]

    def post(self, request):
        body = request.data
        if not isinstance(body, dict) or not (body.get("이번달") or {}).get("합계금액"):
            return Response({"detail": "이번달 관리비 요약 데이터가 필요합니다."}, status=400)

        result = analyze(body)
        return Response(result)
