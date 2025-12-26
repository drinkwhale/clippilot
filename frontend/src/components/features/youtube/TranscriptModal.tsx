/**
 * 자막 수집 결과 표시 모달 컴포넌트
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, Copy, CheckCircle } from "lucide-react";
import { transcribeVideoAudio } from "@/lib/api/youtube";
import type { YouTubeVideo } from "@/lib/api/youtube";
import type { TranscriptResponse } from "@/lib/api/youtube";

interface TranscriptModalProps {
  video: YouTubeVideo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TranscriptModal({
  video,
  open,
  onOpenChange,
}: TranscriptModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // 모달이 열릴 때 자막 수집 시작
  const handleOpenChange = async (newOpen: boolean) => {
    onOpenChange(newOpen);

    if (newOpen && video && !transcript) {
      await fetchTranscript();
    }

    // 모달이 닫힐 때 상태 초기화
    if (!newOpen) {
      setTranscript(null);
      setError(null);
      setCopied(false);
    }
  };

  const fetchTranscript = async () => {
    if (!video) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await transcribeVideoAudio(video.id, "ko");
      setTranscript(result);
    } catch (err: any) {
      console.error("자막 수집 실패:", err);
      setError(
        err.response?.data?.detail ||
          "자막 수집 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!transcript) return;

    try {
      await navigator.clipboard.writeText(transcript.fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  const handleDownload = () => {
    if (!transcript || !video) return;

    const blob = new Blob([transcript.fullText], {
      type: "text/plain;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${video.title.replace(/[^a-z0-9]/gi, "_")}_transcript_${transcript.language}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>영상 음성 자막 수집</DialogTitle>
          <DialogDescription>
            {video?.title || "영상의 음성을 텍스트로 변환합니다"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                <span>영상 음성을 자막으로 변환하는 중입니다...</span>
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 자막 결과 */}
          {transcript && !isLoading && (
            <div className="space-y-4">
              {/* 자막 정보 */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <p className="font-medium">언어: {transcript.language}</p>
                  <p className="text-muted-foreground">
                    {transcript.segments.length}개 세그먼트
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={copied}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        복사
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    다운로드
                  </Button>
                </div>
              </div>

              {/* 전체 텍스트 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">전체 텍스트</h4>
                <div className="p-4 bg-muted rounded-lg max-h-64 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {transcript.fullText}
                  </p>
                </div>
              </div>

              {/* 세그먼트 타임라인 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">타임라인</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transcript.segments.map((segment, index) => (
                    <div
                      key={index}
                      className="p-3 bg-muted rounded-lg flex gap-3"
                    >
                      <div className="flex-shrink-0 text-xs text-muted-foreground font-mono">
                        {formatTime(segment.start)}
                      </div>
                      <div className="text-sm flex-1">{segment.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 시간 포맷 헬퍼 (초 → MM:SS)
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
