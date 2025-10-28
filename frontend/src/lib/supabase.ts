/**
 * Supabase client for ClipPilot frontend
 * Provides authentication and storage access
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Create Supabase client for browser
 * Uses cookies for session management
 */
export const createClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

/**
 * Global Supabase client instance
 * Use this for client components
 */
export const supabase = createClient()

/**
 * Storage helpers
 */
export const storage = {
  /**
   * Upload file to storage bucket
   */
  upload: async (
    bucket: 'videos' | 'thumbnails' | 'assets',
    path: string,
    file: File | Blob
  ) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) throw error
    return data
  },

  /**
   * Get public URL for file
   */
  getPublicUrl: (bucket: 'videos' | 'thumbnails' | 'assets', path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  /**
   * Download file from storage
   */
  download: async (bucket: 'videos' | 'thumbnails' | 'assets', path: string) => {
    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error) throw error
    return data
  },

  /**
   * Delete file from storage
   */
  delete: async (bucket: 'videos' | 'thumbnails' | 'assets', paths: string[]) => {
    const { data, error } = await supabase.storage.from(bucket).remove(paths)

    if (error) throw error
    return data
  },

  /**
   * List files in bucket
   */
  list: async (
    bucket: 'videos' | 'thumbnails' | 'assets',
    path: string = '',
    options?: {
      limit?: number
      offset?: number
      sortBy?: { column: string; order: 'asc' | 'desc' }
    }
  ) => {
    const { data, error } = await supabase.storage.from(bucket).list(path, options)

    if (error) throw error
    return data
  },
}

/**
 * Auth helpers
 */
export const auth = {
  /**
   * Get current user
   */
  getUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) throw error
    return user
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) throw error
    return session
  },

  /**
   * Sign in with email and password
   */
  signInWithPassword: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  /**
   * Sign in with OAuth provider
   */
  signInWithOAuth: async (provider: 'google') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
    return data
  },

  /**
   * Sign out
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
    return data
  },

  /**
   * Reset password
   */
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
  },

  /**
   * Update user password
   */
  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  },
}
