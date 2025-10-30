/**
 * useJobs hook
 * Handles job (content generation) creation, fetching, and management.
 */

'use client'

import { useCallback, useMemo } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'

import { useAuthStore } from '@/lib/stores/auth-store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// API Response Types
interface JobApiResponse {
  id: string
  user_id: string
  template_id: string | null
  prompt: string
  status: 'queued' | 'generating' | 'rendering' | 'uploading' | 'done' | 'failed'
  script: string | null
  srt: string | null
  metadata_json: {
    title?: string
    description?: string
    tags?: string[]
  } | null
  video_url: string | null
  thumbnail_url: string | null
  youtube_video_id: string | null
  error_message: string | null
  retry_count: number
  duration_seconds: number | null
  render_time_seconds: number | null
  created_at: string
  updated_at: string
}

interface JobListApiResponse {
  jobs: JobApiResponse[]
  total: number
  page: number
  page_size: number
}

// Client Types
export interface Job {
  id: string
  userId: string
  templateId: string | null
  prompt: string
  status: 'queued' | 'generating' | 'rendering' | 'uploading' | 'done' | 'failed'
  script: string | null
  srt: string | null
  metadata: {
    title?: string
    description?: string
    tags?: string[]
  } | null
  videoUrl: string | null
  thumbnailUrl: string | null
  youtubeVideoId: string | null
  errorMessage: string | null
  retryCount: number
  durationSeconds: number | null
  renderTimeSeconds: number | null
  createdAt: string
  updatedAt: string
}

export interface JobListResult {
  jobs: Job[]
  total: number
  page: number
  pageSize: number
}

export interface CreateJobParams {
  prompt: string
  templateId?: string
}

export interface UpdateJobParams {
  script?: string
  srt?: string
  metadata?: {
    title?: string
    description?: string
    tags?: string[]
  }
}

// Mapper functions
const mapJob = (job: JobApiResponse): Job => ({
  id: job.id,
  userId: job.user_id,
  templateId: job.template_id,
  prompt: job.prompt,
  status: job.status,
  script: job.script,
  srt: job.srt,
  metadata: job.metadata_json,
  videoUrl: job.video_url,
  thumbnailUrl: job.thumbnail_url,
  youtubeVideoId: job.youtube_video_id,
  errorMessage: job.error_message,
  retryCount: job.retry_count,
  durationSeconds: job.duration_seconds,
  renderTimeSeconds: job.render_time_seconds,
  createdAt: job.created_at,
  updatedAt: job.updated_at,
})

export function useJobs(options?: {
  status?: 'queued' | 'generating' | 'rendering' | 'uploading' | 'done' | 'failed'
  page?: number
  pageSize?: number
}) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()

  const { status, page = 1, pageSize = 20 } = options ?? {}

  // Fetch jobs list
  const fetchJobs = useCallback(async (): Promise<JobListResult> => {
    if (!accessToken) {
      return { jobs: [], total: 0, page: 1, pageSize: 20 }
    }

    const params = new URLSearchParams()
    if (status) params.append('status_filter', status)
    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())

    const response = await fetch(
      `${API_BASE_URL}/api/v1/jobs?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      throw new Error('작업 목록을 불러오지 못했습니다.')
    }

    const data = (await response.json()) as JobListApiResponse
    return {
      jobs: data.jobs.map(mapJob),
      total: data.total,
      page: data.page,
      pageSize: data.page_size,
    }
  }, [accessToken, status, page, pageSize])

  const jobsQuery: UseQueryResult<JobListResult> = useQuery({
    queryKey: ['jobs', { status, page, pageSize }],
    queryFn: fetchJobs,
    enabled: Boolean(accessToken),
    refetchInterval: 5000, // Poll every 5 seconds for status updates
  })

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (params: CreateJobParams) => {
      if (!accessToken) {
        throw new Error('로그인이 필요합니다.')
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt: params.prompt,
          template_id: params.templateId ?? null,
        }),
      })

      if (response.status === 429) {
        const data = await response.json()
        throw new Error(
          data.detail?.message ?? '월간 생성 한도를 초과했습니다.'
        )
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message =
          data?.detail?.message ?? '작업 생성 중 오류가 발생했습니다.'
        throw new Error(message)
      }

      const job = (await response.json()) as JobApiResponse
      return mapJob(job)
    },
    onSuccess: () => {
      // Invalidate jobs list
      queryClient.invalidateQueries({ queryKey: ['jobs'] }).catch(() => {})
    },
  })

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async ({
      jobId,
      updates,
    }: {
      jobId: string
      updates: UpdateJobParams
    }) => {
      if (!accessToken) {
        throw new Error('로그인이 필요합니다.')
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          script: updates.script,
          srt: updates.srt,
          metadata_json: updates.metadata,
        }),
      })

      if (response.status === 404) {
        throw new Error('작업을 찾을 수 없습니다.')
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message =
          data?.detail?.message ?? '작업 수정 중 오류가 발생했습니다.'
        throw new Error(message)
      }

      const job = (await response.json()) as JobApiResponse
      return mapJob(job)
    },
    onSuccess: () => {
      // Invalidate jobs list and individual job
      queryClient.invalidateQueries({ queryKey: ['jobs'] }).catch(() => {})
    },
  })

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] }).catch(() => {})
  }, [queryClient])

  return useMemo(
    () => ({
      // Job list
      jobs: jobsQuery.data?.jobs ?? [],
      total: jobsQuery.data?.total ?? 0,
      page: jobsQuery.data?.page ?? 1,
      pageSize: jobsQuery.data?.pageSize ?? 20,
      isLoading: jobsQuery.isLoading,
      isFetching: jobsQuery.isFetching,
      isError: jobsQuery.isError,
      error: jobsQuery.error as Error | null,

      // Mutations
      createJob: createJobMutation.mutateAsync,
      isCreating: createJobMutation.isPending,
      createError: createJobMutation.error as Error | null,

      updateJob: updateJobMutation.mutateAsync,
      isUpdating: updateJobMutation.isPending,
      updateError: updateJobMutation.error as Error | null,

      // Utils
      refetch: refresh,
      query: jobsQuery,
    }),
    [
      jobsQuery,
      createJobMutation.mutateAsync,
      createJobMutation.isPending,
      createJobMutation.error,
      updateJobMutation.mutateAsync,
      updateJobMutation.isPending,
      updateJobMutation.error,
      refresh,
    ]
  )
}

// Hook for fetching a single job
export function useJob(jobId: string | null) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()

  const fetchJob = useCallback(async (): Promise<Job | null> => {
    if (!accessToken || !jobId) {
      return null
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    if (response.status === 404) {
      throw new Error('작업을 찾을 수 없습니다.')
    }

    if (!response.ok) {
      throw new Error('작업 정보를 불러오지 못했습니다.')
    }

    const data = (await response.json()) as JobApiResponse
    return mapJob(data)
  }, [accessToken, jobId])

  const jobQuery: UseQueryResult<Job | null> = useQuery({
    queryKey: ['jobs', jobId],
    queryFn: fetchJob,
    enabled: Boolean(accessToken && jobId),
    refetchInterval: (query) => {
      // Poll every 5 seconds if job is in progress
      const job = query.state.data
      if (
        job &&
        ['queued', 'generating', 'rendering', 'uploading'].includes(job.status)
      ) {
        return 5000
      }
      return false
    },
  })

  const refresh = useCallback(() => {
    if (jobId) {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] }).catch(() => {})
    }
  }, [queryClient, jobId])

  return useMemo(
    () => ({
      job: jobQuery.data ?? null,
      isLoading: jobQuery.isLoading,
      isFetching: jobQuery.isFetching,
      isError: jobQuery.isError,
      error: jobQuery.error as Error | null,
      refetch: refresh,
      query: jobQuery,
    }),
    [jobQuery, refresh]
  )
}
