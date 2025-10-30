/**
 * useChannels hook
 * Handles YouTube channel list fetching and management.
 */

'use client'

import { useCallback, useMemo } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'

import { useAuthStore } from '@/lib/stores/auth-store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ChannelApiResponse {
  id: string
  user_id: string
  yt_channel_id: string
  channel_name: string
  channel_thumbnail: string | null
  token_expires_at: string
  is_active: boolean
  created_at: string
  updated_at: string
  requires_reauth: boolean
}

export interface Channel {
  id: string
  userId: string
  ytChannelId: string
  channelName: string
  channelThumbnail: string | null
  tokenExpiresAt: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  requiresReauth: boolean
}

const mapChannel = (channel: ChannelApiResponse): Channel => ({
  id: channel.id,
  userId: channel.user_id,
  ytChannelId: channel.yt_channel_id,
  channelName: channel.channel_name,
  channelThumbnail: channel.channel_thumbnail,
  tokenExpiresAt: channel.token_expires_at,
  isActive: channel.is_active,
  createdAt: channel.created_at,
  updatedAt: channel.updated_at,
  requiresReauth: channel.requires_reauth,
})

export function useChannels() {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()

  const fetchChannels = useCallback(async (): Promise<Channel[]> => {
    if (!accessToken) {
      return []
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/channels`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('채널 목록을 불러오지 못했습니다.')
    }

    const data = (await response.json()) as ChannelApiResponse[]
    return data.map(mapChannel)
  }, [accessToken])

  const channelsQuery: UseQueryResult<Channel[]> = useQuery({
    queryKey: ['channels'],
    queryFn: fetchChannels,
    enabled: Boolean(accessToken),
  })

  const connectYouTubeChannel = useCallback(async () => {
    if (!accessToken) {
      throw new Error('로그인이 필요합니다.')
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/channels/oauth/youtube`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })

    if (response.status === 401) {
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.')
    }

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      const message =
        data?.error?.message ?? 'YouTube OAuth를 시작하지 못했습니다.'
      throw new Error(message)
    }

    const payload = (await response.json()) as { authorization_url: string }

    if (typeof window !== 'undefined') {
      window.location.href = payload.authorization_url
    }
  }, [accessToken])

  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      if (!accessToken) {
        throw new Error('로그인이 필요합니다.')
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/channels/${channelId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.status === 404) {
        throw new Error('채널 정보를 찾을 수 없습니다.')
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message =
          data?.error?.message ?? '채널을 삭제하지 못했습니다.'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] }).catch(() => {})
    },
  })

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['channels'] }).catch(() => {})
  }, [queryClient])

  return useMemo(
    () => ({
      channels: channelsQuery.data ?? [],
      isLoading: channelsQuery.isLoading,
      isFetching: channelsQuery.isFetching,
      isError: channelsQuery.isError,
      error: channelsQuery.error as Error | null,
      connectYouTubeChannel,
      deleteChannel: deleteChannelMutation.mutateAsync,
      isDeleting: deleteChannelMutation.isPending,
      refetch: refresh,
      query: channelsQuery,
    }),
    [
      channelsQuery,
      connectYouTubeChannel,
      deleteChannelMutation.isPending,
      deleteChannelMutation.mutateAsync,
      refresh,
    ]
  )
}
