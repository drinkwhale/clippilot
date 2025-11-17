-- Migration: Add oauth_configs table and is_admin field to users
-- Date: 2025-11-18
-- Description:
--   1. Add is_admin field to users table for admin role management
--   2. Create oauth_configs table for storing OAuth credentials

-- ============================================================================
-- Step 1: Add is_admin field to users table
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.is_admin IS 'Whether the user has admin privileges';

-- ============================================================================
-- Step 2: Create oauth_configs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL DEFAULT 'youtube',
    client_id TEXT NOT NULL,
    client_secret_encrypted TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    config_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE oauth_configs IS 'OAuth configuration for external services (YouTube, etc.)';
COMMENT ON COLUMN oauth_configs.provider IS 'OAuth provider name (youtube, google, etc.)';
COMMENT ON COLUMN oauth_configs.client_id IS 'OAuth client ID from provider';
COMMENT ON COLUMN oauth_configs.client_secret_encrypted IS 'Encrypted OAuth client secret (TODO: use pgcrypto)';
COMMENT ON COLUMN oauth_configs.redirect_uri IS 'OAuth redirect URI';
COMMENT ON COLUMN oauth_configs.config_meta IS 'Additional configuration (scopes, etc.)';
COMMENT ON COLUMN oauth_configs.is_active IS 'Whether this configuration is active';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_oauth_configs_provider ON oauth_configs(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_configs_is_active ON oauth_configs(is_active);

-- Add unique constraint for active provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_configs_active_provider
    ON oauth_configs(provider)
    WHERE is_active = true;

-- ============================================================================
-- Step 3: Create updated_at trigger for oauth_configs
-- ============================================================================

CREATE OR REPLACE FUNCTION update_oauth_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_oauth_configs_updated_at
    BEFORE UPDATE ON oauth_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_oauth_configs_updated_at();

-- ============================================================================
-- Rollback script (for reference)
-- ============================================================================

-- To rollback this migration, run:
-- DROP TRIGGER IF EXISTS trigger_oauth_configs_updated_at ON oauth_configs;
-- DROP FUNCTION IF EXISTS update_oauth_configs_updated_at();
-- DROP TABLE IF EXISTS oauth_configs;
-- ALTER TABLE users DROP COLUMN IF EXISTS is_admin;
