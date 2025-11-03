"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useChannels } from "@/lib/hooks/useChannels";
import { Skeleton } from "@/components/ui/skeleton";

interface ChannelFilterProps {
  onChannelChange?: (channelId: string | null) => void;
}

/**
 * 채널 필터 컴포넌트
 *
 * Agency 플랜 사용자가 채널별로 통계를 필터링할 수 있도록 합니다.
 */
export default function ChannelFilter({ onChannelChange }: ChannelFilterProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const { data: channels, isLoading } = useChannels();

  const handleChannelChange = (value: string) => {
    setSelectedChannel(value);
    onChannelChange?.(value === "all" ? null : value);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full max-w-xs" />
      </div>
    );
  }

  // 채널이 없거나 1개만 있으면 필터를 표시하지 않음
  if (!channels || channels.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="channel-filter">채널 필터</Label>
      <Select value={selectedChannel} onValueChange={handleChannelChange}>
        <SelectTrigger id="channel-filter" className="w-full max-w-xs">
          <SelectValue placeholder="채널 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">모든 채널</SelectItem>
          {channels.map((channel) => (
            <SelectItem key={channel.id} value={channel.id}>
              {channel.channel_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
