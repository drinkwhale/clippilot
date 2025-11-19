/**
 * Project Create Page
 * Form for creating new content generation jobs with prompts
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useJobs } from '@/lib/hooks/useJobs'
import { useTemplates, type Template } from '@/lib/hooks/useTemplates'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function NewProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { createJob, isCreating } = useJobs()
  const { templates, isLoading: isLoadingTemplates } = useTemplates(true)

  const [prompt, setPrompt] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (prompt.trim().length < 10) {
      toast({
        title: '입력 오류',
        description: '프롬프트는 최소 10자 이상 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (prompt.trim().length > 2000) {
      toast({
        title: '입력 오류',
        description: '프롬프트는 최대 2000자까지 입력 가능합니다.',
        variant: 'destructive',
      })
      return
    }

    try {
      const job = await createJob({
        prompt: prompt.trim(),
        templateId: selectedTemplateId || undefined,
      })

      toast({
        title: '작업 생성 완료',
        description: '콘텐츠 생성이 시작되었습니다.',
      })

      router.push(`/projects/${job.id}`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '작업 생성 중 오류가 발생했습니다.'

      toast({
        title: '작업 생성 실패',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleCancel = () => {
    router.push('/projects')
  }

  const charCount = prompt.length
  const isValid = charCount >= 10 && charCount <= 2000

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">새 프로젝트 생성</h1>
        <p className="mt-2 text-muted-foreground">
          AI가 자동으로 스크립트, 자막, 메타데이터를 생성합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="template">템플릿 (선택)</Label>
          <Select
            value={selectedTemplateId || undefined}
            onValueChange={(value) => setSelectedTemplateId(value)}
            disabled={isCreating || isLoadingTemplates}
          >
            <SelectTrigger>
              <SelectValue placeholder="템플릿을 선택하세요 (선택사항)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">템플릿 사용 안 함</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                  {template.isSystemDefault && ' (시스템 템플릿)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            템플릿을 선택하면 브랜드 색상 및 폰트가 자동으로 적용됩니다
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">
            프롬프트 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="prompt"
            placeholder="예: 30초 분량의 아이폰 15 Pro 리뷰 숏폼 영상을 만들어줘"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[200px] resize-none"
            disabled={isCreating}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              10자 이상 2000자 이하로 입력해주세요
            </span>
            <span
              className={`font-medium ${
                !isValid && charCount > 0
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              {charCount} / 2000
            </span>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-2 font-semibold">생성 내용</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✅ 30초 분량 스크립트 (약 75단어)</li>
            <li>✅ SRT 형식 자막 파일</li>
            <li>✅ YouTube 메타데이터 (제목, 설명, 태그)</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={!isValid || isCreating} className="flex-1">
            {isCreating ? '생성 중...' : '생성 시작'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isCreating}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  )
}
