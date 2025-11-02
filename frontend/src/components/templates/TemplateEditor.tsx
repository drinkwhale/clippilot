/**
 * TemplateEditor component
 * Modal for creating/editing templates
 */

'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

import { useTemplates, type Template, type BrandConfig } from '@/lib/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TemplateEditorProps {
  isOpen: boolean
  onClose: () => void
  template?: Template | null
}

export function TemplateEditor({
  isOpen,
  onClose,
  template,
}: TemplateEditorProps) {
  const { createTemplate, updateTemplate, isCreating, isUpdating } = useTemplates()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    primaryColor: '#FF6B6B',
    secondaryColor: '#4ECDC4',
    accentColor: '#FFE66D',
    backgroundColor: '#FFFFFF',
    textColor: '#2C3E50',
    titleFont: 'Noto Sans KR',
    bodyFont: 'Noto Sans KR',
    subtitleFont: 'Noto Sans KR',
    watermarkPosition: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    watermarkOpacity: 0.7,
  })

  // Load template data when editing
  useEffect(() => {
    if (template) {
      const config = template.brand_config_json
      setFormData({
        name: template.name,
        description: template.description || '',
        primaryColor: config.colors.primary || '#FF6B6B',
        secondaryColor: config.colors.secondary || '#4ECDC4',
        accentColor: config.colors.accent || '#FFE66D',
        backgroundColor: config.colors.background || '#FFFFFF',
        textColor: config.colors.text || '#2C3E50',
        titleFont: config.fonts.title || 'Noto Sans KR',
        bodyFont: config.fonts.body || 'Noto Sans KR',
        subtitleFont: config.fonts.subtitle || 'Noto Sans KR',
        watermarkPosition: config.watermark_position || 'bottom-right',
        watermarkOpacity: config.watermark_opacity || 0.7,
      })
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        description: '',
        primaryColor: '#FF6B6B',
        secondaryColor: '#4ECDC4',
        accentColor: '#FFE66D',
        backgroundColor: '#FFFFFF',
        textColor: '#2C3E50',
        titleFont: 'Noto Sans KR',
        bodyFont: 'Noto Sans KR',
        subtitleFont: 'Noto Sans KR',
        watermarkPosition: 'bottom-right',
        watermarkOpacity: 0.7,
      })
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const brandConfig: BrandConfig = {
      colors: {
        primary: formData.primaryColor,
        secondary: formData.secondaryColor,
        accent: formData.accentColor,
        background: formData.backgroundColor,
        text: formData.textColor,
      },
      fonts: {
        title: formData.titleFont,
        body: formData.bodyFont,
        subtitle: formData.subtitleFont,
      },
      watermark_position: formData.watermarkPosition,
      watermark_opacity: formData.watermarkOpacity,
    }

    try {
      if (template) {
        // Update existing template
        await updateTemplate(template.id, {
          name: formData.name,
          description: formData.description || undefined,
          brand_config_json: brandConfig,
        })
      } else {
        // Create new template
        await createTemplate({
          name: formData.name,
          description: formData.description || undefined,
          brand_config_json: brandConfig,
        })
      }

      onClose()
    } catch (error) {
      console.error('템플릿 저장 실패:', error)
      alert('템플릿 저장에 실패했습니다')
    }
  }

  const isSubmitting = isCreating || isUpdating

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {template ? '템플릿 수정' : '새 템플릿 생성'}
          </DialogTitle>
          <DialogDescription>
            브랜드 아이덴티티를 템플릿으로 저장하고 재사용하세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">템플릿 이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 브랜드 템플릿 A"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="템플릿에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>
          </div>

          {/* 브랜드 색상 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">브랜드 색상</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">주요 색상 *</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="h-10 w-16"
                  />
                  <Input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#FF6B6B"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondaryColor">보조 색상</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="h-10 w-16"
                  />
                  <Input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    placeholder="#4ECDC4"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accentColor">강조 색상</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="h-10 w-16"
                  />
                  <Input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    placeholder="#FFE66D"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="textColor">텍스트 색상</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    className="h-10 w-16"
                  />
                  <Input
                    type="text"
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    placeholder="#2C3E50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 브랜드 폰트 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">브랜드 폰트</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="titleFont">제목 폰트 *</Label>
                <Input
                  id="titleFont"
                  value={formData.titleFont}
                  onChange={(e) => setFormData({ ...formData, titleFont: e.target.value })}
                  placeholder="Noto Sans KR"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bodyFont">본문 폰트 *</Label>
                <Input
                  id="bodyFont"
                  value={formData.bodyFont}
                  onChange={(e) => setFormData({ ...formData, bodyFont: e.target.value })}
                  placeholder="Noto Sans KR"
                  required
                />
              </div>
            </div>
          </div>

          {/* 워터마크 설정 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">워터마크 설정</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="watermarkPosition">워터마크 위치</Label>
                <select
                  id="watermarkPosition"
                  value={formData.watermarkPosition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      watermarkPosition: e.target.value as any,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="top-left">왼쪽 위</option>
                  <option value="top-right">오른쪽 위</option>
                  <option value="bottom-left">왼쪽 아래</option>
                  <option value="bottom-right">오른쪽 아래</option>
                </select>
              </div>

              <div>
                <Label htmlFor="watermarkOpacity">
                  워터마크 투명도: {formData.watermarkOpacity}
                </Label>
                <input
                  id="watermarkOpacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.watermarkOpacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      watermarkOpacity: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  {template ? '수정 중...' : '생성 중...'}
                </>
              ) : (
                <>{template ? '수정' : '생성'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
