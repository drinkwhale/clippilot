# Research: ClipPilot MVP 기술 조사

**Feature**: ClipPilot MVP - AI 숏폼 크리에이터 자동화 SaaS
**Date**: 2025-10-27
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## Overview

이 문서는 ClipPilot MVP 구현을 위한 핵심 기술 결정사항과 그 근거를 정리합니다.

---

## 1. Frontend Framework 선택

### Decision: Next.js 14 (App Router)

**선택 이유**:
- **SSR + CSR 하이브리드**: 초기 로드 성능 최적화 (NFR-003: 1초 이내 로드)
- **Vercel 최적화**: Edge Functions, Image Optimization, 자동 배포
- **React Server Components**: 서버 로직을 컴포넌트에 직접 통합 가능
- **파일 기반 라우팅**: App Router로 레이아웃 재사용 및 중첩 라우팅 지원
- **TypeScript 완벽 지원**: 타입 안전성 보장

**대안 검토**:
| 대안 | 장점 | 단점 | 거부 이유 |
|------|------|------|-----------|
| Create React App | 단순한 설정 | CSR만 지원, 성능 제한 | 초기 로드 성능 목표 미달 |
| Remix | 데이터 로딩 우수 | Vercel 최적화 부족 | 배포 복잡도 증가 |
| SvelteKit | 번들 크기 작음 | 생태계 작음 | shadcn/ui와 통합 어려움 |

**Best Practices**:
- Server Components로 데이터 페칭 최적화
- `loading.tsx`, `error.tsx`로 UX 개선
- `layout.tsx`로 공통 레이아웃 재사용
- Middleware로 인증 가드 구현
- TanStack Query로 클라이언트 상태 관리

---

## 2. Backend Framework 선택

### Decision: FastAPI (Python 3.11)

**선택 이유**:
- **비동기 지원**: `async/await`로 고성능 API 구현
- **자동 API 문서**: OpenAPI/Swagger 자동 생성 (contract 테스트 용이)
- **Pydantic 통합**: 요청/응답 검증 자동화
- **Python 생태계**: OpenAI SDK, Google API Client 등 LLM 연동 라이브러리 풍부
- **빠른 개발 속도**: 타입 힌트로 IDE 자동완성 지원

**대안 검토**:
| 대안 | 장점 | 단점 | 거부 이유 |
|------|------|------|-----------|
| Flask | 단순함 | 비동기 미지원 | NFR-001 (3초 응답) 달성 어려움 |
| Django | Full-stack | 무겁고 느림 | API 전용 서비스에 과도 |
| Express.js | Node 생태계 | TypeScript 타입 불안정 | Python LLM SDK가 더 성숙 |

**Best Practices**:
- Dependency Injection으로 테스트 가능성 향상
- APIRouter로 모듈화
- Middleware로 CORS, Rate Limiting, 로깅 처리
- Pydantic으로 환경 변수 검증
- SQLAlchemy async로 비동기 DB 접근

---

## 3. Rendering Worker: Go vs Python

### Decision: Go 1.21

**선택 이유**:
- **동시성 모델**: Goroutine으로 다중 렌더링 작업 효율적 처리
- **FFmpeg 제어**: `os/exec`로 FFmpeg 프로세스 안정적 제어
- **성능**: CPU 바운드 작업에 Python GIL 문제 없음
- **메모리 효율**: 가비지 컬렉션 최적화로 렌더링 중 메모리 안정
- **단일 바이너리**: Docker 이미지 크기 최소화 (100MB 이하)

**대안 검토**:
| 대안 | 장점 | 단점 | 거부 이유 |
|------|------|------|-----------|
| Python + multiprocessing | 단일 언어 | GIL, 메모리 사용량 높음 | NFR-002 (3분 렌더링) 달성 어려움 |
| Rust | 최고 성능 | 개발 속도 느림 | MVP 출시 시간 중요 |
| Node.js | 단일 언어 | CPU 바운드 작업 비효율 | 동영상 처리에 부적합 |

**Best Practices**:
- Worker Pool 패턴으로 동시성 제어
- Context로 타임아웃 관리
- Structured logging으로 추적성 확보
- Exponential backoff로 재시도
- Health check 엔드포인트 제공

---

## 4. 작업 큐: Celery + Redis vs 대안

### Decision: Celery + Redis

**선택 이유**:
- **성숙한 생태계**: Python에서 가장 검증된 분산 작업 큐
- **재시도 메커니즘**: 자동 재시도, 지수 백오프 지원
- **우선순위 큐**: FR-039 (Pro > Free > 재시도) 구현 가능
- **모니터링**: Flower로 실시간 작업 추적
- **스케일링**: 워커 수평 확장 용이

**대안 검토**:
| 대안 | 장점 | 단점 | 거부 이유 |
|------|------|------|-----------|
| BullMQ (Node.js) | Redis 기반 | Backend가 Python | 언어 불일치 |
| RabbitMQ + Celery | 고급 라우팅 | 인프라 복잡도 증가 | NFR-015 (비용 10만원) 초과 |
| AWS SQS | 관리형 | 비용 높음, Lock-in | 비용 및 종속성 |

**Best Practices**:
- Task routing으로 작업 분리 (generate/render/upload)
- Result backend로 작업 결과 추적
- Rate limiting으로 외부 API 보호
- Dead letter queue로 실패 작업 분리
- Monitoring으로 큐 길이 알림

---

## 5. 데이터베이스: Supabase PostgreSQL

### Decision: Supabase (PostgreSQL + Auth + Storage)

**선택 이유**:
- **올인원 플랫폼**: Auth, DB, Storage, Realtime을 단일 플랫폼에서 제공
- **무료 티어**: 초기 단계에서 비용 절감 (NFR-015)
- **PostgreSQL**: 관계형 데이터 + JSONB로 유연성 확보
- **Row Level Security**: FR-018 (감사 로그) 및 보안 강화
- **Realtime**: 작업 상태 실시간 업데이트 가능

**대안 검토**:
| 대안 | 장점 | 단점 | 거부 이유 |
|------|------|------|-----------|
| Firebase | Realtime 우수 | NoSQL만 지원 | 관계형 쿼리 필요 (사용량 집계) |
| MongoDB Atlas | 유연한 스키마 | 트랜잭션 제한 | 결제 무결성 요구 |
| AWS RDS | 고성능 | 비용 높음, 설정 복잡 | NFR-015 (비용 제약) |

**Best Practices**:
- Alembic으로 마이그레이션 관리
- 인덱스 최적화 (user_id, status, created_at)
- Connection pooling으로 연결 관리
- Backup 자동화
- Row Level Security로 다중 테넌시 구현

---

## 6. 인증: Supabase Auth

### Decision: Supabase Auth

**선택 이유**:
- **Supabase 통합**: DB와 동일 플랫폼으로 관리 단순화
- **소셜 로그인**: Google OAuth 지원 (YouTube 연동 필수)
- **보안**: 비밀번호 해싱, 세션 관리 자동화 (NFR-010)
- **무료**: 50,000 MAU까지 무료

**대안 검토**:
| 대안 | 장점 | 단점 | 거부 이유 |
|------|------|------|-----------|
| Auth0 | 고급 기능 | 유료 (MAU당 과금) | NFR-015 (비용 제약) |
| Custom JWT | 완전 제어 | 보안 리스크, 개발 시간 | MVP 출시 속도 저하 |
| Firebase Auth | 성숙함 | Firebase 종속 | Supabase DB 사용 중 |

**Best Practices**:
- JWT refresh token 사용
- PKCE flow로 OAuth 보안 강화
- Rate limiting으로 brute force 방지 (FR-024)
- Session expiry 설정 (NFR-010)

---

## 7. 결제: Stripe

### Decision: Stripe

**선택 이유**:
- **글로벌 표준**: 국제 결제 지원 (원본 문서 명시)
- **구독 관리**: 자동 결제, 플랜 전환, 해지 기능 내장
- **Webhook**: 결제 상태 실시간 동기화 (FR-017)
- **개발자 경험**: 명확한 문서, Sandbox 테스트

**대안 검토**:
| 대안 | 장점 | 단점 | 거부 이유 |
|------|------|------|-----------|
| 아임포트 | 국내 PG 라우팅 | 국제 결제 제한 | 원본 문서에서 Stripe 우선 명시 |
| PayPal | 인지도 높음 | 구독 관리 약함 | 플랜 전환 복잡 |

**Best Practices**:
- Webhook signature 검증 (보안)
- Idempotency key로 중복 결제 방지
- Customer Portal로 사용자 셀프 관리
- Test mode로 개발/테스트 분리

---

## 8. LLM: OpenAI GPT-4o

### Decision: OpenAI GPT-4o (또는 GPT-4o-mini)

**선택 이유**:
- **최신 모델**: 멀티모달 지원 (텍스트 + 이미지 이해)
- **Function Calling**: 구조화된 출력 (스크립트, SRT, 메타데이터)
- **속도**: GPT-4o는 GPT-4 대비 2배 빠름 (NFR-001: 3초)
- **비용**: GPT-4o-mini는 저렴 (NFR-016 준수)

**대안 검토**:
| 대안 | 장점 | 단점 | 거부 이유 |
|------|------|------|-----------|
| Claude 3 | 긴 컨텍스트 | Function calling 약함 | 구조화 출력 필요 |
| Llama 3 (자체 호스팅) | 비용 절감 | 품질 낮음, 인프라 복잡 | NFR-015 (비용) 역효과 |

**Best Practices**:
- Structured Output으로 JSON 보장
- Streaming으로 사용자 피드백 제공
- Prompt caching으로 비용 절감
- Fallback model 설정 (GPT-4o → GPT-4o-mini)

---

## 9. YouTube 연동: YouTube Data API v3

### Decision: YouTube Data API v3 + OAuth 2.0

**선택 이유**:
- **공식 API**: 안정성과 문서화 우수
- **OAuth 2.0**: 최소 권한 원칙 (업로드만) (FR-012)
- **무료 할당량**: 일일 10,000 units (초기 충분)

**고려사항**:
- **할당량 관리**: Edge Case에서 초과 시 재시도 큐 사용
- **토큰 갱신**: refresh_token 저장 및 자동 갱신 (FR-013)
- **에러 처리**: 429 (quota), 401 (auth) 명확히 구분 (FR-028)

**Best Practices**:
- Exponential backoff로 재시도
- Batch API로 할당량 절약
- Thumbnail upload 별도 API 사용
- Video status polling으로 업로드 완료 확인

---

## 10. 스톡 미디어: Pexels API

### Decision: Pexels API

**선택 이유**:
- **무료 라이선스**: 상업적 이용 가능 (Edge Case 해결)
- **검색 품질**: 키워드 기반 고품질 영상/이미지
- **무료 API**: 월 200 requests/hour (초기 충분)

**대안 검토**:
| 대안 | 장점 | 단점 | 거부 이유 |
|------|------|------|-----------|
| Unsplash | 이미지 품질 우수 | 동영상 미지원 | 영상 필수 |
| Pixabay | 무료 | API 제한 많음 | 안정성 낮음 |

**Best Practices**:
- 키워드 번역 (한국어 → 영어)
- Caching으로 API 호출 최소화
- 라이선스 명시 (Edge Case 준수)

---

## 11. 영상 렌더링: FFmpeg

### Decision: FFmpeg 6.0

**선택 이유**:
- **업계 표준**: 모든 코덱 지원, 성숙한 생태계
- **고성능**: GPU 가속 지원 (NVENC, Quick Sync)
- **오픈소스**: 무료, 커스터마이징 가능

**고려사항**:
- **복잡도**: FFmpeg 명령어 파이프라인 관리 필요
- **에러 처리**: stderr 파싱으로 진행률 추적

**Best Practices**:
- Hardware acceleration으로 렌더링 속도 향상
- Two-pass encoding으로 품질 최적화
- Progress callback으로 진행률 업데이트 (FR-020)
- Timeout으로 무한 대기 방지

---

## 12. 배포 플랫폼

### Decision:
- **Frontend**: Vercel
- **Backend + Worker**: Render.com (또는 Fly.io)
- **Database**: Supabase Cloud
- **Cache**: Upstash Redis (Serverless)

**선택 이유**:
- **Vercel**: Next.js 최적화, 무료 티어, 자동 배포
- **Render.com**: Docker 지원, 무료 티어 (750시간/월), Background Workers
- **Upstash Redis**: Serverless, 무료 10,000 commands/day

**대안 검토**:
| 대안 | 장점 | 단점 | 거부 이유 |
|------|------|------|-----------|
| AWS (EC2 + ECS) | 완전 제어 | 복잡도 높음, 비용 | NFR-015 (비용 10만원) 초과 |
| Railway | 단순함 | 무료 티어 제한 | Worker 동작 제한 |
| DigitalOcean | 저렴 | 관리 부담 | 운영 복잡도 |

**Best Practices**:
- Docker로 일관된 환경 보장
- Health check로 자동 재시작
- Environment variables로 설정 관리
- CI/CD로 자동 배포 (GitHub Actions)

---

## 13. 모니터링 및 로깅

### Decision:
- **로그**: 구조화 로그 (JSON) + Loki (또는 Render Logs)
- **메트릭**: Prometheus + Grafana (또는 Render Metrics)
- **에러 추적**: Sentry
- **APM**: OpenTelemetry

**선택 이유**:
- **Sentry**: 에러 추적 및 알림, 무료 5,000 events/월
- **구조화 로그**: 요청ID, 사용자ID, 작업ID 추적 (NFR-012)
- **OpenTelemetry**: 벤더 중립적, 추후 확장 용이

**Best Practices**:
- Correlation ID로 분산 추적
- Sampling으로 비용 절감
- Alert rules로 자동 알림 (NFR-014)
- Dashboard로 실시간 모니터링

---

## Summary

모든 기술 결정은 다음 원칙을 따릅니다:

1. **비용 효율성**: 무료 티어 최대 활용, 월 10만원 이하 (NFR-015)
2. **빠른 개발**: 검증된 라이브러리 사용, MVP 출시 속도 우선
3. **성능**: NFR-001~003 충족 (API 3초, 렌더링 3분, 로드 1초)
4. **확장성**: 수평 확장 가능한 아키텍처
5. **보안**: OAuth, HTTPS, 암호화 (NFR-008~011)
6. **관측성**: 로그, 메트릭, 알람 (NFR-012~014)

**다음 단계**: Phase 1 - Data Model & Contracts 생성
