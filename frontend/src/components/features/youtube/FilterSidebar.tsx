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
}

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSearch: () => void;
  onReset: () => void;
}

/**
 * YouTube 검색 필터 사이드바 컴포넌트
 */
export function FilterSidebar({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
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
                <SelectItem value="10">10개</SelectItem>
                <SelectItem value="25">25개</SelectItem>
                <SelectItem value="50">50개</SelectItem>
                <SelectItem value="100">100개</SelectItem>
              </SelectContent>
            </Select>
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

          {/* 국가 코드 */}
          <div className="space-y-2">
            <Label htmlFor="region-code">국가 코드</Label>
            <Input
              id="region-code"
              type="text"
              placeholder="예: KR, US"
              value={filters.regionCode}
              onChange={(e) =>
                updateFilter("regionCode", e.target.value.toUpperCase())
              }
              maxLength={2}
            />
            <p className="text-xs text-muted-foreground">
              ISO 3166-1 alpha-2 코드
            </p>
          </div>

          <Separator />

          {/* 최소 조회수 */}
          <div className="space-y-2">
            <Label htmlFor="min-view-count">최소 조회수</Label>
            <Input
              id="min-view-count"
              type="number"
              placeholder="0"
              min="0"
              value={filters.minViewCount || ""}
              onChange={(e) =>
                updateFilter("minViewCount", parseInt(e.target.value) || 0)
              }
            />
          </div>

          {/* 최소 구독자 수 */}
          <div className="space-y-2">
            <Label htmlFor="min-subscriber-count">최소 구독자 수</Label>
            <Input
              id="min-subscriber-count"
              type="number"
              placeholder="0"
              min="0"
              value={filters.minSubscriberCount || ""}
              onChange={(e) =>
                updateFilter(
                  "minSubscriberCount",
                  parseInt(e.target.value) || 0
                )
              }
            />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t space-y-2">
          <Button onClick={onSearch} className="w-full" size="sm">
            검색
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
