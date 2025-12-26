/**
 * YouTube 영상 카드 컴포넌트
 */

"use client";

import Image from "next/image";
import { formatDuration, formatViewCount, formatDate } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { YouTubeVideo } from "@/lib/api/youtube";

interface VideoCardProps {
  video: YouTubeVideo;
  onClick?: (video: YouTubeVideo) => void;
  onTranscribe?: (video: YouTubeVideo) => void;
}

export function VideoCard({ video, onClick, onTranscribe }: VideoCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(video);
    }
  };

  const handleTranscribeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    if (onTranscribe) {
      onTranscribe(video);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div
        className="relative aspect-video cursor-pointer"
        onClick={handleCardClick}
      >
        <Image
          src={video.thumbnailUrl || "/placeholder-video.png"}
          alt={video.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
          {formatDuration(video.duration)}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2">
          {video.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-1">
          {video.channelTitle}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span>{formatViewCount(video.viewCount)} 조회</span>
          <span>•</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleTranscribeClick}
        >
          자막수집
        </Button>
      </CardContent>
    </Card>
  );
}
