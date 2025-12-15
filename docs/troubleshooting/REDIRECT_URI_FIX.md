# Fix redirect_uri_mismatch Error

## Problem
You're getting `Error 400: redirect_uri_mismatch` when trying to sign in with Google.

This means the redirect URI in Google Cloud Console doesn't match what Supabase is sending.

## Solution

### The redirect URI that Supabase sends to Google is:
```
https://your-project.supabase.co/auth/v1/callback
```

### Steps to Fix:

#### 1. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **nftgo-479510**
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, make sure you have EXACTLY:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
6. **IMPORTANT**: 
   - No trailing slash
   - Must be exactly `https://` (not `http://`)
   - Must match exactly (case-sensitive)
7. Click **SAVE**

#### 2. Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Go to **Authentication** → **URL Configuration**
3. Make sure **Site URL** is set to:
   ```
   nftgo://
   ```
   Or your app's scheme URL
4. Under **Redirect URLs**, add:
   ```
   nftgo://
   exp://localhost:8081
   ```
5. Click **SAVE**

#### 3. Verify in Supabase
1. Go to **Authentication** → **Providers** → **Google**
2. Make sure it's **Enabled**
3. Client ID and Secret are correct
4. Click **SAVE**

### Common Issues:

❌ **Wrong**: `https://your-project.supabase.co/auth/v1/callback/` (trailing slash)
✅ **Correct**: `https://your-project.supabase.co/auth/v1/callback`

❌ **Wrong**: `http://your-project.supabase.co/auth/v1/callback` (http instead of https)
✅ **Correct**: `https://your-project.supabase.co/auth/v1/callback`

❌ **Wrong**: Multiple redirect URIs with slight differences
✅ **Correct**: Only the exact URL above

### After Fixing:

1. Wait 1-2 minutes for changes to propagate
2. Clear your app cache
3. Restart Expo app
4. Try Google Sign In again

### Still Not Working?

Check Supabase logs:
1. Supabase Dashboard → **Logs** → **Auth Logs**
2. Look for the exact redirect URI being sent
3. Make sure it matches exactly in Google Cloud Console

