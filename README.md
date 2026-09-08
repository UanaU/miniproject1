# 아파트 관리비 조회 시스템

같은 아파트 단지 입주민이 로그인 후 본인 세대 관리비를 조회·등록하고, 같은 평수 평균 / 같은 평수+가구원수 평균 /
전월 / 작년 동월과 비교해보는 웹 서비스.

## 기술 스택

- 백엔드: Django + Django REST Framework, MySQL (PyMySQL)
- 프론트엔드: React (Vite) + Recharts
- AI 원인분석: 백엔드 API(`/api/managementfee/analysis`)와 폴백 로직은 구현되어 있으나, 현재 화면에서는
  노출하지 않음 (추후 프론트엔드 연동 예정)

## 준비

1. MySQL에 데이터베이스 생성 (최초 1회)

   ```bash
   mysql -u <user> -p -e "CREATE DATABASE apartment_fee CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

2. `.env.example`을 `.env`로 복사하고 값 채우기 (`DB_USER`/`DB_PASSWORD` 등, `ANTHROPIC_API_KEY`는 있으면 입력)

## 백엔드 실행

```bash
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

cd backend
python manage.py migrate

# 더미데이터 생성 (최초 1회 또는 재현이 필요할 때)
cd ..
python generate_dummy_data.py

# 더미데이터 DB 적재 (재실행 시 기존 데이터 초기화 후 재적재)
cd backend
python manage.py load_dummy_data

# DB 불변식 검증 (선택)
python manage.py verify_data

python manage.py runserver
```

백엔드는 `http://localhost:8000` 에서 실행된다.

## 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 `http://localhost:3000` 에서 실행된다.

## 로그인 테스트 계정

`user0001` ~ `user1000` / 비밀번호 `pw10001` ~ `pw11000`

## 화면 구성

- **로그인** (`/login`) — 아이디/비밀번호 로그인, 하단에 회원가입 링크. 로그인 성공 시에는 항상
  **마이페이지**로 이동한다 (관리비 데이터 유무와 무관)
- **회원가입** (`/signup`) — 아이디/비밀번호/이름/연락처/동(더미데이터 기준 101~115동 중 선택)/호수/
  평수(18·24·32·38·45·52평 중 선택)/가구원수 입력 후 로그인 화면으로 이동 (자동 로그인 아님, 가입한
  계정으로 다시 로그인해야 함)
- **마이페이지** (`/mypage`) — 내 정보 조회, "정보 수정" 버튼으로 수정 화면 이동
- **마이페이지 수정** (`/mypage/edit`) — 이름/연락처/동/호수/평수/가구원수 수정 (아이디는 변경 불가)
- **관리비 조회** (`/fees`) — 청구년월 선택, 항목별 관리비 표시. **전기세/수도세/가스비** 값 옆의
  "수정" 버튼을 누르면 해당 행이 바로 입력 필드로 바뀌어 그 자리에서 값을 고쳐 저장할 수 있다
  (저장 시 합계금액 자동 재계산). 좌측의 **합계금액/전기세/수도세/가스비** 항목을 클릭하면 우측에
  해당 항목의 **선택한 청구년월이 속한 연도(1~12월)** 추이가 꺾은선 그래프로 표시된다
  (AI 원인분석은 이 화면에서 제외 — 추후 별도 연동 예정)
- **관리비 등록** (`/fees/register`) — 세대별 항목(전기세/수도세/가스비)만 입력하면 단지공통·동공통 항목은
  동일 청구년월(없으면 최근월)의 다른 세대 값을 기준으로 자동 반영되어 새 관리비 레코드를 등록
- **관리비 비교** (`/fees/compare`) — 청구년월과 함께 **비교 항목 드롭다운**(전월 비교 / 작년 동월 비교 /
  같은 평수 비교 / 같은 평수+가구원수 비교), **비교 대상 드롭다운**(총관리비 / 전기세 / 수도세 / 가스비)을
  조합해 막대그래프 1개를 보여준다. "이번달"과 비교 대상 막대는 서로 다른 색으로 구분된다

로그인 후에는 화면 우측 상단에 **마이페이지** / **내관리비** 메뉴와 **로그아웃** 버튼이 항상 표시된다.
**내관리비**를 클릭하면 보유한 관리비 레코드가 하나도 없을 때는 **관리비 등록** 화면으로, 데이터가 있으면
**관리비 조회** 화면으로 이동한다 (하위 메뉴에서 관리비 조회·관리비 등록·관리비 비교로 바로 이동 가능).
로그아웃 시 로그인 화면으로 이동한다.

## API

- `POST /api/accounts/login/`, `POST /api/accounts/logout/`, `POST /api/accounts/signup/`
- `GET /api/accounts/me/` (내 정보 조회), `PATCH /api/accounts/me/` (내 정보 수정)
- `GET /api/managementfee/summary?year_month=YYYYMMDD` — 이번달/전월/같은평수평균/같은평수+가구원수평균/작년동월
- `GET /api/managementfee/history` — 내 전체 보유 개월의 합계금액/전기세/수도세/가스비 시계열
- `POST /api/managementfee/register` — 청구년월 + 전기세/수도세/가스비(+ 납부상태)로 신규 레코드 등록
- `PATCH /api/managementfee/record?year_month=YYYYMMDD` — 전기세/수도세/가스비 중 보내온 항목만 수정하고
  합계금액을 재계산 (관리비 조회 화면의 인라인 수정에서 사용)
- `GET /api/managementfee/analysis?year_month=YYYYMMDD` — AI 원인분석 (백엔드 구현 완료, 프론트엔드 미노출)
