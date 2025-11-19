# 대시보드 개선 필요사항

## 📊 현재 상태 분석

### ✅ 구현된 내용
- 인증 확인 및 리다이렉트 (user?.email 표시)
- 통계 카드 3개 (하드코딩된 "0" 값)
  - 총 작업
  - 완료된 작업
  - 연결된 채널
- 빠른 메뉴 1개
  - YouTube 검색 (링크만 존재)

### ❌ 누락된 핵심 기능

#### 1. 실제 데이터 연동 부재
```typescript
// 현재: 하드코딩
<p className="text-3xl font-bold">0</p>

// 필요: API 호출
const { data: stats } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: () => api.get('/api/v1/dashboard/stats')
});
```

#### 2. MVP Phase 3 완료 항목들이 대시보드에 미반영
- ✅ **US0 Authentication** 완료 → 대시보드에는 로그아웃 버튼조차 없음
- ✅ **002-youtube-search Phase 4** 완료 → YouTube 검색 링크만 있고 최근 검색 결과/히스토리 미표시

#### 3. 필수 UI 요소 부재
- 네비게이션 바 (로고, 메뉴, 프로필, 로그아웃)
- 사이드바 (주요 기능 네비게이션)
- 최근 작업 목록 (jobs 테이블 데이터)
- YouTube 채널 연결 상태 (channels 테이블)
- 구독 플랜 정보 (subscriptions 테이블)
- 사용량 통계 (usage_logs 테이블)

---

## 🎯 우선순위별 개선 작업

### P0 (즉시 필요) - 기본 UX

#### T-D001: 네비게이션 바 구현
**파일**: `frontend/src/components/layout/Navbar.tsx`
**내용**:
- 로고 (ClipPilot)
- 메인 메뉴 (대시보드, YouTube 검색, 작업 관리, 채널 관리)
- 사용자 프로필 드롭다운
- 로그아웃 버튼

**의존성**: 없음
**예상 시간**: 2시간

---

#### T-D002: 대시보드 통계 API 엔드포인트 추가
**파일**: `backend/src/api/v1/dashboard.py`
**내용**:
```python
@router.get("/stats")
async def get_dashboard_stats(user: User = Depends(get_current_user)):
    """
    대시보드 통계 조회
    - 총 작업 수 (jobs 테이블)
    - 완료된 작업 수 (jobs.status = 'done')
    - 연결된 채널 수 (channels 테이블)
    - 이번 달 사용량 (usage_logs 테이블)
    """
    return {
        "total_jobs": await get_total_jobs(user.id),
        "completed_jobs": await get_completed_jobs(user.id),
        "connected_channels": await get_connected_channels(user.id),
        "monthly_usage": await get_monthly_usage(user.id)
    }
```

**의존성**: 없음
**예상 시간**: 1시간

---

#### T-D003: 대시보드 통계 API 연동
**파일**: `frontend/src/app/dashboard/page.tsx`
**내용**:
```typescript
const { data: stats, isLoading } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: async () => {
    const response = await fetch('/api/v1/dashboard/stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.json();
  }
});

// 하드코딩된 "0" 제거하고 stats 데이터 사용
```

**의존성**: T-D002
**예상 시간**: 1시간

---

#### T-D004: 최근 작업 목록 컴포넌트
**파일**: `frontend/src/components/features/dashboard/RecentJobs.tsx`
**내용**:
- jobs 테이블에서 최근 5개 작업 조회
- 작업 상태별 배지 (queued, generating, rendering, uploading, done, failed)
- 작업 상세 페이지 링크
- 빈 상태 UI (작업이 없을 때)

**API**: `GET /api/v1/jobs?limit=5&sort=created_at:desc`

**의존성**: 없음
**예상 시간**: 2시간

---

### P1 (중요) - 핵심 기능

#### T-D005: 사이드바 네비게이션
**파일**: `frontend/src/components/layout/Sidebar.tsx`
**내용**:
- 주요 메뉴 (대시보드, YouTube 검색, 작업 관리, 채널 관리, 템플릿, 설정)
- 아이콘 + 텍스트
- 현재 활성 메뉴 하이라이트
- 모바일 반응형 (햄버거 메뉴)

**의존성**: 없음
**예상 시간**: 3시간

---

#### T-D006: YouTube 검색 미리보기 위젯
**파일**: `frontend/src/components/features/dashboard/YouTubeSearchPreview.tsx`
**내용**:
- 최근 검색 결과 3개 표시
- YouTube 영상 썸네일 + 제목 + 조회수
- "더보기" 버튼 → `/dashboard/youtube-search` 페이지로 이동
- 검색 히스토리가 없을 때 빈 상태 UI

**API**: `GET /api/v1/youtube/search/history?limit=3`

**의존성**: YouTube 검색 히스토리 API (002-youtube-search Phase 8)
**예상 시간**: 2시간

---

#### T-D007: 구독 플랜 정보 카드
**파일**: `frontend/src/components/features/dashboard/SubscriptionCard.tsx`
**내용**:
- 현재 플랜 (Free, Basic, Pro, Enterprise)
- 사용량 진행률 (이번 달 생성 영상 수 / 플랜별 제한)
- 업그레이드 버튼 (Free 플랜만)
- 갱신일 표시

**API**: `GET /api/v1/billing/subscription`

**의존성**: 없음 (subscriptions 테이블은 이미 존재)
**예상 시간**: 2시간

---

### P2 (향후 개선) - 고급 기능

#### T-D008: 사용량 추이 차트
**파일**: `frontend/src/components/features/dashboard/UsageChart.tsx`
**라이브러리**: recharts 또는 chart.js
**내용**:
- 최근 7일 또는 30일 영상 생성 수 그래프
- 조회수/좋아요 추이 (YouTube Analytics API 연동 필요)

**의존성**: 차트 라이브러리 설치
**예상 시간**: 4시간

---

#### T-D009: 빠른 작업 생성 버튼
**파일**: `frontend/src/components/features/dashboard/QuickJobCreate.tsx`
**내용**:
- "새 영상 만들기" 버튼
- 모달 또는 드로어로 간단한 작업 생성 폼
- 템플릿 선택 + 프롬프트 입력
- 생성 후 작업 목록으로 자동 이동

**API**: `POST /api/v1/jobs`

**의존성**: 없음
**예상 시간**: 3시간

---

#### T-D010: 알림 센터
**파일**: `frontend/src/components/layout/NotificationCenter.tsx`
**내용**:
- 작업 완료/실패 알림
- YouTube 업로드 성공/실패 알림
- 구독 갱신 알림
- 실시간 업데이트 (WebSocket 또는 Polling)

**의존성**: WebSocket 인프라 또는 SSE (Server-Sent Events)
**예상 시간**: 6시간

---

## 📋 구현 순서 제안

### Week 1: P0 기본 UX (6시간)
1. T-D001: 네비게이션 바 (2h)
2. T-D002: 대시보드 통계 API (1h)
3. T-D003: 통계 API 연동 (1h)
4. T-D004: 최근 작업 목록 (2h)

### Week 2: P1 핵심 기능 (7시간)
5. T-D005: 사이드바 네비게이션 (3h)
6. T-D006: YouTube 검색 미리보기 (2h)
7. T-D007: 구독 플랜 정보 (2h)

### Week 3+: P2 고급 기능 (13시간)
8. T-D008: 사용량 추이 차트 (4h)
9. T-D009: 빠른 작업 생성 (3h)
10. T-D010: 알림 센터 (6h)

---

## 🔧 기술 스택 추가 필요

### Frontend
- **recharts** 또는 **chart.js**: 사용량 차트 (T-D008)
- **react-hot-toast** 또는 **sonner**: 알림 토스트 (T-D010)

### Backend
- **WebSocket** 또는 **SSE**: 실시간 알림 (T-D010)

---

## 📊 데이터 모델 확인

### 이미 존재하는 테이블 (활용 가능)
- `users`: 사용자 정보
- `jobs`: 작업 목록 및 상태
- `channels`: YouTube 채널 연결
- `subscriptions`: 구독 플랜 정보
- `usage_logs`: 사용량 로그
- `templates`: 템플릿 정보

### 추가 필요한 테이블
- `notifications`: 알림 데이터 (T-D010)
- `search_history`: YouTube 검색 히스토리 (T-D006, 002-youtube-search Phase 8에서 구현 예정)

---

## ✅ 완료 기준

### P0 완료 시
- ✅ 사용자가 대시보드에서 실제 통계를 확인할 수 있음
- ✅ 네비게이션 바에서 로그아웃 가능
- ✅ 최근 작업 5개를 확인할 수 있음

### P1 완료 시
- ✅ 사이드바로 모든 주요 페이지 접근 가능
- ✅ 대시보드에서 최근 YouTube 검색 결과 미리보기
- ✅ 현재 구독 플랜 및 사용량 확인 가능

### P2 완료 시
- ✅ 사용량 추이를 차트로 시각화
- ✅ 대시보드에서 바로 작업 생성 가능
- ✅ 실시간 알림으로 작업 완료 여부 확인

---

## 🚀 다음 단계

1. **P0 작업부터 시작** - 기본 UX 개선 우선
2. **002-youtube-search Phase 5 이후 P1 작업** - YouTube 검색 히스토리 API 완성 후
3. **MVP Phase 4 (YouTube OAuth) 이후 구독 플랜 연동** - 채널 연결 완료 후

**현재 권장 작업**: T-D001 (네비게이션 바) + T-D002 (대시보드 통계 API) 우선 구현
