/**
 * Generate 3D thumbnails for NFTs
 * 
 * Usage:
 *   node generate-3d-thumbnails.js        // Skip NFTs with existing thumbnails
 *   node generate-3d-thumbnails.js --force // Regenerate all thumbnails
 *   node generate-3d-thumbnails.js -f      // Short form of --force
 */

require('dotenv').config();

const puppeteer = require('puppeteer');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const forceRegenerate = args.includes('--force') || args.includes('-f');

if (forceRegenerate) {
  console.log('🔄 Force regeneration mode: Will regenerate all thumbnails');
} else {
  console.log('⏭️  Skip mode: Will skip NFTs with existing thumbnails');
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
// ⚠️ SERVICE ROLE KEY - Admin scripts only
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing environment variables!');
  console.error('Make sure .env file exists with EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const OUTPUT_DIR = path.join(__dirname, 'thumbnails');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function generate3DThumbnails() {
  console.log('🚀 Starting 3D thumbnail generation (DEBUG MODE)...');

  // 1. Fetch NFTs (include thumbnail_url for skip logic)
  const { data: nfts, error } = await supabase.from('nfts').select('name, image_url, thumbnail_url');
  if (error) {
    console.error('❌ Error fetching NFTs:', error);
    return;
  }

  // Filter GLBs
  const glbNfts = nfts.filter(nft => nft.image_url && nft.image_url.toLowerCase().endsWith('.glb'));
  console.log(`📦 Found ${glbNfts.length} GLB models total`);

  // Count existing thumbnails
  const withThumbnails = glbNfts.filter(nft => nft.thumbnail_url).length;
  const withoutThumbnails = glbNfts.length - withThumbnails;
  console.log(`   📊 With thumbnails: ${withThumbnails}`);
  console.log(`   📊 Without thumbnails: ${withoutThumbnails}\n`);

  if (glbNfts.length === 0) {
    console.log('No GLB models found. Exiting.');
    return;
  }

  // Counters for summary
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  // 2. Launch Browser
  const browser = await puppeteer.launch({
    headless: false, // Visible for debugging
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--ignore-gpu-blocklist',
      '--enable-webgl',
      '--hide-scrollbars',
      '--mute-audio'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });

  // Pipe browser logs to node console
  page.on('console', msg => console.log('  [BROWSER]', msg.text()));

  // 3. Process each NFT
  // const nftsToProcess = glbNfts.filter(n => n.image_url.includes('scifi_drone_1.1'));
  const nftsToProcess = glbNfts; // Restore for all

  for (const nft of nftsToProcess) {
    // Skip if thumbnail exists and not forcing regeneration
    if (!forceRegenerate && nft.thumbnail_url) {
      console.log(`⏭️  Skipping "${nft.name}" - thumbnail already exists`);
      skipped++;
      continue;
    }

    const filename = nft.image_url.split('/').pop();
    const thumbnailName = decodeURIComponent(filename).replace(/\.glb$/i, '.png');
    console.log(`🎨 Processing: ${nft.name} (${filename})`);

    try {
        const modelUrl = nft.image_url;

        // Generate HTML
        const html = getViewerHTML(modelUrl);
        await page.setContent(html);

        // Wait for render
        try {
            await page.waitForFunction('window.renderComplete === true', { timeout: 60000 });
        } catch (e) {
            console.error(`  ⚠️ Timeout waiting for render: ${e.message}`);
            continue;
        }

        // Check for specific model errors captured in browser
        const errors = await page.evaluate(() => window.modelErrors || []);
        if (errors.length > 0) {
            console.error('  ❌ Browser reported errors:', errors);
            continue;
        }

        // Check validation
        const renderSuccess = await page.evaluate(() => window.renderSuccess);
        
        const thumbnailPath = path.join(OUTPUT_DIR, thumbnailName);
        let fileBuffer;
        if (renderSuccess === false) {
             console.log(`  ⚠️ Render validation failed (blank image). Generating fallback icon.`);
             await generateFallback(thumbnailPath);
             fileBuffer = fs.readFileSync(thumbnailPath);
        } else {
             // Screenshot
             await page.screenshot({ path: thumbnailPath, type: 'png' });
             console.log(`  📸 Screenshot saved: ${thumbnailName}`);
             fileBuffer = fs.readFileSync(thumbnailPath);
        }

        // Upload
        const { error: uploadError } = await supabase.storage
            .from('nft-thumbnails')
            .upload(thumbnailName, fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) throw uploadError;
        console.log(`  📤 Uploaded to Supabase\n`);
        processed++;

    } catch (err) {
        console.error(`  ❌ Failed: ${err.message}\n`);
        failed++;
    }
  }

  await browser.close();
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📝 Total: ${nftsToProcess.length}`);
  console.log('\n✨ Generation complete!');
}

function getViewerHTML(modelUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; background: #f3f4f6; }
    canvas { display: block; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>
</head>
<body>
  <script type="module">
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

    window.renderComplete = false;
    window.modelErrors = [];

    function log(msg) {
      console.log(msg);
    }

    async function init() {
      try {
        log("Initializing Three.js scene...");
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
        renderer.setSize(512, 512);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.setClearColor(0xf3f4f6, 1);
        document.body.appendChild(renderer.domElement);

        const scene = new THREE.Scene();

        // Helpers removed for clean thumbnail
        // const gridHelper = new THREE.GridHelper(10, 10);
        // scene.add(gridHelper);
        // const axesHelper = new THREE.AxesHelper(5);
        // scene.add(axesHelper);
        // log("Helpers added to scene");

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
        dirLight.position.set(5, 10, 7.5);
        scene.add(dirLight);

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        // Initial position before loading
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);

        // Force initial render to verify context
        renderer.render(scene, camera);
        log("Initial empty render complete");

        // Loader
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
        loader.setDRACOLoader(dracoLoader);

        log("Loading model: ${modelUrl}");
        
        loader.load('${modelUrl}', (gltf) => {
          log("Model loaded successfully");
          const model = gltf.scene;
          scene.add(model);

          // NEW: Track texture loading
          const texturesToLoad = [];
          model.traverse((child) => {
            if (child.isMesh && child.material) {
              const mat = child.material;
              // Collect all texture maps
              const textures = [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.emissiveMap, mat.aoMap];
              textures.forEach(tex => {
                if (tex && tex.image && !texturesToLoad.includes(tex)) {
                  texturesToLoad.push(tex);
                }
              });
            }
          });

          log('Textures to load: ' + texturesToLoad.length);

          // Wait for all textures to load
          let loadedCount = 0;
          const texturesReady = new Promise((resolve) => {
            if (texturesToLoad.length === 0) {
              log('No textures to wait for');
              resolve();
              return;
            }

            // Timeout fallback (5 seconds max wait)
            const timeout = setTimeout(() => {
              log('  ⚠️ Texture loading timeout, proceeding anyway');
              resolve();
            }, 5000);

            texturesToLoad.forEach((tex, index) => {
              // Check if texture has image property and if it's already loaded
              if (tex.image && typeof tex.image.complete !== 'undefined') {
                if (tex.image.complete) {
                  loadedCount++;
                  log('  Texture ' + (index + 1) + ' already loaded');
                  if (loadedCount === texturesToLoad.length) {
                    clearTimeout(timeout);
                    resolve();
                  }
                } else {
                  tex.image.onload = () => {
                    loadedCount++;
                    log('  Texture ' + (index + 1) + ' loaded (' + loadedCount + '/' + texturesToLoad.length + ')');
                    if (loadedCount === texturesToLoad.length) {
                      clearTimeout(timeout);
                      resolve();
                    }
                  };
                  tex.image.onerror = (err) => {
                    loadedCount++;
                    log('  ⚠️ Texture ' + (index + 1) + ' FAILED to load');
                    if (loadedCount === texturesToLoad.length) {
                      clearTimeout(timeout);
                      resolve();
                    }
                  };
                }
              } else {
                // Texture doesn't have standard image property (might be embedded/ready)
                loadedCount++;
                log('  Texture ' + (index + 1) + ' appears ready (no image property)');
                if (loadedCount === texturesToLoad.length) {
                  clearTimeout(timeout);
                  resolve();
                }
              }
            });
          });

          // Continue with existing code AFTER textures are ready
          texturesReady.then(() => {
            log('All textures processed, continuing...');

            // Log stats
            let meshCount = 0;
          let vertexCount = 0;
          let textureCount = 0;
          let materialTypes = new Set();
          let hasBaseColor = false;
          let hasMetallic = false;
          let hasNormal = false;

          model.traverse((child) => {
            if (child.isMesh) {
              meshCount++;
              vertexCount += child.geometry.attributes.position.count;

              // Log material details
              const mat = child.material;
              if (mat) {
                materialTypes.add(mat.type);

                // Check for textures
                if (mat.map) { textureCount++; hasBaseColor = true; }
                if (mat.metalnessMap) { textureCount++; hasMetallic = true; }
                if (mat.normalMap) { textureCount++; hasNormal = true; }
                if (mat.roughnessMap) textureCount++;
                if (mat.emissiveMap) textureCount++;
                if (mat.aoMap) textureCount++;

                // Log texture loading status
                if (mat.map && mat.map.image) {
                  const img = mat.map.image;
                  log(\`  Texture: \${img.width}x\${img.height}, complete=\${img.complete}\`);
                }
              }
            }
          });

          log('Stats: Meshes=' + meshCount + ', Vertices=' + vertexCount);
          log('Materials: ' + Array.from(materialTypes).join(', '));
          log('Textures: ' + textureCount + ' total (baseColor=' + hasBaseColor + ', metallic=' + hasMetallic + ', normal=' + hasNormal + ')');

          // Normalize scale/material
          let materialsModified = 0;
          model.traverse((child) => {
            if (child.isMesh) {
              const mat = child.material;

              // Log if material is missing or broken
              if (!mat) {
                log('  ⚠️ WARNING: Mesh has no material!');
                child.material = new THREE.MeshStandardMaterial({ color: 0xff00ff }); // Bright pink fallback
              } else {
                child.material.side = THREE.DoubleSide; // Fix inside-out geometry
                child.material.transparent = false; // Force opaque
                child.material.opacity = 1.0;

                // Force material to update
                child.material.needsUpdate = true;
                materialsModified++;
              }
            }
          });
          log('Materials processed: ' + materialsModified);

          // Auto-fit camera logic
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          log('BBox Size: ' + JSON.stringify(size));
          log('BBox Center: ' + JSON.stringify(center));

          if (size.lengthSq() === 0) {
             log("⚠️ WARNING: Empty bounding box!");
          }

          // NORMALIZE SCALE: Scale model to fit in a unit box (size ~1)
          // This avoids issues with extremely large or small models causing camera/clipping issues
          const maxDim = Math.max(size.x, size.y, size.z) || 2;

          // Adaptive scaling based on model size
          let targetSize;
          if (maxDim > 10000) {
            targetSize = 2000; // Extreme models (Hunter-Killer: 36,593 units) - 4× increase
          } else if (maxDim > 1000) {
            targetSize = 200; // Large models
          } else {
            targetSize = 100; // Small/Medium models
          }

          // Center model at origin
          model.position.sub(center);

          // NORMALIZE SCALE
          const scaleFactor = targetSize / maxDim;
          model.scale.multiplyScalar(scaleFactor);

          log(\`Normalized Scale: \${scaleFactor.toFixed(4)} (Original: \${maxDim.toFixed(2)} units → Target: \${targetSize} units)\`);

          // RE-CENTER after scaling (scaling can shift the position)
          const scaledBox = new THREE.Box3().setFromObject(model);
          const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
          model.position.sub(scaledCenter);

          log('Model re-centered after scaling');

          // ROTATE MODEL for better viewing angle
          // Many models are exported facing wrong direction (sideways, backwards)
          // Rotate 45° on Y-axis to get a better 3/4 perspective
          model.rotation.y = Math.PI / 4; // 45 degrees clockwise
          log('Model rotated 45° for better viewing angle');

          const newMaxDim = targetSize;

          // Calculate camera distance based on actual normalized size
          const fov = camera.fov * (Math.PI / 180);
          let cameraDistance = Math.abs(targetSize / Math.tan(fov / 2));

          cameraDistance *= 0.95; // Even tighter framing for better frame usage

          // Reset clipping planes for adaptive scale
          camera.near = cameraDistance * 0.01;
          camera.far = cameraDistance * 100;
          camera.updateProjectionMatrix();

          // Position camera at consistent 3/4 angle (slightly above and to the side)
          // This gives good perspective on most 3D models
          const camX = cameraDistance * 0.7;  // Right side (was 0.8)
          const camY = cameraDistance * 0.5;  // Above (was 0.6)
          const camZ = cameraDistance * 0.7;  // Front (was 1.0)

          camera.position.set(camX, camY, camZ);
          camera.lookAt(0, 0, 0); // Look at origin (model center)

          log('Camera: distance=' + cameraDistance.toFixed(2) + ', pos=(' + camX.toFixed(2) + ', ' + camY.toFixed(2) + ', ' + camZ.toFixed(2) + ')');

          // Wait for textures (simulated by delay + render loop)
          log("Starting render loop...");
          
          let frames = 0;
          const totalFrames = 60; // 60 frames

          function animate() {
            if (frames > totalFrames) {
               log("Render loop finished. Checking for blank image...");

               // NEW: Check if anything is actually being drawn
               const gl = renderer.getContext();
               log('WebGL state: drawingBuffer=' + gl.drawingBufferWidth + 'x' + gl.drawingBufferHeight);
               
               // Validation: Check if image is blank (uniform color)
               const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
               gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
               
               let hasVariance = false;
               // Check standard deviation or just simple difference from first pixel
               const r0 = pixels[0];
               const g0 = pixels[1];
               const b0 = pixels[2];
               
               // Sample every 100th pixel to save time
               for (let i = 0; i < pixels.length; i += 400) {
                 if (Math.abs(pixels[i] - r0) > 5 || Math.abs(pixels[i+1] - g0) > 5 || Math.abs(pixels[i+2] - b0) > 5) {
                   hasVariance = true;
                   break;
                 }
               }
               
               if (!hasVariance) {
                 log("⚠️ Validation Failed: Image appears blank/uniform.");
                 window.renderSuccess = false;
               } else {
                 log("✅ Validation Passed: Image content detected.");
                 window.renderSuccess = true;
               }

               log("Waiting additional delay...");
               setTimeout(() => {
                 log("Ready for screenshot");
                 window.renderComplete = true;
               }, 1000);
               return;
            }
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
            frames++;
          }
          animate();
          }); // Close texturesReady.then()

        }, (xhr) => {
            // progress
        }, (error) => {
          log("Error loading model: " + error.message);
          window.modelErrors.push(error.message);
          window.renderComplete = true; 
        });

      } catch (e) {
        log("Exception in init: " + e.message);
        window.modelErrors.push(e.message);
        window.renderComplete = true;
      }
    }

    init();
  </script>
</body>
</html>
  `;
}


async function generateFallback(thumbnailPath) {
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 79, g: 70, b: 229, alpha: 1 } // Indigo-600 background
    }
  })
  .composite([{
    input: Buffer.from(`
      <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <!-- 3D Cube Icon -->
        <path d="M256 112L128 176V336L256 400L384 336V176L256 112Z" fill="none" stroke="white" stroke-width="24" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="M256 240L384 176" stroke="white" stroke-width="24" stroke-linecap="round"/>
        <path d="M256 240L128 176" stroke="white" stroke-width="24" stroke-linecap="round"/>
        <path d="M256 240V400" stroke="white" stroke-width="24" stroke-linecap="round"/>
        <!-- Optional: Opacity overlay for depth -->
        <path d="M256 112L384 176L256 240L128 176L256 112Z" fill="white" fill-opacity="0.2"/>
      </svg>
    `),
    top: 0,
    left: 0
  }])
  .png()
  .toFile(thumbnailPath);
}

generate3DThumbnails();
