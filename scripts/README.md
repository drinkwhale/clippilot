# ClipPilot 개발 서버 스크립트 가이드

Phase 3 완료 상태 기준 (인증 기능 테스트 가능)

## 🚀 빠른 시작

### 1단계: 환경 설정

```bash
# .env 파일 생성 (프로젝트 루트에 생성됨)
cp .env.example .env

# .env 파일 수정 (필수 항목만)
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

### 2단계: 서버 실행

```bash
# 프로젝트 루트에서 실행
./scripts/dev-start.sh
```

**자동으로 실행되는 서비스:**
- ✅ Redis (포트 6379)
- ✅ Backend API (포트 8000)
- ✅ Frontend (포트 3000)

### 3단계: 테스트

브라우저에서 다음 URL로 접속:

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **회원가입**: http://localhost:3000/signup
- **로그인**: http://localhost:3000/login
- **대시보드**: http://localhost:3000/dashboard

---

## 📜 스크립트 목록

### `dev-start.sh` - 서버 시작

모든 개발 서버를 한 번에 실행합니다.

```bash
./scripts/dev-start.sh
```

**수행 작업:**
1. `.env` 파일 존재 여부 확인 (없으면 `.env.example` 복사)
2. Redis 실행 (이미 실행 중이면 스킵)
3. Backend API 실행 (백그라운드)
4. Frontend 실행 (백그라운드)
5. 각 서비스 PID 저장 (`logs/*.pid`)

**실행 조건:**
- `.env` 파일 존재 필수
- Redis 설치 필수 (`brew install redis` / `apt install redis-server`)
- Python 3.11+ (`uv` 사용)
- Node.js 20+ (`pnpm` 사용)

---

### `dev-stop.sh` - 서버 종료

실행 중인 모든 서버를 종료합니다.

```bash
./scripts/dev-stop.sh
```

**수행 작업:**
1. Backend API 종료
2. Frontend 종료
3. Redis 종료 여부 선택 (대화형)

**종료 방식:**
- PID 파일이 있으면 PID로 종료
- 없으면 포트 번호로 프로세스를 찾아서 종료

---

### `dev-status.sh` - 상태 확인

현재 실행 중인 서비스 상태를 확인합니다.

```bash
./scripts/dev-status.sh
```

**출력 정보:**
- ✅ **Redis**: 실행 상태, PID, 버전, 연결 테스트
- ✅ **Backend API**: 실행 상태, PID, URL, Health Check
- ✅ **Frontend**: 실행 상태, PID, URL, Health Check
- ✅ **환경 정보**: `.env`, Python venv, node_modules 존재 여부
- ✅ **빠른 액션**: 자주 사용하는 명령어 가이드

**예시 출력:**
```
========================================
  ClipPilot 서비스 상태
========================================

[Redis]
  상태: ● 실행 중 (PID: 12345)
  포트: 6379
  버전: v=7.2.3
  연결: ✓ 정상

[Backend API]
  상태: ● 실행 중 (PID: 12346)
  포트: 8000
  URL:  http://localhost:8000
  Docs: http://localhost:8000/docs
  Health: ✓ 정상

[Frontend]
  상태: ● 실행 중 (PID: 12347)
  포트: 3000
  URL:  http://localhost:3000
  Health: ✓ 정상

[환경 정보]
  .env 파일: ✓ 존재
  Python venv: ✓ 존재
  node_modules: ✓ 존재
```

---

### `dev-logs.sh` - 로그 확인

실시간으로 서버 로그를 확인합니다.

```bash
# 특정 서비스 로그
./scripts/dev-logs.sh backend   # Backend API 로그
./scripts/dev-logs.sh frontend  # Frontend 로그
./scripts/dev-logs.sh redis     # Redis 로그

# 모든 로그 (기본값)
./scripts/dev-logs.sh all
./scripts/dev-logs.sh
```

**로그 파일 위치:**
- Backend: `logs/backend.log`
- Frontend: `logs/frontend.log`
- Redis: `logs/redis.log`

**Tip**: `multitail` 설치하면 여러 로그를 동시에 볼 수 있습니다.
```bash
brew install multitail  # macOS
```

---

## 🔧 문제 해결

### Redis 설치 안 됨

**macOS:**
```bash
brew install redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
```

**확인:**
```bash
redis-server --version
```

---

### Backend 실행 실패

**로그 확인:**
```bash
tail -f logs/backend.log
```

**일반적인 원인:**
1. `.env` 파일 설정 오류 (Supabase 키 확인)
2. Redis 미실행 (Redis 먼저 실행 필요)
3. Python 가상환경 문제

**해결:**
```bash
cd backend
rm -rf .venv
uv sync  # 가상환경 재생성
```

---

### Frontend 실행 실패

**로그 확인:**
```bash
tail -f logs/frontend.log
```

**일반적인 원인:**
1. `node_modules` 미설치
2. `.env.local` 파일 없음

**해결:**
```bash
cd frontend
rm -rf node_modules .next
pnpm install
```

---

### 포트 충돌 (이미 사용 중)

**포트 사용 중인 프로세스 확인:**
```bash
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :6379  # Redis
```

**강제 종료:**
```bash
kill -9 $(lsof -ti:3000)  # Frontend
kill -9 $(lsof -ti:8000)  # Backend
kill -9 $(lsof -ti:6379)  # Redis
```

---

## 📁 파일 구조

```
scripts/
├── dev-start.sh    # 서버 시작 (Redis + Backend + Frontend)
├── dev-stop.sh     # 서버 종료
├── dev-status.sh   # 상태 확인
├── dev-logs.sh     # 로그 확인
└── README.md       # 이 문서

logs/
├── backend.log     # Backend API 로그
├── backend.pid     # Backend API PID
├── frontend.log    # Frontend 로그
├── frontend.pid    # Frontend PID
└── redis.log       # Redis 로그
```

---

## 🧪 테스트 시나리오

### Phase 3 완료 상태에서 테스트 가능한 기능

1. **회원가입 플로우**
   - http://localhost:3000/signup 접속
   - 이메일/비밀번호 입력
   - 회원가입 완료 확인

2. **로그인 플로우**
   - http://localhost:3000/login 접속
   - 이메일/비밀번호 입력
   - 대시보드로 리다이렉트 확인

3. **인증 상태 확인**
   - 로그인 안 한 상태로 http://localhost:3000/dashboard 접속
   - 로그인 페이지로 리다이렉트되는지 확인
   - 로그인 후 대시보드 접근 가능한지 확인

4. **비밀번호 재설정**
   - http://localhost:3000/reset-password 접속
   - 이메일 입력 후 재설정 링크 수신 확인

5. **API 문서 확인**
   - http://localhost:8000/docs 접속
   - Swagger UI에서 API 엔드포인트 확인
   - `/api/v1/auth/signup` 엔드포인트 테스트

---

## 💡 Tip

### 빠른 재시작
```bash
./scripts/dev-stop.sh && ./scripts/dev-start.sh
```

### 로그 실시간 모니터링
```bash
# 터미널 분할하여 각각 실행
./scripts/dev-logs.sh backend
./scripts/dev-logs.sh frontend
```

### 상태 주기적 확인
```bash
watch -n 5 ./scripts/dev-status.sh  # 5초마다 상태 갱신
```

---

## 📞 문제 발생 시

1. **로그 확인**: `./scripts/dev-logs.sh [service]`
2. **상태 확인**: `./scripts/dev-status.sh`
3. **서버 재시작**: `./scripts/dev-stop.sh && ./scripts/dev-start.sh`
4. **환경 초기화**:
   ```bash
   # Backend
   cd backend && rm -rf .venv && uv sync

   # Frontend
   cd frontend && rm -rf node_modules .next && pnpm install
   ```

---

**작성일**: 2025-10-29
**버전**: Phase 3 (US0 Authentication) 완료 기준
