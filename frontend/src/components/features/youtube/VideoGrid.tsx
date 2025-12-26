/**
 * YouTube 영상 그리드 컴포넌트
 */

"use client";

import { VideoCard } from "./VideoCard";
import type { YouTubeVideo } from "@/lib/api/youtube";

interface VideoGridProps {
  videos: YouTubeVideo[];
  onVideoClick?: (video: YouTubeVideo) => void;
  onTranscribe?: (video: YouTubeVideo) => void;
}

export function VideoGrid({
  videos,
  onVideoClick,
  onTranscribe,
}: VideoGridProps) {
  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onClick={onVideoClick}
          onTranscribe={onTranscribe}
        />
      ))}
    </div>
  );
}
