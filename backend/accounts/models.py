from django.db import models


class Member(models.Model):
    """회원정보DB"""

    회원_index = models.AutoField(primary_key=True)
    회원id = models.CharField(max_length=50, unique=True)
    회원비밀번호 = models.CharField(max_length=255)
    이름 = models.CharField(max_length=50)
    연락처 = models.CharField(max_length=20)
    아파트동 = models.IntegerField()
    아파트호수 = models.IntegerField()
    아파트평수 = models.IntegerField()
    가구원수 = models.IntegerField()

    class Meta:
        db_table = "회원정보"

    def __str__(self):
        return f"{self.회원id} ({self.아파트동}동 {self.아파트호수}호)"
