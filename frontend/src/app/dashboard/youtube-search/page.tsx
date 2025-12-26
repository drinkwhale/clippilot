/**
 * YouTube 검색 페이지 (재구성된 레이아웃)
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { HeaderNav } from "@/components/layout/HeaderNav";
import {
  FilterSidebar,
  type FilterState,
} from "@/components/features/youtube/FilterSidebar";
import { VideoTable } from "@/components/features/youtube/VideoTable";
import { VideoDetailModal } from "@/components/features/youtube/VideoDetailModal";
import { TranscriptModal } from "@/components/features/youtube/TranscriptModal";
import { useYouTubeSearch } from "@/hooks/useYouTubeSearch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { YouTubeVideo } from "@/lib/api/youtube";
import { Skeleton } from "@/components/ui/skeleton";

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

const resultCountFormatter = new Intl.NumberFormat("ko-KR");

export default function YouTubeSearchPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  // 필터 상태 통합
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    maxResults: 25,
    videoDuration: "any",
    uploadPeriod: "all",
    regionCode: "ALL",
    minViewCount: 0,
    minSubscriberCount: 0,
    minCii: 0,
  });

  // 검색 실행 여부 상태
  const [shouldSearch, setShouldSearch] = useState(false);
  // 검색 시점에 확정된 publishedAfter 값을 보관 (재렌더마다 변하지 않도록)
  const [publishedAfter, setPublishedAfter] = useState<string | undefined>(
    undefined
  );

  // 모달 상태
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 자막 수집 모달 상태
  const [transcriptVideo, setTranscriptVideo] = useState<YouTubeVideo | null>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);

  // Hooks는 조건문 이전에 호출되어야 함
  const { data, isLoading, error } = useYouTubeSearch({
    query: filters.query,
    maxResults: filters.maxResults,
    filters: {
      videoType:
        filters.videoDuration === "any"
          ? "all"
          : (filters.videoDuration as "shorts" | "long"),
      publishedAfter,
      regionCode: filters.regionCode === "ALL" ? undefined : filters.regionCode,
      minViewCount: filters.minViewCount > 0 ? filters.minViewCount : undefined,
      minSubscribers:
        filters.minSubscriberCount > 0 ? filters.minSubscriberCount : undefined,
    },
    enabled: _hasHydrated && isAuthenticated && shouldSearch && !!filters.query,
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const handleSearch = () => {
    if (filters.query.trim()) {
      setPublishedAfter(getPublishedAfterDate(filters.uploadPeriod));
      setShouldSearch(true);
    }
  };

  const handleReset = () => {
    setFilters({
      query: "",
      maxResults: 25,
      videoDuration: "any",
      uploadPeriod: "all",
      regionCode: "ALL",
      minViewCount: 0,
      minSubscriberCount: 0,
      minCii: 0,
    });
    setPublishedAfter(undefined);
    setShouldSearch(false);
  };

  const handleVideoClick = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleSaveVideo = (video: YouTubeVideo) => {
    // TODO: 영상 저장 기능 구현
    console.log("Save video:", video);
  };

  const handleTranscribe = (video: YouTubeVideo) => {
    setTranscriptVideo(video);
    setIsTranscriptModalOpen(true);
  };

  // 조건부 렌더링 전에 return
  if (!hasMounted || !_hasHydrated || !isAuthenticated) {
    return null;
  }

  // CII 필터는 백엔드가 지원하지 않으므로 프론트에서 필터링
  const filteredVideos = (data?.videos ?? []).filter((video) => {
    const engagementRate =
      (((video.likeCount ?? 0) + (video.commentCount ?? 0)) /
        Math.max(video.viewCount ?? 0, 1)) *
      100;
    const ciiScore = video.cii ?? engagementRate;
    return ciiScore >= filters.minCii;
  });
  const totalResults = filteredVideos.length;

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 네비게이션 */}
      <HeaderNav />

      <div className="flex">
        {/* 왼쪽 필터 사이드바 */}
        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          onReset={handleReset}
          isSearching={isLoading}
        />

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 p-6 overflow-x-auto">
          <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">YouTube 영상 검색</h1>
                {shouldSearch && data && (
                  <p className="text-sm text-muted-foreground">
                    총 {resultCountFormatter.format(totalResults)}개의 영상
                  </p>
                )}
              </div>
              <p className="text-muted-foreground">
                키워드로 YouTube 영상을 검색하고 분석하세요.
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message.includes("429")
                    ? "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
                    : `검색 중 오류가 발생했습니다: ${error.message}`}
                </AlertDescription>
              </Alert>
            )}

            {/* 로딩 상태 */}
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}

            {/* 검색 결과 테이블 */}
            {!isLoading && shouldSearch && data && filteredVideos.length > 0 && (
              <VideoTable
                videos={filteredVideos}
                onVideoClick={handleVideoClick}
                onSaveVideo={handleSaveVideo}
                onTranscribe={handleTranscribe}
              />
            )}

            {/* 검색 결과 없음 */}
            {!isLoading &&
              shouldSearch &&
              data &&
              filteredVideos.length === 0 && (
              <div className="border rounded-lg p-12 text-center">
                <p className="text-lg text-muted-foreground">
                  검색 결과가 없습니다.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  다른 키워드로 검색해보세요.
                </p>
              </div>
            )}

            {/* 초기 안내 메시지 */}
            {!shouldSearch && !isLoading && (
              <div className="border rounded-lg p-12 text-center">
                <p className="text-lg text-muted-foreground">
                  왼쪽 검색 필터에서 키워드를 입력하고 검색 버튼을 눌러주세요.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 영상 상세 정보 모달 */}
      <VideoDetailModal
        video={selectedVideo}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      {/* 자막 수집 모달 */}
      <TranscriptModal
        video={transcriptVideo}
        open={isTranscriptModalOpen}
        onOpenChange={setIsTranscriptModalOpen}
      />
    </div>
  );
}
