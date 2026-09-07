from django.contrib import admin

from .models import ManagementFee


@admin.register(ManagementFee)
class ManagementFeeAdmin(admin.ModelAdmin):
    list_display = ("관리비_index", "회원", "청구년월", "합계금액", "납부상태")
    list_filter = ("청구년월", "납부상태")
    search_fields = ("회원__회원id",)
