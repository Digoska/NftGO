import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Linking } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import * as FileSystem from 'expo-file-system/legacy';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { Ionicons } from '@expo/vector-icons';

// Blob polyfill is now set up in app/_layout.tsx using expo-blob
// This ensures Blob API is available globally before GLTFLoader is used
// No need to set it up here - it's already configured at app root level

interface ModelNFTProps {
  uri: string;
  style?: any;
  modelFormat?: 'glb' | 'gltf' | 'obj';
  textureUrls?: string[]; // For GLTF/OBJ formats with external textures
}

export default function ModelNFT({ uri, style, modelFormat, textureUrls = [] }: ModelNFTProps) {
  // Auto-detect format from URI if not specified
  const detectedFormat = modelFormat || (() => {
    if (uri.endsWith('.gltf')) return 'gltf';
    if (uri.endsWith('.glb')) return 'glb';
    if (uri.endsWith('.obj')) return 'obj';
    return 'glb'; // Default fallback
  })();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animationFrameRef = useRef<number | null>(null);

  const onGLContextCreate = async (gl: any) => {
    try {
      // Fix for EXGL: gl.pixelStorei() doesn't support this parameter yet!
      // Workaround from: https://github.com/pmndrs/react-three-fiber/issues/2574
      // expo-gl only supports UNPACK_FLIP_Y_WEBGL parameter
      if (gl && gl.pixelStorei) {
        const pixelStorei = gl.pixelStorei.bind(gl);
        gl.pixelStorei = function(...args: any[]) {
          const [parameter] = args;
          
          // Only allow UNPACK_FLIP_Y_WEBGL - all else is unimplemented in expo-gl
          if (parameter === gl.UNPACK_FLIP_Y_WEBGL) {
            return pixelStorei(...args);
          }
          // Silently ignore other parameters to prevent warnings
        };
      }
      
      // Suppress EXGL warnings and texture errors (they're harmless)
      const originalWarn = console.warn;
      const originalError = console.error;
      const originalLog = console.log;
      
      // Suppress all EXGL warnings - check all arguments
      console.warn = (...args: any[]) => {
        const msg = args.map(a => {
          if (typeof a === 'string') return a;
          if (typeof a === 'object' && a !== null) return JSON.stringify(a);
          return String(a || '');
        }).join(' ');
        
        if (msg.includes('gl.pixelStorei') || 
            msg.includes('EXGL') ||
            msg.includes('pixelStorei') ||
            msg.includes('doesn\'t support') ||
            msg.includes('doesn\'t support this parameter')) {
          return; // Suppress EXGL pixelStorei warnings
        }
        originalWarn(...args);
      };
      
      // Suppress texture loading errors - more comprehensive
      console.error = (...args: any[]) => {
        const msg = args.map(a => {
          if (typeof a === 'string') return a;
          if (typeof a === 'object' && a !== null) {
            try {
              return JSON.stringify(a);
            } catch {
              return String(a);
            }
          }
          return String(a || '');
        }).join(' ');
        
        if (msg.includes('GLTFLoader') || 
            msg.includes('THREE.GLTFLoader') ||
            (msg.includes('texture') && (msg.includes('Couldn\'t load') || msg.includes('load texture') || msg.includes('Failed to load'))) ||
            msg.includes('Couldn\'t load texture') ||
            msg.includes('Failed to load texture')) {
          // Suppress texture loading errors - model can render without textures
          return;
        }
        originalError(...args);
      };
      
      // Also suppress console.log for EXGL warnings
      console.log = (...args: any[]) => {
        const msg = args.map(a => String(a || '')).join(' ');
        if (msg.includes('EXGL') || 
            msg.includes('gl.pixelStorei') ||
            msg.includes('pixelStorei') ||
            msg.includes('doesn\'t support this parameter')) {
          return; // Suppress EXGL logs
        }
        originalLog(...args);
      };

      // Create renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;
      
      // Restore console methods after model loads
      const restoreConsole = () => {
        console.warn = originalWarn;
        console.error = originalError;
        console.log = originalLog;
      };
      
      // Restore after 3 seconds (enough time for model to load)
      setTimeout(restoreConsole, 3000);

      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 5);
      cameraRef.current = camera;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Load 3D model based on format
      // GLTF (not GLB) and OBJ formats work better in React Native because textures are external
      restoreConsole();
      
      let model: THREE.Group;
      let animations: THREE.AnimationClip[] = [];
      
      try {
        if (detectedFormat === 'gltf' || detectedFormat === 'glb') {
          // GLTF/GLB loader with custom LoadingManager
          const loadingManager = new THREE.LoadingManager();
          
          // Resolve relative paths for GLTF external textures
          // GLTFLoader automatically resolves relative paths based on the GLTF file's URL
          // This ensures textures in the same directory are found correctly
          loadingManager.setURLModifier((url: string) => {
            // If URL is relative (doesn't start with http:// or https://)
            if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
              // Resolve relative path based on GLTF file's directory
              const gltfUrl = new URL(uri);
              const basePath = gltfUrl.pathname.substring(0, gltfUrl.pathname.lastIndexOf('/') + 1);
              const resolvedUrl = new URL(url, gltfUrl.origin + basePath);
              console.log(`🔗 Resolved relative path: ${url} → ${resolvedUrl.href}`);
              return resolvedUrl.href;
            }
            return url;
          });
          
          // Handle loading errors with better logging
          loadingManager.onError = (url: string) => {
            // For GLB format, embedded textures may fail (Blob API limitation)
            if (detectedFormat === 'glb') {
              if (url.includes('texture') || url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg')) {
                console.warn(`⚠️ GLB embedded texture failed to load: ${url}`);
                console.warn('💡 Tip: Use GLTF format with external textures for Expo Go compatibility');
                return; // Suppress texture errors for GLB (expected in Expo Go)
              }
            }
            // For GLTF format, texture loading errors should be logged
            if (detectedFormat === 'gltf') {
              console.error(`❌ GLTF texture failed to load: ${url}`);
              console.error('💡 Check that texture file exists and is in the same directory as .gltf file');
            }
            // Log non-texture errors
            console.warn('⚠️ Failed to load resource:', url);
          };
          
          // Track texture loading progress for GLTF
          if (detectedFormat === 'gltf') {
            loadingManager.onLoad = () => {
              console.log('✅ All GLTF resources loaded successfully');
            };
            loadingManager.onProgress = (url: string, loaded: number, total: number) => {
              if (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.bin')) {
                console.log(`📦 Loading GLTF resource ${loaded}/${total}: ${url.split('/').pop()}`);
              }
            };
          }
          
          const loader = new GLTFLoader(loadingManager);
          console.log(`🔄 Loading ${detectedFormat.toUpperCase()} model from:`, uri);
          
          if (detectedFormat === 'gltf') {
            console.log('📝 GLTF format detected - external textures will be loaded from URLs');
          } else {
            console.log('📦 GLB format detected - embedded textures may not work in Expo Go');
          }
          
          const gltf = await loader.loadAsync(uri);
          model = gltf.scene;
          animations = gltf.animations || [];
          
          console.log('✅ Model loaded successfully');
          console.log('📊 Model info:', {
            animations: animations.length,
            scenes: model.children.length,
            format: detectedFormat.toUpperCase(),
          });
          
          // Check texture loading status
          if (model) {
            let textureCount = 0;
            let loadedTextures = 0;
            const textureDetails: string[] = [];
            
            model.traverse((child: any) => {
              if (child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((material: any) => {
                  ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap'].forEach((prop) => {
                    const texture = material[prop];
                    if (texture && texture instanceof THREE.Texture) {
                      textureCount++;
                      if (texture.image) {
                        texture.needsUpdate = true;
                        loadedTextures++;
                        textureDetails.push(`${prop}: ✅ loaded`);
                      } else {
                        textureDetails.push(`${prop}: ❌ failed`);
                      }
                    }
                  });
                  material.needsUpdate = true;
                });
              }
            });
            
            if (textureCount > 0) {
              console.log(`🖼️ Textures: ${loadedTextures}/${textureCount} loaded`);
              if (detectedFormat === 'gltf') {
                if (loadedTextures === textureCount) {
                  console.log('✅ All GLTF external textures loaded successfully!');
                } else {
                  console.warn(`⚠️ Some GLTF textures failed to load (${textureCount - loadedTextures} failed)`);
                  console.warn('💡 Ensure all texture files are uploaded to the same directory as .gltf file');
                }
                textureDetails.forEach(detail => console.log(`   ${detail}`));
              } else if (detectedFormat === 'glb') {
                if (loadedTextures < textureCount) {
                  console.warn('⚠️ GLB embedded textures may not load in Expo Go (Blob API limitation)');
                  console.warn('💡 Solution: Export as GLTF format with external textures');
                }
              }
            } else {
              console.log('ℹ️ No textures found in model - using default materials');
            }
          }
        } else if (detectedFormat === 'obj') {
          // OBJ loader with MTL materials
          console.log('🔄 Loading OBJ model from:', uri);
          
          let objLoader: OBJLoader;
          
          // If we have MTL file URL, load materials first
          if (textureUrls.length > 0 && textureUrls[0].endsWith('.mtl')) {
            const mtlLoader = new MTLLoader();
            const materials = await new Promise<THREE.MaterialCreator>((resolve, reject) => {
              mtlLoader.load(
                textureUrls[0],
                (materials) => {
                  materials.preload();
                  resolve(materials);
                },
                undefined,
                reject
              );
            });
            
            objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            console.log('✅ Materials loaded');
          } else {
            objLoader = new OBJLoader();
          }
          
          model = await new Promise<THREE.Group>((resolve, reject) => {
            objLoader.load(
              uri,
              (object) => resolve(object),
              undefined,
              reject
            );
          });
          
          console.log('✅ OBJ model loaded successfully');
          
          // Load textures manually if provided
          if (textureUrls.length > 0) {
            const textureLoader = new THREE.TextureLoader();
            textureUrls.forEach((textureUrl, index) => {
              if (textureUrl.endsWith('.mtl')) return; // Skip MTL files
              
              textureLoader.load(
                textureUrl,
                (texture) => {
                  // Apply texture to first material found
                  model.traverse((child: any) => {
                    if (child.material) {
                      const materials = Array.isArray(child.material) ? child.material : [child.material];
                      materials.forEach((material: any) => {
                        if (!material.map) {
                          material.map = texture;
                          material.needsUpdate = true;
                        }
                      });
                    }
                  });
                  console.log(`✅ Texture ${index + 1} loaded:`, textureUrl);
                },
                undefined,
                (err) => {
                  console.warn(`⚠️ Failed to load texture ${index + 1}:`, textureUrl, err);
                }
              );
            });
          }
        } else {
          throw new Error(`Unsupported model format: ${detectedFormat}`);
        }
      } catch (err: any) {
        console.error('❌ Failed to load 3D model:', err);
        setError(err.message || 'Failed to load 3D model');
        setLoading(false);
        restoreConsole();
        return;
      }
      
      // Add model to scene
      scene.add(model);
      modelRef.current = model;

      // Center and scale model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      
      model.scale.multiplyScalar(scale);
      model.position.x = -center.x * scale;
      model.position.y = -center.y * scale;
      model.position.z = -center.z * scale;

      // Setup animations if available
      restoreConsole(); // Restore console before logging animation info
      
      if (animations && animations.length > 0) {
        console.log(`🎬 Found ${animations.length} animation(s) in model`);
        try {
          const mixer = new THREE.AnimationMixer(model);
          let animationsLoaded = 0;
          
          animations.forEach((clip, index) => {
            try {
              console.log(`🎬 Processing animation ${index + 1}: ${clip.name || 'Unnamed'}, duration: ${clip.duration}s, tracks: ${clip.tracks.length}`);
              const action = mixer.clipAction(clip);
              if (action) {
                action.play();
                animationsLoaded++;
                console.log(`✅ Animation "${clip.name || 'Unnamed'}" started`);
              } else {
                console.warn(`⚠️ Could not create action for animation: ${clip.name || 'Unnamed'}`);
              }
            } catch (animErr) {
              console.warn(`⚠️ Failed to play animation clip "${clip.name || 'Unnamed'}":`, animErr);
            }
          });
          
          if (animationsLoaded > 0) {
            animationMixerRef.current = mixer;
            console.log(`✅ Successfully loaded ${animationsLoaded}/${animations.length} animation(s)`);
          } else {
            console.warn('⚠️ No animations could be loaded - model will render without animations');
          }
        } catch (animErr) {
          console.warn('⚠️ Failed to setup animations:', animErr);
          // Continue without animations - model will still render
        }
      } else {
        console.log('ℹ️ No animations found in model - this is normal for static models');
      }
      
      // Check textures
      const checkTextures = (object: THREE.Object3D) => {
        let textureCount = 0;
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material;
            if (Array.isArray(material)) {
              material.forEach((mat) => {
                if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                  if (mat.map) textureCount++;
                  if (mat.normalMap) textureCount++;
                  if (mat.roughnessMap) textureCount++;
                  if (mat.metalnessMap) textureCount++;
                }
              });
            } else if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
              if (material.map) textureCount++;
              if (material.normalMap) textureCount++;
              if (material.roughnessMap) textureCount++;
              if (material.metalnessMap) textureCount++;
            }
          }
        });
        return textureCount;
      };
      
      const textureCount = checkTextures(model);
      if (textureCount > 0) {
        console.log(`🖼️ Found ${textureCount} texture(s) in model`);
      } else {
        console.log('ℹ️ No textures found in model - model will render with default materials');
      }

      setLoading(false);

      // Animation loop
      const animate = () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

        // Update animations
        if (animationMixerRef.current) {
          animationMixerRef.current.update(clockRef.current.getDelta());
        }

        // Rotate model slowly
        if (modelRef.current) {
          modelRef.current.rotation.y += 0.01;
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
        animationFrameRef.current = requestAnimationFrame(animate);
        gl.endFrameEXP();
      };

      animate();
    } catch (err: any) {
      console.error('Error loading 3D model:', err);
      setError(err.message || 'Failed to load 3D model');
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleOpenInViewer = () => {
    // Open in online GLB viewer
    const viewerUrl = `https://gltf-viewer.donmccurdy.com/?url=${encodeURIComponent(uri)}`;
    Linking.openURL(viewerUrl).catch((err) => {
      console.error('Error opening viewer:', err);
    });
  };

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>Failed to load 3D model</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity
          style={styles.viewerButton}
          onPress={handleOpenInViewer}
          activeOpacity={0.7}
        >
          <Ionicons name="open-outline" size={16} color={colors.primary} />
          <Text style={styles.viewerButtonText}>Open in Viewer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading 3D model...</Text>
        </View>
      )}
      <GLView
        style={styles.glView}
        onContextCreate={onGLContextCreate}
      />
      <TouchableOpacity
        style={styles.viewerButton}
        onPress={handleOpenInViewer}
        activeOpacity={0.7}
      >
        <Ionicons name="open-outline" size={16} color={colors.primary} />
        <Text style={styles.viewerButtonText}>Open in 3D Viewer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundCard,
    position: 'relative',
  },
  glView: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorSubtext: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  viewerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  viewerButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});

