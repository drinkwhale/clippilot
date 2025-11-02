package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-redis/redis/v8"
)

var ctx = context.Background()

type RenderJob struct {
	JobID      string                 `json:"job_id"`
	UserID     string                 `json:"user_id"`
	Script     string                 `json:"script"`
	SRTContent string                 `json:"srt_content"`
	Metadata   map[string]interface{} `json:"metadata"`
	TemplateID *string                `json:"template_id,omitempty"`
	CreatedAt  time.Time              `json:"created_at"`
}

func main() {
	log.Println("Starting ClipPilot Worker...")

	// Redis 클라이언트 생성
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatal("Failed to parse Redis URL:", err)
	}

	client := redis.NewClient(opt)

	// Redis 연결 확인
	_, err = client.Ping(ctx).Result()
	if err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}
	log.Println("Connected to Redis")

	// Graceful shutdown 처리
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	// Worker 실행
	go startWorker(client)

	// 종료 신호 대기
	<-sigChan
	log.Println("Shutting down worker...")
}

func startWorker(client *redis.Client) {
	queueKey := "render_queue"
	log.Printf("Listening to queue: %s\n", queueKey)

	for {
		// BLPOP으로 큐에서 작업 가져오기 (타임아웃 5초)
		result, err := client.BLPop(ctx, 5*time.Second, queueKey).Result()
		if err == redis.Nil {
			// 타임아웃 - 계속 대기
			continue
		} else if err != nil {
			log.Printf("Error reading from queue: %v\n", err)
			time.Sleep(1 * time.Second)
			continue
		}

		// result[0]은 키, result[1]은 값
		jobData := result[1]

		// JSON 파싱
		var job RenderJob
		if err := json.Unmarshal([]byte(jobData), &job); err != nil {
			log.Printf("Error parsing job JSON: %v\n", err)
			continue
		}

		log.Printf("Processing job: %s\n", job.JobID)

		// 렌더링 처리 (TODO: 실제 구현)
		if err := processRenderJob(&job); err != nil {
			log.Printf("Error processing job %s: %v\n", job.JobID, err)
			// TODO: Celery callback으로 실패 알림
			continue
		}

		log.Printf("Job completed: %s\n", job.JobID)
		// TODO: Celery callback으로 완료 알림
	}
}

func processRenderJob(job *RenderJob) error {
	// TODO: 실제 렌더링 로직 구현
	// 1. 스톡 영상/이미지 다운로드
	// 2. FFmpeg로 영상 합성
	// 3. 자막 오버레이
	// 4. Intro/Outro 추가
	// 5. Watermark 추가
	// 6. Supabase Storage 업로드
	// 7. 진행률 업데이트

	log.Printf("TODO: Implement rendering logic for job %s\n", job.JobID)

	// 임시로 성공 반환
	return nil
}
