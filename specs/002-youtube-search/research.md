# YouTube 영상 검색 기능 - 기술 조사 (Research)

## 개요

이 문서는 YouTube 영상 검색 기능 구현을 위한 기술 조사 및 의사결정 내용을 담고 있습니다.

## 1. YouTube Data API v3 연동 패턴

### 1.1 API 클라이언트 초기화

**선택한 방법**: `google-api-python-client` 라이브러리

**근거**:
- Google 공식 Python 클라이언트 라이브러리
- OAuth 2.0 및 API Key 인증 모두 지원
- 자동 rate limiting 및 retry 로직 내장
- 타입 안전성 및 IDE 자동완성 지원

**구현 패턴**:
```python
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

class YouTubeClient:
    def __init__(self, api_key: str):
        self.youtube = build('youtube', 'v3', developerKey=api_key)

    def search(self, **kwargs):
        try:
            request = self.youtube.search().list(**kwargs)
            return request.execute()
        except HttpError as e:
            # Handle quota errors, invalid API key, etc.
            raise YouTubeAPIError(e)
```

**대안 고려**:
- `requests` 직접 사용: 더 많은 제어권, 하지만 retry/error handling 직접 구현 필요
- 비공식 라이브러리 (`youtube-dl`, `pytube`): API quota 없지만 안정성 및 ToS 위반 위험

### 1.2 API Quota 관리 전략

**YouTube Data API Quota Limits**:
- 일일 기본 할당량: 10,000 units
- 주요 작업별 quota 비용:
  - `search.list`: 100 units
  - `videos.list`: 1 unit per video
  - `channels.list`: 1 unit per channel
  - `captions.list`: 50 units
  - `captions.download`: 200 units

**Quota 최적화 전략**:

1. **Redis 캐싱**:
   ```python
   # 검색 결과: 15분 캐싱 (빠르게 변하는 데이터)
   cache_key = f"youtube:search:{hash(search_params)}"
   ttl = 900  # 15 minutes

   # 영상 메타데이터: 1시간 캐싱 (준정적 데이터)
   cache_key = f"youtube:video:{video_id}"
   ttl = 3600  # 1 hour

   # 자막: 24시간 캐싱 (정적 데이터)
   cache_key = f"youtube:caption:{video_id}:{language}"
   ttl = 86400  # 24 hours

   # CII 점수: 6시간 캐싱 (반정적 데이터)
   cache_key = f"youtube:cii:{channel_id}"
   ttl = 21600  # 6 hours
   ```

2. **Quota 사용량 추적**:
   ```python
   # Redis에 일일 사용량 저장
   daily_key = f"youtube:quota:{date.today().isoformat()}"
   redis.incr(daily_key, amount=quota_cost)
   redis.expire(daily_key, 86400)  # 24시간 후 자동 삭제

   # 90% 도달 시 경고
   current_usage = redis.get(daily_key)
   if current_usage >= 9000:
       logger.warning(f"Quota usage at {current_usage}/10000")
   ```

3. **Graceful Degradation**:
   - Quota 초과 시 캐시된 데이터 우선 반환
   - 사용자에게 "일일 검색 한도 초과, 내일 다시 시도" 메시지
   - 관리자에게 알림 전송

### 1.3 에러 처리

**주요 에러 시나리오**:

1. **Quota 초과 (403 Forbidden)**:
   ```python
   if error.resp.status == 403 and "quotaExceeded" in error.content:
       # 캐시된 결과 반환 또는 사용자에게 안내
       raise QuotaExceededError("일일 검색 한도 초과")
   ```

2. **잘못된 API Key (400 Bad Request)**:
   ```python
   if error.resp.status == 400 and "keyInvalid" in error.content:
       logger.critical("Invalid YouTube API Key")
       raise ConfigurationError("YouTube API 설정 오류")
   ```

3. **Rate Limit (429 Too Many Requests)**:
   ```python
   if error.resp.status == 429:
       retry_after = error.resp.get('Retry-After', 60)
       raise RateLimitError(f"{retry_after}초 후 다시 시도")
   ```

---

## 2. CII (Channel Influence Index) 계산 알고리즘

### 2.1 계산 공식

**최종 CII Score** (0-100 범위):
```
CII = (
  normalize_subscribers(subscribers) × 0.40 +
  normalize_avg_views(avg_views) × 0.30 +
  normalize_upload_frequency(videos_per_month) × 0.15 +
  normalize_like_ratio(avg_like_ratio) × 0.15
) × 100
```

### 2.2 정규화 함수

**1. 구독자 수 정규화** (40% 가중치):
```python
def normalize_subscribers(count: int) -> float:
    """
    로그 스케일 정규화 (1천만 구독자 기준)

    Examples:
      10 subscribers → 0.10 (10%)
      1,000 → 0.30 (30%)
      100,000 → 0.57 (57%)
      1,000,000 → 0.71 (71%)
      10,000,000 → 1.00 (100%)
    """
    if count <= 0:
        return 0.0

    reference = 10_000_000  # 1천만 구독자
    return min(log10(count) / log10(reference), 1.0)
```

**2. 평균 조회수 정규화** (30% 가중치):
```python
def normalize_avg_views(avg_views: float) -> float:
    """
    최근 10개 영상 평균 조회수 (100만 조회수 기준)

    Examples:
      100 views → 0.20 (20%)
      10,000 → 0.67 (67%)
      100,000 → 0.83 (83%)
      1,000,000 → 1.00 (100%)
    """
    if avg_views <= 0:
        return 0.0

    reference = 1_000_000  # 100만 조회수
    return min(log10(avg_views) / log10(reference), 1.0)
```

**3. 영상 게시 빈도 정규화** (15% 가중치):
```python
def normalize_upload_frequency(videos_per_month: float) -> float:
    """
    월평균 영상 게시 수 (월 10개 기준)

    Examples:
      1 video/month → 0.10 (10%)
      5 videos/month → 0.50 (50%)
      10 videos/month → 1.00 (100%)
      20 videos/month → 1.00 (capped at 100%)
    """
    reference = 10.0  # 월 10개
    return min(videos_per_month / reference, 1.0)
```

**4. 평균 좋아요 비율 정규화** (15% 가중치):
```python
def normalize_like_ratio(avg_like_ratio: float) -> float:
    """
    평균 좋아요/조회수 비율 (5% 기준)

    Examples:
      0.01 (1%) → 0.20 (20%)
      0.03 (3%) → 0.60 (60%)
      0.05 (5%) → 1.00 (100%)
      0.10 (10%) → 1.00 (capped at 100%)
    """
    reference = 0.05  # 5%
    return min(avg_like_ratio / reference, 1.0)
```

### 2.3 데이터 수집 전략

**채널 정보 조회** (`channels.list`):
```python
def get_channel_metrics(channel_id: str) -> CIIMetrics:
    # 1. 채널 기본 정보 (1 quota unit)
    channel_response = youtube.channels().list(
        part="statistics,contentDetails",
        id=channel_id
    ).execute()

    subscriber_count = int(channel_response['statistics']['subscriberCount'])
    uploads_playlist_id = channel_response['contentDetails']['relatedPlaylists']['uploads']

    # 2. 최근 10개 영상 조회 (1 quota unit)
    uploads_response = youtube.playlistItems().list(
        part="contentDetails",
        playlistId=uploads_playlist_id,
        maxResults=10
    ).execute()

    video_ids = [item['contentDetails']['videoId'] for item in uploads_response['items']]

    # 3. 영상 상세 정보 (1 quota unit)
    videos_response = youtube.videos().list(
        part="statistics,snippet",
        id=",".join(video_ids)
    ).execute()

    # 4. 통계 계산
    total_views = sum(int(v['statistics']['viewCount']) for v in videos_response['items'])
    total_likes = sum(int(v['statistics'].get('likeCount', 0)) for v in videos_response['items'])
    avg_views = total_views / len(videos_response['items'])
    avg_like_ratio = total_likes / total_views if total_views > 0 else 0

    # 5. 업로드 빈도 계산
    first_video_date = parse_date(videos_response['items'][-1]['snippet']['publishedAt'])
    last_video_date = parse_date(videos_response['items'][0]['snippet']['publishedAt'])
    months_diff = (last_video_date - first_video_date).days / 30
    videos_per_month = len(videos_response['items']) / months_diff if months_diff > 0 else 0

    return CIIMetrics(
        subscriberCount=subscriber_count,
        averageViewCount=avg_views,
        uploadFrequency=videos_per_month,
        averageLikeRatio=avg_like_ratio,
        ciiScore=calculate_cii_score(...)
    )
```

**총 quota 비용**: 3 units (채널 정보 + 재생목록 + 영상 상세)

### 2.4 CII 캐싱 전략

- **TTL**: 6시간 (채널 지표는 빠르게 변하지 않음)
- **Cache Key**: `youtube:cii:{channel_id}`
- **Invalidation**: 수동 갱신 기능 제공 (관리자 전용)

---

## 3. 자막 수집 및 파싱

### 3.1 YouTube Captions API 제약사항

**중요한 제약**:
1. **OAuth 인증 필요**: `captions.download`는 API Key만으로는 불가능 → **OAuth 2.0 필수**
2. **Quota 비용 높음**: `captions.list` (50 units) + `captions.download` (200 units) = 250 units
3. **저작권 제한**: 일부 영상은 자막 다운로드가 차단됨

**대안 방법**:

#### Option A: YouTube Transcript API (비공식)
```python
# youtube-transcript-api 라이브러리 사용
from youtube_transcript_api import YouTubeTranscriptApi

def get_captions_unofficial(video_id: str, language: str = 'ko'):
    """
    장점:
    - OAuth 불필요
    - API quota 소비 없음
    - 빠른 응답 속도

    단점:
    - 비공식 API (YouTube ToS 위반 가능성)
    - 안정성 보장 없음
    - 일부 영상에서 작동 안 할 수 있음
    """
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=[language])
        return [
            Caption(
                text=entry['text'],
                start=entry['start'],
                duration=entry['duration']
            )
            for entry in transcript
        ]
    except Exception as e:
        logger.warning(f"Failed to fetch caption for {video_id}: {e}")
        return None
```

#### Option B: Official Captions API + OAuth
```python
# OAuth 2.0 인증 필요
from google_auth_oauthlib.flow import Flow

def get_captions_official(video_id: str, language: str = 'ko'):
    """
    장점:
    - 공식 API (안정성 보장)
    - 모든 자막 형식 지원

    단점:
    - OAuth 인증 플로우 구현 필요
    - API quota 많이 소비 (250 units)
    - 사용자별 인증 필요
    """
    # 1. 자막 목록 조회 (50 units)
    captions = youtube.captions().list(
        part="snippet",
        videoId=video_id
    ).execute()

    # 2. 특정 언어 자막 찾기
    caption_id = next(
        (c['id'] for c in captions['items'] if c['snippet']['language'] == language),
        None
    )

    if not caption_id:
        return None

    # 3. 자막 다운로드 (200 units)
    caption_content = youtube.captions().download(
        id=caption_id,
        tfmt='srt'  # or 'vtt', 'sbv'
    ).execute()

    return parse_srt(caption_content)
```

**선택한 방법**: **Option A (비공식 API) + Fallback to Option B**

**근거**:
- MVP 단계에서는 빠른 구현과 quota 절약이 우선
- 비공식 API가 실패하면 공식 API fallback
- 향후 프로덕션에서는 Option B로 전환 고려

### 3.2 자막 파싱 전략

**SRT 형식 파싱**:
```python
import re
from dataclasses import dataclass

@dataclass
class Caption:
    text: str
    start: float  # seconds
    duration: float  # seconds

def parse_srt(srt_content: str) -> list[Caption]:
    """
    SRT 형식:
    1
    00:00:00,000 --> 00:00:03,000
    첫 번째 자막 텍스트

    2
    00:00:03,500 --> 00:00:07,000
    두 번째 자막 텍스트
    """
    pattern = r'(\d+:\d+:\d+,\d+) --> (\d+:\d+:\d+,\d+)\n(.+?)(?=\n\n|\Z)'
    matches = re.findall(pattern, srt_content, re.DOTALL)

    captions = []
    for start_time, end_time, text in matches:
        start_seconds = time_to_seconds(start_time)
        end_seconds = time_to_seconds(end_time)

        captions.append(Caption(
            text=text.strip(),
            start=start_seconds,
            duration=end_seconds - start_seconds
        ))

    return captions

def time_to_seconds(time_str: str) -> float:
    """00:01:30,500 → 90.5 seconds"""
    h, m, s = time_str.replace(',', '.').split(':')
    return int(h) * 3600 + int(m) * 60 + float(s)
```

### 3.3 자막 저장 형식

**DB 스키마** (`templates.captions` JSONB):
```json
{
  "ko": {
    "language": "ko",
    "languageName": "한국어",
    "isAutoGenerated": false,
    "captions": [
      {"text": "안녕하세요", "start": 0.0, "duration": 2.5},
      {"text": "오늘은...", "start": 2.5, "duration": 3.0}
    ],
    "fullText": "안녕하세요 오늘은..."
  },
  "en": {
    "language": "en",
    "languageName": "English",
    "isAutoGenerated": true,
    "captions": [...],
    "fullText": "Hello, today..."
  }
}
```

---

## 4. Redis 캐싱 패턴

### 4.1 캐시 키 설계

**캐시 키 네이밍 컨벤션**:
```
youtube:{resource}:{identifier}[:{subkey}]

Examples:
- youtube:search:sha256(search_params)
- youtube:video:dQw4w9WgXcQ
- youtube:caption:dQw4w9WgXcQ:ko
- youtube:cii:UC_x5XG1OV2P6uZZ5FSM9Ttw
- youtube:quota:2025-01-15
```

### 4.2 캐시 구현 패턴

```python
from functools import wraps
import hashlib
import json
import redis

redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

def cached(ttl: int, key_prefix: str):
    """
    캐싱 데코레이터

    Usage:
      @cached(ttl=3600, key_prefix="youtube:video")
      def get_video_details(video_id: str):
          return youtube.videos().list(...).execute()
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 1. 캐시 키 생성
            cache_key = f"{key_prefix}:{args[0]}"  # 첫 번째 인자를 식별자로 사용

            # 2. 캐시 조회
            cached_value = redis_client.get(cache_key)
            if cached_value:
                logger.debug(f"Cache hit: {cache_key}")
                return json.loads(cached_value)

            # 3. 함수 실행
            logger.debug(f"Cache miss: {cache_key}")
            result = func(*args, **kwargs)

            # 4. 캐시 저장
            redis_client.setex(cache_key, ttl, json.dumps(result))

            return result
        return wrapper
    return decorator

# 사용 예시
@cached(ttl=3600, key_prefix="youtube:video")
def get_video_details(video_id: str):
    return youtube.videos().list(
        part="snippet,statistics,contentDetails",
        id=video_id
    ).execute()
```

### 4.3 검색 결과 캐싱 (복잡한 파라미터)

```python
def search_cache_key(search_params: dict) -> str:
    """
    검색 파라미터를 해시하여 캐시 키 생성

    search_params = {
        "q": "react tutorial",
        "videoType": "shorts",
        "regionCode": "KR",
        "order": "viewCount",
        ...
    }
    """
    # 파라미터를 정렬하여 일관된 해시 생성
    sorted_params = json.dumps(search_params, sort_keys=True)
    param_hash = hashlib.sha256(sorted_params.encode()).hexdigest()[:16]
    return f"youtube:search:{param_hash}"

@cached(ttl=900, key_prefix="youtube:search")
def search_videos(search_params: dict):
    cache_key = search_cache_key(search_params)
    # ... 검색 로직
```

---

## 5. Rate Limiting 전략

### 5.1 slowapi 구현

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Limiter 초기화 (Redis 기반)
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379"
)

# FastAPI 앱에 등록
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 엔드포인트에 적용
@app.get("/api/v1/youtube/search")
@limiter.limit("10/minute")  # 분당 10회
async def search_youtube(request: Request, q: str):
    # 검색 로직
    pass
```

### 5.2 사용자 인증 기반 Rate Limiting

```python
from slowapi.util import get_remote_address

def get_user_id(request: Request) -> str:
    """
    인증된 사용자 ID 추출 (Supabase JWT)
    """
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if token:
        user = verify_jwt(token)
        return user.get("sub")  # Supabase user ID
    return get_remote_address(request)  # Fallback to IP

limiter = Limiter(key_func=get_user_id)

@app.get("/api/v1/youtube/search")
@limiter.limit("10/minute")  # 사용자당 분당 10회
async def search_youtube(request: Request, q: str):
    pass
```

### 5.3 Premium 사용자 차등 제한

```python
def get_rate_limit(request: Request) -> str:
    """
    사용자 등급에 따라 다른 rate limit 적용

    - Free: 10/minute
    - Premium: 30/minute
    - Enterprise: 100/minute
    """
    user = get_current_user(request)

    if user.subscription_tier == "enterprise":
        return "100/minute"
    elif user.subscription_tier == "premium":
        return "30/minute"
    else:
        return "10/minute"

@app.get("/api/v1/youtube/search")
@limiter.limit(get_rate_limit)
async def search_youtube(request: Request, q: str):
    pass
```

---

## 6. ISO 8601 Duration 파싱

### 6.1 Duration 형식

YouTube API는 영상 길이를 ISO 8601 형식으로 반환:
- `PT1M30S` → 1분 30초 (90초)
- `PT15M` → 15분 (900초)
- `PT1H2M3S` → 1시간 2분 3초 (3723초)
- `PT30S` → 30초

### 6.2 파싱 구현

```python
import re

def parse_duration(duration: str) -> int:
    """
    ISO 8601 duration을 초 단위로 변환

    Examples:
      PT1M30S → 90
      PT15M → 900
      PT1H2M3S → 3723
      PT30S → 30
    """
    if not duration or duration == "PT0S":
        return 0

    # 정규표현식: PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?
    pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
    match = re.match(pattern, duration)

    if not match:
        raise ValueError(f"Invalid ISO 8601 duration: {duration}")

    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)

    return hours * 3600 + minutes * 60 + seconds

def is_shorts(duration: str) -> bool:
    """
    60초 이하이면 Shorts로 분류
    """
    return parse_duration(duration) <= 60
```

### 6.3 Frontend 표시 형식

```typescript
// frontend/src/lib/utils/format.ts
export function formatDuration(duration: string): string {
  const seconds = parseDuration(duration);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

// Examples:
// PT1M30S → "1:30"
// PT1H2M3S → "1:02:03"
// PT30S → "0:30"
```

---

## 7. Frontend 상태 관리 (TanStack Query)

### 7.1 Query Key 설계

```typescript
// hooks/useYouTubeSearch.ts
const youtubeKeys = {
  all: ['youtube'] as const,
  searches: () => [...youtubeKeys.all, 'search'] as const,
  search: (params: SearchQuery) => [...youtubeKeys.searches(), params] as const,
  videos: () => [...youtubeKeys.all, 'videos'] as const,
  video: (videoId: string) => [...youtubeKeys.videos(), videoId] as const,
  captions: (videoId: string) => [...youtubeKeys.video(videoId), 'captions'] as const,
  cii: (channelId: string) => [...youtubeKeys.all, 'cii', channelId] as const,
};
```

### 7.2 useYouTubeSearch Hook

```typescript
import { useQuery } from '@tanstack/react-query';
import { youtubeApi } from '@/lib/api/youtube';

export function useYouTubeSearch(params: SearchQuery) {
  return useQuery({
    queryKey: youtubeKeys.search(params),
    queryFn: () => youtubeApi.search(params),
    staleTime: 1000 * 60 * 15, // 15분 (서버 캐시와 동일)
    enabled: params.keyword.length > 0,
  });
}

// 사용 예시
const { data, isLoading, error } = useYouTubeSearch({
  keyword: 'react tutorial',
  videoType: 'all',
  maxResults: 25,
});
```

### 7.3 무한 스크롤 (Infinite Queries)

```typescript
export function useInfiniteYouTubeSearch(params: SearchQuery) {
  return useInfiniteQuery({
    queryKey: youtubeKeys.search(params),
    queryFn: ({ pageParam }) =>
      youtubeApi.search({ ...params, pageToken: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    staleTime: 1000 * 60 * 15,
  });
}

// 사용 예시
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteYouTubeSearch({ keyword: 'react', maxResults: 25 });

// Intersection Observer로 자동 로드
const { ref } = useInView({
  onChange: (inView) => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  },
});
```

---

## 8. UI/UX 고려사항

### 8.1 스켈레톤 로딩

```tsx
// components/features/youtube/VideoSkeleton.tsx
export function VideoSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {/* 썸네일 */}
      <div className="aspect-video bg-gray-200 rounded-lg" />

      {/* 제목 */}
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />

      {/* 채널명 + 조회수 */}
      <div className="flex items-center gap-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
}

// VideoGrid에 적용
{isLoading && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 12 }).map((_, i) => (
      <VideoSkeleton key={i} />
    ))}
  </div>
)}
```

### 8.2 에러 상태 처리

```tsx
// components/features/youtube/SearchError.tsx
export function SearchError({ error, retry }: { error: Error; retry: () => void }) {
  const errorMessage = (() => {
    if (error.message.includes('quota')) {
      return {
        title: '일일 검색 한도 초과',
        description: '내일 다시 시도해주세요.',
        showRetry: false,
      };
    }

    if (error.message.includes('network')) {
      return {
        title: '네트워크 오류',
        description: '인터넷 연결을 확인해주세요.',
        showRetry: true,
      };
    }

    return {
      title: '검색 오류',
      description: '잠시 후 다시 시도해주세요.',
      showRetry: true,
    };
  })();

  return (
    <div className="text-center py-12">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold">{errorMessage.title}</h3>
      <p className="text-gray-600 mt-2">{errorMessage.description}</p>
      {errorMessage.showRetry && (
        <button onClick={retry} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          다시 시도
        </button>
      )}
    </div>
  );
}
```

### 8.3 반응형 디자인

```tsx
// Tailwind CSS Breakpoints
// sm: 640px (모바일 가로)
// md: 768px (태블릿)
// lg: 1024px (데스크톱)
// xl: 1280px (대형 데스크톱)

// VideoGrid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {videos.map(video => <VideoCard key={video.videoId} video={video} />)}
</div>

// SearchBar (모바일: 세로 스택, 데스크톱: 가로 정렬)
<div className="flex flex-col md:flex-row gap-4">
  <SearchInput />
  <SearchFilters />
</div>
```

---

## 9. 보안 고려사항

### 9.1 API Key 관리

**환경 변수 분리**:
```python
# backend/src/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    YOUTUBE_API_KEY: str

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

**절대 노출 금지**:
- Frontend에서 YouTube API 직접 호출 ❌
- 모든 YouTube API 호출은 Backend를 통해 수행 ✅
- API Key는 `.env` 파일에만 저장, Git에는 커밋하지 않음

### 9.2 입력 검증

```python
from pydantic import BaseModel, Field, validator

class SearchQuery(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=200)
    maxResults: int = Field(default=25, ge=1, le=50)

    @validator('keyword')
    def sanitize_keyword(cls, v):
        # XSS 방지: 특수문자 제거
        import re
        sanitized = re.sub(r'[<>]', '', v)
        return sanitized.strip()
```

### 9.3 CORS 설정

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://clippilot.vercel.app"],  # 프로덕션 도메인만
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)
```

---

## 10. 테스트 전략

### 10.1 Backend 단위 테스트

```python
# tests/test_youtube_service.py
import pytest
from unittest.mock import patch, MagicMock

@pytest.fixture
def youtube_service():
    return YouTubeSearchService(api_key="test_key")

def test_search_videos(youtube_service):
    with patch.object(youtube_service, 'youtube') as mock_youtube:
        # Mock YouTube API 응답
        mock_youtube.search().list().execute.return_value = {
            'items': [
                {
                    'id': {'videoId': 'test123'},
                    'snippet': {'title': 'Test Video'}
                }
            ]
        }

        result = youtube_service.search_videos(keyword='test')
        assert len(result['items']) == 1
        assert result['items'][0]['videoId'] == 'test123'

def test_parse_duration():
    assert parse_duration('PT1M30S') == 90
    assert parse_duration('PT1H2M3S') == 3723
    assert is_shorts('PT30S') == True
    assert is_shorts('PT2M') == False
```

### 10.2 Frontend E2E 테스트 (Playwright)

```typescript
// tests/e2e/youtube-search.spec.ts
import { test, expect } from '@playwright/test';

test('YouTube 영상 검색 플로우', async ({ page }) => {
  // 1. 검색 페이지 이동
  await page.goto('/dashboard/youtube-search');

  // 2. 검색어 입력
  await page.fill('input[placeholder="검색어를 입력하세요"]', 'react tutorial');
  await page.click('button[type="submit"]');

  // 3. 로딩 상태 확인
  await expect(page.locator('[data-testid="video-skeleton"]')).toBeVisible();

  // 4. 검색 결과 표시 확인
  await expect(page.locator('[data-testid="video-card"]').first()).toBeVisible();

  // 5. 영상 카드 클릭 → 상세 모달 확인
  await page.locator('[data-testid="video-card"]').first().click();
  await expect(page.locator('[data-testid="video-detail-modal"]')).toBeVisible();

  // 6. 템플릿 저장
  await page.fill('input[name="templateName"]', 'Test Template');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=템플릿이 저장되었습니다')).toBeVisible();
});

test('필터 적용', async ({ page }) => {
  await page.goto('/dashboard/youtube-search?q=music');

  // 쇼츠 필터 선택
  await page.click('[data-testid="video-type-filter"]');
  await page.click('text=쇼츠');

  // 모든 결과가 60초 이하인지 확인
  const durations = await page.locator('[data-testid="video-duration"]').allTextContents();
  durations.forEach(duration => {
    const seconds = parseDuration(duration);
    expect(seconds).toBeLessThanOrEqual(60);
  });
});
```

---

## 11. 성능 최적화

### 11.1 이미지 최적화

```tsx
// Next.js Image 컴포넌트 사용
import Image from 'next/image';

export function VideoCard({ video }: { video: YouTubeSearchResult }) {
  return (
    <div>
      <Image
        src={video.thumbnails.high}
        alt={video.title}
        width={480}
        height={360}
        loading="lazy"  // Lazy loading
        placeholder="blur"  // Blur placeholder
        blurDataURL="data:image/svg+xml;base64,..."
      />
    </div>
  );
}
```

### 11.2 Code Splitting

```tsx
// VideoDetailModal을 동적 import
import dynamic from 'next/dynamic';

const VideoDetailModal = dynamic(
  () => import('@/components/features/youtube/VideoDetailModal'),
  { ssr: false, loading: () => <ModalSkeleton /> }
);

// 모달이 열릴 때만 로드
{isModalOpen && <VideoDetailModal videoId={selectedVideoId} />}
```

### 11.3 Debounced Search

```tsx
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function SearchBar() {
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword, 500); // 500ms delay

  const { data } = useYouTubeSearch({ keyword: debouncedKeyword });

  return (
    <input
      value={keyword}
      onChange={(e) => setKeyword(e.target.value)}
      placeholder="검색어를 입력하세요"
    />
  );
}
```

---

## 12. 배포 고려사항

### 12.1 환경별 설정

**Development**:
- YouTube API Key: 개발용 키 (별도 프로젝트)
- Redis: 로컬 Redis 서버
- Rate Limiting: 더 관대한 제한 (20 req/min)

**Production**:
- YouTube API Key: 프로덕션 키 (보안 강화)
- Redis: Upstash Redis (Serverless)
- Rate Limiting: 엄격한 제한 (10 req/min)
- Monitoring: Sentry 에러 추적 활성화

### 12.2 CI/CD 파이프라인

```yaml
# .github/workflows/youtube-search.yml
name: YouTube Search Feature CI

on:
  push:
    branches: [002-youtube-search]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Backend Tests
        run: |
          cd backend
          pytest tests/test_youtube_service.py

      - name: Frontend Tests
        run: |
          cd frontend
          npm run test
          npx playwright test tests/e2e/youtube-search.spec.ts

      - name: Lint
        run: |
          cd backend && flake8 src/core/youtube/
          cd frontend && npm run lint
```

---

## 13. 향후 개선 사항

1. **YouTube Analytics API 연동**:
   - 채널 성장률 추적
   - 트렌드 영상 예측

2. **ML 기반 추천**:
   - 사용자가 저장한 템플릿 기반 유사 영상 추천
   - 채널 특성 분석 및 성공 예측

3. **실시간 알림**:
   - 인기 영상 급상승 알림
   - 새로운 트렌드 키워드 알림

4. **Advanced Filtering**:
   - 댓글 수 필터
   - 공유 수 필터
   - 채널 인증 여부 (Verified Badge)

---

## 결론

이 문서에서 다룬 기술적 의사결정들은 다음 원칙을 따릅니다:

1. **API Quota 효율성**: 캐싱과 최적화로 일일 10,000 units 내에서 운영
2. **사용자 경험**: 2초 이내 응답, 무한 스크롤, 스켈레톤 로딩
3. **확장성**: Redis 캐싱, Rate Limiting으로 스케일 가능한 아키텍처
4. **안정성**: 에러 처리, Fallback 전략, Graceful Degradation
5. **보안**: API Key 관리, 입력 검증, CORS 설정

이 연구를 바탕으로 다음 단계인 데이터 모델 설계 및 API 계약 문서화를 진행합니다.
