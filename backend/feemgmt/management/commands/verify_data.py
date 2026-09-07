from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "DB에 실제 적재된 데이터가 관리비 항목 산정 원칙을 만족하는지 raw SQL로 검증한다."

    def handle(self, *args, **options):
        ok = True
        with connection.cursor() as cursor:
            self.stdout.write("회원/관리비 레코드 수 확인...")
            cursor.execute("SELECT COUNT(*) FROM `회원정보`")
            member_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM `관리비`")
            fee_count = cursor.fetchone()[0]
            self.stdout.write(f"  회원: {member_count}, 관리비 레코드: {fee_count}")

            self.stdout.write("단지공통 항목(일반관리비/공동전기료/청소비/경비비) 월별 전세대 동일 여부...")
            cursor.execute("""
                SELECT 청구년월,
                       COUNT(DISTINCT 일반관리비) d1,
                       COUNT(DISTINCT 공동전기료) d2,
                       COUNT(DISTINCT 청소비) d3,
                       COUNT(DISTINCT 경비비) d4
                FROM `관리비`
                GROUP BY 청구년월
                HAVING d1 > 1 OR d2 > 1 OR d3 > 1 OR d4 > 1
            """)
            violations = cursor.fetchall()
            if violations:
                ok = False
                self.stderr.write(self.style.ERROR(f"  FAIL: {len(violations)}개 월에서 불일치 발견"))
            else:
                self.stdout.write(self.style.SUCCESS("  PASS"))

            self.stdout.write("동공통 항목(승강기전기료/수선유지비) 동 내 일치 여부...")
            cursor.execute("""
                SELECT m.아파트동, f.청구년월,
                       COUNT(DISTINCT f.승강기전기료) d1,
                       COUNT(DISTINCT f.수선유지비) d2
                FROM `관리비` f
                JOIN `회원정보` m ON m.회원_index = f.회원_index
                GROUP BY m.아파트동, f.청구년월
                HAVING d1 > 1 OR d2 > 1
            """)
            violations = cursor.fetchall()
            if violations:
                ok = False
                self.stderr.write(self.style.ERROR(f"  FAIL: {len(violations)}개 (동,월) 조합에서 불일치 발견"))
            else:
                self.stdout.write(self.style.SUCCESS("  PASS"))

            self.stdout.write("동공통 항목이 동 간에는 실제로 다른지 확인...")
            cursor.execute("""
                SELECT f.청구년월, COUNT(DISTINCT f.승강기전기료)
                FROM `관리비` f
                JOIN `회원정보` m ON m.회원_index = f.회원_index
                GROUP BY f.청구년월
                HAVING COUNT(DISTINCT m.아파트동) > 1 AND COUNT(DISTINCT f.승강기전기료) <= 1
            """)
            flat = cursor.fetchall()
            if flat:
                ok = False
                self.stderr.write(self.style.ERROR("  FAIL: 동 간에 값이 전혀 다르지 않은 월이 있음"))
            else:
                self.stdout.write(self.style.SUCCESS("  PASS"))

            self.stdout.write("신규입주(비교 데이터 없는) 회원 존재 확인...")
            cursor.execute("""
                SELECT COUNT(*) FROM (
                    SELECT 회원_index FROM `관리비` GROUP BY 회원_index HAVING COUNT(*) = 1
                ) t
            """)
            single_month_count = cursor.fetchone()[0]
            self.stdout.write(f"  1개월만 보유한 회원 수: {single_month_count}")

        if ok:
            self.stdout.write(self.style.SUCCESS("모든 검증 통과"))
        else:
            self.stderr.write(self.style.ERROR("일부 검증 실패 - 위 로그 확인"))
