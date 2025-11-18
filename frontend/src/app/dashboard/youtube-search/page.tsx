/**
 * YouTube 검색 페이지
 */

"use client";

import { useState } from "react";
import { SearchBar } from "@/components/features/youtube/SearchBar";
import { CollectionCountSelector } from "@/components/features/youtube/CollectionCountSelector";
import { VideoGrid } from "@/components/features/youtube/VideoGrid";
import { VideoSkeletonGrid } from "@/components/features/youtube/VideoSkeleton";
import { EmptyState } from "@/components/features/youtube/EmptyState";
import { useYouTubeSearch } from "@/hooks/useYouTubeSearch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { YouTubeVideo } from "@/lib/api/youtube";

export default function YouTubeSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [maxResults, setMaxResults] = useState(25);

  const { data, isLoading, error } = useYouTubeSearch({
    query: searchQuery,
    maxResults,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleVideoClick = (video: YouTubeVideo) => {
    // TODO: 영상 상세 모달 열기 (Phase 7에서 구현)
    console.log("Video clicked:", video);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">YouTube 영상 검색</h1>
        <p className="text-muted-foreground">
          키워드로 YouTube 영상을 검색하고 템플릿으로 저장하세요.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <SearchBar onSearch={handleSearch} />
        <CollectionCountSelector
          value={maxResults}
          onChange={setMaxResults}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            검색 중 오류가 발생했습니다: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && <VideoSkeletonGrid count={maxResults} />}

      {!isLoading && data && data.videos.length === 0 && (
        <EmptyState
          message="검색 결과가 없습니다"
          description="다른 키워드로 검색해보세요."
        />
      )}

      {!isLoading && data && data.videos.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            총 {data.totalResults}개의 영상을 찾았습니다.
          </p>
          <VideoGrid videos={data.videos} onVideoClick={handleVideoClick} />
        </div>
      )}

      {!searchQuery && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-muted-foreground">
            검색어를 입력하여 YouTube 영상을 검색해보세요.
          </p>
        </div>
      )}
    </div>
  );
}
