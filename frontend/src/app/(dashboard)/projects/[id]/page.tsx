/**
 * Project Detail Page
 * View and edit job details (script, subtitle, metadata)
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useJob, useJobs } from '@/lib/hooks/useJobs'
import { ScriptEditor } from '@/components/editor/ScriptEditor'
import { SubtitleEditor } from '@/components/editor/SubtitleEditor'
import { MetadataEditor } from '@/components/editor/MetadataEditor'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

type JobStatus = 'queued' | 'generating' | 'rendering' | 'uploading' | 'done' | 'failed'

const STATUS_LABELS: Record<JobStatus, string> = {
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

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const { job, isLoading, isError, error, isFetching } = useJob(params.id)
  const { updateJob, isUpdating } = useJobs()

  const [localScript, setLocalScript] = useState('')
  const [localSrt, setLocalSrt] = useState('')
  const [localMetadata, setLocalMetadata] = useState<{
    title?: string
    description?: string
    tags?: string[]
  } | null>(null)

  // Initialize local state when job loads
  if (job && !localScript && job.script) {
    setLocalScript(job.script)
  }
  if (job && !localSrt && job.srt) {
    setLocalSrt(job.srt)
  }
  if (job && !localMetadata && job.metadata) {
    setLocalMetadata(job.metadata)
  }

  const handleSaveScript = async () => {
    if (!job) return

    try {
      await updateJob({
        jobId: job.id,
        updates: { script: localScript },
      })

      toast({
        title: '저장 완료',
        description: '스크립트가 저장되었습니다.',
      })
    } catch (error) {
      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      })
    }
  }

  const handleSaveSubtitle = async () => {
    if (!job) return

    try {
      await updateJob({
        jobId: job.id,
        updates: { srt: localSrt },
      })

      toast({
        title: '저장 완료',
        description: '자막이 저장되었습니다.',
      })
    } catch (error) {
      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      })
    }
  }

  const handleSaveMetadata = async () => {
    if (!job || !localMetadata) return

    try {
      await updateJob({
        jobId: job.id,
        updates: { metadata: localMetadata },
      })

      toast({
        title: '저장 완료',
        description: '메타데이터가 저장되었습니다.',
      })
    } catch (error) {
      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="container py-10">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">오류 발생</p>
          </div>
          <p className="mt-2">{error?.message ?? '프로젝트를 찾을 수 없습니다'}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const isInProgress = ['queued', 'generating', 'rendering', 'uploading'].includes(
    job.status
  )

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={STATUS_VARIANTS[job.status]}>
                {STATUS_LABELS[job.status]}
              </Badge>
              {isFetching && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {job.metadata?.title || '제목 없음'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(job.createdAt), {
                addSuffix: true,
                locale: ko,
              })}
            </p>
          </div>
        </div>
      </div>

      {job.errorMessage && (
        <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="font-semibold text-destructive">오류 발생</p>
          <p className="mt-1 text-sm">{job.errorMessage}</p>
        </div>
      )}

      {isInProgress && (
        <div className="mb-6 rounded-lg border bg-muted/50 p-4">
          <p className="font-semibold">진행 중</p>
          <p className="mt-1 text-sm text-muted-foreground">
            콘텐츠 생성이 진행 중입니다. 잠시만 기다려주세요...
          </p>
        </div>
      )}

      <div className="rounded-lg border bg-muted/50 p-4 mb-6">
        <p className="text-sm font-semibold mb-1">프롬프트</p>
        <p className="text-sm text-muted-foreground">{job.prompt}</p>
      </div>

      <Tabs defaultValue="script" className="space-y-6">
        <TabsList>
          <TabsTrigger value="script">스크립트</TabsTrigger>
          <TabsTrigger value="subtitle">자막</TabsTrigger>
          <TabsTrigger value="metadata">메타데이터</TabsTrigger>
        </TabsList>

        <TabsContent value="script" className="space-y-4">
          <ScriptEditor
            value={job.script ?? ''}
            onChange={setLocalScript}
            onSave={handleSaveScript}
            isSaving={isUpdating}
            readOnly={isInProgress}
          />
        </TabsContent>

        <TabsContent value="subtitle" className="space-y-4">
          <SubtitleEditor
            value={job.srt ?? ''}
            onChange={setLocalSrt}
            onSave={handleSaveSubtitle}
            isSaving={isUpdating}
            readOnly={isInProgress}
          />
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4">
          <MetadataEditor
            value={job.metadata}
            onChange={setLocalMetadata}
            onSave={handleSaveMetadata}
            isSaving={isUpdating}
            readOnly={isInProgress}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
