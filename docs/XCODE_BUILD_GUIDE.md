# Building NftGO in Xcode for iPhone

## Quick Steps

### 0. ⚠️ CRITICAL: Start Metro Bundler First!

**Before building in Xcode, you MUST start Metro bundler:**

```bash
cd /Users/digo/Documents/nft-go
npm start
```

**Keep this terminal running!** The app needs Metro to load JavaScript code.

**Why?** In DEBUG mode, the app connects to Metro bundler instead of using a bundled JS file. Without Metro running, you'll get:
```
No script URL provided. Make sure the packager is running...
```

### 1. Open Project in Xcode
The project should already be open. If not:
```bash
open ios/NftGO.xcworkspace
```

**IMPORTANT:** Always open `.xcworkspace`, NOT `.xcodeproj`!

### 2. Select Your iPhone Device

In Xcode:
1. At the top toolbar, click on the device selector (next to "NftGO")
2. Under "iOS Device" or "Your iPhone", select your connected iPhone
3. Make sure your iPhone is:
   - Connected via USB cable
   - Unlocked
   - Trust this computer (if prompted)

### 3. Configure Signing

1. In Xcode, click on **"NftGO"** project in the left sidebar
2. Select **"NftGO"** target
3. Go to **"Signing & Capabilities"** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** (your Apple Developer account)
6. Xcode will automatically generate a provisioning profile

**If you don't have an Apple Developer account:**
- You can still build and test for 7 days with a free Apple ID
- Go to Xcode → Preferences → Accounts → Add Apple ID
- Then select it in the Team dropdown

### 4. Build and Run

1. Press **⌘ + R** (or click the Play button)
2. First build may take 5-10 minutes
3. If prompted, enter your Mac password for code signing
4. On your iPhone, go to **Settings → General → VPN & Device Management**
5. Trust the developer certificate (your name/email)
6. App should launch on your iPhone!

## Troubleshooting

### Error: "No script URL provided" / "Make sure the packager is running"

**This is the most common error!**

**Solution:**
1. **Start Metro bundler in a terminal:**
   ```bash
   cd /Users/digo/Documents/nft-go
   npm start
   ```
2. **Wait for Metro to start** (you'll see "Metro waiting on...")
3. **Keep the terminal open** - don't close it!
4. **Make sure your iPhone and Mac are on the same Wi-Fi network**
5. **Try building again in Xcode** (⌘ + R)

**Alternative: Use Release Build (no Metro needed)**
1. In Xcode: Product → Scheme → Edit Scheme
2. Select "Run" → Info tab
3. Change "Build Configuration" from "Debug" to "Release"
4. Build again (but you won't get hot reload)

**Best Practice:** Always keep Metro running in a separate terminal when developing.

### Error: "No signing certificate found"

**Solution:**
1. Xcode → Preferences → Accounts
2. Select your Apple ID
3. Click **"Download Manual Profiles"**
4. Go back to Signing & Capabilities
5. Select your Team again

### Error: "Provisioning profile doesn't match"

**Solution:**
1. In Signing & Capabilities
2. Uncheck "Automatically manage signing"
3. Check it again
4. Select your Team
5. Let Xcode regenerate the profile

### Error: "Device not connected"

**Solution:**
1. Make sure iPhone is unlocked
2. Trust this computer (if prompted on iPhone)
3. Check USB cable connection
4. In Xcode: Window → Devices and Simulators
5. Make sure your iPhone appears in the list

### Error: "Bundle identifier already exists"

**Solution:**
The bundle ID `com.nftgo.app` might be taken. Change it:
1. Project → Target → General
2. Change **Bundle Identifier** to `com.nftgo.app.yourname` (or your own)
3. Make sure it matches in **Signing & Capabilities**

### Build Takes Forever

**First build is always slow:**
- Installing CocoaPods dependencies
- Compiling React Native
- Building native modules
- Subsequent builds are much faster

**Wait for it to complete** - first build can take 10-15 minutes.

## What Gets Built

The Xcode build creates:
- Native iOS app with all Expo modules
- All React Native dependencies
- Full access to device features (location, camera, etc.)
- Works with all 3D models (GLB/GLTF)

## Running the App

After first successful build:
- Press **⌘ + R** to rebuild and run
- Or use Xcode's **Product → Run** menu
- The app will install on your iPhone and launch automatically

## Notes

- **Metro bundler must be running** for DEBUG builds
- **First build:** 10-15 minutes (compiling everything)
- **Subsequent builds:** 2-5 minutes (incremental)
- **Debug builds:** Slower, includes debugging symbols, requires Metro
- **Release builds:** Faster, optimized, but harder to debug, no Metro needed
- **Same Wi-Fi:** iPhone and Mac must be on the same network for Metro connection

---

**Need help?** Check Xcode console for specific error messages.

