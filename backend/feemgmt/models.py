from django.db import models

from accounts.models import Member


class ManagementFee(models.Model):
    """관리비DB"""

    관리비_index = models.AutoField(primary_key=True)
    회원 = models.ForeignKey(
        Member, on_delete=models.CASCADE, db_column="회원_index", related_name="관리비목록"
    )
    청구년월 = models.CharField(max_length=8)  # "YYYYMMDD", 항상 해당월 1일
    납부상태 = models.BooleanField(default=True)
    합계금액 = models.IntegerField()

    # [세대별] 세대마다 다름
    전기세 = models.IntegerField()
    수도세 = models.IntegerField()
    가스비 = models.IntegerField()

    # [단지 공통] 같은 단지 전체 동일
    일반관리비 = models.IntegerField()
    공동전기료 = models.IntegerField()
    청소비 = models.IntegerField()
    경비비 = models.IntegerField()

    # [동 공통] 같은 동끼리만 동일
    승강기전기료 = models.IntegerField()
    수선유지비 = models.IntegerField()

    class Meta:
        db_table = "관리비"
        unique_together = (("회원", "청구년월"),)
        indexes = [models.Index(fields=["청구년월"])]

    def __str__(self):
        return f"{self.회원_id} {self.청구년월} {self.합계금액}원"
