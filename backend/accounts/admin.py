from django.contrib import admin

from .models import Member


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ("회원_index", "회원id", "이름", "아파트동", "아파트호수", "아파트평수", "가구원수")
    search_fields = ("회원id", "이름")
