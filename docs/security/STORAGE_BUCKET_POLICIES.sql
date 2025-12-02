-- Storage Bucket Policies for Supabase
-- Run this in Supabase SQL Editor after creating buckets

-- 1. Create buckets (if they don't exist)
-- Note: Buckets must be created in Supabase Dashboard → Storage first
-- This script only sets up policies

-- ============================================
-- AVATARS BUCKET POLICIES
-- ============================================

-- Policy: Anyone can read avatars (public read)
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- NFTS BUCKET POLICIES
-- ============================================

-- Policy: Anyone can read NFTs (public read)
CREATE POLICY "NFTs are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'nfts');

-- Policy: Only authenticated users can upload NFTs (admin-only in production)
-- For MVP: Allow authenticated users, restrict to admins later
CREATE POLICY "Authenticated users can upload NFTs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'nfts' 
  AND auth.role() = 'authenticated'
);

-- Policy: Only admins can update/delete NFTs
-- Note: You'll need to create an 'admin' role or use a different check
CREATE POLICY "Admins can update NFTs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'nfts'
  -- Add admin check here (e.g., check user metadata or separate admin table)
);

CREATE POLICY "Admins can delete NFTs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'nfts'
  -- Add admin check here
);

-- ============================================
-- FILE SIZE AND TYPE RESTRICTIONS
-- ============================================

-- Note: File size and type restrictions should be enforced in:
-- 1. Client-side validation (before upload)
-- 2. Supabase Storage settings (in Dashboard)
-- 3. Edge Functions (for server-side validation)

-- Recommended limits:
-- - Avatars: Max 5MB, types: jpg, jpeg, png, webp
-- - NFTs: Max 50MB, types: jpg, jpeg, png, webp, mp4, glb, gltf, bin

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if policies exist
SELECT 
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- Check bucket existence and settings
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('avatars', 'nfts');

