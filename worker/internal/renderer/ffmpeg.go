// Package renderer provides video rendering functionality using FFmpeg
package renderer

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// FFmpegRenderer handles video rendering with FFmpeg
type FFmpegRenderer struct {
	ffmpegPath string
	ffprobePath string
	workDir string
}

// RenderOptions contains rendering configuration
type RenderOptions struct {
	Width         int
	Height        int
	FPS           int
	VideoBitrate  string
	AudioBitrate  string
	Format        string
	VideoCodec    string
	AudioCodec    string
	Preset        string
}

// DefaultRenderOptions returns default rendering options for YouTube Shorts
func DefaultRenderOptions() *RenderOptions {
	return &RenderOptions{
		Width:        1080, // 9:16 aspect ratio
		Height:       1920,
		FPS:          30,
		VideoBitrate: "5000k",
		AudioBitrate: "192k",
		Format:       "mp4",
		VideoCodec:   "libx264",
		AudioCodec:   "aac",
		Preset:       "medium", // fast, medium, slow
	}
}

// NewFFmpegRenderer creates a new FFmpeg renderer
func NewFFmpegRenderer() (*FFmpegRenderer, error) {
	// Check FFmpeg installation
	ffmpegPath, err := exec.LookPath("ffmpeg")
	if err != nil {
		return nil, fmt.Errorf("ffmpeg not found in PATH: %w", err)
	}

	ffprobePath, err := exec.LookPath("ffprobe")
	if err != nil {
		return nil, fmt.Errorf("ffprobe not found in PATH: %w", err)
	}

	// Create work directory
	workDir := os.Getenv("WORK_DIR")
	if workDir == "" {
		workDir = "/tmp/clippilot-worker"
	}

	if err := os.MkdirAll(workDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create work directory: %w", err)
	}

	log.Printf("FFmpeg renderer initialized")
	log.Printf("FFmpeg: %s", ffmpegPath)
	log.Printf("FFprobe: %s", ffprobePath)
	log.Printf("Work directory: %s", workDir)

	return &FFmpegRenderer{
		ffmpegPath:  ffmpegPath,
		ffprobePath: ffprobePath,
		workDir:     workDir,
	}, nil
}

// RenderVideo renders a video from script and stock footage
func (r *FFmpegRenderer) RenderVideo(
	ctx context.Context,
	jobID string,
	script string,
	srtContent string,
	stockVideoPaths []string,
	options *RenderOptions,
) (string, error) {
	if options == nil {
		options = DefaultRenderOptions()
	}

	log.Printf("Starting render for job: %s", jobID)
	startTime := time.Now()

	// Create job work directory
	jobWorkDir := filepath.Join(r.workDir, jobID)
	if err := os.MkdirAll(jobWorkDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create job work directory: %w", err)
	}
	defer os.RemoveAll(jobWorkDir) // Cleanup after render

	// Write SRT file
	srtPath := filepath.Join(jobWorkDir, "subtitles.srt")
	if err := os.WriteFile(srtPath, []byte(srtContent), 0644); err != nil {
		return "", fmt.Errorf("failed to write SRT file: %w", err)
	}

	// Concatenate stock videos
	concatenatedPath := filepath.Join(jobWorkDir, "concatenated.mp4")
	if err := r.concatenateVideos(ctx, stockVideoPaths, concatenatedPath); err != nil {
		return "", fmt.Errorf("failed to concatenate videos: %w", err)
	}

	// Add subtitles and encode
	outputPath := filepath.Join(jobWorkDir, fmt.Sprintf("%s_final.mp4", jobID))
	if err := r.addSubtitlesAndEncode(ctx, concatenatedPath, srtPath, outputPath, options); err != nil {
		return "", fmt.Errorf("failed to add subtitles and encode: %w", err)
	}

	duration := time.Since(startTime)
	log.Printf("Render completed for job %s in %.2fs", jobID, duration.Seconds())

	return outputPath, nil
}

// concatenateVideos concatenates multiple video files
func (r *FFmpegRenderer) concatenateVideos(ctx context.Context, inputPaths []string, outputPath string) error {
	if len(inputPaths) == 0 {
		return fmt.Errorf("no input videos provided")
	}

	// If single video, just copy it
	if len(inputPaths) == 1 {
		args := []string{
			"-i", inputPaths[0],
			"-c", "copy",
			"-y",
			outputPath,
		}
		return r.runFFmpeg(ctx, args)
	}

	// Create concat file
	concatFile := filepath.Join(filepath.Dir(outputPath), "concat.txt")
	var lines []string
	for _, path := range inputPaths {
		lines = append(lines, fmt.Sprintf("file '%s'", path))
	}
	if err := os.WriteFile(concatFile, []byte(strings.Join(lines, "\n")), 0644); err != nil {
		return fmt.Errorf("failed to write concat file: %w", err)
	}
	defer os.Remove(concatFile)

	// Concatenate videos
	args := []string{
		"-f", "concat",
		"-safe", "0",
		"-i", concatFile,
		"-c", "copy",
		"-y",
		outputPath,
	}

	return r.runFFmpeg(ctx, args)
}

// addSubtitlesAndEncode adds subtitles and encodes video
func (r *FFmpegRenderer) addSubtitlesAndEncode(
	ctx context.Context,
	inputPath string,
	srtPath string,
	outputPath string,
	options *RenderOptions,
) error {
	args := []string{
		"-i", inputPath,
		"-vf", fmt.Sprintf(
			"scale=%d:%d,subtitles=%s:force_style='Fontsize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Alignment=2'",
			options.Width,
			options.Height,
			srtPath,
		),
		"-c:v", options.VideoCodec,
		"-preset", options.Preset,
		"-b:v", options.VideoBitrate,
		"-r", fmt.Sprintf("%d", options.FPS),
		"-c:a", options.AudioCodec,
		"-b:a", options.AudioBitrate,
		"-movflags", "+faststart", // Enable streaming
		"-y",
		outputPath,
	}

	return r.runFFmpeg(ctx, args)
}

// GenerateThumbnail generates a thumbnail from video
func (r *FFmpegRenderer) GenerateThumbnail(ctx context.Context, videoPath string, outputPath string, timeSeconds float64) error {
	args := []string{
		"-i", videoPath,
		"-ss", fmt.Sprintf("%.2f", timeSeconds),
		"-vframes", "1",
		"-vf", "scale=1080:1920",
		"-y",
		outputPath,
	}

	return r.runFFmpeg(ctx, args)
}

// GetVideoDuration returns the duration of a video in seconds
func (r *FFmpegRenderer) GetVideoDuration(ctx context.Context, videoPath string) (float64, error) {
	args := []string{
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		videoPath,
	}

	cmd := exec.CommandContext(ctx, r.ffprobePath, args...)
	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("ffprobe failed: %w", err)
	}

	var duration float64
	if _, err := fmt.Sscanf(string(output), "%f", &duration); err != nil {
		return 0, fmt.Errorf("failed to parse duration: %w", err)
	}

	return duration, nil
}

// runFFmpeg executes FFmpeg command
func (r *FFmpegRenderer) runFFmpeg(ctx context.Context, args []string) error {
	cmd := exec.CommandContext(ctx, r.ffmpegPath, args...)

	// Capture stderr for logging
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("failed to get stderr pipe: %w", err)
	}

	// Start command
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start ffmpeg: %w", err)
	}

	// Log stderr in background
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := stderr.Read(buf)
			if n > 0 {
				log.Printf("FFmpeg: %s", string(buf[:n]))
			}
			if err != nil {
				break
			}
		}
	}()

	// Wait for completion
	if err := cmd.Wait(); err != nil {
		return fmt.Errorf("ffmpeg failed: %w", err)
	}

	return nil
}

// Cleanup removes temporary files
func (r *FFmpegRenderer) Cleanup(jobID string) error {
	jobWorkDir := filepath.Join(r.workDir, jobID)
	return os.RemoveAll(jobWorkDir)
}
