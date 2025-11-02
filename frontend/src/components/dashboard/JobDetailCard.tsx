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
import { Download, ExternalLink, Youtube } from "lucide-react";

interface JobDetailCardProps {
  jobId: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  metadata?: {
    youtube_url?: string;
    privacy_status?: string;
  };
}

/**
 * Job Detail Card
 *
 * 완료된 작업의 상세 정보 카드
 * - 영상 다운로드 버튼 (T103)
 * - YouTube 영상 링크 (T104)
 */
export function JobDetailCard({
  jobId,
  videoUrl,
  youtubeVideoId,
  metadata,
}: JobDetailCardProps) {
  const handleDownload = () => {
    // API endpoint로 리디렉트 (백엔드에서 Supabase Storage로 리디렉트)
    window.open(`/api/jobs/${jobId}/download`, "_blank");
  };

  const handleOpenYouTube = () => {
    const youtubeUrl =
      metadata?.youtube_url ||
      `https://www.youtube.com/watch?v=${youtubeVideoId}`;
    window.open(youtubeUrl, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>작업 완료</CardTitle>
        <CardDescription>
          영상이 성공적으로 생성되었습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {videoUrl && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">렌더링된 영상</h4>
            <video
              src={videoUrl}
              controls
              className="w-full rounded-lg border"
            />
          </div>
        )}

        {metadata?.privacy_status && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Youtube className="h-4 w-4" />
            <span>
              공개 상태:{" "}
              {{
                draft: "초안",
                private: "비공개",
                unlisted: "일부 공개",
                public: "공개",
              }[metadata.privacy_status] || metadata.privacy_status}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {videoUrl && (
          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            영상 다운로드
          </Button>
        )}

        {youtubeVideoId && (
          <Button onClick={handleOpenYouTube} className="flex-1">
            <ExternalLink className="mr-2 h-4 w-4" />
            YouTube에서 보기
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
