/**
 * YouTube 검색 페이지
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { SearchBar } from "@/components/features/youtube/SearchBar";
import { CollectionCountSelector } from "@/components/features/youtube/CollectionCountSelector";
import {
  SearchFilters,
  type SearchFiltersState,
} from "@/components/features/youtube/SearchFilters";
import { VideoGrid } from "@/components/features/youtube/VideoGrid";
import { VideoSkeletonGrid } from "@/components/features/youtube/VideoSkeleton";
import { EmptyState } from "@/components/features/youtube/EmptyState";
import { useYouTubeSearch } from "@/hooks/useYouTubeSearch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { YouTubeVideo } from "@/lib/api/youtube";

// 업로드 기간을 ISO 8601 날짜로 변환하는 헬퍼 함수
function getPublishedAfterDate(period: string): string | undefined {
  const now = new Date();
  switch (period) {
    case "hour":
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case "today":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "year":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return undefined;
  }
}

export default function YouTubeSearchPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [maxResults, setMaxResults] = useState(25);
  const [filters, setFilters] = useState<SearchFiltersState>({
    videoDuration: "any",
    uploadPeriod: "all",
    regionCode: "",
    minViewCount: 0,
    minSubscriberCount: 0,
  });

  // Hooks는 조건문 이전에 호출되어야 함
  const { data, isLoading, error } = useYouTubeSearch({
    query: searchQuery,
    maxResults,
    filters: {
      videoType:
        filters.videoDuration === "any"
          ? "all"
          : (filters.videoDuration as "shorts" | "long"),
      publishedAfter: getPublishedAfterDate(filters.uploadPeriod),
      regionCode: filters.regionCode || undefined,
      minViewCount: filters.minViewCount > 0 ? filters.minViewCount : undefined,
      minSubscribers:
        filters.minSubscriberCount > 0 ? filters.minSubscriberCount : undefined,
    },
    enabled: _hasHydrated && isAuthenticated, // 인증 후에만 활성화
  });

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [_hasHydrated, isAuthenticated, router]);

  if (!_hasHydrated || !isAuthenticated) {
    return null;
  }

  const videos = data?.videos ?? [];
  const totalResults = data?.totalResults ?? 0;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleVideoClick = (video: YouTubeVideo) => {
    // TODO: 영상 상세 모달 열기 (Phase 7에서 구현)
    console.log("Video clicked:", video);
  };

  const handleResetFilters = () => {
    setFilters({
      videoDuration: "any",
      uploadPeriod: "all",
      regionCode: "",
      minViewCount: 0,
      minSubscriberCount: 0,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar />
        <div className="container py-8 space-y-6">
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

          <SearchFilters
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                검색 중 오류가 발생했습니다: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && <VideoSkeletonGrid count={maxResults} />}

          {!isLoading && data && videos.length === 0 && (
            <EmptyState
              message="검색 결과가 없습니다"
              description="다른 키워드로 검색해보세요."
            />
          )}

          {!isLoading && data && videos.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                총 {totalResults}개의 영상을 찾았습니다.
              </p>
              <VideoGrid videos={videos} onVideoClick={handleVideoClick} />
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
      </div>
    </div>
  );
}
