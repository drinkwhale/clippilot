"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useJobs } from "@/lib/hooks/useJobs";

interface Step3FirstProjectProps {
  onComplete: () => void;
}

const SAMPLE_PROMPTS = [
  "최신 AI 기술 트렌드를 소개하는 1분 영상을 만들어줘",
  "건강한 아침 루틴 5가지를 소개하는 숏폼 영상을 만들어줘",
  "스마트폰 사진 잘 찍는 팁 3가지를 알려주는 영상을 만들어줘",
];

export function Step3FirstProject({ onComplete }: Step3FirstProjectProps) {
  const router = useRouter();
  const { createJob } = useJobs();
  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseSamplePrompt = (samplePrompt: string) => {
    setPrompt(samplePrompt);
  };

  const handleCreateProject = async () => {
    if (!prompt.trim()) {
      setError("프롬프트를 입력해주세요.");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      // 선택된 템플릿 가져오기
      const selectedTemplateId = localStorage.getItem(
        "onboarding_selected_template"
      );

      // 첫 프로젝트 생성
      const job = await createJob({
        prompt: prompt.trim(),
        templateId: selectedTemplateId || undefined,
      });

      // 로컬 스토리지 클리어
      localStorage.removeItem("onboarding_selected_template");

      // 온보딩 완료
      setIsCreating(false);
      onComplete();

      // 프로젝트 상세 페이지로 이동
      router.push(`/dashboard/projects/${job.id}`);
    } catch (err) {
      console.error("Failed to create project:", err);
      const fallbackMessage =
        "프로젝트 생성에 실패했습니다. 다시 시도해주세요.";
      if (err instanceof Error) {
        setError(err.message || fallbackMessage);
      } else {
        setError(fallbackMessage);
      }
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20">
          <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">첫 프로젝트 생성</h3>
          <p className="text-sm text-muted-foreground mt-2">
            AI가 자동으로 스크립트, 자막, 영상을 만드는 과정을 경험해보세요
          </p>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-3">
          <Label htmlFor="prompt">어떤 영상을 만들고 싶으신가요?</Label>
          <Textarea
            id="prompt"
            placeholder="영상 주제나 내용을 자유롭게 입력해주세요..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            또는 샘플 프롬프트 사용하기
          </Label>
          <div className="space-y-2">
            {SAMPLE_PROMPTS.map((samplePrompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-auto py-2 px-3"
                onClick={() => handleUseSamplePrompt(samplePrompt)}
              >
                <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{samplePrompt}</span>
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 pt-4">
          <Alert>
            <AlertDescription className="text-sm">
              <strong>AI가 자동으로 처리하는 작업:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>프롬프트 기반 스크립트 생성</li>
                <li>자막 파일 자동 생성 (SRT)</li>
                <li>썸네일 제목 및 설명 작성</li>
                <li>스톡 영상/이미지 자동 선택 및 합성</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleCreateProject}
            disabled={isCreating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                프로젝트 생성 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                첫 프로젝트 만들기
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            완료 후 프로젝트 상세 페이지로 이동합니다
          </p>
        </div>
      </Card>
    </div>
  );
}
