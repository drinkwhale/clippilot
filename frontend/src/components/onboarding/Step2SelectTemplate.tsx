"use client";

import { useState } from "react";
import { Layout, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTemplates } from "@/lib/hooks/useTemplates";
import { cn } from "@/lib/utils";

interface Step2SelectTemplateProps {
  onNext: () => void;
}

export function Step2SelectTemplate({ onNext }: Step2SelectTemplateProps) {
  const { templates, isLoading } = useTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );

  // 기본 시스템 템플릿 3개만 표시
  const systemTemplates =
    templates?.filter((t) => t.isSystemDefault).slice(0, 3) || [];

  const handleContinue = () => {
    if (selectedTemplateId) {
      // 선택된 템플릿을 로컬 스토리지에 저장 (프로젝트 생성 시 사용)
      localStorage.setItem("onboarding_selected_template", selectedTemplateId);
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20">
          <Layout className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">템플릿 선택</h3>
          <p className="text-sm text-muted-foreground mt-2">
            브랜드에 맞는 템플릿을 선택하여 일관된 스타일의 영상을 만드세요
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            템플릿을 불러오는 중...
          </div>
        ) : systemTemplates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            사용 가능한 템플릿이 없습니다.
          </div>
        ) : (
          <RadioGroup
            value={selectedTemplateId || undefined}
            onValueChange={setSelectedTemplateId}
            className="space-y-3"
          >
            {systemTemplates.map((template) => (
              <Card
                key={template.id}
                className={cn(
                  "relative cursor-pointer transition-all hover:border-primary",
                  selectedTemplateId === template.id &&
                    "border-primary bg-primary/5"
                )}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <Label
                  htmlFor={template.id}
                  className="flex items-start gap-4 p-4 cursor-pointer"
                >
                  <RadioGroupItem value={template.id} id={template.id} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{template.name}</h4>
                      {template.isSystemDefault && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded">
                          추천
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>

                    {/* 템플릿 설정 미리보기 */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {template.brandConfig && (
                        <>
                          {template.brandConfig.fonts && (
                            <span className="inline-flex items-center px-2 py-1 text-xs bg-muted rounded">
                              폰트: {template.brandConfig.fonts.title}
                            </span>
                          )}
                          {template.brandConfig.colors && (
                            <span className="inline-flex items-center px-2 py-1 text-xs bg-muted rounded">
                              색상:{" "}
                              <span
                                className="inline-block w-3 h-3 ml-1 rounded-full border"
                                style={{
                                  backgroundColor:
                                    template.brandConfig.colors.primary,
                                }}
                              />
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {selectedTemplateId === template.id && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </Label>
              </Card>
            ))}
          </RadioGroup>
        )}

        <div className="pt-4 space-y-2">
          <Button
            onClick={handleContinue}
            disabled={!selectedTemplateId}
            className="w-full"
            size="lg"
          >
            선택 완료
          </Button>
          <Button
            onClick={onNext}
            variant="ghost"
            className="w-full"
            size="lg"
          >
            템플릿 없이 계속하기
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          나중에 설정에서 템플릿을 추가하거나 수정할 수 있습니다
        </p>
      </div>
    </div>
  );
}
