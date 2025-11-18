# YouTube 영상 검색 기능 구현 작업 목록

## 개요

YouTube Data API v3를 활용하여 영상 검색, 고급 필터링, CII 계산, 자막 수집 기능을 구현합니다.

**총 작업 수**: 85개
**예상 구현 기간**: 4-5주
**MVP 범위**: Phase 1 (기본 검색 및 필터링)

## 작업 구조

- **Phase 1**: Setup (의존성 및 환경 설정)
- **Phase 2**: Foundational (공통 인프라)
- **Phase 3**: US1 - 기본 검색 (FR-001, FR-003)
- **Phase 4**: US2 - 고급 필터링 (FR-002)
- **Phase 5**: US3 - CII 계산 및 필터링 (FR-008)
- **Phase 6**: US4 - 자막 수집 (FR-007)
- **Phase 7**: US5 - 영상 미리보기 및 저장 (FR-004, FR-005)
- **Phase 8**: US6 - 검색 히스토리 (FR-006)
- **Phase 9**: Polish & 최적화

---

## Phase 1: Setup (프로젝트 초기 설정)

**목표**: YouTube API 연동 및 필요한 라이브러리 설치

- [x] T001 [P] Backend에 google-api-python-client 추가 in backend/pyproject.toml (이미 설치됨)
- [x] T002 [P] Backend에 slowapi (Rate Limiting) 추가 in backend/pyproject.toml
- [x] T003 [P] Frontend에 react-youtube 추가 in frontend/package.json
- [x] T004 [P] Frontend에 lucide-react 추가 (이미 설치되어 있으면 스킵) in frontend/package.json (이미 설치됨)
- [x] T005 Backend 환경 변수에 YOUTUBE_API_KEY 추가 in backend/src/config.py
- [x] T006 Redis 연결 설정 확인 in backend/src/config.py (이미 설정됨 - REDIS_URL)
- [x] T007 [P] templates 테이블 마이그레이션: youtube 관련 컬럼 추가 in backend/migrations/002_add_youtube_columns_to_templates.sql

**Phase 1 완료 기준**:
- ✅ 모든 의존성 설치 완료
- ✅ YouTube API 키 설정 완료
- ✅ DB 마이그레이션 성공

---

## Phase 2: Foundational (공통 인프라)

**목표**: 모든 User Story에서 사용할 공통 서비스 및 유틸리티 구현

### Backend Foundational

- [x] T008 [P] YouTube API 클라이언트 초기화 in backend/src/core/youtube/__init__.py
- [x] T009 [P] Redis 캐시 서비스 구현 (get/set/delete) in backend/src/core/cache.py
- [x] T010 [P] Rate Limiting 미들웨어 구현 (slowapi) in backend/src/middleware/rate_limit.py
- [x] T011 [P] YouTube API 에러 핸들러 구현 in backend/src/core/youtube/exceptions.py
- [x] T012 [P] ISO 8601 duration 파싱 유틸리티 (PT1M30S → 초 변환) in backend/src/core/youtube/utils.py

### Frontend Foundational

- [x] T013 [P] YouTube API 클라이언트 타입 정의 in frontend/src/lib/api/youtube.ts
- [x] T014 [P] 날짜/시간 포맷팅 유틸리티 (formatDuration, formatViewCount, formatDate) in frontend/src/lib/utils/format.ts
- [x] T015 [P] API 클라이언트 axios 인스턴스 설정 in frontend/src/lib/api/client.ts

**Phase 2 완료 기준**:
- ✅ 캐시 서비스 동작 확인 (set → get)
- ✅ Rate Limiting 동작 확인 (10 req/min 초과 시 429 응답)
- ✅ Duration 파싱 테스트 통과 (PT1M30S → 90)

---

## Phase 3: US1 - 기본 검색 (FR-001, FR-003)

**User Story**: 사용자가 키워드로 YouTube 영상을 검색하고 기본 정보를 확인할 수 있어야 합니다.

**독립 테스트 기준**:
- ✅ 검색 키워드 입력 → 영상 목록 표시
- ✅ 썸네일, 제목, 채널명, 조회수, 게시일 표시
- ✅ 영상 수집 수 설정 (25~50개) 동작
- ✅ 응답 시간 2초 이내

### Backend - US1

- [x] T016 [P] [US1] YouTubeSearchService 클래스 생성 in backend/src/core/youtube/search_service.py
- [x] T017 [US1] search_videos() 메서드 구현 (YouTube Data API search.list 호출) in backend/src/core/youtube/search_service.py
- [x] T018 [US1] get_video_details() 메서드 구현 (videos.list 호출) in backend/src/core/youtube/search_service.py
- [x] T019 [US1] YouTube API 응답 → YouTubeSearchResult 변환 로직 in backend/src/core/youtube/search_service.py
- [x] T020 [P] [US1] Pydantic 스키마: SearchQuery 정의 in backend/src/api/v1/schemas/youtube.py
- [x] T021 [P] [US1] Pydantic 스키마: YouTubeSearchResult 정의 in backend/src/api/v1/schemas/youtube.py
- [x] T022 [US1] API 라우터 생성 (prefix="/youtube") in backend/src/api/v1/youtube.py
- [x] T023 [US1] GET /api/v1/youtube/search 엔드포인트 구현 in backend/src/api/v1/youtube.py
- [x] T024 [US1] GET /api/v1/youtube/videos/{videoId} 엔드포인트 구현 in backend/src/api/v1/youtube.py
- [x] T025 [US1] Rate Limiting 적용 (/search에 10/min) in backend/src/api/v1/youtube.py
- [x] T026 [US1] 검색 결과 캐싱 적용 (15분 TTL) in backend/src/api/v1/youtube.py
- [x] T027 [US1] main.py에 youtube 라우터 등록 in backend/src/api/v1/__init__.py

### Frontend - US1

- [x] T028 [P] [US1] YouTube API 클라이언트 함수 (search, getVideoDetails) in frontend/src/lib/api/youtube.ts
- [x] T029 [P] [US1] useYouTubeSearch 커스텀 훅 (TanStack Query) in frontend/src/hooks/useYouTubeSearch.ts
- [x] T030 [P] [US1] useVideoDetails 커스텀 훅 in frontend/src/hooks/useYouTubeSearch.ts
- [x] T031 [P] [US1] SearchBar 컴포넌트 (검색 입력 폼) in frontend/src/components/features/youtube/SearchBar.tsx
- [x] T032 [P] [US1] CollectionCountSelector 컴포넌트 (25~50개 선택) in frontend/src/components/features/youtube/CollectionCountSelector.tsx
- [x] T033 [P] [US1] VideoCard 컴포넌트 (썸네일, 제목, 채널명, 조회수, 날짜) in frontend/src/components/features/youtube/VideoCard.tsx
- [x] T034 [P] [US1] VideoGrid 컴포넌트 (그리드 레이아웃) in frontend/src/components/features/youtube/VideoGrid.tsx
- [x] T035 [P] [US1] VideoSkeleton 컴포넌트 (로딩 UI) in frontend/src/components/features/youtube/VideoSkeleton.tsx
- [x] T036 [P] [US1] EmptyState 컴포넌트 (검색 결과 없음) in frontend/src/components/features/youtube/EmptyState.tsx
- [x] T037 [US1] YouTubeSearchPage 생성 (/dashboard/youtube-search) in frontend/src/app/dashboard/youtube-search/page.tsx
- [x] T038 [US1] 대시보드 네비게이션에 "YouTube 검색" 메뉴 추가 in frontend/src/app/dashboard/page.tsx

**US1 완료 기준**:
- ✅ "React Tutorial" 검색 → 25개 영상 목록 표시
- ✅ 각 카드에 썸네일, 제목, 채널명, 조회수, 날짜 표시
- ✅ 수집 수 50개로 변경 → 50개 표시
- ✅ 캐싱 확인: 동일 검색 2초 이내 응답

---

## Phase 4: US2 - 고급 필터링 (FR-002)

**User Story**: 사용자가 영상 타입, 업로드 기간, 국가, 조회수, 구독자 수로 검색 결과를 필터링할 수 있어야 합니다.

**독립 테스트 기준**:
- ✅ 영상 타입 필터 (쇼츠/롱폼) 동작
- ✅ 업로드 기간 필터 (7일 이내) 동작
- ✅ 국가 선택 (KR, JP, US) 동작
- ✅ 조회수/구독자 수 필터 동작
- ✅ 필터 조합 시 올바른 결과

### Backend - US2

- [x] T039 [P] [US2] videoType 필터 로직 (duration ≤ 60초 → shorts) in backend/src/core/youtube/search_service.py
- [x] T040 [P] [US2] publishedAfter/publishedBefore 파라미터 처리 in backend/src/core/youtube/search_service.py
- [x] T041 [P] [US2] regionCode 파라미터 처리 in backend/src/core/youtube/search_service.py
- [x] T042 [US2] 조회수 필터 (minViewCount) 백엔드 로직 in backend/src/core/youtube/search_service.py
- [x] T043 [US2] 구독자 수 필터 (minSubscribers) - 채널 정보 조회 in backend/src/core/youtube/search_service.py
- [x] T044 [US2] /search 엔드포인트에 필터 파라미터 추가 in backend/src/api/v1/youtube.py

### Frontend - US2

- [x] T045 [P] [US2] VideoTypeFilter 컴포넌트 (쇼츠/롱폼/전체) in frontend/src/components/features/youtube/filters/VideoTypeFilter.tsx
- [x] T046 [P] [US2] UploadPeriodFilter 컴포넌트 (1시간~사용자 지정) in frontend/src/components/features/youtube/filters/UploadPeriodFilter.tsx
- [x] T047 [P] [US2] RegionSelector 컴포넌트 (KR, JP, US 등) in frontend/src/components/features/youtube/filters/RegionSelector.tsx
- [x] T048 [P] [US2] ViewCountFilter 컴포넌트 (최소 조회수 입력) in frontend/src/components/features/youtube/filters/ViewCountFilter.tsx
- [x] T049 [P] [US2] SubscriberFilter 컴포넌트 (최소 구독자 수) in frontend/src/components/features/youtube/filters/SubscriberFilter.tsx
- [x] T050 [US2] SearchFilters 컨테이너 컴포넌트 (모든 필터 통합) in frontend/src/components/features/youtube/SearchFilters.tsx
- [x] T051 [US2] VideoTypeBadge 컴포넌트 (쇼츠/롱폼 표시) in frontend/src/components/features/youtube/VideoTypeBadge.tsx
- [x] T052 [US2] SearchBar에 필터 통합 in frontend/src/app/dashboard/youtube-search/page.tsx

**US2 완료 기준**:
- ✅ "Music" 검색 + 쇼츠 필터 → 60초 이하 영상만 표시
- ✅ 업로드 기간 7일 이내 → 최근 7일 영상만 표시
- ✅ 국가 JP 선택 → 일본 인기 영상 표시
- ✅ 조회수 100만 이상 필터 → 해당 영상만 표시

---

## Phase 5: US3 - CII 계산 및 필터링 (FR-008)

**User Story**: 채널의 영향력 지수(CII)를 계산하여 검색 결과를 필터링하고 정렬할 수 있어야 합니다.

**독립 테스트 기준**:
- ✅ 채널 CII 점수 계산 동작 (0-100)
- ✅ CII 필터 (70점 이상) 동작
- ✅ CII 정렬 동작 (높은 순)
- ✅ 검색 결과에 CII 점수 표시

### Backend - US3

- [ ] T053 [P] [US3] CII 계산 로직 구현 (구독자/조회수/빈도/좋아요 비율) in backend/src/core/youtube/cii_service.py
- [ ] T054 [P] [US3] 정규화 함수 구현 (log10 기반) in backend/src/core/youtube/cii_service.py
- [ ] T055 [US3] calculate_cii() 메서드 (채널 정보 → CII 점수) in backend/src/core/youtube/cii_service.py
- [ ] T056 [US3] GET /api/v1/youtube/channels/{channelId}/cii 엔드포인트 in backend/src/api/v1/youtube.py
- [ ] T057 [US3] CII 점수 캐싱 (6시간 TTL) in backend/src/api/v1/youtube.py
- [ ] T058 [US3] minCiiScore/maxCiiScore 필터 로직 in backend/src/core/youtube/search_service.py
- [ ] T059 [US3] CII 정렬 옵션 (order=cii) in backend/src/core/youtube/search_service.py
- [ ] T060 [US3] CIIMetrics Pydantic 스키마 in backend/src/api/v1/schemas/youtube.py

### Frontend - US3

- [ ] T061 [P] [US3] CIIFilter 컴포넌트 (점수 범위 슬라이더) in frontend/src/components/features/youtube/filters/CIIFilter.tsx
- [ ] T062 [P] [US3] CIIScoreBadge 컴포넌트 (점수 표시) in frontend/src/components/features/youtube/CIIScoreBadge.tsx
- [ ] T063 [US3] VideoCard에 CII 점수 표시 추가 in frontend/src/components/features/youtube/VideoCard.tsx
- [ ] T064 [US3] CII 정렬 옵션 추가 in frontend/src/components/features/youtube/SearchBar.tsx

**US3 완료 기준**:
- ✅ 채널 CII 점수 조회 → 0-100 점수 반환
- ✅ CII 70점 이상 필터 → 해당 채널만 표시
- ✅ CII 정렬 → 높은 점수 순으로 정렬
- ✅ 검색 결과 카드에 CII 점수 표시

---

## Phase 6: US4 - 자막 수집 (FR-007)

**User Story**: 사용자가 선택한 영상의 자막을 수집하여 저장할 수 있어야 합니다.

**독립 테스트 기준**:
- ✅ 자막 가용 여부 확인
- ✅ 사용 가능한 자막 언어 목록 표시
- ✅ 특정 언어 자막 다운로드
- ✅ 타임스탬프 포함 자막 데이터 저장

### Backend - US4

- [ ] T065 [P] [US4] CaptionService 클래스 생성 in backend/src/core/youtube/caption_service.py
- [ ] T066 [US4] get_caption_tracks() 메서드 (captions.list 호출) in backend/src/core/youtube/caption_service.py
- [ ] T067 [US4] download_caption() 메서드 (captions.download 호출) in backend/src/core/youtube/caption_service.py
- [ ] T068 [US4] 자막 파싱 로직 (XML/SRT → Caption[]) in backend/src/core/youtube/caption_service.py
- [ ] T069 [US4] GET /api/v1/youtube/videos/{videoId}/captions 엔드포인트 in backend/src/api/v1/youtube.py
- [ ] T070 [US4] GET /api/v1/youtube/videos/{videoId}/captions/{language} 엔드포인트 in backend/src/api/v1/youtube.py
- [ ] T071 [US4] 자막 데이터 캐싱 (24시간 TTL) in backend/src/api/v1/youtube.py
- [ ] T072 [P] [US4] CaptionTrack, CaptionData Pydantic 스키마 in backend/src/api/v1/schemas/youtube.py

### Frontend - US4

- [ ] T073 [P] [US4] CaptionsSelector 컴포넌트 (언어 선택) in frontend/src/components/features/youtube/CaptionsSelector.tsx
- [ ] T074 [P] [US4] CaptionPreview 컴포넌트 (자막 미리보기) in frontend/src/components/features/youtube/CaptionPreview.tsx
- [ ] T075 [P] [US4] CaptionsBadge 컴포넌트 (자막 가용 표시) in frontend/src/components/features/youtube/CaptionsBadge.tsx
- [ ] T076 [US4] VideoCard에 자막 가용 여부 표시 in frontend/src/components/features/youtube/VideoCard.tsx

**US4 완료 기준**:
- ✅ 영상 자막 목록 조회 → 한국어, 영어 등 목록 반환
- ✅ 한국어 자막 다운로드 → 타임스탬프 포함 데이터 반환
- ✅ 자막 미리보기 표시
- ✅ 자막 없는 영상 → 안내 메시지 표시

---

## Phase 7: US5 - 영상 미리보기 및 저장 (FR-004, FR-005)

**User Story**: 사용자가 영상 상세 정보를 미리보고 템플릿으로 저장할 수 있어야 합니다.

**독립 테스트 기준**:
- ✅ 영상 클릭 → 상세 모달 표시
- ✅ 임베디드 플레이어 재생
- ✅ 자막 정보 표시
- ✅ 템플릿으로 저장 동작

### Backend - US5

- [ ] T077 [US5] POST /api/v1/templates/from-youtube 엔드포인트 in backend/src/api/v1/templates.py
- [ ] T078 [US5] 템플릿 생성 로직 (YouTube 메타데이터 포함) in backend/src/api/v1/templates.py
- [ ] T079 [US5] 자막 데이터 저장 (includeCaptions=true 시) in backend/src/api/v1/templates.py

### Frontend - US5

- [ ] T080 [P] [US5] VideoDetailModal 컴포넌트 (모달 레이아웃) in frontend/src/components/features/youtube/VideoDetailModal.tsx
- [ ] T081 [P] [US5] VideoPlayer 컴포넌트 (react-youtube 통합) in frontend/src/components/features/youtube/VideoPlayer.tsx
- [ ] T082 [P] [US5] VideoMetadata 컴포넌트 (설명, 태그, 카테고리, 채널 정보) in frontend/src/components/features/youtube/VideoMetadata.tsx
- [ ] T083 [P] [US5] SaveAsTemplateForm 컴포넌트 (템플릿 이름, 카테고리, 자막 선택) in frontend/src/components/features/youtube/SaveAsTemplateForm.tsx
- [ ] T084 [US5] useSaveYouTubeTemplate mutation 훅 in frontend/src/hooks/useTemplates.ts
- [ ] T085 [US5] VideoGrid에 모달 연동 in frontend/src/app/dashboard/youtube-search/page.tsx

**US5 완료 기준**:
- ✅ 영상 클릭 → 모달 열림 + 플레이어 표시
- ✅ 템플릿 이름 입력 + 저장 → 템플릿 생성 확인
- ✅ 자막 포함 저장 → captions JSONB에 저장
- ✅ 저장 후 대시보드에서 템플릿 확인

---

## Phase 8: US6 - 검색 히스토리 (FR-006)

**User Story**: 사용자가 최근 검색어를 저장하고 다시 검색할 수 있어야 합니다.

**독립 테스트 기준**:
- ✅ 검색 시 자동 히스토리 저장
- ✅ 최근 10개 검색어 표시
- ✅ 검색어 클릭 → 재검색
- ✅ 검색어 삭제 동작

### Backend - US6

- [ ] T086 [P] [US6] SearchHistory 모델 생성 in backend/src/models/search_history.py
- [ ] T087 [US6] search_histories 테이블 마이그레이션 in backend/alembic/versions/xxx_add_search_history.py
- [ ] T088 [US6] GET /api/v1/youtube/search-history 엔드포인트 in backend/src/api/v1/youtube.py
- [ ] T089 [US6] POST /api/v1/youtube/search-history 엔드포인트 in backend/src/api/v1/youtube.py
- [ ] T090 [US6] DELETE /api/v1/youtube/search-history/{keyword} 엔드포인트 in backend/src/api/v1/youtube.py

### Frontend - US6

- [ ] T091 [P] [US6] SearchHistory 컴포넌트 (최근 검색어 목록) in frontend/src/components/features/youtube/SearchHistory.tsx
- [ ] T092 [US6] SearchBar에 검색 시 히스토리 저장 로직 추가 in frontend/src/components/features/youtube/SearchBar.tsx
- [ ] T093 [US6] 검색 페이지에 SearchHistory 컴포넌트 추가 in frontend/src/app/dashboard/youtube-search/page.tsx

**US6 완료 기준**:
- ✅ "React" 검색 → 히스토리에 저장
- ✅ 히스토리 목록에 "React" 표시
- ✅ "React" 클릭 → 재검색
- ✅ 삭제 버튼 → 히스토리에서 제거

---

## Phase 9: Polish & 최적화

**목표**: 성능 최적화, 무한 스크롤, API Quota 모니터링

- [ ] T094 [P] useInfiniteYouTubeSearch 훅 (무한 스크롤) in frontend/src/hooks/useInfiniteYouTubeSearch.ts
- [ ] T095 VideoGrid에 무한 스크롤 통합 (Intersection Observer) in frontend/src/components/features/youtube/VideoGrid.tsx
- [ ] T096 [P] 썸네일 Lazy Loading (Next.js Image 컴포넌트) in frontend/src/components/features/youtube/VideoCard.tsx
- [ ] T097 [P] API Quota 사용량 추적 로직 in backend/src/core/youtube/quota_tracker.py
- [ ] T098 Quota 초과 시 에러 메시지 및 대기 시간 표시 in backend/src/api/v1/youtube.py
- [ ] T099 [P] SearchError 컴포넌트 (네트워크 오류, API 오류) in frontend/src/components/features/youtube/SearchError.tsx
- [ ] T100 반응형 디자인 검증 (모바일, 태블릿, 데스크톱) in frontend/src/app/dashboard/youtube-search/page.tsx

**Phase 9 완료 기준**:
- ✅ 무한 스크롤 동작 (스크롤 하단 도달 시 다음 페이지 로드)
- ✅ 썸네일 Lazy Loading 적용
- ✅ Quota 모니터링 대시보드에서 사용량 확인
- ✅ 모바일/데스크톱 레이아웃 정상 동작

---

## 의존성 그래프

```
Phase 1 (Setup) → Phase 2 (Foundational)
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
    Phase 3 (US1)           Phase 8 (US6)
        ↓
    Phase 4 (US2)
        ↓
    Phase 5 (US3)
        ↓
    Phase 6 (US4)
        ↓
    Phase 7 (US5)
        ↓
    Phase 9 (Polish)
```

**병렬 실행 가능**:
- US6 (검색 히스토리)는 US1 완료 후 독립적으로 진행 가능
- Phase 9의 [P] 태그 작업들은 병렬 실행 가능

---

## MVP 범위

**Phase 1 + Phase 2 + Phase 3 (US1)** = 38개 작업

**MVP 완료 시 기능**:
- ✅ 키워드 검색
- ✅ 영상 목록 표시 (썸네일, 제목, 채널명, 조회수, 날짜)
- ✅ 영상 수집 수 설정
- ✅ 캐싱 및 Rate Limiting
- ✅ 기본 에러 처리

**MVP 이후 확장**:
- Phase 4: 고급 필터링
- Phase 5: CII 계산
- Phase 6: 자막 수집
- Phase 7: 영상 미리보기 및 저장
- Phase 8: 검색 히스토리
- Phase 9: 최적화

---

## 병렬 실행 예시

### Phase 1 (모든 작업 병렬)
```bash
T001, T002, T003, T004 → 동시 실행 (의존성 설치)
```

### Phase 2 (Backend/Frontend 분리)
```bash
Backend: T008, T009, T010, T011, T012 → 동시 실행
Frontend: T013, T014, T015 → 동시 실행
```

### Phase 3 - US1
```bash
Backend: T016-T021 → 동시 실행 (서로 다른 파일)
Frontend: T028-T036 → 동시 실행 (서로 다른 컴포넌트)
```

---

## 구현 전략

1. **MVP First**: Phase 1~3 완료 후 프로덕션 배포
2. **Incremental Delivery**: 각 Phase 완료 시 테스트 및 검증
3. **User Story 기반**: 각 Phase는 독립적인 사용자 가치 제공
4. **Parallel-First**: [P] 태그 작업 우선 병렬 실행

---

## 작업 완료 체크리스트

각 작업 완료 시 다음을 확인하세요:

- [ ] 코드 작성 완료
- [ ] ESLint/Flake8/gofmt 통과
- [ ] 단위 테스트 작성 (해당 시)
- [ ] 통합 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] tasks.md의 해당 체크박스 체크

---

**총 작업 수**: 100개
**MVP 작업 수**: 38개
**병렬 실행 가능 작업**: 52개 ([P] 태그)
**User Story**: 6개 (US1~US6)
**예상 구현 기간**: MVP 2주, 전체 4-5주
