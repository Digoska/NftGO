# NftGO 3D Model System Documentation

## Overview

NftGO uses a hybrid approach to display high-fidelity 3D models with textures and animations in Expo Go. We use `react-native-webview` to wrap Google's `<model-viewer>`, bypassing native Three.js limitations regarding Blob/Texture loading.

## Component: `WebViewModel.tsx`

- **Technology:** WebView + `<model-viewer>`
- **Supports:** GLB/GLTF, Animations, Textures, Camera Controls
- **Performance:** Hardware accelerated

## Usage

```tsx
import WebViewModel from '@/components/nft/WebViewModel';

// ⚠️ CRITICAL: Parent container MUST have a fixed height!
<View style={{ height: 300, width: '100%' }}>
  <WebViewModel uri={item.image_url} />
</View>
```

## Asset Requirements (Important)

1. **Format:** `.glb` (Binary GLTF)

2. **Size Limit:** 
   - **Recommended:** <5MB (optimal performance)
   - **Maximum:** <10MB (works on most devices)
   - **Hard Limit:** ~15MB (will fail on Android WebView)
   
   **Why these limits?**
   - 📱 **Android WebView Memory Constraints:** Mobile WebViews have limited heap memory (typically 32-128MB per app)
   - 🧠 **RAM Limitations:** The entire GLB file must be loaded into memory before rendering
   - ⚡ **Performance:** Larger files = slower loading, more memory usage, potential crashes
   - 🔋 **Battery Impact:** Large models drain battery faster due to increased processing
   - 📊 **Device Compatibility:** Conservative limits ensure models work on low-end devices (1-2GB RAM phones)
   
   **Can I use larger files?**
   - ✅ **iOS:** Generally handles larger files better (can go up to ~20-30MB on newer devices)
   - ⚠️ **Android:** Strict limits, especially on older/low-end devices
   - 💡 **Solution:** Optimize your models (see optimization tips below)

3. **Textures:** Must be embedded/compressed in the GLB

4. **Scale:** Apply all transforms (Ctrl+A -> Scale) in Blender before export

## Optimization Tips

If your model is too large, here's how to reduce file size:

### 1. Reduce Polygon Count
- **Target:** <200,000 polygons
- **How:** Use Blender's Decimate modifier
- **Tool:** Edit mode → Select All → Mesh → Cleanup → Decimate

### 2. Compress Textures
- **Target:** 512x512 or 1024x1024 max resolution
- **Format:** JPEG (85% quality) or WebP
- **Reduce:** Use fewer texture maps (combine diffuse + roughness if possible)

### 3. Optimize GLB Export
- **Blender Export Settings:**
  - ✅ Compress meshes
  - ✅ Remove duplicate vertices
  - ✅ Use Draco compression (if supported)
  - ✅ Bake textures (combine into single texture)

### 4. Use Texture Compression
- Compress textures before embedding in GLB
- Use tools like: ImageOptim, TinyPNG, Squoosh

### 5. Remove Unnecessary Data
- Remove unused materials
- Remove unused animations
- Remove unused meshes/objects
- Simplify geometry (reduce vertex count)

**Expected Results:**
- **Before optimization:** 20-50MB file
- **After optimization:** 2-5MB file
- **Quality:** Still looks great, just optimized! ✨

---

## Troubleshooting

- **White Screen:** 
  - Parent container has no height (must set `height` style prop)
  - OR Model file size is too big (>15MB on Android)
  - **Solution:** Optimize model or test on iOS device
  
- **Gray Box:** 
  - WebView loaded but URL is invalid/HTTP (must be HTTPS)
  - **Solution:** Ensure URL starts with `https://`
  
- **Model Loading Forever:** 
  - Slow internet connection
  - Unoptimized asset (too many polygons/textures)
  - **Solution:** Check network, optimize model

- **Crash/Freeze:**
  - Model too large for device memory
  - Too many polygons/textures
  - **Solution:** Optimize model (reduce polygons, compress textures)

---

## 🚀 Performance & Caching System (Implemented Dec 6, 2025)

### Offline Caching Architecture

The `WebViewModel` component now implements a "Download Once, Read Forever" strategy:

1. **Check:** Has this URL been downloaded to `FileSystem.documentDirectory`?

2. **Download:** If No, download using `FileSystem.downloadAsync`.

3. **Serve:** Read the file as a **Base64 String** and inject it into the WebView using a Data URI (`data:model/gltf-binary;base64...`).

   - *Why Base64?* Android WebViews in Expo Go restrict direct `file://` access. Base64 bypasses this security restriction reliably.

### User Interaction Constraints

To improve performance and keep the UI consistent:

- **Interaction Locked:** Users cannot manually rotate/zoom/pan.

- **Implementation:** `pointer-events: none` CSS + removed `camera-controls`.

- **Auto-Rotate:** Always enabled for dynamic presentation.

### Requirements for New Models

- **File Size:** Strict **<10MB** limit (Target <5MB). Large Base64 strings will crash the JS bridge.

---

