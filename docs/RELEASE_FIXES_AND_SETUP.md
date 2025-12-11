# Release Build Configuration & Troubleshooting Guide

This document details the critical configurations required for the **Release Build** (APK) of NftGO, specifically focusing on **Authentication** and **Map Functionality**. These features behave differently in release mode compared to Expo Go or Debug builds.

## 1. Authentication & Environment Variables

### The Problem
In Expo Go (development), environment variables from `.env` are loaded dynamically at runtime. However, in a **Release Build (APK)**, standard `process.env` lookups often fail because the `.env` file is not bundled inside the APK for security and architectural reasons.

**Symptoms of Failure:**
- **Error:** `[AuthUnknownError: JSON Parse error: Unexpected character: o]`
- **Cause:** `process.env.EXPO_PUBLIC_SUPABASE_URL` is undefined. The Supabase client defaults to a relative URL (or empty), causing the network request to hit a fallback (like `localhost` or an error page), returning HTML (starts with `<` or `o` from "offline") instead of JSON.

### The Solution
We implemented **build-time inlining** of environment variables using Babel. This forces the actual values of the variables to be written directly into the JavaScript bundle during compilation.

#### Configuration Steps
1.  **Install Plugin:**
    ```bash
    npm install --save-dev babel-plugin-transform-inline-environment-variables
    ```

2.  **Configure `babel.config.js`:**
    We added the plugin and whitelisted the specific variables we need.
    ```javascript
    plugins: [
      ['transform-inline-environment-variables', {
        include: [
          'EXPO_PUBLIC_SUPABASE_URL',
          'EXPO_PUBLIC_SUPABASE_ANON_KEY',
          'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'
        ]
      }],
      // ... other plugins
    ]
    ```

3.  **Supabase Client (`lib/supabase.ts`):**
    We added robust checks to ensure the URL is valid before attempting requests, preventing vague JSON errors.

---

## 2. Map Functionality (Android)

### The Problem
The Map view crashes immediately upon opening in the Release build.

**Symptoms of Failure:**
- **Error:** `FATAL EXCEPTION: main ... java.lang.IllegalStateException: API key not found`
- **Error:** `Element type is invalid: expected a string...` (when trying to use incorrect providers).

### Understanding Map Providers
- **iOS:** Uses **Apple Maps** by default. It is free and built into the OS. No API key required.
- **Android:** Uses **Google Maps SDK** by default. This **STRICTLY REQUIRES** a valid Google Maps API Key. There is no "keyless" default map on Android for third-party apps.

### The Solution
We configured the app to use the standard Google Maps provider with a valid API Key injected into the Android Manifest.

#### Configuration Steps
1.  **AndroidManifest.xml (`android/app/src/main/AndroidManifest.xml`):**
    We manually added the API Key metadata tag inside the `<application>` block.
    ```xml
    <meta-data
        android:name="com.google.android.geo.API_KEY"
        android:value="YOUR_API_KEY_HERE"/>
    ```

2.  **App Configuration (`app.config.js`):**
    While Expo handles this automatically in managed workflows, for bare/prebuild workflows, editing the `AndroidManifest.xml` directly or ensuring `app.config.js` has the correct `android.config.googleMaps.apiKey` field is crucial.

3.  **Map Component (`app/(tabs)/map.tsx`):**
    We reverted to using the default provider settings (which maps to Google Maps on Android) after determining that OpenStreetMap (`osmdroid`) required complex native configuration that was unstable in the current build environment.

### Why not OpenStreetMap (OSM)?
While OSM is free and requires no key, integrating it via `react-native-maps` on Android requires specific native dependencies (`org.osmdroid`) and configuration changes that caused "Invalid Element" JavaScript errors during our attempts. Given the goal of a stable release, using the standard Google Maps SDK with a key is the most reliable path.

---

## 3. Summary of Files Modified

| File | Purpose |
|------|---------|
| `babel.config.js` | Inlines env vars (`SUPABASE_URL`, etc.) into the JS bundle. |
| `lib/supabase.ts` | Debug logging and validation for env vars. |
| `android/app/src/main/AndroidManifest.xml` | Adds `com.google.android.geo.API_KEY`. |
| `android/app/build.gradle` | (Optional) Added `osmdroid` dependency (can be removed if sticking to Google Maps). |
| `app/(tabs)/map.tsx` | Cleaned up map provider logic to use system defaults. |

## 4. How to Rebuild

After changing environment variables or the API key, you must **rebuild the native binary**:

```bash
cd android
./gradlew.bat clean
./gradlew.bat assembleRelease
```

The new APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

