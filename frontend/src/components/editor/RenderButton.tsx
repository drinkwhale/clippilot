"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Video } from "lucide-react";
import { useRouter } from "next/navigation";

interface RenderButtonProps {
  jobId: string;
  disabled?: boolean;
  onRenderStart?: () => void;
  onRenderComplete?: () => void;
}

/**
 * Render & Upload Button
 *
 * 렌더링 및 YouTube 업로드를 시작하는 버튼 컴포넌트
 */
export function RenderButton({
  jobId,
  disabled = false,
  onRenderStart,
  onRenderComplete,
}: RenderButtonProps) {
  const router = useRouter();
  const [isRendering, setIsRendering] = useState(false);

  const handleRender = async () => {
    try {
      setIsRendering(true);
      onRenderStart?.();

      // 렌더링 요청 API 호출
      const response = await fetch(`/api/jobs/${jobId}/render`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "렌더링 요청 실패");
      }

      const result = await response.json();
      console.log("Render started:", result);

      // 렌더링 진행 페이지로 이동
      router.push(`/dashboard/projects/${jobId}?tab=rendering`);

      onRenderComplete?.();
    } catch (error) {
      console.error("Failed to start rendering:", error);
      alert(
        error instanceof Error
          ? error.message
          : "렌더링 요청 중 오류가 발생했습니다"
      );
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <Button
      onClick={handleRender}
      disabled={disabled || isRendering}
      size="lg"
      className="w-full sm:w-auto"
    >
      {isRendering ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          렌더링 요청 중...
        </>
      ) : (
        <>
          <Video className="mr-2 h-4 w-4" />
          렌더링 & YouTube 업로드
        </>
      )}
    </Button>
  );
}
