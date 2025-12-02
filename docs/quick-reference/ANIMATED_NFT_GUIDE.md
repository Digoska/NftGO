# Návod: Animované NFT z Blenderu

## 1. Export z Blenderu

### Možnosť A: Video (MP4) - Odporúčané
**Najlepšie pre komplexné animácie**

1. **Nastavenie renderu:**
   - `Render Properties` → `Output Properties`
   - `File Format`: FFmpeg video
   - `Encoding`:
     - `Container`: MPEG-4
     - `Video Codec`: H.264
     - `Output Quality`: High (alebo Medium pre menšie súbory)
   - `Resolution`: 1080x1080 (alebo 512x512 pre menšie súbory)

2. **Nastavenie animácie:**
   - `Timeline` → Nastav `Start Frame` a `End Frame`
   - `Frame Rate`: 30 fps (alebo 24 fps)

3. **Render:**
   - `Render` → `Render Animation` (Ctrl+F12)
   - Video sa uloží do output folderu

### Možnosť B: 3D Model (GLB/GLTF) - Pre 3D NFT
**Pre interaktívne 3D modely**

1. **Export:**
   - `File` → `Export` → `glTF 2.0 (.glb/.gltf)`
   - Vyber `.glb` (binárny, menší súbor)
   - V `Export` nastaveniach:
     - ✅ `Include Selected Objects`
     - ✅ `Transform` → `+Y Up`
     - ✅ `Geometry` → `Apply Modifiers`
     - ✅ `Animation` → `Bake Animation` (ak máš animáciu)

2. **Optimalizácia:**
   - Použi Blender addon "glTF Tools" pre optimalizáciu
   - Zníž počet polygónov ak je model príliš komplexný

### Možnosť C: GIF (Pre jednoduché animácie)
**Najjednoduchšie, ale veľké súbory**

1. **Render ako obrázky:**
   - `Render Properties` → `Output Properties`
   - `File Format`: PNG
   - Render Animation

2. **Konverzia na GIF:**
   - Použi online nástroj (ezgif.com) alebo
   - Blender addon "GIF Exporter"

## 2. Upload na Supabase Storage

### Krok 1: Vytvor Storage Bucket

V Supabase Dashboard:
1. `Storage` → `Create a new bucket`
2. Názov: `nfts`
3. `Public bucket`: ✅ (aby boli NFT verejne prístupné)
4. `File size limit`: 50 MB (alebo viac pre video)

### Krok 2: Upload súboru

**Cez Supabase Dashboard:**
1. `Storage` → `nfts` bucket
2. `Upload file`
3. Vyber svoj MP4/GLB/GIF súbor
4. Skopíruj URL súboru

**Cez API (programaticky):**
```typescript
// Upload NFT video/model
const uploadNFT = async (file: File, nftId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${nftId}.${fileExt}`;
  const filePath = `nfts/${fileName}`;

  const { data, error } = await supabase.storage
    .from('nfts')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('nfts')
    .getPublicUrl(filePath);

  return publicUrl;
};
```

### Krok 3: Aktualizuj NFT v databáze

```sql
-- Pridaj nový stĺpec pre typ média (ak ešte nie je)
ALTER TABLE nfts 
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', 'model', 'gif'));

-- Aktualizuj NFT s novým súborom
UPDATE nfts 
SET 
  image_url = 'https://your-project.supabase.co/storage/v1/object/public/nfts/your-nft.mp4',
  media_type = 'video'
WHERE id = 'your-nft-id';
```

## 3. Implementácia v React Native

### Možnosť A: Video NFT (MP4)

**1. Inštaluj expo-av:**
```bash
npx expo install expo-av
```

**2. Vytvor VideoNFT komponentu:**
```typescript
// components/nft/VideoNFT.tsx
import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface VideoNFTProps {
  uri: string;
  style?: any;
  autoPlay?: boolean;
  loop?: boolean;
}

export default function VideoNFT({ 
  uri, 
  style, 
  autoPlay = true, 
  loop = true 
}: VideoNFTProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlayback = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={autoPlay}
        isLooping={loop}
        isMuted={isMuted}
        useNativeControls={false}
      />
      <TouchableOpacity
        style={styles.playButton}
        onPress={togglePlayback}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={24}
          color={colors.background}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.muteButton}
        onPress={() => setIsMuted(!isMuted)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isMuted ? 'volume-mute' : 'volume-high'}
          size={20}
          color={colors.background}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

**3. Aktualizuj NFT typ:**
```typescript
// types/index.ts
export interface NFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
  media_type?: 'image' | 'video' | 'model' | 'gif'; // Pridaj tento stĺpec
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  // ... ostatné
}
```

**4. Použi v Wallet/Collection:**
```typescript
// V wallet.tsx alebo collection.tsx
import VideoNFT from '../../components/nft/VideoNFT';

// V render funkcii:
{nft.media_type === 'video' ? (
  <VideoNFT 
    uri={nft.image_url} 
    style={styles.nftImage}
    autoPlay={true}
    loop={true}
  />
) : (
  <Image
    source={{ uri: nft.image_url }}
    style={styles.nftImage}
    resizeMode="cover"
  />
)}
```

### Možnosť B: 3D Model (GLB/GLTF)

**1. Inštaluj expo-gl a expo-three:**
```bash
npx expo install expo-gl expo-three
npm install three @react-three/fiber @react-three/drei
```

**2. Vytvor 3D NFT komponentu:**
```typescript
// components/nft/ModelNFT.tsx
import React, { Suspense } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { colors } from '../../constants/colors';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1} />;
}

interface ModelNFTProps {
  uri: string;
  style?: any;
}

export default function ModelNFT({ uri, style }: ModelNFTProps) {
  return (
    <View style={[styles.container, style]}>
      <Canvas>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Model url={uri} />
          <OrbitControls enableZoom={false} />
        </Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundCard,
  },
});
```

### Možnosť C: GIF

**Použi existujúci Image komponent:**
```typescript
// React Native Image podporuje GIF automaticky
<Image
  source={{ uri: nft.image_url }}
  style={styles.nftImage}
  resizeMode="cover"
/>
```

## 4. Aktualizácia databázovej schémy

```sql
-- Pridaj media_type stĺpec do nfts tabuľky
ALTER TABLE nfts 
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', 'model', 'gif')) DEFAULT 'image';
```

## 5. Rýchly workflow

1. **Export z Blenderu:**
   - Render Animation → MP4 (1080x1080, H.264)

2. **Upload na Supabase:**
   - Storage → `nfts` bucket → Upload file
   - Skopíruj public URL

3. **Pridaj do databázy:**
   ```sql
   INSERT INTO nfts (name, description, image_url, media_type, rarity, latitude, longitude)
   VALUES (
     'My Animated NFT',
     'Cool animated NFT from Blender',
     'https://your-project.supabase.co/storage/v1/object/public/nfts/my-nft.mp4',
     'video',
     'rare',
     48.1486,  -- tvoja lat
     17.1077   -- tvoja lon
   );
   ```

4. **Aplikácia automaticky zobrazí video namiesto obrázka!**

## Tipy

- **Optimalizácia videa:** Použi HandBrake alebo FFmpeg na kompresiu
- **Veľkosť súboru:** Cieľ < 10 MB pre rýchle načítanie
- **Formát:** MP4 H.264 je najlepšie podporovaný
- **Rozlíšenie:** 512x512 alebo 1080x1080 (podľa potreby)

## Podpora formátov

- ✅ **Video (MP4)**: Najlepšie pre animácie
- ✅ **3D Model (GLB)**: Pre interaktívne 3D NFT
- ✅ **GIF**: Jednoduché, ale veľké súbory
- ✅ **Image (PNG/JPG)**: Štandardné statické NFT

