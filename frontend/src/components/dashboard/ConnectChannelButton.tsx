/**
 * ConnectChannelButton component
 * Triggers YouTube OAuth connection flow.
 */

'use client'

import { useState } from 'react'

interface ConnectChannelButtonProps {
  onConnect: () => Promise<void>
}

export function ConnectChannelButton({ onConnect }: ConnectChannelButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await onConnect()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'YouTube 인증을 시작하는 중 오류가 발생했습니다.'
      setError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-400"
      >
        {isLoading ? 'YouTube로 이동 중…' : 'YouTube 채널 연결'}
      </button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-neutral-500">
        버튼을 클릭하면 Google OAuth 페이지로 이동하여 업로드 권한을 승인합니다.
      </p>
    </div>
  )
}
