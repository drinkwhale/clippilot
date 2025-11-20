"use client";

import { useQuery } from "@tanstack/react-query";
import { getSearchHistory } from "@/lib/api/youtube";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Youtube, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { mockSearchHistory } from "@/lib/mocks/dashboard";
import { isMockApi, waitFor } from "@/lib/config";

/**
 * 검색 히스토리 항목
 */
interface SearchHistoryItem {
  keyword: string;
  searched_at: string;
  result_count: number;
}

/**
 * YouTube 검색 미리보기 위젯 컴포넌트
 */
export function YouTubeSearchPreview() {
  const { data: searchHistory, isLoading } = useQuery<SearchHistoryItem[]>({
    queryKey: ["youtube-search-history-preview", isMockApi],
    queryFn: async () => {
      try {
        if (isMockApi) {
          await waitFor(150);
        }
        const history = isMockApi ? mockSearchHistory : await getSearchHistory();
        // 최근 3개만 반환 (문자열 배열을 객체 배열로 변환)
        return history.slice(0, 3).map((keyword, index) => ({
          keyword,
          searched_at: new Date(Date.now() - index * 1000 * 60 * 5).toISOString(),
          result_count: 0,
        }));
      } catch (error) {
        console.error("Failed to fetch search history:", error);
        return [];
      }
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Youtube className="h-5 w-5 mr-2 text-red-600" />
            YouTube 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-16 w-28 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!searchHistory || searchHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Youtube className="h-5 w-5 mr-2 text-red-600" />
            YouTube 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">검색 히스토리가 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-4">
              YouTube에서 영상을 검색하여 작업을 시작해보세요.
            </p>
            <Link href="/dashboard/youtube-search">
              <Button>
                <Search className="h-4 w-4 mr-2" />
                검색 시작하기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Youtube className="h-5 w-5 mr-2 text-red-600" />
          최근 검색
        </CardTitle>
        <Link href="/dashboard/youtube-search">
          <Button variant="ghost" size="sm">
            모두 보기
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {searchHistory.map((item, index) => (
            <Link
              key={index}
              href={`/dashboard/youtube-search?q=${encodeURIComponent(item.keyword)}`}
              className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Search className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.keyword}</p>
                <p className="text-xs text-muted-foreground">
                  {item.result_count > 0
                    ? `${item.result_count}개 결과`
                    : "검색 결과 보기"}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </Link>
          ))}
        </div>
        <Link href="/dashboard/youtube-search" className="block mt-4">
          <Button variant="outline" className="w-full">
            <Search className="h-4 w-4 mr-2" />
            새로운 검색 시작하기
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
