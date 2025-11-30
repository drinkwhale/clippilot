/**
 * YouTube 검색 훅
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchVideos,
  getVideoDetails,
  type YouTubeSearchParams,
  type YouTubeSearchResult,
  type YouTubeVideo,
} from "@/lib/api/youtube";

/**
 * YouTube 영상 검색 훅
 */
export function useYouTubeSearch(
  params: YouTubeSearchParams & { enabled?: boolean }
) {
  const { enabled = true, ...searchParams } = params;

  return useQuery<YouTubeSearchResult, Error>({
    queryKey: ["youtube-search", searchParams],
    queryFn: () => searchVideos(searchParams),
    enabled: enabled && !!searchParams.query && searchParams.query.length > 0,
    staleTime: 5 * 60 * 1000, // 5분 동안 캐시 유지
    gcTime: 15 * 60 * 1000, // 15분 후 가비지 컬렉션
  });
}

/**
 * YouTube 영상 상세 정보 조회 훅
 */
export function useVideoDetails(videoId: string | null) {
  return useQuery<YouTubeVideo, Error>({
    queryKey: ["youtube-video", videoId],
    queryFn: () => {
      if (!videoId) {
        throw new Error("Video ID is required");
      }
      return getVideoDetails(videoId);
    },
    enabled: !!videoId,
    staleTime: 10 * 60 * 1000, // 10분 동안 캐시 유지
    gcTime: 30 * 60 * 1000, // 30분 후 가비지 컬렉션
  });
}
