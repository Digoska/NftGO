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

2. **Size Limit:** Must be **under 10MB** (Target: <5MB)
   - *Warning:* Files >15MB (like the unoptimized Tank) will fail to render (White Screen) on Android WebViews due to memory limits.

3. **Textures:** Must be embedded/compressed in the GLB

4. **Scale:** Apply all transforms (Ctrl+A -> Scale) in Blender before export

## Troubleshooting

- **White Screen:** Parent container has no height OR Model file size is too big (>15MB)
- **Gray Box:** WebView loaded but URL is invalid/HTTP (must be HTTPS)
- **Model Loading Forever:** Internet connection or unoptimized asset

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

