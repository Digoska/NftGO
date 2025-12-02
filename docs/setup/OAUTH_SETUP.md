# OAuth Setup Instructions for NftGO

## Problem
You're getting errors:
- **Google**: `"Unsupported provider: missing OAuth secret"`
- **Apple**: Gets stuck at loading

This means OAuth providers need to be configured in your Supabase dashboard.

## Solution: Configure OAuth in Supabase

### Step 1: Go to Supabase Dashboard

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers**

### Step 2: Configure Google OAuth

1. Find **Google** in the providers list
2. Click **Enable**
3. You'll need:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)

#### Getting Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   (Replace `YOUR_PROJECT_REF` with your Supabase project reference)
7. Copy **Client ID** and **Client Secret**
8. Paste them into Supabase Google provider settings

### Step 3: Configure Apple OAuth

1. Find **Apple** in the providers list
2. Click **Enable**
3. You'll need:
   - **Services ID** (from Apple Developer)
   - **Team ID** (from Apple Developer)
   - **Key ID** (from Apple Developer)
   - **Private Key** (from Apple Developer)

#### Getting Apple OAuth Credentials:

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Go to **Certificates, Identifiers & Profiles**
3. Create a **Services ID**:
   - Identifier: `com.nftgo.app.signin` (or similar)
   - Enable "Sign In with Apple"
   - Add redirect URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Create a **Key**:
   - Key Name: `NftGO Sign In Key`
   - Enable "Sign In with Apple"
   - Download the `.p8` file (this is your Private Key)
   - Note the **Key ID**
5. Get your **Team ID** from the top right of Apple Developer Portal
6. Enter all these values in Supabase Apple provider settings

### Step 4: Update Redirect URLs

In Supabase, make sure the redirect URLs include:
- `nftgo://` (for your app scheme)
- `exp://localhost:8081` (for Expo Go development)

### Step 5: Test

After configuration:
1. Restart your Expo app
2. Try Google Sign In - should work now
3. Try Apple Sign In - should work now

## Alternative: Disable OAuth (Use Email Only)

If you don't want to set up OAuth right now, you can:
1. Remove/hide the Google and Apple sign-in buttons
2. Use only email/password authentication
3. Set up OAuth later when ready

## Need Help?

- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Setup](https://developer.apple.com/sign-in-with-apple/)

