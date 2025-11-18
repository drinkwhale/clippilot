# YouTube 영상 검색 기능 - Quickstart Guide

## 개요

이 문서는 YouTube 영상 검색 기능의 개발 환경 설정, 테스트 시나리오, 검증 절차를 포함합니다.

---

## 1. 개발 환경 설정

### 1.1 필수 요구사항

- **Node.js**: 20.x
- **Python**: 3.11
- **Redis**: 7.x
- **PostgreSQL**: 15.x (Supabase)
- **YouTube Data API Key**: [Google Cloud Console](https://console.cloud.google.com/)에서 발급

### 1.2 YouTube API Key 발급

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스 > 라이브러리** 이동
4. "YouTube Data API v3" 검색 및 활성화
5. **사용자 인증 정보 > API 키 만들기**
6. API 키 복사 및 제한 설정:
   - **애플리케이션 제한사항**: HTTP 리퍼러 (웹사이트) 또는 IP 주소
   - **API 제한사항**: YouTube Data API v3만 허용

### 1.3 Backend 환경 변수 설정

```bash
# backend/.env
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY_HERE
REDIS_URL=redis://localhost:6379
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```

### 1.4 데이터베이스 마이그레이션

```bash
cd backend

# templates 테이블에 YouTube 컬럼 추가
alembic revision -m "add_youtube_columns_to_templates"
alembic upgrade head

# search_histories 테이블 생성
alembic revision -m "create_search_histories"
alembic upgrade head
```

**마이그레이션 SQL**:
```sql
-- templates 테이블 확장
ALTER TABLE templates
ADD COLUMN youtube_video_id VARCHAR(20),
ADD COLUMN youtube_metadata JSONB,
ADD COLUMN captions JSONB,
ADD COLUMN cii_score DECIMAL(5,2),
ADD COLUMN channel_info JSONB;

-- search_histories 테이블 생성
CREATE TABLE search_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword VARCHAR(200) NOT NULL,
  search_params JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_keyword UNIQUE (user_id, keyword)
);
```

### 1.5 의존성 설치

**Backend**:
```bash
cd backend
pip install -r requirements.txt

# 새로운 의존성 (추가 필요)
pip install google-api-python-client slowapi youtube-transcript-api
```

**Frontend**:
```bash
cd frontend
npm install

# 새로운 의존성 (추가 필요)
npm install react-youtube
```

### 1.6 로컬 서버 실행

**Redis 실행**:
```bash
redis-server
```

**Backend 실행**:
```bash
cd backend
uvicorn src.main:app --reload --port 8000
```

**Frontend 실행**:
```bash
cd frontend
npm run dev
```

---

## 2. 핵심 테스트 시나리오

### 2.1 US1: 기본 검색 (Phase 3)

#### 시나리오 1.1: 키워드 검색
```gherkin
Given 사용자가 YouTube 검색 페이지에 접속했을 때
When "react tutorial"을 검색하면
Then 25개의 영상 결과가 표시된다
And 각 영상에는 썸네일, 제목, 채널명, 조회수, 게시일이 포함된다
And 응답 시간은 2초 이내다
```

**수동 테스트**:
1. http://localhost:3000/dashboard/youtube-search 접속
2. 검색창에 "react tutorial" 입력
3. Enter 또는 검색 버튼 클릭
4. 결과 확인

**API 테스트 (curl)**:
```bash
curl -X GET "http://localhost:8000/api/v1/youtube/search?q=react%20tutorial&maxResults=25" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**예상 응답**:
```json
{
  "items": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "React Tutorial for Beginners",
      "description": "Learn React from scratch...",
      "thumbnails": {
        "high": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
      },
      "channelTitle": "Programming with Mosh",
      "viewCount": 1500000,
      "publishedAt": "2024-06-15T10:00:00Z",
      "duration": "PT45M30S",
      "videoType": "long-form",
      "captionsAvailable": true
    }
  ],
  "totalResults": 1000,
  "resultsPerPage": 25
}
```

#### 시나리오 1.2: 영상 수집 수 변경
```gherkin
Given 사용자가 검색 결과 페이지에 있을 때
When 수집 수를 50개로 변경하면
Then 50개의 영상 결과가 표시된다
```

**수동 테스트**:
1. 검색 페이지에서 "영상 수집 수" 드롭다운 클릭
2. "50개" 선택
3. 결과 개수 확인 (50개 영상 카드 표시)

**API 테스트**:
```bash
curl -X GET "http://localhost:8000/api/v1/youtube/search?q=react&maxResults=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 시나리오 1.3: 캐싱 동작 확인
```gherkin
Given 사용자가 "react tutorial"을 검색했을 때
When 동일한 검색을 다시 수행하면
Then 캐시된 결과가 2초 이내에 반환된다
```

**Backend 로그 확인**:
```bash
# 첫 번째 검색 (Cache miss)
INFO: Cache miss: youtube:search:a3f2d8e1c4b6
INFO: YouTube API called (100 quota units)

# 두 번째 검색 (Cache hit)
INFO: Cache hit: youtube:search:a3f2d8e1c4b6
INFO: Response time: 120ms
```

---

### 2.2 US2: 고급 필터링 (Phase 4)

#### 시나리오 2.1: 영상 타입 필터 (쇼츠)
```gherkin
Given 사용자가 검색 페이지에서 "music"을 검색할 때
When 영상 타입을 "쇼츠"로 선택하면
Then 모든 결과는 60초 이하 영상이다
And 각 영상에 "Shorts" 뱃지가 표시된다
```

**수동 테스트**:
1. 검색창에 "music" 입력
2. 필터에서 "영상 타입: 쇼츠" 선택
3. 모든 영상의 duration이 "0:59" 이하인지 확인

**API 테스트**:
```bash
curl -X GET "http://localhost:8000/api/v1/youtube/search?q=music&videoType=shorts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**검증 스크립트**:
```python
# 모든 결과가 60초 이하인지 확인
for video in response['items']:
    duration_seconds = parse_duration(video['duration'])
    assert duration_seconds <= 60, f"Video {video['videoId']} is not a Short"
    assert video['videoType'] == 'shorts'
```

#### 시나리오 2.2: 업로드 기간 필터
```gherkin
Given 사용자가 검색 페이지에 있을 때
When 업로드 기간을 "이번주 (7일 이내)"로 설정하면
Then 모든 결과는 최근 7일 이내에 업로드된 영상이다
```

**수동 테스트**:
1. 필터에서 "업로드 기간: 이번주" 선택
2. 각 영상의 게시일이 오늘로부터 7일 이내인지 확인

**API 테스트**:
```bash
# 7일 전 날짜 계산
SEVEN_DAYS_AGO=$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)

curl -X GET "http://localhost:8000/api/v1/youtube/search?q=news&publishedAfter=$SEVEN_DAYS_AGO" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 시나리오 2.3: 국가 필터
```gherkin
Given 사용자가 "K-pop"을 검색할 때
When 국가를 "일본"으로 선택하면
Then 일본에서 인기 있는 K-pop 영상이 표시된다
```

**API 테스트**:
```bash
curl -X GET "http://localhost:8000/api/v1/youtube/search?q=k-pop&regionCode=JP" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 시나리오 2.4: 조회수 필터
```gherkin
Given 사용자가 검색 결과를 필터링할 때
When 최소 조회수를 100만으로 설정하면
Then 모든 결과는 조회수가 100만 이상이다
```

**API 테스트**:
```bash
curl -X GET "http://localhost:8000/api/v1/youtube/search?q=tech&minViewCount=1000000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**검증**:
```python
for video in response['items']:
    assert video['viewCount'] >= 1_000_000
```

---

### 2.3 US3: CII 계산 및 필터링 (Phase 5)

#### 시나리오 3.1: CII 점수 계산
```gherkin
Given 채널 ID "UC_x5XG1OV2P6uZZ5FSM9Ttw"가 주어졌을 때
When CII 점수를 계산하면
Then 0-100 범위의 점수가 반환된다
And 구독자 수, 평균 조회수, 게시 빈도, 좋아요 비율이 포함된다
```

**API 테스트**:
```bash
curl -X GET "http://localhost:8000/api/v1/youtube/channels/UC_x5XG1OV2P6uZZ5FSM9Ttw/cii" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**예상 응답**:
```json
{
  "channelId": "UC_x5XG1OV2P6uZZ5FSM9Ttw",
  "channelTitle": "Sample Channel",
  "subscriberCount": 1000000,
  "averageViewCount": 500000.0,
  "uploadFrequency": 8.5,
  "averageLikeRatio": 0.035,
  "ciiScore": 75.5
}
```

**검증 로직**:
```python
def test_cii_calculation():
    # 1. 정규화 테스트
    subscribers_norm = normalize_subscribers(1_000_000)
    assert 0.6 < subscribers_norm < 0.8  # log10(1M) / log10(10M) ≈ 0.71

    # 2. 최종 점수 범위 테스트
    assert 0 <= response['ciiScore'] <= 100

    # 3. 가중치 합계 검증
    weighted_sum = (
        subscribers_norm * 0.40 +
        avg_views_norm * 0.30 +
        upload_freq_norm * 0.15 +
        like_ratio_norm * 0.15
    )
    assert abs(weighted_sum * 100 - response['ciiScore']) < 0.1
```

#### 시나리오 3.2: CII 필터 적용
```gherkin
Given 사용자가 검색 결과를 필터링할 때
When CII 점수 범위를 70-100으로 설정하면
Then 모든 결과는 CII 점수가 70 이상 100 이하다
```

**API 테스트**:
```bash
curl -X GET "http://localhost:8000/api/v1/youtube/search?q=education&minCiiScore=70&maxCiiScore=100" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**검증**:
```python
for video in response['items']:
    assert 70 <= video['ciiScore'] <= 100
```

#### 시나리오 3.3: CII 정렬
```gherkin
Given 사용자가 검색 결과를 정렬할 때
When 정렬 기준을 "CII 점수"로 선택하면
Then 결과는 CII 점수가 높은 순으로 정렬된다
```

**API 테스트**:
```bash
curl -X GET "http://localhost:8000/api/v1/youtube/search?q=tech&order=cii" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**검증**:
```python
cii_scores = [video['ciiScore'] for video in response['items']]
assert cii_scores == sorted(cii_scores, reverse=True)
```

---

### 2.4 US4: 자막 수집 (Phase 6)

#### 시나리오 4.1: 자막 목록 조회
```gherkin
Given 영상 ID "dQw4w9WgXcQ"가 주어졌을 때
When 사용 가능한 자막을 조회하면
Then 한국어, 영어 등 자막 언어 목록이 반환된다
And 자동 생성 여부가 표시된다
```

**API 테스트**:
```bash
curl -X GET "http://localhost:8000/api/v1/youtube/videos/dQw4w9WgXcQ/captions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**예상 응답**:
```json
[
  {
    "language": "ko",
    "languageName": "한국어",
    "isAutoGenerated": false,
    "captionId": "SwPOvp0r7kd9ttt_XhcHdZthNwSopnhhb1iMWv6HbWQ="
  },
  {
    "language": "en",
    "languageName": "English",
    "isAutoGenerated": true,
    "captionId": "AnotherCaptionIdHere"
  }
]
```

#### 시나리오 4.2: 한국어 자막 다운로드
```gherkin
Given 영상에 한국어 자막이 있을 때
When 한국어 자막을 다운로드하면
Then 타임스탬프 포함 자막 데이터가 반환된다
And 전체 텍스트가 포함된다
```

**API 테스트**:
```bash
curl -X GET "http://localhost:8000/api/v1/youtube/videos/dQw4w9WgXcQ/captions/ko" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**예상 응답**:
```json
{
  "videoId": "dQw4w9WgXcQ",
  "language": "ko",
  "languageName": "한국어",
  "isAutoGenerated": false,
  "captions": [
    {"text": "안녕하세요", "start": 0.0, "duration": 2.5},
    {"text": "오늘은 YouTube API에 대해 알아보겠습니다", "start": 2.5, "duration": 3.5}
  ],
  "fullText": "안녕하세요 오늘은 YouTube API에 대해 알아보겠습니다"
}
```

**검증**:
```python
# 타임스탬프 순서 확인
for i in range(len(captions) - 1):
    assert captions[i]['start'] <= captions[i+1]['start']

# 전체 텍스트 일치 확인
full_text_reconstructed = ' '.join([c['text'] for c in captions])
assert full_text_reconstructed == response['fullText']
```

#### 시나리오 4.3: 자막 없는 영상 처리
```gherkin
Given 영상에 자막이 없을 때
When 자막을 조회하면
Then 404 에러와 "자막이 없습니다" 메시지가 반환된다
```

**API 테스트**:
```bash
curl -X GET "http://localhost:8000/api/v1/youtube/videos/NoSubtitlesVideoId/captions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**예상 응답** (404):
```json
{
  "error": {
    "code": "CAPTIONS_NOT_AVAILABLE",
    "message": "이 영상에는 자막이 없습니다"
  }
}
```

---

### 2.5 US5: 영상 미리보기 및 저장 (Phase 7)

#### 시나리오 5.1: 영상 상세 모달
```gherkin
Given 사용자가 검색 결과에서 영상을 클릭할 때
Then 상세 모달이 열린다
And 임베디드 플레이어가 표시된다
And 전체 설명, 태그, 카테고리가 표시된다
And 사용 가능한 자막 언어가 표시된다
```

**수동 테스트**:
1. 검색 결과에서 영상 카드 클릭
2. 모달이 열리는지 확인
3. YouTube 플레이어가 로드되는지 확인 (react-youtube)
4. 자막 언어 목록 확인

#### 시나리오 5.2: 템플릿 저장 (자막 없이)
```gherkin
Given 사용자가 영상 상세 모달에서 템플릿으로 저장할 때
When 템플릿 이름을 "React Tutorial"로 입력하고
And 카테고리를 "education"으로 선택하고
And 자막 포함 옵션을 체크하지 않고 저장하면
Then 템플릿이 생성된다
And youtube_metadata에 영상 정보가 저장된다
And captions 컬럼은 NULL이다
```

**API 테스트**:
```bash
curl -X POST "http://localhost:8000/api/v1/templates/from-youtube" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "dQw4w9WgXcQ",
    "name": "React Tutorial",
    "category": "education",
    "includeCaptions": false
  }'
```

**DB 검증**:
```sql
SELECT
  name,
  youtube_video_id,
  youtube_metadata->>'title' as video_title,
  cii_score,
  captions
FROM templates
WHERE youtube_video_id = 'dQw4w9WgXcQ';

-- 예상 결과:
-- name: "React Tutorial"
-- youtube_video_id: "dQw4w9WgXcQ"
-- video_title: "Sample Video Title"
-- cii_score: 75.5
-- captions: NULL
```

#### 시나리오 5.3: 템플릿 저장 (한국어 + 영어 자막 포함)
```gherkin
Given 사용자가 자막 포함 옵션을 선택할 때
When 한국어와 영어 자막을 선택하고 저장하면
Then captions JSONB에 두 언어의 자막 데이터가 저장된다
```

**API 테스트**:
```bash
curl -X POST "http://localhost:8000/api/v1/templates/from-youtube" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "dQw4w9WgXcQ",
    "name": "React Tutorial with Captions",
    "category": "education",
    "includeCaptions": true,
    "captionLanguages": ["ko", "en"]
  }'
```

**DB 검증**:
```sql
SELECT
  captions->'ko'->>'languageName' as ko_name,
  captions->'en'->>'languageName' as en_name,
  jsonb_array_length(captions->'ko'->'captions') as ko_caption_count,
  jsonb_array_length(captions->'en'->'captions') as en_caption_count
FROM templates
WHERE youtube_video_id = 'dQw4w9WgXcQ';

-- 예상 결과:
-- ko_name: "한국어"
-- en_name: "English"
-- ko_caption_count: 50 (예시)
-- en_caption_count: 50 (예시)
```

---

### 2.6 US6: 검색 히스토리 (Phase 8)

#### 시나리오 6.1: 검색 시 자동 저장
```gherkin
Given 사용자가 "react tutorial"을 검색할 때
Then 검색어가 히스토리에 자동으로 저장된다
```

**수동 테스트**:
1. "react tutorial" 검색
2. 검색 히스토리 영역에 "react tutorial" 표시 확인

**DB 검증**:
```sql
SELECT keyword, created_at
FROM search_histories
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC
LIMIT 10;

-- "react tutorial"이 최상단에 표시되어야 함
```

#### 시나리오 6.2: 최근 10개만 유지
```gherkin
Given 사용자가 11개의 검색을 수행할 때
Then 가장 오래된 검색어는 자동으로 삭제된다
And 최근 10개만 유지된다
```

**API 테스트**:
```bash
# 11개 검색어 저장
for i in {1..11}; do
  curl -X POST "http://localhost:8000/api/v1/youtube/search-history" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"keyword\": \"test$i\"}"
done

# 히스토리 조회
curl -X GET "http://localhost:8000/api/v1/youtube/search-history" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**검증**:
```python
response = get_search_history()
assert len(response) == 10  # 최근 10개만
assert response[0]['keyword'] == 'test11'  # 최신이 먼저
assert 'test1' not in [item['keyword'] for item in response]  # 가장 오래된 것 삭제됨
```

#### 시나리오 6.3: 검색어 클릭으로 재검색
```gherkin
Given 검색 히스토리에 "react tutorial"이 있을 때
When 사용자가 "react tutorial"을 클릭하면
Then 해당 검색어로 자동 검색된다
```

**수동 테스트**:
1. 검색 히스토리에서 "react tutorial" 클릭
2. 검색창에 "react tutorial"이 자동 입력되고 검색 실행됨

#### 시나리오 6.4: 검색어 삭제
```gherkin
Given 검색 히스토리에 "old search"가 있을 때
When 사용자가 삭제 버튼을 클릭하면
Then 해당 검색어가 히스토리에서 제거된다
```

**API 테스트**:
```bash
curl -X DELETE "http://localhost:8000/api/v1/youtube/search-history/old%20search" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**검증**:
```sql
SELECT keyword
FROM search_histories
WHERE user_id = 'USER_ID' AND keyword = 'old search';

-- 결과가 없어야 함
```

---

## 3. 성능 테스트

### 3.1 검색 응답 시간 (NFR-001)

**목표**: 검색 API 응답 시간 2초 이내

**테스트 스크립트**:
```python
import time
import requests

def test_search_performance():
    start_time = time.time()
    response = requests.get(
        "http://localhost:8000/api/v1/youtube/search",
        params={"q": "react", "maxResults": 25},
        headers={"Authorization": f"Bearer {JWT_TOKEN}"}
    )
    end_time = time.time()

    response_time = end_time - start_time
    assert response_time < 2.0, f"Response time {response_time}s exceeds 2s limit"
    assert response.status_code == 200
```

### 3.2 캐싱 성능

**목표**: 캐시 히트 시 200ms 이내

**테스트**:
```python
def test_cache_performance():
    # 첫 번째 요청 (Cache miss)
    requests.get(url, params=params)

    # 두 번째 요청 (Cache hit)
    start_time = time.time()
    response = requests.get(url, params=params)
    end_time = time.time()

    response_time = (end_time - start_time) * 1000  # ms
    assert response_time < 200, f"Cached response time {response_time}ms exceeds 200ms"
```

### 3.3 Rate Limiting

**목표**: 분당 10회 초과 시 429 응답

**테스트**:
```python
def test_rate_limiting():
    # 10회 요청 (성공)
    for i in range(10):
        response = requests.get(url, headers=headers)
        assert response.status_code == 200

    # 11번째 요청 (실패)
    response = requests.get(url, headers=headers)
    assert response.status_code == 429
    assert response.json()['error']['code'] == 'RATE_LIMIT_EXCEEDED'
```

---

## 4. Quota 관리 테스트

### 4.1 일일 Quota 사용량 추적

**테스트**:
```python
def test_quota_tracking():
    # Redis에서 오늘 사용량 조회
    today = datetime.now().date().isoformat()
    quota_key = f"youtube:quota:{today}"
    current_usage = redis_client.get(quota_key)

    # 검색 수행 (100 units)
    response = requests.get(search_url)

    # 사용량 증가 확인
    new_usage = int(redis_client.get(quota_key))
    assert new_usage == int(current_usage or 0) + 100
```

### 4.2 Quota 초과 시 동작

**목표**: 90% 도달 시 경고, 100% 도달 시 403 응답

**테스트**:
```python
def test_quota_exceeded():
    # Quota를 9,500으로 설정 (90%)
    redis_client.set(f"youtube:quota:{today}", 9500)

    # 검색 수행
    response = requests.get(search_url)
    assert response.status_code == 200
    # 로그에 경고 확인: "Quota usage at 9500/10000"

    # Quota를 9,900으로 설정 (99%)
    redis_client.set(f"youtube:quota:{today}", 9900)

    # 검색 수행 (100 units → 초과)
    response = requests.get(search_url)
    assert response.status_code == 403
    assert response.json()['error']['code'] == 'QUOTA_EXCEEDED'
```

---

## 5. E2E 테스트 (Playwright)

### 5.1 전체 검색 플로우

```typescript
// tests/e2e/youtube-search-flow.spec.ts
import { test, expect } from '@playwright/test';

test('YouTube 영상 검색 → 필터링 → 템플릿 저장 전체 플로우', async ({ page }) => {
  // 1. 로그인
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // 2. YouTube 검색 페이지 이동
  await page.goto('/dashboard/youtube-search');

  // 3. 검색 수행
  await page.fill('input[placeholder="검색어를 입력하세요"]', 'react tutorial');
  await page.click('button[type="submit"]');

  // 4. 검색 결과 확인
  await expect(page.locator('[data-testid="video-card"]').first()).toBeVisible();

  // 5. 쇼츠 필터 적용
  await page.click('[data-testid="video-type-filter"]');
  await page.click('text=쇼츠');

  // 6. 모든 결과가 쇼츠인지 확인
  const videoTypes = await page.locator('[data-testid="video-type-badge"]').allTextContents();
  expect(videoTypes.every(type => type === 'Shorts')).toBeTruthy();

  // 7. 첫 번째 영상 클릭
  await page.locator('[data-testid="video-card"]').first().click();

  // 8. 모달 표시 확인
  await expect(page.locator('[data-testid="video-detail-modal"]')).toBeVisible();

  // 9. 템플릿 저장
  await page.fill('input[name="templateName"]', 'Test Shorts Template');
  await page.selectOption('select[name="category"]', 'entertainment');
  await page.click('button[type="submit"]');

  // 10. 성공 메시지 확인
  await expect(page.locator('text=템플릿이 저장되었습니다')).toBeVisible();

  // 11. 대시보드에서 템플릿 확인
  await page.goto('/dashboard/templates');
  await expect(page.locator('text=Test Shorts Template')).toBeVisible();
});
```

---

## 6. 에러 핸들링 테스트

### 6.1 잘못된 영상 ID

```bash
curl -X GET "http://localhost:8000/api/v1/youtube/videos/INVALID_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**예상 응답** (404):
```json
{
  "error": {
    "code": "VIDEO_NOT_FOUND",
    "message": "영상을 찾을 수 없습니다: INVALID_ID"
  }
}
```

### 6.2 네트워크 오류

```typescript
// Frontend 에러 처리 테스트
test('네트워크 오류 시 에러 메시지 표시', async ({ page }) => {
  // 네트워크 오프라인 시뮬레이션
  await page.context().setOffline(true);

  await page.goto('/dashboard/youtube-search');
  await page.fill('input[placeholder="검색어를 입력하세요"]', 'test');
  await page.click('button[type="submit"]');

  // 에러 메시지 확인
  await expect(page.locator('text=네트워크 오류')).toBeVisible();
  await expect(page.locator('text=인터넷 연결을 확인해주세요')).toBeVisible();

  // 재시도 버튼 확인
  await expect(page.locator('button:has-text("다시 시도")')).toBeVisible();
});
```

---

## 7. 환경별 설정

### 7.1 Development

```bash
# backend/.env.development
YOUTUBE_API_KEY=dev_api_key
REDIS_URL=redis://localhost:6379
RATE_LIMIT_PER_MINUTE=20  # 개발 시 더 관대
LOG_LEVEL=DEBUG
```

### 7.2 Production

```bash
# backend/.env.production
YOUTUBE_API_KEY=prod_api_key
REDIS_URL=redis://upstash-prod.example.com
RATE_LIMIT_PER_MINUTE=10  # 엄격
LOG_LEVEL=INFO
SENTRY_DSN=https://...
```

---

## 8. 문제 해결 (Troubleshooting)

### 8.1 YouTube API Quota 초과

**증상**: 403 에러, "quotaExceeded" 메시지

**해결**:
1. Google Cloud Console에서 quota 확인
2. 다음 날까지 대기 또는
3. Quota 증가 요청 (유료)

### 8.2 자막 다운로드 실패

**증상**: 404 에러, "Caption not found"

**원인**:
- 영상에 자막이 없음
- OAuth 인증 필요한 자막 (비공식 API 사용 시)

**해결**:
1. 자막 목록 먼저 조회 (`/captions`)
2. 사용 가능한 언어 확인 후 다운로드
3. 비공식 API 실패 시 공식 API fallback

### 8.3 CII 점수 계산 오류

**증상**: CII 점수가 0 또는 NULL

**원인**:
- 채널에 영상이 10개 미만
- 좋아요/조회수 데이터 없음

**해결**:
1. 채널 영상 수 확인
2. 영상이 부족하면 CII 점수를 NULL로 표시
3. Frontend에서 "데이터 부족" 안내

---

## 9. 다음 단계

Phase별로 테스트를 진행하며 다음 순서로 검증합니다:

1. **Phase 1-2 (Setup & Foundational)**: 의존성 설치, API 연결 확인
2. **Phase 3 (US1)**: 기본 검색 동작 확인
3. **Phase 4 (US2)**: 모든 필터 동작 확인
4. **Phase 5 (US3)**: CII 계산 정확도 확인
5. **Phase 6 (US4)**: 자막 다운로드 및 파싱 확인
6. **Phase 7 (US5)**: 템플릿 저장 E2E 테스트
7. **Phase 8 (US6)**: 검색 히스토리 동작 확인
8. **Phase 9 (Polish)**: 무한 스크롤, 성능 최적화 확인

각 Phase 완료 후 해당 User Story의 "독립 테스트 기준"을 모두 통과해야 다음 Phase로 진행합니다.
