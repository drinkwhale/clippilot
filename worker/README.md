# ClipPilot Worker

Go 기반 비디오 렌더링 워커

## 🛠 기술 스택

- **Language**: Go 1.21
- **Video Processing**: FFmpeg 6.0
- **Queue**: Redis
- **Storage**: Supabase Storage
- **Deployment**: Render / Fly.io

## 📁 프로젝트 구조

```
worker/
├── cmd/
│   └── worker/
│       └── main.go             # 워커 진입점
├── internal/
│   ├── renderer/               # 렌더링 로직
│   │   ├── ffmpeg.go           # FFmpeg 래퍼
│   │   └── video.go            # 비디오 처리
│   ├── queue/                  # Redis 큐
│   │   ├── listener.go         # 큐 리스너
│   │   └── consumer.go         # 작업 소비자
│   ├── storage/                # 스토리지
│   │   └── supabase.go         # Supabase Storage 업로드
│   └── config/                 # 설정
│       └── config.go           # 환경 설정
├── pkg/                        # 공용 패키지
├── go.mod                      # Go 모듈
├── go.sum                      # 의존성 체크섬
└── .env.example                # 환경 변수 예시
```

## 🚀 시작하기

### 1. Go 설치

Go 1.21 이상이 필요합니다:

```bash
# macOS
brew install go

# 버전 확인
go version  # go1.21 이상
```

### 2. FFmpeg 설치

FFmpeg 6.0 이상이 필요합니다:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# 버전 확인
ffmpeg -version  # 6.0 이상
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```bash
# Redis
REDIS_URL=redis://localhost:6379/0

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...

# 환경
ENVIRONMENT=development
LOG_LEVEL=info
```

### 4. 의존성 설치

```bash
go mod download
```

### 5. 워커 실행

```bash
# 프로젝트 루트에서 실행 (통합 스크립트)
./scripts/dev-start.sh

# 또는 수동 실행
cd worker
go run cmd/worker/main.go
```

## 📜 주요 명령어

```bash
# 워커 실행
go run cmd/worker/main.go

# 빌드
go build -o bin/worker cmd/worker/main.go

# 테스트
go test ./...

# 커버리지 포함 테스트
go test -cover ./...

# 벤치마크
go test -bench=. ./...

# 코드 포맷팅
gofmt -w .

# 린팅
golangci-lint run
```

## 🎥 렌더링 워크플로우

### 작업 처리 흐름

```
1. Redis 큐에서 렌더링 작업 수신
   ↓
2. 스크립트 및 메타데이터 파싱
   ↓
3. Pexels API로 스톡 영상 다운로드
   ↓
4. FFmpeg로 영상 합성
   - 스톡 영상 편집
   - 자막 오버레이
   - 배경음악 추가
   - 트랜지션 효과
   ↓
5. 렌더링된 영상을 Supabase Storage에 업로드
   ↓
6. 작업 상태 업데이트 (done/failed)
```

### 지원 기능

- ✅ 여러 영상 클립 합성
- ✅ 자막 오버레이 (SRT 파일)
- ✅ 배경음악 추가
- ✅ 트랜지션 효과
- ✅ 썸네일 생성
- ✅ 다양한 해상도 지원 (1080p, 720p, 480p)
- ✅ 세로형 영상 (9:16) 지원

## 🔧 개발 가이드

### 새 렌더링 기능 추가

1. `internal/renderer/` 아래에 기능 파일 생성
2. FFmpeg 명령어 구성
3. 에러 처리 포함

**예시: 필터 추가**
```go
// internal/renderer/filter.go
package renderer

import "fmt"

// ApplyBlurFilter applies blur effect to video
func ApplyBlurFilter(input, output string, strength int) error {
    cmd := fmt.Sprintf("ffmpeg -i %s -vf boxblur=%d:1 %s",
        input, strength, output)

    return execFFmpeg(cmd)
}
```

### Redis 큐 작업 처리

```go
// internal/queue/consumer.go
package queue

import (
    "encoding/json"
    "github.com/go-redis/redis/v8"
)

type RenderJob struct {
    JobID      string   `json:"job_id"`
    ScriptText string   `json:"script_text"`
    VideoURLs  []string `json:"video_urls"`
}

func (c *Consumer) ProcessJob(ctx context.Context) error {
    // Redis에서 작업 수신
    result, err := c.client.BLPop(ctx, 0, "render_queue").Result()
    if err != nil {
        return err
    }

    // JSON 파싱
    var job RenderJob
    if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
        return err
    }

    // 렌더링 실행
    return c.renderer.Render(&job)
}
```

### FFmpeg 명령어 래핑

```go
// internal/renderer/ffmpeg.go
package renderer

import (
    "os/exec"
    "fmt"
)

func execFFmpeg(args ...string) error {
    cmd := exec.Command("ffmpeg", args...)

    output, err := cmd.CombinedOutput()
    if err != nil {
        return fmt.Errorf("ffmpeg failed: %s, output: %s", err, output)
    }

    return nil
}

// 비디오 합성 예시
func ConcatVideos(inputs []string, output string) error {
    // 임시 파일 목록 생성
    listFile := createTempList(inputs)
    defer os.Remove(listFile)

    // FFmpeg 실행
    return execFFmpeg(
        "-f", "concat",
        "-safe", "0",
        "-i", listFile,
        "-c", "copy",
        output,
    )
}
```

## 🧪 테스트

```bash
# 전체 테스트
go test ./...

# 특정 패키지 테스트
go test ./internal/renderer

# 커버리지
go test -cover ./...

# 자세한 출력
go test -v ./...

# 벤치마크
go test -bench=. ./internal/renderer
```

**테스트 작성 예시:**
```go
// internal/renderer/ffmpeg_test.go
package renderer

import "testing"

func TestConcatVideos(t *testing.T) {
    inputs := []string{"video1.mp4", "video2.mp4"}
    output := "output.mp4"

    err := ConcatVideos(inputs, output)
    if err != nil {
        t.Fatalf("ConcatVideos failed: %v", err)
    }

    // 파일 존재 확인
    if !fileExists(output) {
        t.Error("Output file not created")
    }
}
```

## 🚀 배포

### Docker 빌드

```bash
# Dockerfile (infra/docker/worker.Dockerfile)
docker build -f infra/docker/worker.Dockerfile -t clippilot-worker .

# 로컬 실행
docker run -e REDIS_URL=redis://host.docker.internal:6379 \
    -e SUPABASE_URL=xxx \
    -e SUPABASE_SERVICE_KEY=xxx \
    clippilot-worker
```

### Render 배포

1. `render.yaml` 설정
2. 환경 변수 설정
3. GitHub 연결 후 자동 배포

### Fly.io 배포

```bash
# Fly CLI 설치
curl -L https://fly.io/install.sh | sh

# 앱 생성
fly launch

# 환경 변수 설정
fly secrets set REDIS_URL=redis://xxx
fly secrets set SUPABASE_URL=xxx
fly secrets set SUPABASE_SERVICE_KEY=xxx

# 배포
fly deploy
```

## 🔍 문제 해결

### FFmpeg 명령어 실패

**원인**: FFmpeg 미설치 또는 잘못된 명령어

**해결:**
```bash
# FFmpeg 설치 확인
ffmpeg -version

# 명령어 테스트
ffmpeg -i input.mp4 -c copy output.mp4

# 로그 확인
go run cmd/worker/main.go 2>&1 | tee worker.log
```

### Redis 연결 실패

**원인**: Redis 미실행 또는 잘못된 URL

**해결:**
```bash
# Redis 실행 확인
redis-cli ping  # PONG 응답

# 연결 테스트
redis-cli -u redis://localhost:6379 ping

# .env 파일의 REDIS_URL 확인
```

### 메모리 부족 오류

**원인**: 대용량 영상 처리 시 메모리 부족

**해결:**
```bash
# Go 힙 메모리 제한 증가
GOGC=50 go run cmd/worker/main.go

# Docker 메모리 제한
docker run -m 4g clippilot-worker
```

### 렌더링 속도 느림

**원인**: CPU 성능 부족 또는 비효율적인 FFmpeg 설정

**해결:**
```go
// 하드웨어 가속 활용
func RenderWithHWAccel(input, output string) error {
    return execFFmpeg(
        "-hwaccel", "auto",  // 하드웨어 가속
        "-i", input,
        "-c:v", "h264_videotoolbox",  // macOS GPU 인코더
        output,
    )
}

// 프리셋 조정
func RenderFast(input, output string) error {
    return execFFmpeg(
        "-i", input,
        "-preset", "ultrafast",  // 빠른 인코딩
        "-crf", "28",            // 압축률 높임
        output,
    )
}
```

## 📚 참고 자료

- [FFmpeg 문서](https://ffmpeg.org/documentation.html)
- [Go 공식 문서](https://go.dev/doc/)
- [go-redis 문서](https://redis.uptrace.dev/)
- [Supabase Go 클라이언트](https://github.com/supabase-community/supabase-go)

## 🤝 기여하기

1. 코드 스타일: `gofmt` + `golangci-lint`
2. 커밋 메시지: Conventional Commits 형식
3. PR 전 테스트 실행: `go test ./...`

---

**작성일**: 2025-11-03
**버전**: Phase 2 (Foundational) 완료 기준
