FROM golang:1.21-alpine AS builder

# FFmpeg 설치 (빌드 스테이지)
RUN apk add --no-cache ffmpeg

WORKDIR /app

# 의존성 복사 및 다운로드
COPY worker/go.mod worker/go.sum ./
RUN go mod download

# 소스 코드 복사 및 빌드
COPY worker/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /worker cmd/worker/main.go

# 실행 스테이지
FROM alpine:latest

# FFmpeg 설치 (실행 스테이지)
RUN apk add --no-cache ffmpeg

WORKDIR /root/

# 빌드된 바이너리 복사
COPY --from=builder /worker ./worker

# 실행
CMD ["./worker"]
