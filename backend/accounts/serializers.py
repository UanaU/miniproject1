from rest_framework import serializers

from .models import Member


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = [
            "회원_index", "회원id", "이름", "연락처",
            "아파트동", "아파트호수", "아파트평수", "가구원수",
        ]
