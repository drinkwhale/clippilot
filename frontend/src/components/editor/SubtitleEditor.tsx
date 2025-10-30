/**
 * Subtitle Editor Component
 * Editable textarea for SRT subtitle with format validation
 */

'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface SubtitleEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: () => void
  isSaving?: boolean
  readOnly?: boolean
}

export function SubtitleEditor({
  value,
  onChange,
  onSave,
  isSaving = false,
  readOnly = false,
}: SubtitleEditorProps) {
  const [localValue, setLocalValue] = useState(value)
  const [hasChanges, setHasChanges] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    setLocalValue(value)
    setHasChanges(false)
    setValidationError(null)
  }, [value])

  const validateSRT = (srt: string): string | null => {
    if (!srt.trim()) {
      return null // Empty is okay (not generated yet)
    }

    // Basic SRT format validation
    const blocks = srt.split('\n\n').filter((block) => block.trim())

    for (let i = 0; i < blocks.length; i++) {
      const lines = blocks[i].split('\n')

      // Must have at least 3 lines: number, timestamp, text
      if (lines.length < 3) {
        return `블록 ${i + 1}: SRT 형식이 올바르지 않습니다 (최소 3줄 필요)`
      }

      // First line should be a number
      if (!/^\d+$/.test(lines[0].trim())) {
        return `블록 ${i + 1}: 첫 줄은 숫자여야 합니다`
      }

      // Second line should be timestamp
      if (!/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/.test(lines[1].trim())) {
        return `블록 ${i + 1}: 타임스탬프 형식이 올바르지 않습니다 (HH:MM:SS,mmm --> HH:MM:SS,mmm)`
      }
    }

    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    setHasChanges(newValue !== value)

    // Validate on change
    const error = validateSRT(newValue)
    setValidationError(error)

    onChange(newValue)
  }

  const handleSave = () => {
    if (validationError) {
      return
    }

    if (onSave && hasChanges) {
      onSave()
      setHasChanges(false)
    }
  }

  const handleReset = () => {
    setLocalValue(value)
    setHasChanges(false)
    setValidationError(null)
    onChange(value)
  }

  const blockCount = localValue
    .split('\n\n')
    .filter((block) => block.trim()).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="subtitle-editor" className="text-base font-semibold">
          자막 (SRT)
        </Label>
        <div className="text-sm text-muted-foreground">{blockCount} 블록</div>
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <Textarea
        id="subtitle-editor"
        value={localValue}
        onChange={handleChange}
        disabled={readOnly || isSaving}
        className="min-h-[400px] resize-none font-mono text-sm"
        placeholder={`자막이 생성되면 여기에 표시됩니다...

SRT 형식 예시:
1
00:00:00,000 --> 00:00:03,000
첫 번째 자막 텍스트

2
00:00:03,000 --> 00:00:06,000
두 번째 자막 텍스트`}
      />

      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        <p>
          💡 <strong>SRT 형식:</strong> 각 블록은 번호, 타임스탬프, 텍스트 순서로
          구성되며 빈 줄로 구분됩니다.
        </p>
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || Boolean(validationError)}
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
