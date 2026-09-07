"""
아파트 관리비 더미데이터 생성기

Python + Faker(ko_KR) 기반. 이름/연락처는 Faker로 생성하고,
관리비 수치는 CLAUDE.md의 "관리비 항목 산정 원칙"을 그대로 구현한 로직으로 계산한다.

  1. 세대별 항목 (전기세/수도세/가스비): 평수 + 가구원수에 따라 세대마다 다름
  2. 단지 공통 항목 (일반관리비/공동전기료/청소비/경비비): 같은 청구년월이면 단지 전체 동일
  3. 동 공통 항목 (승강기전기료/수선유지비): 같은 동끼리만 동일, 동마다 기준값 다름

사용법:
    pip install faker
    python generate_dummy_data.py

CONFIG 영역의 값만 바꾸면 규모/분포를 조절할 수 있다. SEED를 고정하면 재실행해도
동일한 데이터가 재현되고, SEED = None으로 바꾸면 매번 다른 데이터가 생성된다.
"""
import csv
import os
import random

from faker import Faker

# ============================================================
# CONFIG
# ============================================================
SEED = 42  # None 으로 바꾸면 매번 다른 데이터 생성

NUM_MEMBERS = 1000
NUM_FEE_RECORDS = 10000

UNIT_SIZES = [18, 24, 32, 38, 45, 52]          # 평수 종류
SIZE_HOUSEHOLD_MEAN = {                          # 평수별 가구원수 평균 (정규분포 평균)
    18: 1.5, 24: 2.0, 32: 2.8, 38: 3.3, 45: 4.0, 52: 4.5,
}
HOUSEHOLD_SIZE_RANGE = (1, 6)

NUM_BUILDINGS = 15                               # 101동~115동
BUILDINGS = list(range(101, 101 + NUM_BUILDINGS))
FLOORS = range(2, 21)                            # 2층~20층
LINES = range(1, 5)                              # 라인 1~4

# 거주기간(보유 관리비 레코드 개월 수) 구간별 표본 가중치.
# (최소개월, 최대개월, 가중치) - 평균 거주기간이 대략 12개월 근처가 되도록 튜닝됨.
RESIDENCY_BUCKETS = [
    (1, 1, 0.25),     # 신규 입주, 비교 데이터 없음 (예외처리 테스트용)
    (2, 9, 0.42),     # 단기~중기 거주
    (10, 23, 0.20),   # 1~2년차
    (24, 35, 0.09),   # 2~3년차
    (36, 48, 0.04),   # 3~4년 장기거주
]

ELECTRICITY_SPIKE_RATIO = 0.03          # 급증 이상치 비율 (세대 기준)
ELECTRICITY_SPIKE_RANGE = (0.60, 1.20)  # 60~120% 급증
UNPAID_RATIO = 0.04                     # 미납 비율 (레코드 기준)

LATEST_YEAR_MONTH = (2026, 9)  # 가장 최근 청구년월 (연, 월). 이 달부터 과거로 거슬러 생성

OUTPUT_DIR = "dummy_data"

# ============================================================
# 내부 상수 / 헬퍼
# ============================================================
MAX_RESIDENCY = max(b[1] for b in RESIDENCY_BUCKETS)


def add_months(year, month, delta_back):
    """delta_back 개월만큼 과거로 이동한 (year, month) 반환 (delta_back=0 은 그대로)."""
    total = year * 12 + (month - 1) - delta_back
    y, m = divmod(total, 12)
    return y, m + 1


def yyyymmdd(year, month):
    return f"{year}{month:02d}01"


def drift_factor(month_offset):
    """월이 과거로 갈수록 물가가 살짝 낮았던 것처럼 보이는 완만한 추세 계수."""
    return max(0.85, 1 - 0.002 * month_offset)


def round100(x):
    return int(round(x / 100.0) * 100)


def complex_common_values(month_offset):
    """단지 공통 항목 - 오직 month_offset(청구년월)만의 함수 -> 같은 달이면 전 세대 항상 동일."""
    f = drift_factor(month_offset)
    return {
        "일반관리비": round100(40000 * f),
        "공동전기료": round100(15000 * f),
        "청소비": round100(20000 * f),
        "경비비": round100(12000 * f),
    }


def building_common_values(building, month_offset):
    """동 공통 항목 - building과 month_offset만의 함수 -> 같은 동/같은 달이면 항상 동일,
    동이 다르면 base가 달라 값도 달라짐."""
    f = drift_factor(month_offset)
    base_elevator, base_maint = BUILDING_BASES[building]
    return {
        "승강기전기료": round100(base_elevator * f),
        "수선유지비": round100(base_maint * f),
    }


def per_unit_values(size, household, month, is_spike, rng):
    """세대별 항목 - 평수 + 가구원수 + 계절 + 노이즈로 산정 (Faker 아님, 결정적 로직 + 난수 노이즈)."""
    electricity = 12000 + size * 300 + household * 3500 + rng.gauss(0, 2500)
    water = 6000 + size * 150 + household * 2000 + rng.gauss(0, 1200)

    if month in (12, 1, 2):
        seasonal = 1.4
    elif month in (6, 7, 8):
        seasonal = 0.7
    else:
        seasonal = 1.0
    gas = (8000 + size * 200 + household * 2200) * seasonal + rng.gauss(0, 1500)

    if is_spike:
        electricity *= 1 + rng.uniform(*ELECTRICITY_SPIKE_RANGE)

    return {
        "전기세": max(5000, round100(electricity)),
        "수도세": max(3000, round100(water)),
        "가스비": max(3000, round100(gas)),
    }


def sample_residency(rng):
    buckets, weights = zip(*[((lo, hi), w) for lo, hi, w in RESIDENCY_BUCKETS])
    lo, hi = rng.choices(buckets, weights=weights, k=1)[0]
    return rng.randint(lo, hi)


# ============================================================
# 생성 시작
# ============================================================
def main():
    rng = random.Random(SEED)
    fake = Faker("ko_KR")
    if SEED is not None:
        fake.seed_instance(SEED)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # --- 동별 기준값 (동마다 다르고, 같은 동끼리는 같음) ---
    global BUILDING_BASES
    BUILDING_BASES = {
        b: (rng.uniform(6000, 12000), rng.uniform(3000, 8000)) for b in BUILDINGS
    }

    # --- 회원 생성 ---
    members = []
    for idx in range(1, NUM_MEMBERS + 1):
        size = rng.choice(UNIT_SIZES)
        household = int(round(rng.gauss(SIZE_HOUSEHOLD_MEAN[size], 1.0)))
        household = min(max(household, HOUSEHOLD_SIZE_RANGE[0]), HOUSEHOLD_SIZE_RANGE[1])
        building = rng.choice(BUILDINGS)
        unit_no = rng.choice(list(FLOORS)) * 100 + rng.choice(list(LINES))

        members.append({
            "회원_index": idx,
            "회원id": f"user{idx:04d}",
            "회원비밀번호": f"pw{10000 + idx}",
            "이름": fake.name(),
            "연락처": fake.phone_number(),
            "아파트동": building,
            "아파트호수": unit_no,
            "아파트평수": size,
            "가구원수": household,
            "residency": sample_residency(rng),
        })

    # --- 총 레코드 수를 NUM_FEE_RECORDS 에 정확히 맞추기 (일부 회원 거주기간 보정) ---
    total = sum(m["residency"] for m in members)
    diff = NUM_FEE_RECORDS - total
    guard = 0
    while diff != 0 and guard < 200000:
        m = members[rng.randrange(NUM_MEMBERS)]
        if diff > 0 and m["residency"] < MAX_RESIDENCY:
            m["residency"] += 1
            diff -= 1
        elif diff < 0 and m["residency"] > 1:
            m["residency"] -= 1
            diff += 1
        guard += 1

    # --- 이상치 대상 회원 선정 (전기세 급증 ~3%) ---
    spike_member_ids = set(
        rng.sample(range(NUM_MEMBERS), k=max(1, int(NUM_MEMBERS * ELECTRICITY_SPIKE_RATIO)))
    )

    # --- 관리비 레코드 생성 ---
    fee_records = []
    fee_index = 1
    for mi, m in enumerate(members):
        residency = m["residency"]
        spike_month_pos = rng.randrange(residency) if mi in spike_member_ids else -1

        for pos in range(residency):
            month_offset = pos  # 0 = 최신월(LATEST_YEAR_MONTH), residency-1 = 가장 과거
            year, month = add_months(LATEST_YEAR_MONTH[0], LATEST_YEAR_MONTH[1], month_offset)
            ym = yyyymmdd(year, month)

            unit_vals = per_unit_values(
                m["아파트평수"], m["가구원수"], month,
                is_spike=(pos == spike_month_pos), rng=rng,
            )
            complex_vals = complex_common_values(month_offset)
            building_vals = building_common_values(m["아파트동"], month_offset)

            total_amount = (
                sum(unit_vals.values())
                + sum(complex_vals.values())
                + sum(building_vals.values())
            )

            fee_records.append({
                "관리비_index": fee_index,
                "회원_index": m["회원_index"],
                "청구년월": ym,
                "납부상태": True,  # 아래에서 UNPAID_RATIO 만큼 일괄 False 처리
                "합계금액": total_amount,
                **unit_vals,
                **complex_vals,
                **building_vals,
            })
            fee_index += 1

    # --- 미납 랜덤 주입 (레코드의 ~4%) ---
    unpaid_count = int(len(fee_records) * UNPAID_RATIO)
    for i in rng.sample(range(len(fee_records)), k=unpaid_count):
        fee_records[i]["납부상태"] = False

    # --- CSV 저장 ---
    member_fields = [
        "회원_index", "회원id", "회원비밀번호", "이름", "연락처",
        "아파트동", "아파트호수", "아파트평수", "가구원수",
    ]
    with open(os.path.join(OUTPUT_DIR, "members.csv"), "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=member_fields)
        writer.writeheader()
        for m in members:
            writer.writerow({k: m[k] for k in member_fields})

    fee_fields = [
        "관리비_index", "회원_index", "청구년월", "납부상태", "합계금액",
        "전기세", "수도세", "가스비",
        "일반관리비", "공동전기료", "청소비", "경비비",
        "승강기전기료", "수선유지비",
    ]
    with open(os.path.join(OUTPUT_DIR, "management_fees.csv"), "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fee_fields)
        writer.writeheader()
        for r in fee_records:
            writer.writerow(r)

    # --- 자체 검증 ---
    report_lines = []

    def log(line):
        print(line)
        report_lines.append(line)

    log("=" * 60)
    log("더미데이터 생성 완료")
    log("=" * 60)
    log(f"회원 수: {len(members)}")
    log(f"관리비 레코드 수: {len(fee_records)} (목표: {NUM_FEE_RECORDS})")

    residencies = [m["residency"] for m in members]
    log(
        f"거주기간(개월) - 평균: {sum(residencies)/len(residencies):.2f}, "
        f"최소: {min(residencies)}, 최대: {max(residencies)}"
    )
    log(f"신규입주(1개월) 세대 수: {sum(1 for r in residencies if r == 1)}")
    log(f"전기세 급증 이상치 세대 수: {len(spike_member_ids)}")
    log(f"미납 레코드 수: {unpaid_count} / {len(fee_records)} "
        f"({unpaid_count/len(fee_records)*100:.2f}%)")

    # 단지공통 항목: 같은 청구년월이면 전 세대 동일해야 함
    by_month = {}
    for r in fee_records:
        by_month.setdefault(r["청구년월"], []).append(r)

    complex_fields = ["일반관리비", "공동전기료", "청소비", "경비비"]
    complex_ok = True
    for ym, rows in by_month.items():
        for field in complex_fields:
            if len({row[field] for row in rows}) > 1:
                complex_ok = False
                log(f"  [FAIL] {ym} {field} 값이 단지 내에서 일치하지 않음")
    log(f"[검증] 단지공통 항목 월별 전세대 동일 여부: {'PASS' if complex_ok else 'FAIL'}")

    # 동공통 항목: 같은 (동, 청구년월)이면 동일, 동이 다르면 값이 달라야 함
    by_building_month = {}
    for r in fee_records:
        member = next(m for m in members if m["회원_index"] == r["회원_index"])
        key = (member["아파트동"], r["청구년월"])
        by_building_month.setdefault(key, []).append(r)

    building_fields = ["승강기전기료", "수선유지비"]
    building_ok = True
    for key, rows in by_building_month.items():
        for field in building_fields:
            if len({row[field] for row in rows}) > 1:
                building_ok = False
                log(f"  [FAIL] {key} {field} 값이 동 내에서 일치하지 않음")

    differs_across_buildings = True
    sample_month = fee_records[0]["청구년월"]
    values_per_building = {}
    for (building, ym), rows in by_building_month.items():
        if ym == sample_month:
            values_per_building[building] = rows[0]["승강기전기료"]
    if len(set(values_per_building.values())) <= 1 and len(values_per_building) > 1:
        differs_across_buildings = False

    log(f"[검증] 동공통 항목 동 내 일치 여부: {'PASS' if building_ok else 'FAIL'}")
    log(f"[검증] 동공통 항목 동간 상이 여부: {'PASS' if differs_across_buildings else 'FAIL'}")

    log("=" * 60)
    log(f"로그인 테스트 계정: user0001~user{NUM_MEMBERS:04d} / "
        f"pw10001~pw{10000+NUM_MEMBERS}")
    log(f"CSV 저장 위치: {os.path.abspath(OUTPUT_DIR)}")

    with open(os.path.join(OUTPUT_DIR, "verification_report.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))


if __name__ == "__main__":
    main()
