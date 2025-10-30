/**
 * ChannelList component
 * Displays connected YouTube channels and token status.
 */

'use client'

import { useMemo } from 'react'

import type { Channel } from '@/lib/hooks/useChannels'

interface ChannelListProps {
  channels: Channel[]
  onDelete: (channelId: string) => Promise<void>
  isDeleting?: boolean
}

const formatExpiresLabel = (tokenExpiresAt: string) => {
  const expiresAt = new Date(tokenExpiresAt).getTime()
  const now = Date.now()

  const diffMs = expiresAt - now
  const oneHour = 60 * 60 * 1000
  const oneDay = 24 * oneHour

  if (Number.isNaN(diffMs)) {
    return '만료 시각을 확인할 수 없습니다'
  }

  if (diffMs <= 0) {
    return '만료됨'
  }

  if (diffMs < oneHour) {
    const minutes = Math.round(diffMs / (60 * 1000))
    return `${minutes}분 후 만료`
  }

  if (diffMs < oneDay) {
    const hours = Math.round(diffMs / oneHour)
    return `${hours}시간 후 만료`
  }

  const days = Math.round(diffMs / oneDay)
  return `${days}일 후 만료`
}

export function ChannelList({ channels, onDelete, isDeleting }: ChannelListProps) {
  const sortedChannels = useMemo(
    () =>
      [...channels].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [channels]
  )

  if (sortedChannels.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
        연결된 YouTube 채널이 없습니다. 먼저 채널을 연결해주세요.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedChannels.map((channel) => {
        const expiresLabel = formatExpiresLabel(channel.tokenExpiresAt)

        const isExpired = channel.requiresReauth
        const expiresSoon =
          !isExpired &&
          new Date(channel.tokenExpiresAt).getTime() - Date.now() <
            48 * 60 * 60 * 1000

        return (
          <div
            key={channel.id}
            className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              {channel.channelThumbnail ? (
                <img
                  src={channel.channelThumbnail}
                  alt={channel.channelName}
                  className="h-12 w-12 rounded-full border border-neutral-200 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-sm font-semibold text-neutral-500">
                  {channel.channelName.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-neutral-900">
                    {channel.channelName}
                  </p>
                  {!channel.isActive && (
                    <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                      비활성
                    </span>
                  )}
                  {isExpired && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                      재인증 필요
                    </span>
                  )}
                  {!isExpired && expiresSoon && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      만료 임박
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500">{channel.ytChannelId}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  토큰 상태: {expiresLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDelete(channel.id)}
                disabled={isDeleting}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                연결 해제
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
