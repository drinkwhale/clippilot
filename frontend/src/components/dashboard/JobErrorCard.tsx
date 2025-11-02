"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

interface JobErrorCardProps {
  jobId: string;
  errorMessage: string;
  retryCount: number;
  maxRetries?: number;
  onRetry?: () => void;
}

/**
 * Job Error Card
 *
 * 작업 실패 시 오류 메시지와 재시도 옵션을 표시하는 컴포넌트 (FR-028, FR-029)
 */
export function JobErrorCard({
  jobId,
  errorMessage,
  retryCount,
  maxRetries = 3,
  onRetry,
}: JobErrorCardProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);

      const response = await fetch(`/api/jobs/${jobId}/retry`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "재시도 실패");
      }

      onRetry?.();
    } catch (error) {
      console.error("Failed to retry:", error);
      alert(
        error instanceof Error ? error.message : "재시도 중 오류가 발생했습니다"
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const canRetry = retryCount < maxRetries;

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          작업 실패
        </CardTitle>
        <CardDescription>
          작업 처리 중 오류가 발생했습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-white p-4">
          <p className="text-sm text-gray-700">{errorMessage}</p>
        </div>

        {retryCount > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            재시도 횟수: {retryCount} / {maxRetries}
          </p>
        )}
      </CardContent>
      {canRetry && (
        <CardFooter>
          <Button
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRetrying ? "animate-spin" : ""}`}
            />
            {isRetrying ? "재시도 중..." : "다시 시도"}
          </Button>
        </CardFooter>
      )}
      {!canRetry && (
        <CardFooter>
          <p className="text-sm text-gray-500">
            최대 재시도 횟수를 초과했습니다. 지원팀에 문의해주세요.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
