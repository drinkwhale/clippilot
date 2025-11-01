"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface RenderProgressProps {
  jobId: string;
  status: "queued" | "generating" | "rendering" | "uploading" | "done" | "failed";
  progress?: number;
  message?: string;
}

const STATUS_LABELS = {
  queued: "대기 중",
  generating: "콘텐츠 생성 중",
  rendering: "영상 렌더링 중",
  uploading: "YouTube 업로드 중",
  done: "완료",
  failed: "실패",
};

const STATUS_COLORS = {
  queued: "text-gray-500",
  generating: "text-blue-500",
  rendering: "text-purple-500",
  uploading: "text-green-500",
  done: "text-green-600",
  failed: "text-red-600",
};

/**
 * Render Progress Bar
 *
 * 렌더링 진행률을 표시하는 컴포넌트 (FR-020)
 * 실시간으로 진행 상태를 폴링하여 업데이트합니다.
 */
export function RenderProgress({
  jobId,
  status,
  progress = 0,
  message,
}: RenderProgressProps) {
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [statusMessage, setStatusMessage] = useState(message);

  useEffect(() => {
    // 작업이 진행 중이면 폴링 시작
    if (
      status === "generating" ||
      status === "rendering" ||
      status === "uploading"
    ) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/jobs/${jobId}`);
          if (response.ok) {
            const job = await response.json();
            setCurrentStatus(job.status);
            setCurrentProgress(
              job.metadata_json?.render_progress || currentProgress
            );
            setStatusMessage(job.metadata_json?.render_message || message);

            // 완료되면 폴링 중지
            if (job.status === "done" || job.status === "failed") {
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error("Failed to fetch job status:", error);
        }
      }, 2000); // 2초마다 폴링

      return () => clearInterval(interval);
    }
  }, [jobId, status, currentProgress, message]);

  const getStatusIcon = () => {
    switch (currentStatus) {
      case "done":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    }
  };

  const progressPercentage = Math.round(currentProgress * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={STATUS_COLORS[currentStatus]}>
            {STATUS_LABELS[currentStatus]}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentStatus !== "done" && currentStatus !== "failed" && (
          <>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-sm text-gray-600">
              {progressPercentage}% 완료
            </p>
          </>
        )}

        {statusMessage && (
          <p className="text-sm text-gray-500">{statusMessage}</p>
        )}

        {currentStatus === "queued" && (
          <p className="text-sm text-gray-500">
            대기열에 등록되었습니다. 곧 처리가 시작됩니다.
          </p>
        )}

        {currentStatus === "generating" && (
          <p className="text-sm text-gray-500">
            AI가 스크립트와 자막을 생성하고 있습니다...
          </p>
        )}

        {currentStatus === "rendering" && (
          <p className="text-sm text-gray-500">
            영상을 렌더링하고 있습니다. 최대 3분 소요됩니다...
          </p>
        )}

        {currentStatus === "uploading" && (
          <p className="text-sm text-gray-500">
            YouTube에 업로드하고 있습니다...
          </p>
        )}

        {currentStatus === "done" && (
          <p className="text-sm text-green-600 font-medium">
            모든 작업이 완료되었습니다! 🎉
          </p>
        )}

        {currentStatus === "failed" && (
          <p className="text-sm text-red-600 font-medium">
            작업 처리 중 오류가 발생했습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
