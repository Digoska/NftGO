# Google OAuth Setup for NftGO

## Your Google OAuth Credentials

✅ **You already have your Google OAuth credentials!**

- **Client ID**: `823161628768-bhqc988srlk3khfom66i2v8727lf041l.apps.googleusercontent.com`
- **Client Secret**: `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`
- **Project ID**: `nftgo-479510`

## Step-by-Step Setup in Supabase

### Step 1: Open Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **NftGO** project
3. Navigate to **Authentication** → **Providers**

### Step 2: Configure Google Provider

1. Find **Google** in the providers list
2. Click the toggle to **Enable** it
3. Enter your credentials:
   - **Client ID (for OAuth)**: 
     ```
     823161628768-bhqc988srlk3khfom66i2v8727lf041l.apps.googleusercontent.com
     ```
   - **Client Secret (for OAuth)**: 
     ```
     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
     ```

### Step 3: Add Redirect URL in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **nftgo-479510**
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, click **+ ADD URI** and add:
   ```
   https://REDACTED_SUPABASE_URL/auth/v1/callback
   ```
6. Click **SAVE**

### Step 4: Save and Test

1. Click **Save** in Supabase
2. Restart your Expo app
3. Try Google Sign In - it should work now! ✅

## Your Redirect URL

✅ **Your Supabase callback URL:**
```
https://REDACTED_SUPABASE_URL/auth/v1/callback
```

Make sure this exact URL is added to Google Cloud Console!

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches:
  `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### Error: "invalid_client"
- Double-check that Client ID and Client Secret are correct
- Make sure there are no extra spaces when copying

### Still not working?
- Wait a few minutes after saving (Google OAuth can take time to propagate)
- Clear app cache and restart
- Check Supabase logs: Dashboard → Logs → Auth Logs

## Next Steps

After Google is working, you can set up Apple Sign In (see `OAUTH_SETUP.md`).

