const puppeteer = require('puppeteer');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const SUPABASE_URL = 'https://REDACTED_SUPABASE_URL';
// ⚠️ SERVICE ROLE KEY - Admin scripts only
const SUPABASE_SERVICE_ROLE_KEY = 'REDACTED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const OUTPUT_DIR = path.join(__dirname, 'thumbnails');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function generate3DThumbnails() {
  console.log('🚀 Starting 3D thumbnail generation (DEBUG MODE)...');

  // 1. Fetch NFTs
  const { data: nfts, error } = await supabase.from('nfts').select('name, image_url');
  if (error) {
    console.error('❌ Error fetching NFTs:', error);
    return;
  }

  // Filter GLBs
  const glbNfts = nfts.filter(nft => nft.image_url && nft.image_url.toLowerCase().endsWith('.glb'));
  console.log(`📦 Found ${glbNfts.length} GLB models to process`);
  console.log('⚠️ Processing ONLY the first model for debugging...\n');

  if (glbNfts.length === 0) {
    console.log('No GLB models found. Exiting.');
    return;
  }

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
    const filename = nft.image_url.split('/').pop();
    const thumbnailName = decodeURIComponent(filename).replace(/\.glb$/i, '.png');
    console.log(`Processing: ${nft.name} (${filename})`);

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

    } catch (err) {
        console.error(`  ❌ Failed: ${err.message}\n`);
    }
  }

  await browser.close();
  console.log('✨ Debug generation complete!');
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

          // Log stats
          let meshCount = 0;
          let vertexCount = 0;
          model.traverse((child) => {
            if (child.isMesh) {
              meshCount++;
              vertexCount += child.geometry.attributes.position.count;
            }
          });
          log('Stats: Meshes=' + meshCount + ', Vertices=' + vertexCount);

          // Normalize scale/material
          model.traverse((child) => {
            if (child.isMesh) {
              child.material.side = THREE.DoubleSide; // Fix inside-out geometry
              child.material.transparent = false; // Force opaque to debug visibility
              child.material.opacity = 1.0;
            }
          });

          // Auto-fit camera logic
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          log('BBox Size: ' + JSON.stringify(size));
          log('BBox Center: ' + JSON.stringify(center));

          if (size.lengthSq() === 0) {
             log("⚠️ WARNING: Empty bounding box!");
          }

          // Center model at origin
          model.position.sub(center);

          // NORMALIZE SCALE: Scale model to fit in a unit box (size ~1)
          // This avoids issues with extremely large or small models causing camera/clipping issues
          const maxDim = Math.max(size.x, size.y, size.z) || 2;
          const scaleFactor = 5.0 / maxDim; // Scale to ~5 units
          model.scale.multiplyScalar(scaleFactor);
          
          log(\`Normalized Scale: \${scaleFactor.toFixed(4)} (Original Size: \${maxDim.toFixed(2)})\`);

          // Recalculate size after scaling (should be ~5)
          // const newBox = new THREE.Box3().setFromObject(model);
          // const newSize = newBox.getSize(new THREE.Vector3());
          // const newMaxDim = Math.max(newSize.x, newSize.y, newSize.z);
          const newMaxDim = 5.0;

          // Calculate camera distance
          const fov = camera.fov * (Math.PI / 180);
          let cameraZ = Math.abs(newMaxDim / 2 / Math.tan(fov / 2));
          
          cameraZ *= 1.2; // Tighter zoom

          // Reset clipping planes for normalized scale
          camera.near = 0.1;
          camera.far = 1000;
          camera.updateProjectionMatrix();

          // Position camera
          const distance = cameraZ;
          camera.position.set(distance * 0.8, distance * 0.6, distance * 1.0);
          camera.lookAt(0, 0, 0);
          
          log('Camera pos: ' + JSON.stringify(camera.position));

          // Wait for textures (simulated by delay + render loop)
          log("Starting render loop...");
          
          let frames = 0;
          const totalFrames = 60; // 60 frames

          function animate() {
            if (frames > totalFrames) {
               log("Render loop finished. Checking for blank image...");
               
               // Validation: Check if image is blank (uniform color)
               const gl = renderer.getContext();
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
