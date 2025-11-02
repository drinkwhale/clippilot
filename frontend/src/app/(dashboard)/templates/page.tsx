/**
 * Templates page
 * Manage user templates and system default templates
 */

'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { type Template } from '@/lib/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { TemplateList } from '@/components/templates/TemplateList'
import { TemplateEditor } from '@/components/templates/TemplateEditor'
import { TemplatePreview } from '@/components/templates/TemplatePreview'

export default function TemplatesPage() {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  const handleCreateNew = () => {
    setEditingTemplate(null)
    setIsEditorOpen(true)
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setIsEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setEditingTemplate(null)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">템플릿 관리</h1>
          <p className="mt-2 text-muted-foreground">
            브랜드 아이덴티티를 템플릿으로 저장하고 재사용하세요
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          새 템플릿
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 템플릿 목록 (2/3) */}
        <div className="lg:col-span-2">
          <TemplateList
            onSelectTemplate={setSelectedTemplate}
            onEditTemplate={handleEditTemplate}
            selectedTemplateId={selectedTemplate?.id}
          />
        </div>

        {/* 템플릿 미리보기 (1/3) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <TemplatePreview template={selectedTemplate} />
          </div>
        </div>
      </div>

      {/* 템플릿 에디터 모달 */}
      <TemplateEditor
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        template={editingTemplate}
      />
    </div>
  )
}
