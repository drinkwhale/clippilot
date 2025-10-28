# Supabase Storage Buckets Setup

## Overview
ClipPilot requires 3 storage buckets for media files.

## Buckets Configuration

### 1. videos
- **Purpose**: Rendered video files
- **Public**: No (requires authentication)
- **File size limit**: 500MB
- **Allowed MIME types**: `video/mp4`, `video/quicktime`

```sql
-- Create bucket via Supabase Dashboard or CLI
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false);

-- RLS Policy: Users can upload/view own videos
CREATE POLICY "Users can upload own videos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own videos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
```

### 2. thumbnails
- **Purpose**: Video thumbnails
- **Public**: Yes (CDN delivery)
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true);

-- RLS Policy: Users can upload own thumbnails
CREATE POLICY "Users can upload own thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can delete own thumbnails"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. assets
- **Purpose**: User-uploaded brand assets (intro/outro videos, watermarks)
- **Public**: No (requires authentication)
- **File size limit**: 50MB
- **Allowed MIME types**: `video/mp4`, `image/png`, `image/jpeg`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', false);

-- RLS Policy: Users can manage own assets
CREATE POLICY "Users can upload own assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own assets"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own assets"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
```

## File Organization

### videos/
```
{user_id}/
  {job_id}.mp4
```

### thumbnails/
```
{user_id}/
  {job_id}.jpg
```

### assets/
```
{user_id}/
  intro_{timestamp}.mp4
  outro_{timestamp}.mp4
  watermark_{timestamp}.png
```

## Setup Instructions

### Via Supabase Dashboard
1. Go to Storage section
2. Create buckets: `videos`, `thumbnails`, `assets`
3. Set public access for `thumbnails` only
4. Run RLS policies from above SQL

### Via Supabase CLI
```bash
supabase storage buckets create videos --public=false
supabase storage buckets create thumbnails --public=true
supabase storage buckets create assets --public=false
```

## Security Notes
- All uploads require authentication via Supabase JWT
- File paths include `user_id` for isolation
- RLS policies prevent cross-user access
- Public bucket (`thumbnails`) still requires upload auth
