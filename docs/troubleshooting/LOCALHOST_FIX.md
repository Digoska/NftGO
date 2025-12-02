# Fix "Safari can't connect to localhost" Error

## Problem
After Google Sign In, you're redirected to `localhost` which doesn't work on mobile. Safari shows: "Safari can't open the page because it couldn't connect to the server."

## Root Cause
The OAuth redirect URL was set to `localhost` instead of the app's deep link scheme (`nftgo://`).

## Solution

### ✅ Code Fix (Already Done)
I've updated the code to use `nftgo://` as the redirect URL instead of `localhost`.

### ⚠️ Supabase Configuration (YOU NEED TO DO THIS)

1. **Go to Supabase Dashboard**
   - Open [Supabase Dashboard](https://app.supabase.com)
   - Select your **NftGO** project

2. **Configure URL Settings**
   - Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to:
     ```
     nftgo://
     ```
   - Under **Redirect URLs**, add:
     ```
     nftgo://
     ```
   - Click **SAVE**

3. **Verify Google Provider**
   - Go to **Authentication** → **Providers** → **Google**
   - Make sure it's **Enabled**
   - Client ID and Secret are correct
   - Click **SAVE**

### How It Works Now

1. User clicks "Sign in with Google"
2. Google OAuth opens in browser
3. User signs in with Google
4. Google redirects to Supabase: `https://wkpgupdorbgcthmjoybe.supabase.co/auth/v1/callback`
5. Supabase redirects to app: `nftgo://#access_token=...&refresh_token=...`
6. App opens via deep link and extracts tokens
7. User is signed in! ✅

### Testing

After configuring Supabase:
1. Restart your Expo app
2. Try Google Sign In
3. After signing in with Google, the app should automatically open (not Safari)
4. You should be logged in!

### If It Still Doesn't Work

1. **Check Supabase Logs**
   - Dashboard → **Logs** → **Auth Logs**
   - Look for the redirect URL being used

2. **Verify Deep Link**
   - Make sure `scheme: 'nftgo'` is in `app.config.js` ✅ (already set)

3. **Clear App Cache**
   - Close and reopen the app
   - Or reinstall the app

4. **Check Redirect URL Format**
   - Should be exactly: `nftgo://`
   - No trailing slash
   - No `http://` or `https://`

