/**
 * TypeScript types for Supabase database schema
 * Generated from data-model.md
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          plan: 'free' | 'pro' | 'agency'
          oauth_provider: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          plan?: 'free' | 'pro' | 'agency'
          oauth_provider?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          plan?: 'free' | 'pro' | 'agency'
          oauth_provider?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          is_active?: boolean
        }
      }
      channels: {
        Row: {
          id: string
          user_id: string
          yt_channel_id: string
          channel_name: string
          channel_thumbnail: string | null
          access_token_meta: Json
          token_expires_at: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          yt_channel_id: string
          channel_name: string
          channel_thumbnail?: string | null
          access_token_meta: Json
          token_expires_at: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          yt_channel_id?: string
          channel_name?: string
          channel_thumbnail?: string | null
          access_token_meta?: Json
          token_expires_at?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          user_id: string
          name: string
          brand_config_json: Json
          is_system_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          brand_config_json?: Json
          is_system_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          brand_config_json?: Json
          is_system_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          channel_id: string | null
          template_id: string | null
          status: 'queued' | 'generating' | 'rendering' | 'uploading' | 'done' | 'failed'
          prompt: string
          video_length_sec: number
          tone: string
          script: string | null
          srt: string | null
          metadata_json: Json | null
          output_video_url: string | null
          output_thumbnail_url: string | null
          youtube_video_id: string | null
          error_message: string | null
          render_started_at: string | null
          render_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          channel_id?: string | null
          template_id?: string | null
          status?: 'queued' | 'generating' | 'rendering' | 'uploading' | 'done' | 'failed'
          prompt: string
          video_length_sec?: number
          tone?: string
          script?: string | null
          srt?: string | null
          metadata_json?: Json | null
          output_video_url?: string | null
          output_thumbnail_url?: string | null
          youtube_video_id?: string | null
          error_message?: string | null
          render_started_at?: string | null
          render_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          channel_id?: string | null
          template_id?: string | null
          status?: 'queued' | 'generating' | 'rendering' | 'uploading' | 'done' | 'failed'
          prompt?: string
          video_length_sec?: number
          tone?: string
          script?: string | null
          srt?: string | null
          metadata_json?: Json | null
          output_video_url?: string | null
          output_thumbnail_url?: string | null
          youtube_video_id?: string | null
          error_message?: string | null
          render_started_at?: string | null
          render_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'free' | 'pro' | 'agency'
          status: 'active' | 'cancelled' | 'past_due' | 'unpaid'
          provider_customer_id: string | null
          provider_subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan?: 'free' | 'pro' | 'agency'
          status?: 'active' | 'cancelled' | 'past_due' | 'unpaid'
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: 'free' | 'pro' | 'agency'
          status?: 'active' | 'cancelled' | 'past_due' | 'unpaid'
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          job_id: string | null
          action_type: string
          tokens_in: number | null
          tokens_out: number | null
          render_duration_sec: number | null
          api_cost_usd: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id?: string | null
          action_type: string
          tokens_in?: number | null
          tokens_out?: number | null
          render_duration_sec?: number | null
          api_cost_usd?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string | null
          action_type?: string
          tokens_in?: number | null
          tokens_out?: number | null
          render_duration_sec?: number | null
          api_cost_usd?: number | null
          created_at?: string
        }
      }
      webhooks: {
        Row: {
          id: string
          type: string
          provider: string
          payload_json: Json
          processed: boolean
          processed_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          provider: string
          payload_json: Json
          processed?: boolean
          processed_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          provider?: string
          payload_json?: Json
          processed?: boolean
          processed_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      plan_type: 'free' | 'pro' | 'agency'
      job_status: 'queued' | 'generating' | 'rendering' | 'uploading' | 'done' | 'failed'
      subscription_status: 'active' | 'cancelled' | 'past_due' | 'unpaid'
    }
  }
}
