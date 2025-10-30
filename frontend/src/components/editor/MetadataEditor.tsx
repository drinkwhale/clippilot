/**
 * Metadata Editor Component
 * Edit YouTube metadata (title, description, tags)
 */

'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface Metadata {
  title?: string
  description?: string
  tags?: string[]
}

interface MetadataEditorProps {
  value: Metadata | null
  onChange: (value: Metadata) => void
  onSave?: () => void
  isSaving?: boolean
  readOnly?: boolean
}

export function MetadataEditor({
  value,
  onChange,
  onSave,
  isSaving = false,
  readOnly = false,
}: MetadataEditorProps) {
  const [localMetadata, setLocalMetadata] = useState<Metadata>(
    value ?? { title: '', description: '', tags: [] }
  )
  const [tagInput, setTagInput] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalMetadata(value ?? { title: '', description: '', tags: [] })
    setHasChanges(false)
  }, [value])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    const updated = { ...localMetadata, title: newTitle }
    setLocalMetadata(updated)
    setHasChanges(true)
    onChange(updated)
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value
    const updated = { ...localMetadata, description: newDescription }
    setLocalMetadata(updated)
    setHasChanges(true)
    onChange(updated)
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (!trimmedTag) return

    const currentTags = localMetadata.tags ?? []
    if (currentTags.includes(trimmedTag)) {
      return // Duplicate tag
    }

    const updated = {
      ...localMetadata,
      tags: [...currentTags, trimmedTag],
    }
    setLocalMetadata(updated)
    setTagInput('')
    setHasChanges(true)
    onChange(updated)
  }

  const handleRemoveTag = (tag: string) => {
    const updated = {
      ...localMetadata,
      tags: (localMetadata.tags ?? []).filter((t) => t !== tag),
    }
    setLocalMetadata(updated)
    setHasChanges(true)
    onChange(updated)
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = () => {
    if (onSave && hasChanges) {
      onSave()
      setHasChanges(false)
    }
  }

  const handleReset = () => {
    setLocalMetadata(value ?? { title: '', description: '', tags: [] })
    setTagInput('')
    setHasChanges(false)
    onChange(value ?? { title: '', description: '', tags: [] })
  }

  const titleLength = localMetadata.title?.length ?? 0
  const descriptionLength = localMetadata.description?.length ?? 0
  const tagCount = localMetadata.tags?.length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title-input" className="text-base font-semibold">
          제목
        </Label>
        <p className="mb-2 text-sm text-muted-foreground">
          YouTube 동영상 제목 (최대 50자 권장)
        </p>
        <Input
          id="title-input"
          value={localMetadata.title ?? ''}
          onChange={handleTitleChange}
          disabled={readOnly || isSaving}
          placeholder="클릭을 유도하는 제목을 입력하세요"
          maxLength={100}
        />
        <div className="mt-1 text-right text-sm text-muted-foreground">
          {titleLength} / 100
        </div>
      </div>

      <div>
        <Label htmlFor="description-input" className="text-base font-semibold">
          설명
        </Label>
        <p className="mb-2 text-sm text-muted-foreground">
          YouTube 동영상 설명 (최대 200자 권장)
        </p>
        <Textarea
          id="description-input"
          value={localMetadata.description ?? ''}
          onChange={handleDescriptionChange}
          disabled={readOnly || isSaving}
          placeholder="SEO 최적화된 설명을 입력하세요"
          className="min-h-[120px] resize-none"
          maxLength={5000}
        />
        <div className="mt-1 text-right text-sm text-muted-foreground">
          {descriptionLength} / 5000
        </div>
      </div>

      <div>
        <Label htmlFor="tag-input" className="text-base font-semibold">
          태그
        </Label>
        <p className="mb-2 text-sm text-muted-foreground">
          검색 최적화를 위한 태그 (3-10개 권장)
        </p>

        {!readOnly && (
          <div className="mb-3 flex gap-2">
            <Input
              id="tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              disabled={isSaving || tagCount >= 10}
              placeholder="태그 입력 후 Enter"
              maxLength={30}
            />
            <Button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || isSaving || tagCount >= 10}
            >
              추가
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(localMetadata.tags ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">태그가 없습니다</p>
          ) : (
            (localMetadata.tags ?? []).map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={isSaving}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))
          )}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {tagCount} / 10 태그
        </div>
      </div>

      {!readOnly && (
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex-1"
          >
            {isSaving ? '저장 중...' : '변경사항 저장'}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
          >
            초기화
          </Button>
        </div>
      )}
    </div>
  )
}
