/**
 * Shared dashboard type definitions
 */

export type JobStatus =
  | 'queued'
  | 'generating'
  | 'rendering'
  | 'uploading'
  | 'done'
  | 'failed';

export interface Job {
  id: string;
  prompt: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  video_url?: string;
  error_message?: string;
}

export interface DashboardStats {
  total_jobs: number;
  completed_jobs: number;
  connected_channels: number;
  monthly_usage: number;
}
