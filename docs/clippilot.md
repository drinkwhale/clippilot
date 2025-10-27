# 📘 ClipPilot: AI 숏폼 크리에이터 자동화 SaaS

> 목적: 유튜브/숏츠 크리에이터의 **아이디어→스크립트→영상/썸네일→게시** 워크플로우를 1클릭으로 자동화  
> 목표: 90일 내 MRR 300만원, 초기 100명 유료 사용자

---

## 0. 한눈 요약

- **타겟**: 1인 크리에이터, 리뷰/정보성 채널 운영자, 소규모 에이전시  
- **핵심가치**: 생성 시간을 80% 단축, 업로드 자동화, 템플릿 기반 일관성  
- **핵심 기능**: 프롬프트 입력 → 스크립트/자막/썸네일 생성 → FFmpeg/렌더링 → YouTube 자동 업로드  
- **요금제**: Free(체험), Pro, Agency(다계정) / Stripe(또는 아임포트)  
- **지표**: NSM=“주당 자동생성→업로드 완료 건수”, 전환율·잔존율·생성성공률

---

## 1. 페르소나 & 문제정의

- **페르소나**: 구독자 1천~1만, 일일 업로드 목표이지만 편집 시간이 부족한 개인 크리에이터  
- **문제**: 아이디어 고갈, 반복 작업(편집/자막/썸네일), 채널별 업로드/메타데이터 반복  
- **현 대체재**: CapCut 템플릿, Pictory/HeyGen(생성은 되나 업로드·플로우 자동화 약함)

---

## 2. 핵심 사용자 스토리 (Top 5)

1. 유저로서, **키워드**를 입력하면 **스크립트/샷리스트/자막/썸네일**이 자동 생성되길 원한다.  
2. 유저로서, 생성물을 **미리보기/수정** 후, **YouTube에 자동 업로드**하고 싶다.  
3. 유저로서, **템플릿**(브랜드 프리셋, 자막 스타일, 엔딩카드)을 저장/재사용하고 싶다.  
4. 유저로서, **해시태그/설명/타임스탬프**가 자동으로 제안되길 원한다.  
5. 유저로서, 내 **사용량/성공률/채널별 성과**를 대시보드에서 확인하고 싶다.

---

## 3. 기능 요구사항 (Functional)

- 프롬프트 입력(키워드/톤/길이/타깃) → **스크립트 생성**(GPT)  
- 스크립트 → **샷리스트/자막 SRT** → **썸네일 카피/구도 제안**  
- **소스 합성**: 스톡 영상/이미지(예: Pexels API)+TTS(선택) → FFmpeg 렌더링  
- **메타데이터 생성**: 제목/설명/태그/챕터(타임라인) 자동 생성  
- **업로드 자동화**: YouTube Data API(초안/공개 스케줄링), 썸네일 업로드 포함  
- **템플릿/브랜딩**: 인트로/아웃로/자막 스타일, 폰트/색, 로고 워터마크  
- **결제/플랜**: Stripe/아임포트 연동, 사용량 제한, 플랜 전환/해지  
- **대시보드**: 생성 요청/성공률/평균 렌더링 시간/업로드 결과

### 비기능 요구사항 (Non-Functional)

- 응답: API < 3s(큐 배치 제외), 렌더링 워커 병렬 처리  
- 가용성: 99.5% / 백오프-재시도 / 아이들 워커 자동 축소  
- 비용상한: 월 인프라 ≤ 10만원(초기), 변동비 모니터링/알람  
- 보안: OAuth(YouTube), JWT 세션, 최소 개인정보  
- 로그/관측: OpenTelemetry 트레이스, Loki 로그, Grafana 지표, Sentry 에러

---

## 4. 아키텍처 (텍스트 다이어그램)


---

## 5. 데이터 모델 (요약 스키마)

- `users(id, email, plan, oauth_provider, created_at)`  
- `channels(id, user_id, yt_channel_id, access_token_meta, created_at)`  
- `templates(id, user_id, name, brand_config_json, created_at)`  
- `jobs(id, user_id, status{queued|running|failed|done}, prompt, script, srt, metadata_json, output_url, error, created_at)`  
- `subscriptions(id, user_id, plan{free|pro|agency}, status, provider_customer_id, current_period_end)`  
- `usage_logs(id, user_id, job_id, tokens_in, tokens_out, render_secs, api_cost, created_at)`  
- `webhooks(id, type, payload_json, created_at)`  

인덱스: `jobs(user_id,status,created_at)`, `usage_logs(user_id,created_at)`, `subscriptions(user_id,status)`

---

## 6. 주요 API (초안)

### Auth
- `POST /auth/login` (Supabase)  
- `GET /auth/oauth/youtube/callback` (채널 연결)

### 생성/업로드
- `POST /jobs` : `{prompt, length_sec, tone, template_id, upload:{channel_id, privacy, schedule_at}}`  
- `GET /jobs/:id` : 상태/결과 조회  
- `POST /jobs/:id/retry`  
- `POST /uploads/:id/publish` : 초안→공개 전환

### 템플릿/브랜딩
- `GET /templates` / `POST /templates` / `PUT /templates/:id` / `DELETE /templates/:id`

### 결제/플랜
- `POST /billing/checkout` : `{plan}` → 결제 세션 생성  
- `POST /billing/webhook` : 구독 상태 동기화

### 리포팅
- `GET /metrics/user` : 생성/성공률/시간/비용  
- `GET /metrics/org` (Agency)

---

## 7. 외부 연동

- **OpenAI API (GPT-4o/mini)**: 스크립트/자막/메타데이터 생성  
- **Pexels/Unsplash API**: 저작권 안전한 스톡 리소스  
- **TTS(선택)**: ElevenLabs/Google Cloud TTS  
- **YouTube Data API**: 동영상/썸네일 업로드, 스케줄링  
- **결제**: Stripe(국제)/아임포트(국내 PG 라우팅)

---

## 8. 플랜/가격 (가안)

| 플랜 | 월 가격 | 생성/월 | 기능 | 비고 |
|---|---:|---:|---|---|
| Free | 0원 | 20회 | 워터마크, 초안 업로드만 | 3일 체험 |
| Pro | 19,000원 | 500회 | 자동업로드/스케줄/템플릿 | 초과 과금 옵션 |
| Agency | 79,000원 | 2,000회 | 다계정/리포트/API | 좌석 추가 과금 |

- **초과 과금(옵션)**: 1회당 200원(모델·TTS·렌더 비용 포함 가정)  
- **앵커**: 시간절감(편집 30분→6분), 동영상 1편 가치 ≥ 3천~5천원

---

## 9. 실험/검증 (30-60-90)

- **30일**: POC(스크립트→SRT→썸네일→초안 업로드), 베타 100명 웨이팅  
- **60일**: 결제 오픈, 전환율 ≥10%, 성공률 ≥90%  
- **90일**: 유료 160명(MRR≈300만원), CAC 회수 < 1개월

실험항목:  
- A/B: 제목/썸네일 카피 생성 방식(짧은 훅 vs 정보형)  
- 업로드: 즉시 vs 예약  
- 템플릿: 니치별(리뷰/뉴스/숏강의) 성과 비교

---

## 10. 리스크 & 완화

| 유형 | 리스크 | 완화 |
|---|---|---|
| 기술 | 렌더 실패/대기열 적체 | 재시도/워크큐 우선순위/샤딩 |
| 정책 | YouTube 제한/토큰 만료 | 최소 권한, 재인증 UX, 초안 기본 |
| 저작권 | 이미지/음원 라이선스 | 스톡 API만 사용, 약관/가이드 고지 |
| 비용 | LLM/TTS 과금 폭주 | 저가 모델·캐싱·요약·사전 프롬프트 |
| 시장 | 유사툴 증가 | “업로드 자동화/템플릿 UX”로 차별 |

---

## 11. 품질/관측성/운영

- **로그**: 요청ID/유저ID/잡ID 단위 구조화 로그  
- **메트릭**: 생성성공률, 렌더 평균시간, 업로드 실패율, 토큰/건당 원가  
- **알람**: 에러율 급증, 큐 체류시간, 외부 API 4xx/5xx  
- **SLO**: 잡 시작≤1분, 성공률≥95%, 업로드 실패≤2%  
- **런북**: 대기열 폭주 시 워커 증설→큐 드레인→지연 보상 정책

---

## 12. 보안/법률/정책

- **개인정보 최소 수집**: 이메일, OAuth 토큰 메타만 저장(암호화)  
- **콘텐츠 정책**: 성인/폭력/증오 발화 필터링(프롬프트 가드)  
- **이용약관/라이선스**: 스톡 사용범위 고지, 상업적 이용 가이드  
- **취소/환불**: 월 구독 환불 규정 명시, 초과과금 캡  
- **감사 로그**: 결제/업로드/권한변경 추적

---

## 13. 기술 스택

- **프런트**: Next.js + Tailwind + shadcn/ui  
- **백엔드**: FastAPI(Python) + Go 워커(FFmpeg)  
- **DB/스토리지**: Supabase(Postgres/PGVector, Storage)  
- **잡/큐**: Redis + Celery(또는 Temporal/Arq)  
- **호스팅**: Vercel(프론트), Render/Fly.io(API/워커)  
- **관측성**: OpenTelemetry + Grafana + Loki + Sentry  
- **CI/CD**: GitHub Actions, IaC 최소(Terraform 선택)

---

## 14. 프로젝트 구조 (예시)


---

## 15. MVP 완료 정의 (DoD)

- 프롬프트→스크립트→SRT→썸네일 카피→**초안 업로드**까지 **1클릭**  
- 실패 재시도/실패 사유 표준화, Sentry 알람 동작  
- 결제 플로우(Free→Pro 업그레이드) 및 사용량 제한  
- 대시보드: 작업 히스토리/성공률/평균시간/비용 추정  
- 약관/개인정보처리방침/콘텐츠 정책 게시

---

## 16. 성공 지표 (KPI)

- **NSM**: 주당 **업로드 완료 건수**  
- 전환율(Free→유료) ≥ 10%  
- 4주 잔존율 ≥ 35%  
- 생성 성공률 ≥ 95%, 평균 렌더링 ≤ 3분(60초 영상 기준)

---

## 17. 롤아웃 계획

1. **Closed Beta**: 커뮤니티 50명 초대, 수동 온보딩  
2. **Public Beta**: 유튜브 데모 공개, 프리오더(₩9,900)  
3. **Launch**: Pro/Agency 정가, 제휴/리뷰 캠페인  
4. **확장**: 템플릿 마켓, API/에이전시 기능

---

## 18. 백로그(우선순위 상)

- P0: 프롬프트→스크립트→SRT/썸네일→YouTube 초안  
- P1: 템플릿/브랜딩, 예약게시, 실패 재시도/알람  
- P2: 다계정(Agency), 리포트, 외부 TTS 옵션  
- P3: 템플릿 마켓, 팀 협업, 멀티채널(TikTok/IG Reels)

---

