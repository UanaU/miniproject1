import csv

from django.conf import settings
from django.contrib.auth.hashers import PBKDF2PasswordHasher
from django.core.management.base import BaseCommand
from django.db import connection, transaction

from accounts.models import Member
from feemgmt.models import ManagementFee

DUMMY_DIR = settings.BASE_DIR.parent / "dummy_data"

BOOL_TRUE = {"true", "1", "True"}

# 더미/데모 로그인 계정 전용 - 기본(870,000회) 대신 훨씬 적은 반복 횟수로 빠르게 해싱한다.
# pbkdf2_sha256 해시 문자열 자체에 반복 횟수가 포함되므로 check_password()는
# 이 값과 무관하게 항상 정상적으로 검증한다.
_FAST_HASHER = PBKDF2PasswordHasher()
_FAST_HASHER.iterations = 4000


def hash_password(raw_password: str) -> str:
    return _FAST_HASHER.encode(raw_password, _FAST_HASHER.salt())


class Command(BaseCommand):
    help = "dummy_data/*.csv 를 읽어 DB를 초기화 후 재적재한다 (데모 전 재실행 가능)."

    def handle(self, *args, **options):
        members_csv = DUMMY_DIR / "members.csv"
        fees_csv = DUMMY_DIR / "management_fees.csv"

        if not members_csv.exists() or not fees_csv.exists():
            self.stderr.write(self.style.ERROR(
                f"{DUMMY_DIR} 에 members.csv / management_fees.csv 가 없습니다. "
                "먼저 python generate_dummy_data.py 를 실행하세요."
            ))
            return

        with transaction.atomic():
            self.stdout.write("기존 데이터 삭제 중...")
            ManagementFee.objects.all().delete()
            Member.objects.all().delete()
            with connection.cursor() as cursor:
                cursor.execute("ALTER TABLE `관리비` AUTO_INCREMENT = 1")
                cursor.execute("ALTER TABLE `회원정보` AUTO_INCREMENT = 1")

            self.stdout.write("회원 데이터 적재 중...")
            members = []
            with open(members_csv, encoding="utf-8-sig") as f:
                for row in csv.DictReader(f):
                    members.append(Member(
                        회원_index=int(row["회원_index"]),
                        회원id=row["회원id"],
                        회원비밀번호=hash_password(row["회원비밀번호"]),
                        이름=row["이름"],
                        연락처=row["연락처"],
                        아파트동=int(row["아파트동"]),
                        아파트호수=int(row["아파트호수"]),
                        아파트평수=int(row["아파트평수"]),
                        가구원수=int(row["가구원수"]),
                    ))
            Member.objects.bulk_create(members, batch_size=500)
            self.stdout.write(self.style.SUCCESS(f"회원 {len(members)}명 적재 완료"))

            self.stdout.write("관리비 데이터 적재 중...")
            fees = []
            with open(fees_csv, encoding="utf-8-sig") as f:
                for row in csv.DictReader(f):
                    fees.append(ManagementFee(
                        관리비_index=int(row["관리비_index"]),
                        회원_id=int(row["회원_index"]),
                        청구년월=row["청구년월"],
                        납부상태=row["납부상태"] in BOOL_TRUE,
                        합계금액=int(row["합계금액"]),
                        전기세=int(row["전기세"]),
                        수도세=int(row["수도세"]),
                        가스비=int(row["가스비"]),
                        일반관리비=int(row["일반관리비"]),
                        공동전기료=int(row["공동전기료"]),
                        청소비=int(row["청소비"]),
                        경비비=int(row["경비비"]),
                        승강기전기료=int(row["승강기전기료"]),
                        수선유지비=int(row["수선유지비"]),
                    ))
            ManagementFee.objects.bulk_create(fees, batch_size=500)
            self.stdout.write(self.style.SUCCESS(f"관리비 레코드 {len(fees)}건 적재 완료"))

        self.stdout.write(self.style.SUCCESS("더미데이터 적재 완료"))
