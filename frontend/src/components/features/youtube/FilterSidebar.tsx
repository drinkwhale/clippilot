"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter as FilterIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface FilterState {
  query: string;
  maxResults: number;
  videoDuration: "any" | "shorts" | "long";
  uploadPeriod: "all" | "hour" | "today" | "week" | "month" | "year";
  regionCode: string;
  minViewCount: number;
  minSubscriberCount: number;
  minCii: number;
}

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSearch: () => void;
  onReset: () => void;
  isSearching?: boolean;
}

/**
 * YouTube 검색 필터 사이드바 컴포넌트
 */
export function FilterSidebar({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  isSearching = false,
}: FilterSidebarProps) {
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] sticky top-16 border-r bg-card">
      <div className="flex flex-col h-full">
        {/* 헤더 */}
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <FilterIcon className="h-4 w-4" />
            검색 필터
          </h2>
        </div>

        {/* 필터 내용 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 검색 키워드 */}
          <div className="space-y-2">
            <Label htmlFor="search-query">검색 키워드</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-query"
                type="text"
                placeholder="키워드 입력..."
                value={filters.query}
                onChange={(e) => updateFilter("query", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSearch();
                  }
                }}
                className="pl-9"
              />
            </div>
          </div>

          <Separator />

          {/* 수집 개수 */}
          <div className="space-y-2">
            <Label htmlFor="max-results">수집 개수</Label>
            <Select
              value={filters.maxResults.toString()}
              onValueChange={(value) =>
                updateFilter("maxResults", parseInt(value))
              }
            >
              <SelectTrigger id="max-results">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25개</SelectItem>
                <SelectItem value="50">50개</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              백엔드 제한: 25-50개
            </p>
          </div>

          <Separator />

          {/* 영상 길이 */}
          <div className="space-y-2">
            <Label htmlFor="video-duration">영상 길이</Label>
            <Select
              value={filters.videoDuration}
              onValueChange={(value: any) =>
                updateFilter("videoDuration", value)
              }
            >
              <SelectTrigger id="video-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">전체</SelectItem>
                <SelectItem value="shorts">Shorts</SelectItem>
                <SelectItem value="long">일반 영상</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 업로드 기간 */}
          <div className="space-y-2">
            <Label htmlFor="upload-period">업로드 기간</Label>
            <Select
              value={filters.uploadPeriod}
              onValueChange={(value: any) => updateFilter("uploadPeriod", value)}
            >
              <SelectTrigger id="upload-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="hour">최근 1시간</SelectItem>
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="week">최근 1주일</SelectItem>
                <SelectItem value="month">최근 1개월</SelectItem>
                <SelectItem value="year">최근 1년</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 국가 */}
          <div className="space-y-2">
            <Label htmlFor="region-code">국가</Label>
            <Select
              value={filters.regionCode || "ALL"}
              onValueChange={(value) => updateFilter("regionCode", value)}
            >
              <SelectTrigger id="region-code">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="KR">🇰🇷 대한민국</SelectItem>
                <SelectItem value="US">🇺🇸 미국</SelectItem>
                <SelectItem value="JP">🇯🇵 일본</SelectItem>
                <SelectItem value="CN">🇨🇳 중국</SelectItem>
                <SelectItem value="GB">🇬🇧 영국</SelectItem>
                <SelectItem value="DE">🇩🇪 독일</SelectItem>
                <SelectItem value="FR">🇫🇷 프랑스</SelectItem>
                <SelectItem value="ES">🇪🇸 스페인</SelectItem>
                <SelectItem value="IT">🇮🇹 이탈리아</SelectItem>
                <SelectItem value="BR">🇧🇷 브라질</SelectItem>
                <SelectItem value="IN">🇮🇳 인도</SelectItem>
                <SelectItem value="ID">🇮🇩 인도네시아</SelectItem>
                <SelectItem value="MX">🇲🇽 멕시코</SelectItem>
                <SelectItem value="RU">🇷🇺 러시아</SelectItem>
                <SelectItem value="AU">🇦🇺 호주</SelectItem>
                <SelectItem value="CA">🇨🇦 캐나다</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* 조회수 범위 */}
          <div className="space-y-2">
            <Label htmlFor="view-count-range">조회수 범위</Label>
            <Select
              value={filters.minViewCount.toString()}
              onValueChange={(value) =>
                updateFilter("minViewCount", parseInt(value))
              }
            >
              <SelectTrigger id="view-count-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">전체</SelectItem>
                <SelectItem value="1000">1천 이상</SelectItem>
                <SelectItem value="10000">1만 이상</SelectItem>
                <SelectItem value="50000">5만 이상</SelectItem>
                <SelectItem value="100000">10만 이상</SelectItem>
                <SelectItem value="500000">50만 이상</SelectItem>
                <SelectItem value="1000000">100만 이상</SelectItem>
                <SelectItem value="5000000">500만 이상</SelectItem>
                <SelectItem value="10000000">1,000만 이상</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 구독자 수 범위 */}
          <div className="space-y-2">
            <Label htmlFor="subscriber-count-range">구독자 수 범위</Label>
            <Select
              value={filters.minSubscriberCount.toString()}
              onValueChange={(value) =>
                updateFilter("minSubscriberCount", parseInt(value))
              }
            >
              <SelectTrigger id="subscriber-count-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">전체</SelectItem>
                <SelectItem value="1000">1천 이상</SelectItem>
                <SelectItem value="10000">1만 이상</SelectItem>
                <SelectItem value="50000">5만 이상</SelectItem>
                <SelectItem value="100000">10만 이상</SelectItem>
                <SelectItem value="500000">50만 이상</SelectItem>
                <SelectItem value="1000000">100만 이상</SelectItem>
                <SelectItem value="5000000">500만 이상</SelectItem>
                <SelectItem value="10000000">1,000만 이상</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CII 최소 등급 */}
          <div className="space-y-2">
            <Label htmlFor="cii-min">CII 필터</Label>
            <Select
              value={filters.minCii.toString()}
              onValueChange={(value) => updateFilter("minCii", Number(value))}
            >
              <SelectTrigger id="cii-min">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">전체 (Soso 이상)</SelectItem>
                <SelectItem value="2">Good 이상</SelectItem>
                <SelectItem value="5">Great 이상</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Soso &lt; 2, Good ≥ 2, Great ≥ 5 기준으로 필터링합니다.
            </p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t space-y-2">
          <Button
            onClick={onSearch}
            className="w-full"
            size="sm"
            disabled={isSearching}
          >
            {isSearching ? "검색 중..." : "검색"}
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            className="w-full"
            size="sm"
          >
            Clear
          </Button>
        </div>
      </div>
    </aside>
  );
}
