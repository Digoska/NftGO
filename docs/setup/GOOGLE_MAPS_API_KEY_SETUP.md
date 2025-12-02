# Google Maps API Key Setup Guide

## Step 1: Get Your Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Click "New Project" or select an existing one
   - Name it (e.g., "NftGO")

3. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Search for and enable:
     - **Maps SDK for iOS**
     - **Maps SDK for Android**
   - Click "Enable" for each

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key that appears

5. **Restrict the API Key (IMPORTANT for Security)**
   - Click on the newly created API key to edit it
   - Under "Application restrictions":
     - Select "iOS apps"
     - Add bundle ID: `com.nftgo.app`
     - Click "Add an item" and add Android package: `com.nftgo.app`
   - Under "API restrictions":
     - Select "Restrict key"
     - Check only:
       - Maps SDK for iOS
       - Maps SDK for Android
   - Click "Save"

## Step 2: Add to .env File

1. **Open or create `.env` file** in the project root:
   ```bash
   # If file doesn't exist, create it
   touch .env
   ```

2. **Add your Google Maps API key**:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

3. **Replace `your_google_maps_api_key_here`** with the actual API key you copied

## Step 3: Verify Setup

1. **Check that `.env` is in `.gitignore`** (it should be already)
   ```bash
   cat .gitignore | grep .env
   ```

2. **Restart your development server** after adding the key:
   ```bash
   npm start
   ```

## Example .env File

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Security Notes

⚠️ **Important:**
- Never commit your `.env` file to Git
- Never share your API key publicly
- Always restrict your API keys in Google Cloud Console
- Use different keys for development and production

## Troubleshooting

**Maps not showing?**
- Verify the API key is correct
- Check that Maps SDK APIs are enabled
- Make sure bundle ID/package restrictions match your app
- Restart the development server after adding the key

**Getting billing errors?**
- Google Maps requires a billing account (but has free tier)
- Go to "Billing" in Google Cloud Console and set up billing

