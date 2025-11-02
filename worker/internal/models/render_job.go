package models

import "time"

// RenderJob represents a video rendering job from Redis queue
type RenderJob struct {
	JobID      string                 `json:"job_id"`
	UserID     string                 `json:"user_id"`
	Script     string                 `json:"script"`
	SRTContent string                 `json:"srt_content"`
	Metadata   map[string]interface{} `json:"metadata"`
	TemplateID *string                `json:"template_id,omitempty"`
	CreatedAt  time.Time              `json:"created_at"`
}

// RenderResult represents the result of a rendering operation
type RenderResult struct {
	JobID     string        `json:"job_id"`
	VideoURL  string        `json:"video_url"`
	Duration  time.Duration `json:"duration"`
	Success   bool          `json:"success"`
	Error     string        `json:"error,omitempty"`
}

// RenderProgress represents rendering progress information
type RenderProgress struct {
	JobID    string  `json:"job_id"`
	Progress float64 `json:"progress"` // 0.0 to 1.0
	Message  string  `json:"message"`
}

// Template configuration from metadata
type TemplateConfig struct {
	BrandColor    string  `json:"brand_color"`
	FontFamily    string  `json:"font_family"`
	LogoURL       *string `json:"logo_url,omitempty"`
	IntroURL      *string `json:"intro_url,omitempty"`
	OutroURL      *string `json:"outro_url,omitempty"`
	WatermarkURL  *string `json:"watermark_url,omitempty"`
	BackgroundURL *string `json:"background_url,omitempty"`
}

// Subtitle represents a single subtitle entry
type Subtitle struct {
	Index     int       `json:"index"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	Text      string    `json:"text"`
}

// ParseSRT parses SRT content into Subtitle entries
func ParseSRT(content string) ([]Subtitle, error) {
	// TODO: Implement SRT parsing
	return nil, nil
}
