# TODO - ClipPilot MVP

**Last Updated**: 2025-11-03
**Current Status**: Phase 10 완료, Phase 11 준비 중

본 문서는 ClipPilot MVP 개발 과정에서 발견된 개선사항, 기술 부채, 추후 구현 사항을 우선순위별로 정리한 목록입니다.

---

## 🚨 Priority 0: Critical (즉시 해결 필요)

### Backend
- [ ] **DB 인덱스 추가** (성능 Critical)
  ```sql
  CREATE INDEX idx_jobs_user_created ON jobs(user_id, created_at);
  CREATE INDEX idx_jobs_status ON jobs(status);
  CREATE INDEX idx_usage_logs_user_created ON usage_logs(user_id, created_at);
  ```
  - **파일**: `backend/migrations/`
  - **이유**: 대용량 데이터에서 쿼리 성능 저하 방지
  - **예상 시간**: 30분

- [ ] **Supabase 프로젝트 설정 완료** (T005)
  - **파일**: `.env.example`, `.env`
  - **작업**: Supabase 프로젝트 생성 및 credentials 저장
  - **예상 시간**: 1시간

### Infrastructure
- [ ] **환경 변수 검증**
  - **파일**: `backend/src/config.py`, `frontend/.env.local`
  - **작업**: 필수 환경 변수 누락 체크 및 validation 로직 추가
  - **예상 시간**: 30분

---

## ⚡ Priority 1: High (다음 Sprint에 반드시 포함)

### Backend - Performance

- [ ] **MetricsService 병렬 쿼리 적용**
  - **파일**: `backend/src/services/metrics_service.py:67-138`
  - **현재 문제**: Job 통계와 Usage 통계를 순차 실행
  - **개선 방안**:
    ```python
    import asyncio

    async def get_dashboard_metrics(self, user_id: UUID, period_days: int = 30):
        start_date = datetime.utcnow() - timedelta(days=period_days)

        # 병렬 실행
        job_task = self.db.execute(job_stats_query)
        usage_task = self.db.execute(usage_stats_query)

        job_result, usage_result = await asyncio.gather(job_task, usage_task)
        # ...
    ```
  - **예상 효과**: 응답 시간 30-40% 단축
  - **예상 시간**: 1시간

- [ ] **할당량 설정 중앙화**
  - **파일**: `backend/src/services/metrics_service.py:172-177`
  - **현재 문제**: 하드코딩된 할당량
  - **개선 방안**:
    ```python
    # backend/src/config.py
    class Settings:
        QUOTA_LIMITS = {
            "free": 20,
            "pro": 500,
            "agency": 2000
        }

    # metrics_service.py
    from ..config import settings
    quota_limit = settings.QUOTA_LIMITS.get(user.plan, 20)
    ```
  - **예상 시간**: 30분

- [ ] **에러 처리 강화**
  - **파일**: `backend/src/api/v1/metrics.py:69-76`
  - **현재 문제**: 일반적인 Exception catch
  - **개선 방안**:
    ```python
    try:
        metrics = await metrics_service.get_dashboard_metrics(...)
    except ValueError as e:
        raise HTTPException(status_code=400, detail={...})
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail={...})
    except Exception as e:
        logger.error(f"Metrics error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={...})
    ```
  - **예상 시간**: 1시간

### Frontend - User Experience

- [ ] **selectedChannel 상태 처리**
  - **파일**: `frontend/src/app/(dashboard)/page.tsx:24`
  - **현재 문제**: 선언되었으나 사용되지 않음
  - **해결 방안**:
    - **Option A**: 채널 필터를 메트릭 API에 전달
    - **Option B**: 주석 처리 후 Phase 11에서 구현
  - **예상 시간**: 30분

- [ ] **차트 접근성 개선**
  - **파일**: `frontend/src/components/dashboard/UsageChart.tsx`
  - **현재 문제**: ARIA 속성 부족
  - **개선 방안**:
    ```typescript
    <ResponsiveContainer
      width="100%"
      height={300}
      role="img"
      aria-label="최근 30일간 일별 작업 수 추이 차트"
    >
      <LineChart data={chartData}>
        ...
      </LineChart>
    </ResponsiveContainer>
    ```
  - **예상 시간**: 30분

### Testing

- [ ] **Backend 단위 테스트 작성**
  - **파일**: `backend/tests/services/test_metrics_service.py` (신규)
  - **테스트 케이스**:
    ```python
    async def test_dashboard_metrics_empty_jobs():
        """작업이 없을 때 0 반환 테스트"""

    async def test_usage_metrics_quota_exceeded():
        """할당량 초과 시 100% 반환 테스트"""

    async def test_daily_job_counts_timezone():
        """타임존 처리 테스트"""
    ```
  - **목표 커버리지**: 70%
  - **예상 시간**: 3시간

- [ ] **Frontend 컴포넌트 테스트 작성**
  - **파일**: `frontend/__tests__/components/dashboard/` (신규)
  - **테스트 케이스**:
    ```typescript
    describe("StatsCards", () => {
      it("로딩 스켈레톤 표시", () => {});
      it("에러 상태 표시", () => {});
      it("success_rate 계산 정확성", () => {});
    });

    describe("UsageBanner", () => {
      it("80% 도달 시 경고 배너 표시", () => {});
      it("100% 도달 시 위험 배너 표시", () => {});
    });
    ```
  - **예상 시간**: 3시간

---

## 🔧 Priority 2: Medium (개선 권장)

### Backend - Code Quality

- [ ] **이메일 발송 기능 구현**
  - **파일**: `backend/src/services/alert_service.py:67-94`
  - **현재 상태**: Placeholder (print 로깅만 수행)
  - **구현 방안**:
    - SendGrid API 연동
    - 또는 AWS SES 연동
    - 이메일 템플릿 생성
    - 발송 이력 저장
  - **예상 시간**: 4시간

- [ ] **에러 바운더리 추가**
  - **파일**: `frontend/src/app/(dashboard)/error.tsx` (신규)
  - **개선 방안**:
    ```typescript
    "use client";
    export default function DashboardError({ error, reset }) {
      return (
        <ErrorFallback
          error={error}
          reset={reset}
          title="대시보드 오류"
          message="통계를 불러오는 중 문제가 발생했습니다."
        />
      );
    }
    ```
  - **예상 시간**: 1시간

- [ ] **로딩 상태 통합**
  - **파일**: `frontend/src/app/(dashboard)/page.tsx`
  - **현재 문제**: 각 컴포넌트가 독립적으로 로딩
  - **개선 방안**:
    ```typescript
    const isPageLoading = metricsLoading || usageLoading || jobsLoading;

    if (isPageLoading) {
      return <DashboardSkeleton />;
    }
    ```
  - **예상 시간**: 2시간

### Frontend - Performance

- [ ] **번들 크기 분석 및 최적화**
  - **작업**:
    ```bash
    npm run build
    npm run analyze
    ```
  - **목표**: recharts 번들 크기 최적화 (tree-shaking)
  - **예상 시간**: 2시간

- [ ] **이미지 최적화**
  - **파일**: `frontend/public/`, `frontend/src/components/`
  - **작업**: Next.js Image 컴포넌트 사용, WebP 변환
  - **예상 시간**: 1시간

### Testing

- [ ] **E2E 테스트 작성 (Playwright)**
  - **파일**: `frontend/tests/e2e/dashboard.spec.ts` (신규)
  - **테스트 케이스**:
    ```typescript
    test("대시보드 통계 표시", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page.locator("text=총 작업 수")).toBeVisible();
      await expect(page.locator("text=성공률")).toBeVisible();
    });

    test("사용량 알림 배너 표시", async ({ page }) => {
      // 80% 시나리오
      await expect(page.locator("text=할당량 부족")).toBeVisible();
    });
    ```
  - **예상 시간**: 4시간

---

## 💡 Priority 3: Low (Nice to Have)

### Features

- [ ] **채널별 통계 필터링 구현**
  - **파일**: `backend/src/services/metrics_service.py`, `frontend/src/app/(dashboard)/page.tsx`
  - **요구사항**: Agency 사용자가 채널별로 통계 필터링
  - **API 변경**:
    ```python
    async def get_dashboard_metrics(
        self,
        user_id: UUID,
        period_days: int = 30,
        channel_id: Optional[UUID] = None  # 추가
    ):
        # channel_id가 있으면 해당 채널의 작업만 집계
        pass
    ```
  - **예상 시간**: 3시간

- [ ] **통계 대시보드 커스터마이징**
  - **기능**: 사용자가 위젯 순서 변경, 표시/숨김
  - **기술**: react-grid-layout 또는 dnd-kit
  - **예상 시간**: 8시간

- [ ] **CSV/Excel 내보내기**
  - **파일**: `backend/src/api/v1/metrics.py`, `frontend/src/components/dashboard/`
  - **기능**: 통계 데이터를 CSV/Excel로 다운로드
  - **예상 시간**: 4시간

- [ ] **알림 설정 커스터마이징**
  - **파일**: `backend/src/services/alert_service.py`
  - **기능**: 사용자가 알림 임계값 변경 (80% → 90% 등)
  - **예상 시간**: 3시간

### UI/UX Improvements

- [ ] **다크 모드 지원**
  - **파일**: `frontend/src/app/layout.tsx`, `frontend/tailwind.config.js`
  - **작업**: Tailwind CSS dark mode 설정
  - **예상 시간**: 4시간

- [ ] **반응형 디자인 개선**
  - **타겟**: 모바일 (< 768px)
  - **개선 영역**: 차트, 테이블, 필터
  - **예상 시간**: 4시간

- [ ] **애니메이션 추가**
  - **라이브러리**: framer-motion
  - **적용**: 카드 등장, 차트 렌더링
  - **예상 시간**: 2시간

### Documentation

- [ ] **API 문서 업데이트**
  - **파일**: `backend/src/api/v1/metrics.py`
  - **작업**: OpenAPI 스펙 상세화, 예제 추가
  - **예상 시간**: 2시간

- [ ] **컴포넌트 Storybook 작성**
  - **파일**: `frontend/src/components/dashboard/*.stories.tsx` (신규)
  - **예상 시간**: 4시간

---

## 📚 Phase 11: Polish & Cross-Cutting Concerns (T155-T170)

### Observability

- [ ] **T155**: Sentry 에러 추적 - Backend
  - **파일**: `backend/src/main.py`
  - **예상 시간**: 1시간

- [ ] **T156**: Sentry 에러 추적 - Frontend
  - **파일**: `frontend/src/app/layout.tsx`
  - **예상 시간**: 1시간

- [ ] **T157**: 구조화된 로깅 (NFR-012)
  - **파일**: `backend/src/core/logger.py` (신규)
  - **예상 시간**: 2시간

- [ ] **T158**: OpenTelemetry tracing
  - **파일**: `backend/src/middleware/tracing.py` (신규)
  - **예상 시간**: 3시간

- [ ] **T159**: Grafana 대시보드 설정
  - **파일**: `infra/monitoring/grafana/` (신규)
  - **예상 시간**: 4시간

- [ ] **T160**: Alert 규칙 설정
  - **파일**: `infra/monitoring/alerts/` (신규)
  - **예상 시간**: 2시간

### Accessibility

- [ ] **T161**: 접근성 기능 구현 (WCAG 2.1 AA)
  - **작업**:
    - 키보드 네비게이션
    - Alt text 추가
    - ARIA 속성 완성
  - **예상 시간**: 8시간

### Infrastructure

- [ ] **T162**: API 문서화 (/docs 엔드포인트)
  - **파일**: `backend/src/main.py`
  - **예상 시간**: 1시간

- [ ] **T163**: 배포 스크립트
  - **파일**: `infra/scripts/` (신규)
  - **예상 시간**: 4시간

- [ ] **T164**: GitHub Actions CI/CD
  - **파일**: `.github/workflows/` (신규)
  - **예상 시간**: 6시간

### Performance

- [ ] **T165**: DB 연결 풀링 최적화
  - **파일**: `backend/src/core/supabase.py`
  - **예상 시간**: 2시간

- [ ] **T166**: Redis 캐싱 (사용자 플랜/할당량)
  - **파일**: `backend/src/services/cache_service.py` (신규)
  - **TTL**: 10분
  - **예상 시간**: 3시간

### Security & Quality

- [ ] **T167**: 보안 감사
  - **작업**:
    - Dependency scan (npm audit, pip-audit)
    - OWASP Top 10 체크
  - **예상 시간**: 4시간

- [ ] **T168**: 부하 테스트
  - **도구**: k6 또는 Locust
  - **목표**: 1,000 concurrent users (NFR-004)
  - **예상 시간**: 6시간

### Documentation

- [ ] **T169**: quickstart.md 검증
  - **작업**: 신규 환경에서 전체 설정 재현
  - **예상 시간**: 2시간

- [ ] **T170**: README.md 작성
  - **내용**: 프로젝트 개요, 설치 방법, 아키텍처
  - **예상 시간**: 2시간

---

## 🎯 Sprint Planning 제안

### Sprint 1 (Week 1-2): Critical + High Priority
**목표**: 성능 최적화 및 안정성 확보

- [ ] DB 인덱스 추가 (P0)
- [ ] Supabase 프로젝트 설정 (P0)
- [ ] 환경 변수 검증 (P0)
- [ ] MetricsService 병렬 쿼리 (P1)
- [ ] 할당량 설정 중앙화 (P1)
- [ ] 에러 처리 강화 (P1)
- [ ] selectedChannel 상태 처리 (P1)
- [ ] 차트 접근성 개선 (P1)

**예상 시간**: 40시간
**담당**: Backend 개발자 1명 + Frontend 개발자 1명

### Sprint 2 (Week 3-4): Testing + Medium Priority
**목표**: 테스트 커버리지 확보 및 UX 개선

- [ ] Backend 단위 테스트 (P1)
- [ ] Frontend 컴포넌트 테스트 (P1)
- [ ] 이메일 발송 기능 구현 (P2)
- [ ] 에러 바운더리 추가 (P2)
- [ ] 로딩 상태 통합 (P2)
- [ ] E2E 테스트 작성 (P2)

**예상 시간**: 50시간
**담당**: Backend 개발자 1명 + Frontend 개발자 1명 + QA 1명

### Sprint 3 (Week 5-6): Phase 11 - Observability
**목표**: 모니터링 및 알림 시스템 구축

- [ ] T155-T160 (Sentry, 로깅, Tracing, Grafana, Alerts)
- [ ] T165-T166 (성능 최적화)
- [ ] T167 (보안 감사)

**예상 시간**: 48시간
**담당**: Backend 개발자 1명 + DevOps 1명

### Sprint 4 (Week 7-8): Phase 11 - Polish
**목표**: 접근성, CI/CD, 문서화 완성

- [ ] T161 (접근성)
- [ ] T162-T164 (문서, 배포, CI/CD)
- [ ] T168-T170 (부하 테스트, 문서)
- [ ] 채널별 통계 필터링 (P3, 시간 여유 시)

**예상 시간**: 52시간
**담당**: Full-stack 개발자 2명 + DevOps 1명

---

## 📊 진행 상황 추적

### Completed (Phase 1-10)
- ✅ Setup (T001-T010)
- ✅ Foundational (T011-T027)
- ✅ US0 Authentication (T028-T044)
- ✅ US6 YouTube OAuth (T045-T057)
- ✅ US1 Content Generation (T058-T080)
- ✅ US2 Rendering/Upload (T081-T104)
- ✅ US3 Templates (T105-T118)
- ✅ US4 Billing (T119-T134)
- ✅ US7 Onboarding (T135-T143)
- ✅ US5 Dashboard (T144-T154)

### In Progress
- 🔄 Phase 10 Code Review 반영

### Upcoming
- ⏳ Phase 11: Polish & Cross-Cutting Concerns (T155-T170)
- ⏳ MVP Launch Preparation

---

## 🔗 References

- **Tasks**: [specs/001-clippilot-mvp/tasks.md](./tasks.md)
- **Spec**: [specs/001-clippilot-mvp/spec.md](./spec.md)
- **Plan**: [specs/001-clippilot-mvp/plan.md](./plan.md)
- **PR #15**: [Phase 10 Code Review](https://github.com/drinkwhale/clippilot/pull/15)

---

**Note**: 이 문서는 지속적으로 업데이트됩니다. 새로운 이슈가 발견되면 해당 Priority에 추가해주세요.
