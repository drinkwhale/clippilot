/**
 * TemplatePreview component
 * Shows visual preview of template colors and fonts
 */

'use client'

import { type Template } from '@/lib/hooks/useTemplates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TemplatePreviewProps {
  template: Template | null
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  if (!template) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>템플릿 미리보기</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            템플릿을 선택하여 미리보기를 확인하세요
          </p>
        </CardContent>
      </Card>
    )
  }

  const config = template.brandConfig

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>{template.name}</CardTitle>
          {template.isSystemDefault && (
            <Badge variant="secondary">시스템 템플릿</Badge>
          )}
        </div>
        {template.description && (
          <p className="text-sm text-muted-foreground">{template.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 색상 팔레트 */}
        <div>
          <h3 className="mb-3 text-sm font-medium">색상 팔레트</h3>
          <div className="grid grid-cols-5 gap-3">
            {config.colors.primary && (
              <div>
                <div
                  className="aspect-square rounded-lg border shadow-sm"
                  style={{ backgroundColor: config.colors.primary }}
                />
                <p className="mt-1 text-xs text-muted-foreground">Primary</p>
                <p className="text-xs font-mono">{config.colors.primary}</p>
              </div>
            )}
            {config.colors.secondary && (
              <div>
                <div
                  className="aspect-square rounded-lg border shadow-sm"
                  style={{ backgroundColor: config.colors.secondary }}
                />
                <p className="mt-1 text-xs text-muted-foreground">Secondary</p>
                <p className="text-xs font-mono">{config.colors.secondary}</p>
              </div>
            )}
            {config.colors.accent && (
              <div>
                <div
                  className="aspect-square rounded-lg border shadow-sm"
                  style={{ backgroundColor: config.colors.accent }}
                />
                <p className="mt-1 text-xs text-muted-foreground">Accent</p>
                <p className="text-xs font-mono">{config.colors.accent}</p>
              </div>
            )}
            {config.colors.background && (
              <div>
                <div
                  className="aspect-square rounded-lg border shadow-sm"
                  style={{ backgroundColor: config.colors.background }}
                />
                <p className="mt-1 text-xs text-muted-foreground">Background</p>
                <p className="text-xs font-mono">{config.colors.background}</p>
              </div>
            )}
            {config.colors.text && (
              <div>
                <div
                  className="aspect-square rounded-lg border shadow-sm"
                  style={{ backgroundColor: config.colors.text }}
                />
                <p className="mt-1 text-xs text-muted-foreground">Text</p>
                <p className="text-xs font-mono">{config.colors.text}</p>
              </div>
            )}
          </div>
        </div>

        {/* 폰트 설정 */}
        <div>
          <h3 className="mb-3 text-sm font-medium">폰트</h3>
          <div className="space-y-2">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">제목 폰트</p>
              <p
                className="text-lg font-bold"
                style={{ fontFamily: config.fonts.title }}
              >
                {config.fonts.title}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">본문 폰트</p>
              <p style={{ fontFamily: config.fonts.body }}>
                {config.fonts.body}
              </p>
            </div>
            {config.fonts.subtitle && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">자막 폰트</p>
                <p
                  className="text-sm"
                  style={{ fontFamily: config.fonts.subtitle }}
                >
                  {config.fonts.subtitle}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 워터마크 설정 */}
        {(config.watermark_position || config.watermark_opacity !== undefined) && (
          <div>
            <h3 className="mb-3 text-sm font-medium">워터마크 설정</h3>
            <div className="space-y-2">
              {config.watermark_position && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">위치</p>
                  <p className="text-sm font-medium">
                    {config.watermark_position === 'top-left' && '왼쪽 위'}
                    {config.watermark_position === 'top-right' && '오른쪽 위'}
                    {config.watermark_position === 'bottom-left' && '왼쪽 아래'}
                    {config.watermark_position === 'bottom-right' && '오른쪽 아래'}
                  </p>
                </div>
              )}
              {config.watermark_opacity !== undefined && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">투명도</p>
                  <p className="text-sm font-medium">
                    {(config.watermark_opacity * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 미디어 파일 */}
        {(config.intro_video_url || config.outro_video_url || config.watermark_url) && (
          <div>
            <h3 className="mb-3 text-sm font-medium">미디어 파일</h3>
            <div className="space-y-2">
              {config.intro_video_url && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">인트로 영상</p>
                  <p className="mt-1 truncate text-xs font-mono">
                    {config.intro_video_url}
                  </p>
                </div>
              )}
              {config.outro_video_url && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">아웃트로 영상</p>
                  <p className="mt-1 truncate text-xs font-mono">
                    {config.outro_video_url}
                  </p>
                </div>
              )}
              {config.watermark_url && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">워터마크 이미지</p>
                  <p className="mt-1 truncate text-xs font-mono">
                    {config.watermark_url}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
