/**
 * Channel settings page
 * Allows users to connect and manage YouTube channels.
 */

'use client'

import { useCallback, useState } from 'react'

import { ChannelList } from '@/components/dashboard/ChannelList'
import { ConnectChannelButton } from '@/components/dashboard/ConnectChannelButton'
import { useChannels } from '@/lib/hooks/useChannels'

export default function ChannelSettingsPage() {
  const {
    channels,
    isLoading,
    isError,
    error,
    connectYouTubeChannel,
    deleteChannel,
    isDeleting,
    refetch,
  } = useChannels()
  const [actionError, setActionError] = useState<string | null>(null)

  const handleDelete = useCallback(
    async (channelId: string) => {
      setActionError(null)
      try {
        await deleteChannel(channelId)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : '채널을 삭제하는 중 문제가 발생했습니다.'
        setActionError(message)
      }
    },
    [deleteChannel]
  )

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">
          YouTube 채널 관리
        </h1>
        <p className="text-sm text-neutral-500">
          ClipPilot에 YouTube 채널을 연결하고 업로드 권한을 유지하세요.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">
          채널 연결
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Google OAuth 인증을 통해 채널을 연결합니다. 토큰이 만료되었거나
          권한이 해제된 경우 재연결이 필요합니다.
        </p>
        <div className="mt-4">
          <ConnectChannelButton onConnect={connectYouTubeChannel} />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            연결된 채널
          </h2>
          <button
            type="button"
            onClick={refetch}
            className="rounded-md border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
          >
            새로고침
          </button>
        </div>
        {isLoading ? (
          <p className="mt-4 text-sm text-neutral-500">채널 정보를 불러오는 중…</p>
        ) : isError ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error instanceof Error
              ? error.message
              : '채널 정보를 불러오는 중 문제가 발생했습니다.'}
          </p>
        ) : (
          <div className="mt-4">
            <ChannelList
              channels={channels}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          </div>
        )}
        {actionError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {actionError}
          </p>
        )}
      </section>
    </div>
  )
}
