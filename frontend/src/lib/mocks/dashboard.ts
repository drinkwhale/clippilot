import type { DashboardStats, Job } from '@/lib/types/dashboard';

export const mockDashboardStats: DashboardStats = {
  total_jobs: 128,
  completed_jobs: 96,
  connected_channels: 3,
  monthly_usage: 24,
};

export const mockJobs: Job[] = [
  {
    id: 'job-1',
    prompt: '트렌드 뉴스 "AI 스타트업 투자" 요약 영상',
    status: 'rendering',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: 'job-2',
    prompt: 'IT 이슈 브리핑 - 갤럭시 S26 루머',
    status: 'done',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    video_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 'job-3',
    prompt: '재테크 꿀팁 30초 요약',
    status: 'uploading',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'job-4',
    prompt: '인기 유튜브 shorts 리포트',
    status: 'failed',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    error_message: 'YouTube 업로드 권한이 만료되었습니다.',
  },
];

export const mockSearchHistory: string[] = [
  '2025 쇼츠 트렌드',
  '테슬라 실적 발표 요약',
  '헬스 홈트 루틴',
];
