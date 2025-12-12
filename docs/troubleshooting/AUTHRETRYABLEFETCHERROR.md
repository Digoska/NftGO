# Fix: AuthRetryableFetchError with JSON Parse Error

## Problem

You're getting this error:
```
❌ Google login error: AuthRetryableFetchError: JSON Parse error: Unexpected character: o
status: 0
```

## What This Means

`AuthRetryableFetchError` with `status: 0` means:
1. **Network request failed** - The app couldn't reach Supabase servers
2. **Non-JSON response** - Supabase returned HTML/text instead of JSON
3. **Request blocked** - Network/CORS/firewall issue

The "Unexpected character: o" suggests the response starts with "o" (like "ok", "object", or HTML like `<o...`).

## Common Causes

### 1. Supabase URL Incorrect in Native Build

The Supabase URL might not be properly embedded in the native iOS build.

**Check:**
- Run the app and check Xcode console logs for:
  ```
  ✅ Found Supabase URL in Info.plist
  ```
  or
  ```
  ✅ Found Supabase URL in Constants.extra
  ```

**Fix:**
```bash
cd /Users/digo/Documents/nft-go
npx expo prebuild --platform ios --clean
```

Then rebuild in Xcode.

### 2. Network Connectivity Issue

Your iPhone might not be able to reach Supabase servers.

**Test:**
1. Open Safari on iPhone
2. Navigate to: `https://REDACTED_SUPABASE_URL`
3. Should load without errors

**If it fails:**
- Check internet connection
- Disable VPN/proxy
- Try different network (WiFi vs cellular)

### 3. Supabase OAuth Not Configured

If Google OAuth isn't enabled in Supabase, it might return an HTML error page.

**Fix:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. **Authentication** → **Providers** → **Google**
3. Make sure **Enabled** is ON
4. Enter Client ID and Secret
5. Click **SAVE**

### 4. CORS/Network Blocking

Some networks or security settings might block OAuth requests.

**Check:**
- Corporate/firewall blocking requests
- VPN interfering with requests
- iOS network permissions

### 5. Supabase Server Issue

Rare, but Supabase might be down or returning errors.

**Check:**
- [Supabase Status](https://status.supabase.com/)
- Try accessing Supabase dashboard
- Check Supabase logs

## Solution Steps

### Step 1: Verify Supabase Config in App

Run the app and check Xcode console for these logs:

```
🔧 Supabase Config:
  URL: https://REDACTED_SUPABASE_URL...
  Key: eyJhbGciOiJIUzI1NiIs...
  Platform: ios
  From Info.plist: Yes
```

If you see `❌ MISSING`, rebuild with prebuild.

### Step 2: Test Network Connection

**On your iPhone:**
1. Open Safari
2. Go to: `https://REDACTED_SUPABASE_URL`
3. Should load (might show API docs or error, but should connect)

**If it doesn't load:**
- Check internet connection
- Try different network
- Disable VPN

### Step 3: Verify Supabase OAuth Configuration

1. **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
   - ✅ Enabled: ON
   - ✅ Client ID: `823161628768-bhqc988srlk3khfom66i2v8727lf041l.apps.googleusercontent.com`
   - ✅ Client Secret: `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`

2. **Authentication** → **URL Configuration**
   - Site URL: `nftgo://`
   - Redirect URLs: `nftgo://` and `nftgo://*`

3. Click **SAVE** on both pages

### Step 4: Rebuild App

```bash
cd /Users/digo/Documents/nft-go
npx expo prebuild --platform ios --clean
```

Then in Xcode:
- Clean Build Folder (⇧⌘K)
- Build and Run (⌘R)

### Step 5: Check Enhanced Logs

The updated code now provides detailed logging. When you try Google sign-in, check Xcode console for:

```
🔐 Calling signInWithOAuth...
🔐 Provider: google
🔐 Redirect URL: nftgo://
🔐 Supabase Base URL: https://REDACTED_SUPABASE_URL
```

If it fails, you'll see detailed error information.

## Debugging

### Check Xcode Console

Look for these logs when clicking "Sign in with Google":

```
🔐 Calling signInWithOAuth...
❌ Google OAuth error: [error details]
❌ Error name: AuthRetryableFetchError
❌ Error status: 0
❌ Error message: JSON Parse error: Unexpected character: o
```

### Check Supabase Logs

1. Supabase Dashboard → **Logs** → **Auth Logs**
2. Look for OAuth attempts
3. Check for errors or unusual activity

### Test OAuth Endpoint Manually

**Note:** Direct URL access will show "requested path is invalid" - this is normal. The URL needs proper query parameters from Supabase.

But you can test if Supabase is reachable:
```bash
curl -I https://REDACTED_SUPABASE_URL
```

Should return HTTP 200 or similar (not connection refused).

## If Still Not Working

1. **Check if it works in Expo Go:**
   - If it works in Expo Go but not Xcode build, it's likely a config embedding issue
   - Rebuild with prebuild

2. **Check Supabase status:**
   - [Supabase Status Page](https://status.supabase.com/)
   - Check your project dashboard for any warnings

3. **Try email/password login:**
   - If email/password works but OAuth doesn't, it's OAuth-specific
   - Verify OAuth configuration in Supabase

4. **Check network on device:**
   - Try on different network
   - Try on different device
   - Check if other network requests work in the app

5. **Clear app data:**
   - Delete and reinstall app
   - Clear app cache

---

**Enhanced error handling added:** The app now provides more specific error messages for network errors vs configuration errors.


