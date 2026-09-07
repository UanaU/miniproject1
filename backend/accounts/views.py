from django.contrib.auth.hashers import check_password
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Member
from .permissions import IsMemberAuthenticated
from .serializers import MemberSerializer


def get_current_member(request):
    member_id = request.session.get("member_id")
    if not member_id:
        return None
    return Member.objects.filter(회원_index=member_id).first()


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"csrftoken": get_token(request)})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        member_id_input = request.data.get("회원id", "")
        password = request.data.get("회원비밀번호", "")

        member = Member.objects.filter(회원id=member_id_input).first()
        if member is None or not check_password(password, member.회원비밀번호):
            return Response({"detail": "아이디 또는 비밀번호가 올바르지 않습니다."}, status=401)

        request.session["member_id"] = member.회원_index
        return Response(MemberSerializer(member).data)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        request.session.flush()
        return Response(status=204)


class MyPageView(APIView):
    permission_classes = [IsMemberAuthenticated]

    def get(self, request):
        member = get_current_member(request)
        if member is None:
            return Response({"detail": "인증이 필요합니다."}, status=401)
        return Response(MemberSerializer(member).data)
