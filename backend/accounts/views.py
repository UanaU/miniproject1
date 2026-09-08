from django.contrib.auth.hashers import check_password, make_password
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Member
from .permissions import IsMemberAuthenticated
from .serializers import MemberSerializer, MemberUpdateSerializer

SIGNUP_REQUIRED_FIELDS = [
    "회원id", "회원비밀번호", "이름", "연락처",
    "아파트동", "아파트호수", "아파트평수", "가구원수",
]


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


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        missing = [f for f in SIGNUP_REQUIRED_FIELDS if not str(data.get(f, "")).strip()]
        if missing:
            return Response(
                {"detail": f"다음 항목을 입력해주세요: {', '.join(missing)}"}, status=400
            )

        if Member.objects.filter(회원id=data["회원id"]).exists():
            return Response({"detail": "이미 사용 중인 아이디입니다."}, status=409)

        try:
            member = Member.objects.create(
                회원id=data["회원id"],
                회원비밀번호=make_password(data["회원비밀번호"]),
                이름=data["이름"],
                연락처=data["연락처"],
                아파트동=int(data["아파트동"]),
                아파트호수=int(data["아파트호수"]),
                아파트평수=int(data["아파트평수"]),
                가구원수=int(data["가구원수"]),
            )
        except (ValueError, TypeError):
            return Response({"detail": "입력값 형식이 올바르지 않습니다."}, status=400)

        return Response(MemberSerializer(member).data, status=201)


class MyPageView(APIView):
    permission_classes = [IsMemberAuthenticated]

    def get(self, request):
        member = get_current_member(request)
        if member is None:
            return Response({"detail": "인증이 필요합니다."}, status=401)
        return Response(MemberSerializer(member).data)

    def patch(self, request):
        member = get_current_member(request)
        if member is None:
            return Response({"detail": "인증이 필요합니다."}, status=401)

        serializer = MemberUpdateSerializer(member, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MemberSerializer(member).data)
