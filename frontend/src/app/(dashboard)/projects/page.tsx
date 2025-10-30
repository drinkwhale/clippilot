/**
 * Project List Page
 * Displays all user's projects (jobs) with status filtering and pagination
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useJobs } from '@/lib/hooks/useJobs'
import { Plus, Loader2, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

type JobStatus = 'queued' | 'generating' | 'rendering' | 'uploading' | 'done' | 'failed'

const STATUS_LABELS: Record<JobStatus | 'all', string> = {
  all: '전체',
  queued: '대기 중',
  generating: '생성 중',
  rendering: '렌더링 중',
  uploading: '업로드 중',
  done: '완료',
  failed: '실패',
}

const STATUS_VARIANTS: Record<
  JobStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  queued: 'secondary',
  generating: 'default',
  rendering: 'default',
  uploading: 'default',
  done: 'outline',
  failed: 'destructive',
}

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const { jobs, total, isLoading, isError, error } = useJobs({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: currentPage,
    pageSize: 20,
  })

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">프로젝트</h1>
          <p className="mt-2 text-muted-foreground">
            생성된 콘텐츠를 관리하고 편집할 수 있습니다
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            새 프로젝트
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as JobStatus | 'all')
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="queued">대기 중</SelectItem>
            <SelectItem value="generating">생성 중</SelectItem>
            <SelectItem value="done">완료</SelectItem>
            <SelectItem value="failed">실패</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground">
          총 {total}개의 프로젝트
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">오류 발생</p>
          </div>
          <p className="mt-1 text-sm">{error?.message ?? '알 수 없는 오류'}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !isError && jobs.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <p className="text-lg font-semibold">프로젝트가 없습니다</p>
          <p className="mt-2 text-sm text-muted-foreground">
            새 프로젝트를 생성하여 시작해보세요
          </p>
          <Button asChild className="mt-6">
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              새 프로젝트 생성
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && !isError && jobs.length > 0 && (
        <>
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/projects/${job.id}`}
                className="block rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant={STATUS_VARIANTS[job.status]}>
                        {STATUS_LABELS[job.status]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(job.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm">{job.prompt}</p>

                    {job.metadata && (
                      <h3 className="mt-2 font-semibold">{job.metadata.title}</h3>
                    )}

                    {job.errorMessage && (
                      <p className="mt-2 text-sm text-destructive">
                        {job.errorMessage}
                      </p>
                    )}
                  </div>

                  {job.thumbnailUrl && (
                    <img
                      src={job.thumbnailUrl}
                      alt=""
                      className="ml-4 h-20 w-36 rounded object-cover"
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                이전
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 2
                  )
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1]
                    const showGap = prev && page - prev > 1

                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showGap && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={page === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </div>
                    )
                  })}
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
