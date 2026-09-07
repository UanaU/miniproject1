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

## API

- `POST /api/accounts/login/`, `POST /api/accounts/logout/`, `GET /api/accounts/me/`
- `GET /api/managementfee/summary?year_month=YYYYMMDD`
- `GET /api/managementfee/analysis?year_month=YYYYMMDD`
