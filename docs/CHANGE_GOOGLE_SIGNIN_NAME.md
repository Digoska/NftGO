# Change Google Sign In Dialog Name

## Problem
When signing in with Google, the dialog shows "Sign in to continue to wkpgupdorbgcthmjoybe.supabase.co" instead of your app name.

## Solution: Update Google OAuth Consent Screen

The name shown in the Google Sign In dialog comes from your **Google Cloud Console OAuth consent screen**, not Supabase.

### Steps to Change It:

1. **Go to Google Cloud Console**
   - Open [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project: **nftgo-479510**

2. **Open OAuth Consent Screen**
   - Go to **APIs & Services** → **OAuth consent screen**

3. **Update App Information**
   - **App name**: Change to `NftGO` (or your preferred name)
   - **User support email**: Set to your email
   - **App logo**: (Optional) Upload your app icon
   - **App domain**: (Optional) Add your website domain
   - **Developer contact information**: Add your email

4. **Save Changes**
   - Click **Save and Continue**
   - Complete any required fields
   - Click **Save**

5. **Wait for Changes**
   - Changes can take a few minutes to propagate
   - Test the sign-in dialog again

### What Will Change:

**Before:**
- Dialog shows: "Sign in to continue to wkpgupdorbgcthmjoybe.supabase.co"

**After:**
- Dialog shows: "Sign in to continue to NftGO" (or your app name)

## Additional Settings (Optional)

### Add App Logo
1. In OAuth consent screen
2. Under **App logo**, click **Upload**
3. Upload your app icon (recommended: 120x120px, PNG/JPG)

### Add Privacy Policy & Terms URLs
1. Scroll to **Authorized domains**
2. Add your domain (if you have one)
3. Add **Privacy Policy URL** and **Terms of Service URL** (required for production)
4. These will appear on the consent screen

## Note

- The Supabase URL (`wkpgupdorbgcthmjoybe.supabase.co`) will still be in the OAuth callback flow, but the **user-facing dialog** will show your app name
- For production apps, Google requires Privacy Policy and Terms of Service URLs
- Changes may take a few minutes to appear in the sign-in dialog

