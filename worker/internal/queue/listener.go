// Package queue provides Redis queue listening functionality for the rendering worker
package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

// RenderJob represents a rendering job from the queue
type RenderJob struct {
	JobID           string                 `json:"job_id"`
	UserID          string                 `json:"user_id"`
	Script          string                 `json:"script"`
	SRT             string                 `json:"srt"`
	VideoLengthSec  int                    `json:"video_length_sec"`
	BrandConfig     map[string]interface{} `json:"brand_config"`
	OutputVideoPath string                 `json:"output_video_path"`
	OutputThumbPath string                 `json:"output_thumb_path"`
}

// Listener handles Redis queue operations
type Listener struct {
	client    *redis.Client
	queueName string
	ctx       context.Context
}

// NewListener creates a new Redis queue listener
func NewListener(ctx context.Context) (*Listener, error) {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379/0"
	}

	// Parse Redis URL
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	// Create Redis client
	client := redis.NewClient(opts)

	// Test connection
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	queueName := os.Getenv("RENDER_QUEUE_NAME")
	if queueName == "" {
		queueName = "rendering"
	}

	log.Printf("Connected to Redis: %s", redisURL)
	log.Printf("Listening on queue: %s", queueName)

	return &Listener{
		client:    client,
		queueName: queueName,
		ctx:       ctx,
	}, nil
}

// Listen starts listening for jobs on the queue
func (l *Listener) Listen(handler func(job *RenderJob) error) error {
	log.Printf("Starting queue listener...")

	for {
		select {
		case <-l.ctx.Done():
			log.Println("Context cancelled, stopping listener")
			return l.ctx.Err()
		default:
			// Block and wait for job (5 second timeout)
			result, err := l.client.BLPop(l.ctx, 5*time.Second, l.queueName).Result()
			if err == redis.Nil {
				// Timeout, continue waiting
				continue
			}
			if err != nil {
				log.Printf("Error popping from queue: %v", err)
				time.Sleep(1 * time.Second)
				continue
			}

			// Parse job data (result[0] is queue name, result[1] is data)
			if len(result) < 2 {
				log.Printf("Invalid queue result: %v", result)
				continue
			}

			jobData := result[1]
			job, err := l.parseJob(jobData)
			if err != nil {
				log.Printf("Error parsing job: %v", err)
				continue
			}

			log.Printf("Received job: %s (user: %s, length: %ds)",
				job.JobID, job.UserID, job.VideoLengthSec)

			// Handle job
			if err := handler(job); err != nil {
				log.Printf("Error handling job %s: %v", job.JobID, err)
				// Optionally push to dead letter queue
				l.pushToDeadLetter(job, err)
			} else {
				log.Printf("Successfully processed job: %s", job.JobID)
			}
		}
	}
}

// parseJob parses job data from JSON
func (l *Listener) parseJob(data string) (*RenderJob, error) {
	var job RenderJob
	if err := json.Unmarshal([]byte(data), &job); err != nil {
		return nil, fmt.Errorf("failed to unmarshal job: %w", err)
	}

	// Validate required fields
	if job.JobID == "" {
		return nil, fmt.Errorf("missing job_id")
	}
	if job.UserID == "" {
		return nil, fmt.Errorf("missing user_id")
	}
	if job.Script == "" {
		return nil, fmt.Errorf("missing script")
	}

	return &job, nil
}

// pushToDeadLetter pushes failed job to dead letter queue
func (l *Listener) pushToDeadLetter(job *RenderJob, err error) {
	deadLetterQueue := l.queueName + ":failed"

	// Create error info
	errorInfo := map[string]interface{}{
		"job":       job,
		"error":     err.Error(),
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	data, _ := json.Marshal(errorInfo)

	if err := l.client.RPush(l.ctx, deadLetterQueue, data).Err(); err != nil {
		log.Printf("Failed to push to dead letter queue: %v", err)
	} else {
		log.Printf("Pushed job %s to dead letter queue", job.JobID)
	}
}

// GetQueueLength returns the current queue length
func (l *Listener) GetQueueLength() (int64, error) {
	return l.client.LLen(l.ctx, l.queueName).Result()
}

// Close closes the Redis connection
func (l *Listener) Close() error {
	log.Println("Closing Redis connection...")
	return l.client.Close()
}

// HealthCheck checks Redis connection health
func (l *Listener) HealthCheck() error {
	return l.client.Ping(l.ctx).Err()
}
