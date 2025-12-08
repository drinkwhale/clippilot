# 모듈: Backend API (FastAPI)

## 역할
비즈니스 로직 및 외부 API 연동을 담당하는 FastAPI 기반 RESTful API 서버

## 기술 스택

- **언어**: Python 3.11
- **프레임워크**: FastAPI 0.120
- **ORM**: SQLAlchemy 2.0
- **외부 API**: google-api-python-client 2.185, OpenAI 2.6
- **작업 큐**: Celery 5.5 + Redis 7.0
- **Rate Limiting**: slowapi 0.1.9
- **결제**: Stripe 10.14
- **로깅**: loguru 0.7
- **패키지 매니저**: uv

## 디렉토리 구조

```
backend/
├── src/
│   ├── api/
│   │   └── v1/                # API 라우터 (버전 1)
│   │       ├── __init__.py    # 라우터 등록
│   │       ├── auth.py        # 인증 엔드포인트
│   │       ├── users.py       # 사용자 관리
│   │       ├── jobs.py        # 작업 생성/조회/관리
│   │       ├── templates.py   # 템플릿 관리
│   │       ├── channels.py    # YouTube 채널 관리
│   │       ├── youtube.py     # YouTube 검색 엔드포인트
│   │       ├── api_keys.py    # API 키 관리
│   │       ├── billing.py     # Stripe 결제 관리
│   │       ├── metrics.py     # 사용량 메트릭
│   │       ├── dashboard.py   # 대시보드 통계
│   │       ├── admin.py       # 관리자 엔드포인트
│   │       └── schemas/       # Pydantic 스키마
│   │           └── youtube.py # YouTube 관련 스키마
│   │
│   ├── core/                  # 핵심 비즈니스 로직
│   │   ├── ai/                # AI 서비스
│   │   │   ├── script_service.py    # 스크립트 생성 (OpenAI)
│   │   │   └── metadata_service.py  # 메타데이터 생성
│   │   ├── youtube/           # YouTube API 연동
│   │   │   ├── __init__.py          # YouTube API 클라이언트 초기화
│   │   │   ├── search_service.py    # 검색 서비스
│   │   │   ├── upload_service.py    # 영상 업로드 (향후)
│   │   │   ├── exceptions.py        # YouTube API 에러 핸들러
│   │   │   └── utils.py            # 유틸리티 (duration 파싱 등)
│   │   ├── security/          # 보안 및 인증
│   │   │   ├── auth.py        # JWT 토큰 검증
│   │   │   └── encryption.py  # 암호화 (OAuth 토큰)
│   │   ├── billing/           # Stripe 결제 처리
│   │   │   └── stripe_service.py
│   │   ├── media/             # 미디어 처리 (향후)
│   │   └── cache.py           # Redis 캐시 서비스
│   │
│   ├── models/                # SQLAlchemy 모델
│   │   ├── user.py            # User 모델
│   │   ├── job.py             # Job 모델
│   │   ├── template.py        # Template 모델
│   │   ├── channel.py         # Channel 모델
│   │   └── ...
│   │
│   ├── middleware/            # FastAPI 미들웨어
│   │   ├── auth.py            # 인증 미들웨어
│   │   ├── rate_limit.py      # Rate Limiting (slowapi)
│   │   └── error_handler.py   # 에러 처리 미들웨어
│   │
│   ├── workers/               # Celery 태스크 (향후)
│   │   ├── celery_app.py      # Celery 앱 설정
│   │   └── render_task.py     # 렌더링 작업 큐잉
│   │
│   ├── config.py              # 환경 변수 및 설정
│   ├── database.py            # Supabase 연결 설정
│   └── main.py                # FastAPI 앱 진입점
│
├── tests/                     # pytest 테스트
│   ├── test_youtube.py        # YouTube API 테스트
│   ├── test_auth.py           # 인증 테스트
│   └── ...
│
├── pyproject.toml             # 의존성 및 설정
└── .env                       # 환경 변수
```

## 핵심 파일

### API 엔드포인트
- **`src/api/v1/youtube.py`**: YouTube 검색 API
  - `GET /api/v1/youtube/search`: 영상 검색
  - `GET /api/v1/youtube/videos/{videoId}`: 영상 상세 조회
- **`src/api/v1/auth.py`**: 인증 API
  - `POST /api/v1/auth/signup`: 회원가입
  - `POST /api/v1/auth/login`: 로그인
- **`src/api/v1/jobs.py`**: 작업 관리 API
  - `POST /api/v1/jobs`: 작업 생성
  - `GET /api/v1/jobs`: 작업 목록 조회
- **`src/api/v1/templates.py`**: 템플릿 관리 API
- **`src/api/v1/channels.py`**: YouTube 채널 관리 API

### 비즈니스 로직
- **`src/core/youtube/search_service.py`**: YouTube 검색 서비스
  - `search_videos()`: YouTube Data API search.list 호출
  - `get_video_details()`: videos.list 호출하여 상세 정보 조회
  - 고급 필터링 로직: 영상 타입, 업로드 기간, 국가, 조회수, 구독자 수
- **`src/core/youtube/__init__.py`**: YouTube API 클라이언트 초기화
  - `get_youtube_client()`: API 키로 YouTube 클라이언트 생성
- **`src/core/cache.py`**: Redis 캐시 서비스
  - `get()`, `set()`, `delete()`: 기본 캐시 연산
  - 검색 결과 15분 TTL 캐싱

### 미들웨어
- **`src/middleware/auth.py`**: Supabase JWT 인증 미들웨어
  - Bearer 토큰 검증
  - 사용자 정보 추출
- **`src/middleware/rate_limit.py`**: slowapi 기반 Rate Limiting
  - 전역: 60 req/min
  - YouTube 검색: 10 req/min

### 모델
- **`src/models/job.py`**: Job 모델
  - 상태 전이: `queued → generating → rendering → uploading → done/failed`
- **`src/models/template.py`**: Template 모델
  - YouTube 메타데이터 저장 (JSONB)

## 개발 규칙

### 1. API 라우터 구조
- **모든 라우터는 `src/api/v1/`에 위치하며 `/api/v1` prefix 사용**
- 라우터는 `src/api/v1/__init__.py`에서 등록
- RESTful 원칙 준수

**Example**:
```python
# src/api/v1/youtube.py
from fastapi import APIRouter

router = APIRouter(prefix="/youtube", tags=["youtube"])

@router.get("/search")
async def search_videos(keyword: str):
    # ...
```

### 2. 비즈니스 로직 분리
- **비즈니스 로직은 `src/core/`의 서비스 클래스로 분리**
- 라우터는 요청/응답 처리만 담당
- 서비스 클래스는 테스트 가능하도록 설계

**Good**:
```python
# src/api/v1/youtube.py
from src.core.youtube.search_service import YouTubeSearchService

@router.get("/search")
async def search_videos(keyword: str):
    service = YouTubeSearchService()
    return await service.search_videos(keyword)
```

**Bad**:
```python
# 라우터에 비즈니스 로직 직접 작성 금지
@router.get("/search")
async def search_videos(keyword: str):
    youtube = build('youtube', 'v3', developerKey=API_KEY)
    # ... 직접 API 호출 로직
```

### 3. 에러 처리
- **`src/core/youtube/exceptions.py`의 커스텀 예외 사용**
- FastAPI HTTPException으로 변환
- 한국어 에러 메시지 제공

**Example**:
```python
# src/core/youtube/exceptions.py
class YouTubeAPIError(Exception):
    """YouTube API 호출 실패"""
    pass

# src/api/v1/youtube.py
try:
    result = await service.search_videos(keyword)
except YouTubeAPIError as e:
    raise HTTPException(
        status_code=500,
        detail={"code": "YOUTUBE_API_ERROR", "message": str(e)}
    )
```

### 4. Pydantic 스키마
- **모든 요청/응답에 Pydantic 스키마 정의**
- `src/api/v1/schemas/`에 도메인별로 정의
- 타입 안전성 및 자동 검증

**Example**:
```python
# src/api/v1/schemas/youtube.py
from pydantic import BaseModel

class SearchQuery(BaseModel):
    keyword: str
    maxResults: int = 25
    videoType: str | None = None

class YouTubeSearchResult(BaseModel):
    videoId: str
    title: str
    channelTitle: str
    # ...
```

### 5. 캐싱 전략
- **검색 결과는 15분 TTL로 캐싱**
- Redis를 통한 분산 캐싱
- 캐시 키는 쿼리 파라미터 기반

**Example**:
```python
from src.core.cache import cache

cache_key = f"youtube:search:{keyword}:{maxResults}"
cached = await cache.get(cache_key)
if cached:
    return cached

result = await youtube_client.search(...)
await cache.set(cache_key, result, ttl=900)  # 15분
```

### 6. Rate Limiting
- **slowapi를 사용한 Rate Limiting**
- 사용자별 제한 적용
- 제한 초과 시 429 응답

**Example**:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.get("/search")
@limiter.limit("10/minute")
async def search_videos(request: Request, keyword: str):
    # ...
```

### 7. 인증 및 보안
- **모든 보호된 엔드포인트는 Supabase JWT 토큰 필수**
- Bearer 토큰 검증
- RLS (Row Level Security) 정책과 연동

**Example**:
```python
from src.middleware.auth import get_current_user

@router.get("/jobs")
async def get_jobs(user: dict = Depends(get_current_user)):
    # user는 Supabase 세션에서 추출된 사용자 정보
    return await job_service.get_user_jobs(user["id"])
```

### 8. 로깅
- **loguru를 사용한 구조화된 로깅**
- 에러 로그는 Sentry로 전송 (프로덕션)
- 민감 정보 (API 키, 토큰) 로깅 금지

**Example**:
```python
from loguru import logger

logger.info("YouTube search", keyword=keyword, user_id=user["id"])
logger.error("YouTube API failed", error=str(e), keyword=keyword)
```

## 개발 명령어

```bash
# 개발 서버 실행
uv run uvicorn src.main:app --reload --port 8000

# 테스트
uv run pytest                    # 전체 테스트
uv run pytest tests/test_youtube.py  # 특정 테스트
uv run pytest --cov              # 커버리지 포함

# 의존성 관리
uv sync                          # 의존성 설치
uv add package-name              # 패키지 추가
uv remove package-name           # 패키지 제거

# 코드 포맷팅 (프로젝트 설정에 따라 자동)
# black .
# isort .
```

## 환경 변수

`.env` 파일에 다음 변수 설정:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_JWT_SECRET=your_jwt_secret

# YouTube
YOUTUBE_API_KEY=your_youtube_api_key

# Redis
REDIS_URL=redis://localhost:6379/0

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Stripe (향후)
STRIPE_API_KEY=your_stripe_api_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# 기타
ENVIRONMENT=development
LOG_LEVEL=INFO
```

## 주요 의존성

### 웹 프레임워크
- `fastapi`: 고성능 비동기 웹 프레임워크
- `uvicorn`: ASGI 서버

### 데이터베이스
- `sqlalchemy`: ORM
- `psycopg2-binary`: PostgreSQL 어댑터
- `asyncpg`: 비동기 PostgreSQL 드라이버

### 외부 API
- `google-api-python-client`: YouTube Data API
- `openai`: OpenAI API
- `stripe`: Stripe 결제 API

### 유틸리티
- `pydantic`: 데이터 검증
- `redis`: Redis 클라이언트
- `slowapi`: Rate Limiting
- `loguru`: 로깅
- `python-dotenv`: 환경 변수 관리

### 작업 큐 (향후)
- `celery`: 비동기 작업 큐
- `flower`: Celery 모니터링

## 코드 스타일

- **Black + isort + flake8** (PEP 8)
- **파일명**: snake_case (예: `search_service.py`)
- **클래스명**: PascalCase (예: `YouTubeSearchService`)
- **함수명**: snake_case (예: `search_videos`)
- **상수명**: UPPER_SNAKE_CASE (예: `DEFAULT_MAX_RESULTS`)

## 테스트 전략

### 단위 테스트 (pytest)
- 서비스 로직 테스트
- 유틸리티 함수 테스트
- 에러 핸들링 테스트

### 통합 테스트
- API 엔드포인트 테스트 (TestClient 사용)
- 데이터베이스 연동 테스트
- 외부 API Mock 테스트

### 테스트 작성 예시
```python
# tests/test_youtube.py
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_search_videos():
    response = client.get("/api/v1/youtube/search?keyword=react")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
```

## API 문서

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Spec**: `specs/001-clippilot-mvp/contracts/api-v1.yaml`

## 주의사항

### 현재 구현 상태
- ✅ Phase 1-3 완료: 기본 인프라, 인증, YouTube 검색
- 🔜 Phase 4 대기: YouTube OAuth
- 🔜 Phase 5 대기: AI 스크립트 생성
- 🔜 Phase 6 대기: 렌더링 및 업로드

### 개발 시 주의사항
1. **YouTube API Quota**: 일일 10,000 유닛 제한 (주의 필요)
2. **Rate Limiting**: 검색 엔드포인트는 10 req/min 제한
3. **인증**: 모든 보호된 엔드포인트는 JWT 토큰 필수
4. **CORS**: Frontend (localhost:3000)에서 접근 가능하도록 설정됨

### 트러블슈팅
- **YouTube API 에러**: API 키 유효성 확인, Quota 확인
- **Redis 연결 에러**: Redis 서버 실행 상태 확인
- **Supabase 연결 에러**: 환경 변수 설정 확인
- **Rate Limit 에러**: slowapi 설정 확인

## 데이터베이스 스키마

Supabase PostgreSQL 스키마는 `specs/001-clippilot-mvp/data-model.md` 참고

주요 테이블:
- `users`: 사용자 정보
- `channels`: YouTube 채널 연동 정보
- `templates`: 영상 템플릿
- `jobs`: 영상 생성 작업
- `subscriptions`: 구독 정보 (Stripe)
- `usage_logs`: API 사용량 로그
- `webhooks`: Webhook 이벤트 로그

## 참고 문서

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [SQLAlchemy 문서](https://docs.sqlalchemy.org/)
- [YouTube Data API v3 문서](https://developers.google.com/youtube/v3)
- [Supabase 문서](https://supabase.com/docs)
- [Stripe API 문서](https://stripe.com/docs/api)
