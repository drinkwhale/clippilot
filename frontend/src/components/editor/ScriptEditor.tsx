/**
 * Script Editor Component
 * Editable textarea for video script with character count and validation
 */

'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface ScriptEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: () => void
  isSaving?: boolean
  readOnly?: boolean
}

export function ScriptEditor({
  value,
  onChange,
  onSave,
  isSaving = false,
  readOnly = false,
}: ScriptEditorProps) {
  const [localValue, setLocalValue] = useState(value)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalValue(value)
    setHasChanges(false)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    setHasChanges(newValue !== value)
    onChange(newValue)
  }

  const handleSave = () => {
    if (onSave && hasChanges) {
      onSave()
      setHasChanges(false)
    }
  }

  const handleReset = () => {
    setLocalValue(value)
    setHasChanges(false)
    onChange(value)
  }

  const charCount = localValue.length
  const lineCount = localValue.split('\n').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="script-editor" className="text-base font-semibold">
          스크립트
        </Label>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{lineCount} 줄</span>
          <span>{charCount} 자</span>
        </div>
      </div>

      <Textarea
        id="script-editor"
        value={localValue}
        onChange={handleChange}
        disabled={readOnly || isSaving}
        className="min-h-[400px] resize-none font-mono"
        placeholder="스크립트가 생성되면 여기에 표시됩니다..."
      />

      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        <p>
          💡 <strong>Tip:</strong> 각 문장을 개행으로 구분하면 자막 생성 시 더 정확한
          타이밍으로 표시됩니다.
        </p>
      </div>

      {!readOnly && (
        <div className="flex gap-2">
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
