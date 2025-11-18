/**
 * YouTube 영상 카드 컴포넌트
 */

"use client";

import Image from "next/image";
import { formatDuration, formatViewCount, formatDate } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import type { YouTubeVideo } from "@/lib/api/youtube";

interface VideoCardProps {
  video: YouTubeVideo;
  onClick?: (video: YouTubeVideo) => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(video);
    }
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <div className="relative aspect-video">
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatViewCount(video.viewCount)} 조회</span>
          <span>•</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
