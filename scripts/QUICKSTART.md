# ⚡ ClipPilot 빠른 시작 가이드

Phase 3 완료 상태 - 3분 안에 로컬 환경에서 ClipPilot 실행하기

---

## 🎯 목표

이 가이드를 따라하면 **3분 안에** 다음을 테스트할 수 있습니다:
- ✅ 회원가입
- ✅ 로그인
- ✅ 대시보드 접근
- ✅ Backend API 문서 확인

---

## ✅ 필수 요구사항

시작하기 전에 다음이 설치되어 있어야 합니다:

- **Node.js**: 20.x 이상
- **Python**: 3.11 이상 (uv 패키지 매니저 사용)
- **Redis**: 7.x 이상
- **pnpm**: 최신 버전
- **Supabase 계정**: [supabase.com](https://supabase.com/)

### 설치 확인

```bash
node --version    # v20.x 이상
python --version  # 3.11 이상
redis-server --version  # 7.x 이상
pnpm --version    # 10.x 이상
```

### Redis 설치 (없는 경우)

**macOS:**
```bash
brew install redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
```

---

## 🚀 3분 빠른 시작

### 1단계: Supabase 프로젝트 설정 (1분)

1. **Supabase 프로젝트 생성**
   - https://app.supabase.com/ 접속
   - "New Project" 클릭
   - 프로젝트 이름, 데이터베이스 비밀번호 입력
   - 프로젝트 생성 완료 대기 (약 30초)

2. **API 키 복사**
   - 프로젝트 대시보드 → Settings → API
   - `URL`, `anon public` 키, `service_role` 키 복사

3. **데이터베이스 스키마 적용** (옵션 - Phase 4 이후 필요)
   - SQL Editor 접속
   - `specs/001-clippilot-mvp/data-model.md` 파일 내용 복사
   - SQL 실행

---

### 2단계: 환경 변수 설정 (30초)

```bash
# 프로젝트 루트에서 실행
cd clippilot
cp .env.example .env
```

**`.env` 파일 수정** (필수 항목만):
```bash
# Supabase (필수)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Redis (기본값 사용)
REDIS_URL=redis://localhost:6379

# 나머지는 Phase 4 이후 필요 (지금은 스킵 가능)
```

---

### 3단계: 서버 실행 (1분)

```bash
# 모든 서비스 한 번에 실행
./scripts/dev-start.sh
```

**예상 출력:**
```
========================================
  ClipPilot 개발 서버 시작
========================================

[1/3] Redis 상태 확인...
✓ Redis 실행 완료

[2/3] Backend API 실행...
✓ Backend API 실행 완료 (PID: 12346)
  URL: http://localhost:8000
  Docs: http://localhost:8000/docs

[3/3] Frontend 실행...
✓ Frontend 실행 완료 (PID: 12347)
  URL: http://localhost:3000

========================================
  ✓ 모든 서비스가 실행되었습니다!
========================================
```

**처음 실행 시 추가 시간 소요:**
- Backend: Python 가상환경 생성 및 패키지 설치 (~1분)
- Frontend: node_modules 설치 (~2분)

---

### 4단계: 테스트 (30초)

#### 브라우저에서 접속

1. **Frontend 접속**
   ```
   http://localhost:3000
   ```

2. **회원가입**
   ```
   http://localhost:3000/signup
   ```
   - 이메일: `test@example.com`
   - 비밀번호: `password123!`

3. **로그인**
   ```
   http://localhost:3000/login
   ```
   - 위에서 생성한 계정으로 로그인

4. **대시보드 확인**
   ```
   http://localhost:3000/dashboard
   ```

5. **API 문서 확인**
   ```
   http://localhost:8000/docs
   ```

---

## 🎉 성공!

다음 화면이 정상적으로 보이면 성공입니다:

- ✅ **Frontend**: http://localhost:3000 (회원가입/로그인 화면)
- ✅ **Backend API Docs**: http://localhost:8000/docs (Swagger UI)
- ✅ **대시보드**: 로그인 후 http://localhost:3000/dashboard

---

## 🛠 추가 명령어

### 서버 상태 확인
```bash
./scripts/dev-status.sh
```

### 로그 확인
```bash
# Backend 로그
./scripts/dev-logs.sh backend

# Frontend 로그
./scripts/dev-logs.sh frontend

# 모든 로그
./scripts/dev-logs.sh all
```

### 서버 종료
```bash
./scripts/dev-stop.sh
```

---

## 🐛 문제 해결

### 1. Redis 연결 실패

**증상:**
```
Redis connection failed
```

**해결:**
```bash
# Redis가 실행 중인지 확인
lsof -i :6379

# Redis 실행
redis-server --daemonize yes
```

---

### 2. Backend 실행 실패

**증상:**
```
Backend API 실행 실패
```

**해결:**
```bash
# Backend 로그 확인
./scripts/dev-logs.sh backend

# 가상환경 재생성
cd backend
rm -rf .venv
uv sync

# 다시 실행
cd ..
./scripts/dev-start.sh
```

---

### 3. Frontend 실행 실패

**증상:**
```
Frontend 실행 실패
```

**해결:**
```bash
# Frontend 로그 확인
./scripts/dev-logs.sh frontend

# node_modules 재설치
cd frontend
rm -rf node_modules .next
pnpm install

# 다시 실행
cd ..
./scripts/dev-start.sh
```

---

### 4. Supabase 연결 실패

**증상:**
```
Supabase authentication failed
```

**해결:**
1. `.env` 파일에서 Supabase URL과 키 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. API 키가 올바른지 확인 (anon key, service_role key)

---

### 5. 포트 충돌

**증상:**
```
Port 3000/8000 is already in use
```

**해결:**
```bash
# 포트 사용 중인 프로세스 확인 및 종료
lsof -ti:3000 | xargs kill -9   # Frontend
lsof -ti:8000 | xargs kill -9   # Backend
lsof -ti:6379 | xargs kill -9   # Redis

# 다시 실행
./scripts/dev-start.sh
```

---

## 📚 다음 단계

### Phase 4: YouTube OAuth 연동
```bash
"Phase 4 진행해줘"
```

### Phase 5: AI 콘텐츠 생성 (핵심 기능!)
```bash
"Phase 5까지 진행해줘"
```

### Phase 6: 영상 렌더링 & YouTube 업로드
```bash
"Phase 6까지 진행해줘"
```

---

## 📖 더 알아보기

- **상세 가이드**: [scripts/README.md](README.md)
- **데모 시나리오**: [scripts/DEMO.md](DEMO.md)
- **전체 스펙**: [../specs/001-clippilot-mvp/spec.md](../specs/001-clippilot-mvp/spec.md)
- **API 문서**: [../specs/001-clippilot-mvp/contracts/api-v1.yaml](../specs/001-clippilot-mvp/contracts/api-v1.yaml)

---

**작성일**: 2025-10-29
**소요 시간**: 약 3분
**버전**: Phase 3 (US0 Authentication) 완료 기준
