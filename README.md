# 🎬 ClipPilot

> AI 기반 숏폼 비디오 자동 생성 & YouTube 업로드 SaaS 플랫폼

**ClipPilot**은 1인 크리에이터가 키워드 입력만으로 스크립트, 자막, 썸네일, 영상을 자동 생성하고 YouTube에 1클릭 업로드할 수 있는 올인원 콘텐츠 자동화 플랫폼입니다.

[![PR](https://img.shields.io/github/issues-pr/drinkwhale/clippilot)](https://github.com/drinkwhale/clippilot/pulls)
[![Issues](https://img.shields.io/github/issues/drinkwhale/clippilot)](https://github.com/drinkwhale/clippilot/issues)

---

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [개발 가이드](#-개발-가이드)
- [API 문서](#-api-문서)
- [로드맵](#-로드맵)
- [기여하기](#-기여하기)
- [라이선스](#-라이선스)

---

## ✨ 주요 기능

### 🔍 YouTube 영상 검색 ⭐ **NEW**
- **키워드 검색**: YouTube 영상을 키워드로 검색하고 결과 확인
- **고급 필터링**:
  - 영상 타입 (쇼츠/롱폼)
  - 업로드 기간 (1시간 이내 ~ 사용자 지정)
  - 국가별 검색 (한국, 일본, 미국 등)
  - 조회수/구독자 수 최소값 설정
- **영상 정보**: 썸네일, 제목, 채널명, 조회수, 게시일, 영상 길이
- **캐싱 & 성능**: Redis 캐싱 (15분 TTL), Rate Limiting (10 req/min)

### 🤖 AI 콘텐츠 생성
- **프롬프트 기반 자동화**: 키워드만 입력하면 GPT-4o가 스크립트, 자막(SRT), 썸네일 카피 자동 생성
- **멀티 길이 지원**: 15초, 30초, 60초 영상 길이 선택 가능
- **톤 커스터마이징**: 정보성, 유머러스, 감성적 등 다양한 톤 선택

### 🎥 자동 비디오 렌더링
- **고품질 영상 합성**: FFmpeg 기반 프로페셔널급 렌더링
- **스톡 영상 자동 매칭**: Pexels API를 통한 관련 영상 자동 삽입
- **브랜드 템플릿**: 로고, 폰트, 색상 등 브랜드 아이덴티티 저장 및 재사용

### 📤 YouTube 자동 업로드
- **1클릭 업로드**: 생성된 영상을 YouTube에 자동 업로드
- **OAuth 연동**: 안전한 YouTube 채널 연동
- **멀티 채널 지원**: 여러 채널 관리 가능

### 💰 구독 기반 수익화
- **3가지 플랜**: Free, Pro, Agency
- **사용량 기반 제한**: 월간 영상 생성 개수 제한
- **Stripe 결제 통합**: 안전한 결제 처리

---

## 🛠 기술 스택

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5.x](https://www.typescriptlang.org/)
- **UI Library**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query)
- **Deployment**: [Vercel](https://vercel.com/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11)
- **Task Queue**: [Celery](https://docs.celeryq.dev/) + [Redis](https://redis.io/)
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **Validation**: [Pydantic](https://docs.pydantic.dev/)
- **Deployment**: [Render](https://render.com/) / [Fly.io](https://fly.io/)

### Worker (Rendering Engine)
- **Language**: [Go 1.21](https://go.dev/)
- **Video Processing**: [FFmpeg 6.0](https://ffmpeg.org/)
- **Queue**: Redis
- **Deployment**: Render / Fly.io

### Infrastructure
- **Database**: [Supabase PostgreSQL](https://supabase.com/) (with Row Level Security)
- **Authentication**: [Supabase Auth](https://supabase.com/auth)
- **Storage**: [Supabase Storage](https://supabase.com/storage)
- **Payment**: [Stripe](https://stripe.com/)
- **Monitoring**: [Sentry](https://sentry.io/)

### External APIs
- **AI**: [OpenAI GPT-4o](https://openai.com/index/gpt-4o/)
- **Video Upload**: [YouTube Data API v3](https://developers.google.com/youtube/v3)
- **Stock Media**: [Pexels API](https://www.pexels.com/api/)

---

## 📁 프로젝트 구조

```text
clippilot/
├── frontend/                 # Next.js 웹 애플리케이션
│   ├── src/
│   │   ├── app/              # Next.js 14 App Router
│   │   │   ├── (auth)/       # 인증 라우트 그룹
│   │   │   ├── dashboard/    # 대시보드
│   │   │   └── api/          # API 라우트
│   │   ├── components/       # 재사용 UI 컴포넌트
│   │   │   ├── ui/           # shadcn/ui 컴포넌트
│   │   │   └── features/     # 기능별 컴포넌트
│   │   └── lib/              # 유틸리티 및 헬퍼
│   ├── public/               # 정적 파일
│   └── package.json
│
├── backend/                  # FastAPI 백엔드 API
│   ├── src/
│   │   ├── api/v1/          # API 라우터
│   │   │   ├── auth.py      # 인증 엔드포인트
│   │   │   ├── jobs.py      # 작업 관리
│   │   │   ├── templates.py # 템플릿 관리
│   │   │   └── billing.py   # 결제 관리
│   │   ├── core/            # 핵심 비즈니스 로직
│   │   │   ├── ai/          # AI 서비스 (스크립트, 메타데이터 생성)
│   │   │   └── youtube/     # YouTube API 연동
│   │   ├── models/          # SQLAlchemy 모델
│   │   ├── workers/         # Celery 태스크
│   │   └── config.py        # 설정 관리
│   ├── tests/               # pytest 테스트
│   └── requirements.txt
│
├── worker/                   # Go 렌더링 워커
│   ├── cmd/worker/          # 워커 진입점
│   ├── internal/
│   │   ├── renderer/        # FFmpeg 렌더링 로직
│   │   └── queue/           # Redis 큐 연동
│   ├── go.mod
│   └── go.sum
│
├── specs/                    # 기능 명세 및 설계 문서
│   └── 001-clippilot-mvp/
│       ├── spec.md          # 요구사항 명세서
│       ├── plan.md          # 구현 계획
│       ├── research.md      # 기술 선정 문서
│       ├── data-model.md    # 데이터베이스 스키마
│       ├── tasks.md         # 구현 태스크 목록
│       ├── quickstart.md    # 개발 환경 가이드
│       └── contracts/
│           └── api-v1.yaml  # OpenAPI 3.1 스펙
│
├── docs/                     # 문서
│   └── clippilot.md         # 원본 기획 문서
│
├── CLAUDE.md                 # AI Agent 컨텍스트
└── README.md                 # 이 파일
```

---

## 🚀 시작하기

### 필수 요구사항

- **Node.js**: 20.x 이상
- **Python**: 3.11 이상
- **Go**: 1.21 이상
- **Redis**: 7.x 이상
- **FFmpeg**: 6.0 이상
- **Supabase 계정**: [supabase.com](https://supabase.com/)
- **OpenAI API Key**: [platform.openai.com](https://platform.openai.com/)
- **YouTube API Key**: [console.cloud.google.com](https://console.cloud.google.com/)
- **Stripe 계정**: [stripe.com](https://stripe.com/)

### 로컬 개발 환경 설정

상세한 설정 가이드는 [quickstart.md](specs/001-clippilot-mvp/quickstart.md)를 참고하세요.

#### 1. 저장소 클론

```bash
git clone https://github.com/drinkwhale/clippilot.git
cd clippilot
```

#### 2. Supabase 설정

```sql
-- Supabase SQL Editor에서 실행
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 타입 정의
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'agency');
CREATE TYPE job_status AS ENUM ('queued', 'generating', 'rendering', 'uploading', 'done', 'failed');

-- 테이블 생성 (data-model.md 참고)
```

#### 3. 환경 변수 설정

각 서비스별 `.env` 파일 생성:

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** (`backend/.env`):
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...
OPENAI_API_KEY=sk-xxx...
YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxx
PEXELS_API_KEY=xxx
STRIPE_SECRET_KEY=sk_test_xxx
REDIS_URL=redis://localhost:6379/0
```

**Worker** (`worker/.env`):
```bash
REDIS_URL=redis://localhost:6379/0
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...
```

#### 4. 서비스 실행

> ⚡ **빠른 시작**: 통합 스크립트로 한 번에 실행하기 (Phase 3 완료 기준)

```bash
# 모든 서비스 한 번에 실행 (권장)
./scripts/dev-start.sh

# 서버 상태 확인
./scripts/dev-status.sh

# 로그 확인
./scripts/dev-logs.sh [backend|frontend|redis|all]

# 서버 종료
./scripts/dev-stop.sh
```

**자동으로 실행되는 서비스:**
- ✅ Redis (포트 6379)
- ✅ Backend API (포트 8000)
- ✅ Frontend (포트 3000)

**테스트 가능한 기능:**

**002-youtube-search (Phase 4 완료):**
- ✅ YouTube 검색: http://localhost:3000/dashboard/youtube-search
- ✅ 키워드 검색 (예: "React Tutorial")
- ✅ 영상 수집 수 선택 (25~50개)
- ✅ 고급 필터링:
  - 영상 타입 (쇼츠/롱폼/전체)
  - 업로드 기간 (1시간 이내 ~ 1년 이내)
  - 국가 선택 (한국, 일본, 미국 등)
  - 조회수 최소값 (예: 100만 이상)
  - 구독자 수 최소값 (예: 10만 이상)
- ✅ 영상 카드: 썸네일, 제목, 채널명, 조회수, 게시일, 영상 길이, 타입 배지
- ✅ 캐싱 동작 확인: 동일 검색 2초 이내 응답
- ✅ API 엔드포인트:
  - `GET /api/v1/youtube/search` - 영상 검색
  - `GET /api/v1/youtube/videos/{videoId}` - 영상 상세

**001-clippilot-mvp (Phase 3 완료 - US0 Authentication):**
- ✅ 회원가입: http://localhost:3000/signup
- ✅ 로그인: http://localhost:3000/login
- ✅ 대시보드: http://localhost:3000/dashboard (인증 보호)
- ✅ 비밀번호 재설정: http://localhost:3000/reset-password
- ✅ API 문서: http://localhost:8000/docs
- ✅ 인증 미들웨어: JWT 기반 보호, 로그인 실패 제한 (3회)

상세한 사용법은 [scripts/README.md](scripts/README.md)를 참고하세요.

---

<details>
<summary><b>수동 실행 방법 (고급)</b></summary>

**Terminal 1 - Redis**:
```bash
redis-server
```

**Terminal 2 - Backend API**:
```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

**Terminal 3 - Celery Worker** (Phase 5 이후 필요):
```bash
cd backend
celery -A src.workers.celery_app worker --loglevel=info
```

**Terminal 4 - Rendering Worker** (Phase 6 이후 필요):
```bash
cd worker
go run cmd/worker/main.go
```

**Terminal 5 - Frontend**:
```bash
cd frontend
npm install
npm run dev
```

</details>

---

## 👨‍💻 개발 가이드

### 브랜치 전략

- **main**: 프로덕션 배포 브랜치
- **001-clippilot-mvp**: MVP 개발 브랜치
- **feature/T{task-id}**: 개별 태스크 브랜치

### 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/) 사용:

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 변경
style: 코드 포맷팅 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 설정 등 기타 변경
```

### 테스트 실행

**Frontend**:
```bash
cd frontend
npm test                 # 단위 테스트
npm run test:e2e        # E2E 테스트
```

**Backend**:
```bash
cd backend
pytest                   # 전체 테스트
pytest tests/test_jobs.py  # 특정 테스트
```

**Worker**:
```bash
cd worker
go test ./...
```

### 코드 스타일

- **Frontend**: ESLint + Prettier
- **Backend**: Black + isort + flake8
- **Worker**: gofmt + golangci-lint

---

## 📚 API 문서

### OpenAPI 스펙

전체 API 명세는 [api-v1.yaml](specs/001-clippilot-mvp/contracts/api-v1.yaml)에서 확인하세요.

### 주요 엔드포인트

#### 인증
- `POST /api/v1/auth/signup` - 회원가입
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/reset-password` - 비밀번호 재설정

#### 작업 관리
- `POST /api/v1/jobs` - 새 작업 생성
- `GET /api/v1/jobs` - 작업 목록 조회
- `GET /api/v1/jobs/{job_id}` - 작업 상세 조회
- `POST /api/v1/jobs/{job_id}/retry` - 작업 재시도

#### 템플릿 관리
- `GET /api/v1/templates` - 템플릿 목록
- `POST /api/v1/templates` - 템플릿 생성
- `PATCH /api/v1/templates/{template_id}` - 템플릿 수정

#### YouTube 연동
- `GET /api/v1/channels/oauth` - OAuth 인증 시작
- `GET /api/v1/channels/oauth/callback` - OAuth 콜백
- `GET /api/v1/channels` - 연동된 채널 목록

#### YouTube 검색 ⭐ **NEW**
- `GET /api/v1/youtube/search` - 영상 검색 (키워드, 필터링)
- `GET /api/v1/youtube/videos/{videoId}` - 영상 상세 조회

### 로컬 API 문서

백엔드 실행 후 http://localhost:8000/docs 에서 Swagger UI 확인 가능

---

## 🗺️ 로드맵

### 001-clippilot-mvp (Phase 1-6) - 104 tasks

- [x] Setup (Phase 1) ✅ **완료**
- [x] Foundational Infrastructure (Phase 2) ✅ **완료**
- [x] Authentication (Phase 3 - US0) ✅ **완료** - P0
- [ ] YouTube OAuth (Phase 4 - US6) - P0
- [ ] Content Generation (Phase 5 - US1) - P0 **MVP CORE**
- [ ] Rendering & Upload (Phase 6 - US2) - P0 **MVP CORE**

자세한 태스크 목록은 [tasks.md](specs/001-clippilot-mvp/tasks.md)를 참고하세요.

### 002-youtube-search (Phase 1-9) - 100 tasks 🔄 **진행 중**

**목표**: YouTube 영상 검색, 고급 필터링, CII 계산, 자막 수집 기능 구현

- [x] Phase 1: Setup ✅ **완료** (T001-T007)
- [x] Phase 2: Foundational ✅ **완료** (T008-T015)
- [x] Phase 3: US1 - 기본 검색 ✅ **완료** (T016-T038)
- [x] Phase 4: US2 - 고급 필터링 ✅ **완료** (T039-T052)
- [ ] Phase 5: US3 - CII 계산 (T053-T064)
- [ ] Phase 6: US4 - 자막 수집 (T065-T076)
- [ ] Phase 7: US5 - 영상 미리보기 및 저장 (T077-T085)
- [ ] Phase 8: US6 - 검색 히스토리 (T086-T093)
- [ ] Phase 9: Polish & 최적화 (T094-T100)

자세한 태스크 목록은 [tasks.md](specs/002-youtube-search/tasks.md)를 참고하세요.

**현재 작업**: Phase 4 완료, Phase 5로 이동 준비 중

### Post-MVP (Phase 7-11)

- [ ] Brand Templates (Phase 7 - US3) - P1
- [ ] Billing & Subscriptions (Phase 8 - US4) - P1
- [ ] User Onboarding (Phase 9 - US7) - P1
- [ ] Dashboard & Analytics (Phase 10 - US5) - P2
- [ ] Polish & Optimization (Phase 11)

---

## 🤝 기여하기

기여를 환영합니다! 다음 절차를 따라주세요:

1. 이 저장소를 Fork합니다
2. Feature 브랜치를 생성합니다 (`git checkout -b feature/T{task-id}`)
3. 변경사항을 커밋합니다 (`git commit -m 'feat: Add some feature'`)
4. 브랜치에 Push합니다 (`git push origin feature/T{task-id}`)
5. Pull Request를 생성합니다

### 기여 가이드라인

- 커밋 메시지는 Conventional Commits 형식을 따릅니다
- 모든 코드는 테스트와 함께 제출되어야 합니다
- PR 전에 린터를 실행하세요
- 문서화가 필요한 변경사항은 README나 관련 문서를 업데이트하세요

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

---

## 📞 문의

- **이슈 트래커**: [GitHub Issues](https://github.com/drinkwhale/clippilot/issues)
- **Pull Requests**: [GitHub PRs](https://github.com/drinkwhale/clippilot/pulls)

---

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들의 도움을 받았습니다:

- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Supabase](https://supabase.com/)
- [FFmpeg](https://ffmpeg.org/)
- [shadcn/ui](https://ui.shadcn.com/)

---

<div align="center">
Made with ❤️ by ClipPilot Team
</div>
