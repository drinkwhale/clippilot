/**
 * TemplateList component
 * Displays list of user templates and system default templates
 */

'use client'

import { useState } from 'react'
import { Trash2, Edit, Copy, CheckCircle } from 'lucide-react'

import { useTemplates, type Template } from '@/lib/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TemplateListProps {
  onSelectTemplate?: (template: Template) => void
  onEditTemplate?: (template: Template) => void
  selectedTemplateId?: string | null
}

export function TemplateList({
  onSelectTemplate,
  onEditTemplate,
  selectedTemplateId,
}: TemplateListProps) {
  const {
    templates,
    isLoading,
    isError,
    error,
    deleteTemplate,
    isDeleting,
  } = useTemplates(true) // 시스템 템플릿 포함

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (templateId: string) => {
    if (!confirm('정말로 이 템플릿을 삭제하시겠습니까?')) {
      return
    }

    setDeletingId(templateId)
    try {
      await deleteTemplate(templateId)
    } catch (error) {
      console.error('템플릿 삭제 실패:', error)
      alert('템플릿 삭제에 실패했습니다')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-muted-foreground">템플릿 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          템플릿을 불러오는데 실패했습니다: {error?.message}
        </p>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">템플릿이 없습니다</p>
        <p className="mt-1 text-sm text-muted-foreground">
          새 템플릿을 생성하여 브랜드 설정을 저장하세요
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplateId === template.id
                ? 'ring-2 ring-primary'
                : ''
            }`}
            onClick={() => onSelectTemplate?.(template)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.description && (
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  )}
                </div>
                {selectedTemplateId === template.id && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="mt-2 flex gap-2">
                {template.is_system_default && (
                  <Badge variant="secondary">시스템 템플릿</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* 색상 프리뷰 */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  브랜드 색상
                </p>
                <div className="flex gap-2">
                  {template.brand_config_json.colors.primary && (
                    <div
                      className="h-8 w-8 rounded border"
                      style={{
                        backgroundColor: template.brand_config_json.colors.primary,
                      }}
                      title="Primary"
                    />
                  )}
                  {template.brand_config_json.colors.secondary && (
                    <div
                      className="h-8 w-8 rounded border"
                      style={{
                        backgroundColor: template.brand_config_json.colors.secondary,
                      }}
                      title="Secondary"
                    />
                  )}
                  {template.brand_config_json.colors.accent && (
                    <div
                      className="h-8 w-8 rounded border"
                      style={{
                        backgroundColor: template.brand_config_json.colors.accent,
                      }}
                      title="Accent"
                    />
                  )}
                </div>
              </div>

              {/* 액션 버튼 (시스템 템플릿이 아닌 경우만) */}
              {!template.is_system_default && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditTemplate?.(template)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(template.id)
                    }}
                    disabled={deletingId === template.id}
                  >
                    {deletingId === template.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
