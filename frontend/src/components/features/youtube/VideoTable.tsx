"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { YouTubeVideo } from "@/lib/api/youtube";

interface VideoTableProps {
  videos: YouTubeVideo[];
  onVideoClick?: (video: YouTubeVideo) => void;
  onSaveVideo?: (video: YouTubeVideo) => void;
}

/**
 * 조회수를 포맷팅하는 함수
 */
function formatViewCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}만`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천`;
  }
  return count.toString();
}

/**
 * 구독자 수를 포맷팅하는 함수
 */
function formatSubscriberCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}만`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천`;
  }
  return count.toString();
}

function formatCount(count?: number): string {
  if (count === undefined || count === null) return "-";
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`;
  return count.toString();
}

function formatRatio(value?: number): string {
  if (value === undefined || value === null) return "-";
  return `${value.toFixed(1)}x`;
}

function formatPercent(value?: number): string {
  if (value === undefined || value === null) return "-";
  return `${value.toFixed(1)}%`;
}

/**
 * 날짜를 포맷팅하는 함수
 */
const seoulDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  // Fix timezone so server/client renders stay in sync.
  const parts = seoulDateFormatter.formatToParts(date);
  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const dayPeriod = getPart("dayPeriod");
  const hour = getPart("hour");
  const minute = getPart("minute");

  return `${getPart("year")}. ${getPart("month")}. ${getPart(
    "day"
  )}.\n${dayPeriod} ${hour}:${minute}`;
}

/**
 * 영상 길이를 포맷팅하는 함수 (초 → 분:초)
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/**
 * 참여율 계산 (예시: 좋아요 + 댓글 / 조회수 * 100)
 */
function calculateEngagementRate(video: YouTubeVideo): number {
  const viewCount = video.viewCount || 0;
  const likeCount = video.likeCount || 0;
  const commentCount = video.commentCount || 0;

  if (viewCount === 0) return 0;
  return ((likeCount + commentCount) / viewCount) * 100;
}

/**
 * CII 점수 계산 및 배지 반환
 */
function getCIIBadge(ciiScore: number) {
  if (ciiScore >= 5) {
    return <Badge className="bg-green-600 hover:bg-green-700">Great!!</Badge>;
  }
  if (ciiScore >= 2) {
    return <Badge className="bg-green-500 hover:bg-green-600">Good</Badge>;
  }
  return <Badge variant="secondary">Soso</Badge>;
}

/**
 * YouTube 검색 결과 테이블 컴포넌트
 */
export function VideoTable({
  videos,
  onVideoClick,
  onSaveVideo,
}: VideoTableProps) {
  const sortedVideos = [...videos].sort(
    (a, b) => (b.viewCount || 0) - (a.viewCount || 0)
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto scrollbar-visible">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">N</TableHead>
              <TableHead className="w-32">썸네일</TableHead>
              <TableHead className="w-40">채널명</TableHead>
              <TableHead className="min-w-[300px]">제목</TableHead>
              <TableHead className="w-32">업로드</TableHead>
              <TableHead className="w-24 text-right">구독자 수</TableHead>
              <TableHead className="w-24 text-right">조회 수</TableHead>
              <TableHead className="w-28 text-center">성과도 배율</TableHead>
              <TableHead className="w-28 text-center">채널 기여도</TableHead>
              <TableHead className="w-24 text-center">참여율</TableHead>
              <TableHead className="w-24 text-right">좋아요 수</TableHead>
              <TableHead className="w-24 text-right">댓글 수</TableHead>
              <TableHead className="w-20 text-right">길이</TableHead>
              <TableHead className="w-24 text-center">CII</TableHead>
              <TableHead className="w-32 text-center">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVideos.map((video, index) => {
              const engagementRate = calculateEngagementRate(video);
              const ciiScore = video.cii ?? engagementRate;

              return (
                <TableRow
                  key={video.id}
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    console.log("Row clicked:", video.title);
                    console.log("onVideoClick exists:", !!onVideoClick);
                    if (onVideoClick) {
                      onVideoClick(video);
                    }
                  }}
                >
                  {/* 번호 */}
                  <TableCell className="text-center font-medium">
                    {index + 1}
                  </TableCell>

                  {/* 썸네일 */}
                  <TableCell>
                    <div className="relative w-28 h-20 rounded overflow-hidden bg-muted">
                      <Image
                        src={video.thumbnailUrl || "/placeholder-video.png"}
                        alt={video.title}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>
                  </TableCell>

                  {/* 채널명 */}
                  <TableCell>
                    <Link
                      href={`https://youtube.com/channel/${video.channelId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {video.channelTitle}
                    </Link>
                  </TableCell>

                  {/* 제목 */}
                  <TableCell>
                    <div className="space-y-1">
                      <Link
                        href={`https://youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium line-clamp-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {video.title}
                      </Link>
                      {video.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* 업로드 날짜 */}
                  <TableCell className="whitespace-pre-line text-sm">
                    {formatDate(video.publishedAt)}
                  </TableCell>

                  {/* 구독자 수 */}
                  <TableCell className="text-right font-medium">
                    {video.subscriberCount
                      ? formatSubscriberCount(video.subscriberCount)
                      : "-"}
                  </TableCell>

                  {/* 조회수 */}
                  <TableCell className="text-right font-medium">
                    {formatViewCount(video.viewCount || 0)}
                  </TableCell>

                  {/* 성과도 배율 */}
                  <TableCell className="text-center">
                    {formatRatio(video.performanceRatio)}
                  </TableCell>

                  {/* 채널 기여도 */}
                  <TableCell className="text-center">
                    {formatPercent(video.channelContribution)}
                  </TableCell>

                  {/* 참여율 */}
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className="bg-gray-800 text-white hover:bg-gray-900"
                    >
                      {engagementRate.toFixed(1)}%
                    </Badge>
                  </TableCell>

                  {/* 좋아요 수 */}
                  <TableCell className="text-right font-medium">
                    {formatCount(video.likeCount)}
                  </TableCell>

                  {/* 댓글 수 */}
                  <TableCell className="text-right font-medium">
                    {video.commentCount !== undefined ? (
                      <a
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                        title="YouTube에서 댓글 보기"
                      >
                        {formatCount(video.commentCount)}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  {/* 영상 길이 */}
                  <TableCell className="text-right text-sm">
                    {video.duration
                      ? formatDuration(video.duration)
                      : "N/A"}
                  </TableCell>

                  {/* CII 점수 */}
                  <TableCell className="text-center space-y-1">
                    <div className="text-sm font-medium">
                      {ciiScore.toFixed(1)}
                    </div>
                    {getCIIBadge(ciiScore)}
                  </TableCell>

                  {/* 액션 버튼 */}
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveVideo?.(video);
                      }}
                    >
                      저장하기
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {videos.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
