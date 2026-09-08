# 아파트 관리비 조회 시스템

같은 아파트 단지 입주민이 로그인 후 본인 세대 관리비를 조회하고, 같은 평수 평균 / 같은 평수+가구원수 평균 /
전월 / 작년 동월과 비교하며, AI 기반 증가 원인 분석을 받아보는 웹 서비스.

## 기술 스택

- 백엔드: Django + Django REST Framework, MySQL (PyMySQL)
- 프론트엔드: React (Vite) + Recharts
- AI 원인분석: Anthropic API (키 없을 시 폴백 응답)

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

- **로그인** (`/login`) — 아이디/비밀번호 로그인, 하단에 회원가입 링크
- **회원가입** (`/signup`) — 아이디/비밀번호/이름/연락처/동/호수/평수/가구원수 입력 후 가입과 동시에 자동 로그인
- **마이페이지** (`/mypage`) — 내 정보 조회, "정보 수정" 버튼으로 수정 화면 이동
- **마이페이지 수정** (`/mypage/edit`) — 이름/연락처/동/호수/평수/가구원수 수정 (아이디는 변경 불가)
- **관리비 조회** (`/fees`) — 청구년월 선택, 항목별 관리비, 4종 비교 차트, AI 원인분석

로그인 후에는 화면 우측 상단에 **마이페이지 / 관리비** 메뉴와 **로그아웃** 버튼이 항상 표시되며,
로그아웃 시 로그인 화면으로 이동한다.

## API

- `POST /api/accounts/login/`, `POST /api/accounts/logout/`, `POST /api/accounts/signup/`
- `GET /api/accounts/me/` (내 정보 조회), `PATCH /api/accounts/me/` (내 정보 수정)
- `GET /api/managementfee/summary?year_month=YYYYMMDD`
- `GET /api/managementfee/analysis?year_month=YYYYMMDD`
