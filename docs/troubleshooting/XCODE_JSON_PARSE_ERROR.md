# Fix: "JSON Parse error: Unexpected character: o" in Xcode Build

## Problem

When building the app from Xcode and running on iPhone, you get:
```
JSON Parse error: Unexpected character: o
```

This happens when signing in with email/password or Google OAuth.

## Root Cause

This error occurs when:
1. Supabase environment variables aren't properly embedded in the native iOS build
2. Supabase client tries to make API calls without valid credentials
3. Server returns an HTML error page (starting with `<o...` like `<object>` or `<html>`)
4. Client tries to parse HTML as JSON → "Unexpected character: o"

## Solution ✅

### 1. Run Prebuild Again

After adding/changing environment variables, always run:

```bash
cd /Users/digo/Documents/nft-go
npx expo prebuild --platform ios --clean
```

This ensures:
- Supabase config is embedded into `Info.plist`
- Native project is up-to-date with latest config
- Environment variables are available at runtime

### 2. Verify Info.plist Contains Keys

Check that `ios/NftGO/Info.plist` contains:

```xml
<key>SupabaseURL</key>
<string>https://your-project.supabase.co</string>
<key>SupabaseAnonKey</key>
<string>your-anon-key-here</string>
```

If these are missing, the config plugin didn't run. Make sure:
- `.env` file exists with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `app.config.js` includes the `./plugins/withSupabaseConfig.js` plugin
- You run `expo prebuild` **before** building in Xcode

### 3. Rebuild in Xcode

After running prebuild:

1. Close Xcode if it's open
2. Run prebuild:
   ```bash
   npx expo prebuild --platform ios
   ```
3. Open Xcode:
   ```bash
   open ios/NftGO.xcworkspace
   ```
4. Clean build folder: **Product → Clean Build Folder** (⇧⌘K)
5. Build and run again: **⌘ + R**

### 4. Check Console Logs

When the app starts, look for these logs:

```
🔧 Supabase Config:
  URL: https://your-project.supabase.co...
  Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your anon key)
  Platform: ios
  From Info.plist: Yes  ← Should say "Yes"
```

If you see `❌ MISSING`, the config wasn't embedded properly.

## How It Works

### Config Plugin (`plugins/withSupabaseConfig.js`)

The plugin reads Supabase credentials from:
1. `app.config.js` → `extra.supabaseUrl` and `extra.supabaseAnonKey`
2. These come from `.env` file → `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

The plugin then embeds these values into `Info.plist` so they're available in native builds.

### Runtime Reading (`lib/supabase.ts`)

At runtime, the code tries multiple sources (in order):
1. **Info.plist** (native builds) - `Constants.expoConfig.ios.infoPlist.SupabaseURL`
2. **Constants.extra** (Expo builds) - `Constants.expoConfig.extra.supabaseUrl`
3. **process.env** (development/Metro) - `process.env.EXPO_PUBLIC_SUPABASE_URL`

## Why Expo Go Works But Xcode Doesn't

- **Expo Go**: Uses Metro bundler which has access to `process.env` variables
- **Xcode Native Build**: Doesn't have `process.env` - needs values embedded in `Info.plist`

## Prevention

**Always run `expo prebuild` before building in Xcode** if you:
- Change `.env` file
- Modify `app.config.js`
- Update environment variables
- Pull changes from git that modify config

## Still Not Working?

1. **Delete iOS folder and regenerate:**
   ```bash
   rm -rf ios
   npx expo prebuild --platform ios
   ```

2. **Check .env file exists:**
   ```bash
   cat .env | grep SUPABASE
   ```

3. **Verify plugin is loaded:**
   ```bash
   grep "withSupabaseConfig" app.config.js
   ```

4. **Check Xcode console logs** for the Supabase config debug output

---

**Fixed in:** Commit where `plugins/withSupabaseConfig.js` was added


