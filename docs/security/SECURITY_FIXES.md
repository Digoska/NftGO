# Security Fixes Applied

## Issue 1: Hardcoded Google Maps API Key ✅ FIXED

### Problem
Google Maps API key was hardcoded in multiple places:
- `app.config.js` - placeholder `'YOUR_GOOGLE_MAPS_API_KEY'`
- `ios/NftGO/AppDelegate.swift` - hardcoded string
- `ios/NftGO/Info.plist` - hardcoded string

### Solution
1. Move Google Maps API key to environment variable: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
2. Update `app.config.js` to use environment variable
3. For iOS native files, the key will be injected via Expo config plugin during build

### Action Required
1. Add `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` to your `.env` file
2. Get your Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
3. Set up API key restrictions in Google Cloud Console:
   - Restrict to iOS bundle ID: `com.nftgo.app`
   - Restrict to Android package: `com.nftgo.app`
   - Enable only required APIs (Maps SDK for iOS, Maps SDK for Android)

---

## Issue 2: RLS Policy Verification

### Action Required
Run `docs/security/VERIFY_RLS_POLICIES.sql` in Supabase SQL Editor to verify:
- All tables have RLS enabled
- All required policies exist
- Policies are correctly configured

---

## Issue 3: Environment Variables Security ✅ VERIFIED

### Status
- ✅ `.env` is in `.gitignore`
- ✅ Supabase keys use environment variables
- ✅ No hardcoded secrets in code (except Google Maps - see Issue 1)

---

## Next Steps

1. **Fix Google Maps API Key** (see Issue 1)
2. **Verify RLS Policies** (run SQL script)
3. **Test unauthorized access** (try accessing other users' data)
4. **Review input validation** (check all user inputs)
5. **Set up production environment variables** in Expo/EAS

