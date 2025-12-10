/**
 * YouTube 영상 상세 정보 모달 컴포넌트
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatViewCount, formatDate } from "@/lib/utils/format";
import { Play, MessageSquare, FileText, User, Download, Copy } from "lucide-react";
import type { YouTubeVideo, Comment, Caption, ChannelDetail } from "@/lib/api/youtube";
import { getVideoComments, getVideoCaptions, getChannelDetails, downloadTranscriptAsFile } from "@/lib/api/youtube";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

interface VideoDetailModalProps {
  video: YouTubeVideo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoDetailModal({ video, open, onOpenChange }: VideoDetailModalProps) {
  const [activeTab, setActiveTab] = useState<string>("preview");

  // 댓글 조회
  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["video-comments", video?.id],
    queryFn: () => video ? getVideoComments(video.id) : Promise.resolve([]),
    enabled: open && activeTab === "comments" && !!video,
  });

  // 자막 조회
  const { data: captions, isLoading: captionsLoading } = useQuery({
    queryKey: ["video-captions", video?.id],
    queryFn: () => video ? getVideoCaptions(video.id) : Promise.resolve([]),
    enabled: open && activeTab === "captions" && !!video,
  });

  // 채널 정보 조회
  const { data: channelDetail, isLoading: channelLoading } = useQuery({
    queryKey: ["channel-detail", video?.channelId],
    queryFn: () => video ? getChannelDetails(video.channelId) : Promise.resolve(null),
    enabled: open && activeTab === "channel" && !!video,
  });

  if (!video) return null;

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(video.description);
  };

  const handleDownloadTranscript = async (languageCode?: string) => {
    try {
      const languages = languageCode ? [languageCode] : ['ko', 'en'];
      await downloadTranscriptAsFile(video.id, video.title, languages);
    } catch (error) {
      console.error('자막 다운로드 실패:', error);
      alert('자막을 다운로드할 수 없습니다. 이 영상은 자막이 제공되지 않을 수 있습니다.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold line-clamp-2">
            {video.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <span>{video.channelTitle}</span>
            <span>•</span>
            <span>{formatViewCount(video.viewCount)} 조회</span>
            <span>•</span>
            <span>{formatDate(video.publishedAt)}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Play className="w-4 h-4" />
              미리보기
            </TabsTrigger>
            <TabsTrigger value="description" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              설명
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              댓글 ({video.commentCount})
            </TabsTrigger>
            <TabsTrigger value="captions" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              자막
            </TabsTrigger>
            <TabsTrigger value="channel" className="flex items-center gap-1">
              <User className="w-4 h-4" />
              채널
            </TabsTrigger>
          </TabsList>

          {/* 미리보기 탭 */}
          <TabsContent value="preview" className="mt-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">
                조회수: {formatViewCount(video.viewCount)}
              </Badge>
              <Badge variant="secondary">
                좋아요: {formatViewCount(video.likeCount)}
              </Badge>
              <Badge variant="secondary">
                댓글: {formatViewCount(video.commentCount)}
              </Badge>
              {video.tags && video.tags.length > 0 && (
                <>
                  {video.tags.slice(0, 5).map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          </TabsContent>

          {/* 설명 탭 */}
          <TabsContent value="description" className="mt-4">
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyDescription}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                복사
              </Button>
            </div>
            <ScrollArea className="h-[400px] rounded-lg border p-4">
              <div className="whitespace-pre-wrap text-sm">
                {video.description || "설명이 없습니다."}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 댓글 탭 */}
          <TabsContent value="comments" className="mt-4">
            <ScrollArea className="h-[400px]">
              {commentsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  댓글을 불러오는 중...
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.commentId} className="border-b pb-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.publishedAt)}
                            </span>
                          </div>
                          <p
                            className="text-sm"
                            dangerouslySetInnerHTML={{ __html: comment.text }}
                          />
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>좋아요 {comment.likeCount}</span>
                            {comment.replyCount > 0 && (
                              <span>답글 {comment.replyCount}개</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  댓글이 없습니다.
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* 자막 탭 */}
          <TabsContent value="captions" className="mt-4">
            <ScrollArea className="h-[400px]">
              {captionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  자막 정보를 불러오는 중...
                </div>
              ) : captions && captions.length > 0 ? (
                <div className="space-y-2">
                  {captions.map((caption) => (
                    <div
                      key={caption.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={caption.isAutoSynced ? "secondary" : "default"}>
                          {caption.language.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{caption.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {caption.isAutoSynced ? "자동 생성" : "수동 작성"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadTranscript(caption.language)}
                        title="자막 다운로드"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  사용 가능한 자막이 없습니다.
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* 채널 탭 */}
          <TabsContent value="channel" className="mt-4">
            <ScrollArea className="h-[400px]">
              {channelLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  채널 정보를 불러오는 중...
                </div>
              ) : channelDetail ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {channelDetail.thumbnailUrl && (
                      <Image
                        src={channelDetail.thumbnailUrl}
                        alt={channelDetail.title}
                        width={88}
                        height={88}
                        className="rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{channelDetail.title}</h3>
                      {channelDetail.customUrl && (
                        <p className="text-sm text-muted-foreground">
                          @{channelDetail.customUrl}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <div>
                          <span className="font-semibold">
                            {formatViewCount(channelDetail.subscriberCount)}
                          </span>
                          <span className="text-muted-foreground ml-1">구독자</span>
                        </div>
                        <div>
                          <span className="font-semibold">
                            {formatViewCount(channelDetail.videoCount)}
                          </span>
                          <span className="text-muted-foreground ml-1">영상</span>
                        </div>
                        <div>
                          <span className="font-semibold">
                            {formatViewCount(channelDetail.viewCount)}
                          </span>
                          <span className="text-muted-foreground ml-1">조회수</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">채널 설명</h4>
                    <p className="text-sm whitespace-pre-wrap">
                      {channelDetail.description || "설명이 없습니다."}
                    </p>
                  </div>
                  {channelDetail.country && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">국가</h4>
                      <p className="text-sm">{channelDetail.country}</p>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">가입일</h4>
                    <p className="text-sm">{formatDate(channelDetail.publishedAt)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  채널 정보를 불러올 수 없습니다.
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
