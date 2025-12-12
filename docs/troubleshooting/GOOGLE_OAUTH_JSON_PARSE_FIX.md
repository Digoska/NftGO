# Fix: JSON Parse Error with Google OAuth in Xcode Build

## Problem

When trying to sign in with Google in a native Xcode build, you get:
```
JSON Parse error: Unexpected character: o
```

But it works fine in Expo Go.

## Root Cause

The JSON parse error occurs when:
1. `supabase.auth.signInWithOAuth()` makes an HTTP request to Supabase's OAuth endpoint
2. The server returns an HTML error page (instead of JSON) due to:
   - Network connectivity issues
   - OAuth misconfiguration in Supabase
   - Server errors
3. The Supabase client tries to parse the HTML response as JSON → "Unexpected character: o" (from `<o...` in HTML)

## Solutions

### ✅ Solution 1: Verify Supabase OAuth Configuration

1. **Go to Supabase Dashboard**
   - Open [Supabase Dashboard](https://app.supabase.com)
   - Select your project

2. **Check OAuth Provider**
   - Go to **Authentication** → **Providers** → **Google**
   - Make sure it's **Enabled**
   - Verify **Client ID** and **Client Secret** are correct
   - Click **SAVE**

3. **Check URL Configuration**
   - Go to **Authentication** → **URL Configuration**
   - **Site URL** should be: `nftgo://`
   - **Redirect URLs** should include: `nftgo://`
   - Click **SAVE**

4. **Check Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - **APIs & Services** → **Credentials**
   - Find your OAuth 2.0 Client ID
   - **Authorized redirect URIs** must include:
     ```
     https://wkpgupdorbgcthmjoybe.supabase.co/auth/v1/callback
     ```
   - Click **SAVE**

### ✅ Solution 2: Rebuild with Updated Config

After making changes:

1. **Clean and rebuild:**
   ```bash
   cd /Users/digo/Documents/nft-go
   rm -rf ios
   npx expo prebuild --platform ios --clean
   ```

2. **In Xcode:**
   - **Product** → **Clean Build Folder** (⇧⌘K)
   - **Product** → **Run** (⌘R)

### ✅ Solution 3: Check Network Connection

The error can also occur if:
- Your iPhone can't reach Supabase servers
- Firewall/VPN blocking requests
- Network timeout

**Test:**
1. Open Safari on your iPhone
2. Navigate to: `https://wkpgupdorbgcthmjoybe.supabase.co`
3. Should load without errors

### ✅ Solution 4: Enhanced Error Handling (Already Added)

The code now includes:
- Better error messages for JSON parse errors
- Verification of Supabase config before OAuth
- Detailed logging for debugging

**Check Xcode console logs** for:
```
🔐 Google OAuth redirect URL: nftgo://
✅ Found Supabase URL in Constants.extra
✅ Found Supabase Key in Constants.extra
```

If you see `❌ Supabase credentials missing`, rebuild with prebuild.

## Debugging

### Check Xcode Console Logs

Look for these specific logs:

```
🔐 Google OAuth redirect URL: nftgo://
❌ Google OAuth error: [error details]
```

### Check Supabase Logs

1. Go to Supabase Dashboard
2. **Logs** → **Auth Logs**
3. Look for OAuth attempts and any errors

### Test OAuth Flow Manually

1. Open Safari on iPhone
2. Navigate to:
   ```
   https://wkpgupdorbgcthmjoybe.supabase.co/auth/v1/authorize?provider=google
   ```
3. Should redirect to Google sign-in
4. After sign-in, should redirect back to `nftgo://`

If this fails, OAuth is misconfigured in Supabase.

## Common Issues

### Issue: "Unsupported provider: missing OAuth secret"

**Solution:** Google OAuth is not enabled in Supabase. Enable it in **Authentication** → **Providers** → **Google**.

### Issue: "redirect_uri_mismatch"

**Solution:** Google Cloud Console redirect URI doesn't match Supabase callback URL. Make sure it's exactly:
```
https://wkpgupdorbgcthmjoybe.supabase.co/auth/v1/callback
```

### Issue: Network timeout

**Solution:** Check internet connection, disable VPN/firewall, or try different network.

## Prevention

**Always verify OAuth is configured before building:**
1. Check Supabase dashboard
2. Check Google Cloud Console
3. Run `npx expo prebuild` before building in Xcode
4. Test in Expo Go first (easier to debug)

---

**Fixed in:** Commit with enhanced error handling for OAuth


