const { createClient } = require('@supabase/supabase-js');
const { NodeIO } = require('@gltf-transform/core');
const { KHRONOS_EXTENSIONS } = require('@gltf-transform/extensions');
const { draco } = require('@gltf-transform/extensions');
const fs = require('fs');
const path = require('path');

// ⚠️ SERVICE ROLE KEY - Admin scripts only
const SUPABASE_URL = 'https://wkpgupdorbgcthmjoybe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcGd1cGRvcmJnY3RobWpveWJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE3NDk4OCwiZXhwIjoyMDc5NzUwOTg4fQ.QVaTSQ-eQLBHMlCD_ZBEa8qfDw5j62R1pXrIkxbhrBw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEMP_DIR = path.join(__dirname, 'temp_glb');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

async function inspectDroneModel() {
  console.log('🔍 Inspecting scifi_drone_1.1.glb...');

  const filename = 'scifi_drone_1.1.glb';
  const localPath = path.join(TEMP_DIR, filename);

  // Download
  console.log('⬇️ Downloading model...');
  const { data, error } = await supabase.storage
    .from('nfts')
    .download(filename);

  if (error) {
    console.error('❌ Download failed:', error.message);
    return;
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(localPath, buffer);
  console.log(`✅ Saved to ${localPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

  // Inspect with gltf-transform
  console.log('\n🧠 Analyzing structure with gltf-transform...');
  const io = new NodeIO()
    .registerExtensions(KHRONOS_EXTENSIONS)
    .registerDependencies({
      // 'draco3d.decoder': await draco3d.createDecoderModule(), // If we needed actual decoding, but inspection often works without
    });

  try {
    const document = await io.read(localPath);
    const root = document.getRoot();

    console.log(`  Scene Count: ${root.listScenes().length}`);
    console.log(`  Mesh Count: ${root.listMeshes().length}`);
    console.log(`  Material Count: ${root.listMaterials().length}`);
    console.log(`  Node Count: ${root.listNodes().length}`);
    
    let totalPrimitives = 0;
    let totalVertices = 0;

    root.listMeshes().forEach((mesh, i) => {
      console.log(`  Mesh ${i} (${mesh.getName()}):`);
      mesh.listPrimitives().forEach((prim, j) => {
        const position = prim.getAttribute('POSITION');
        const count = position ? position.getCount() : 0;
        console.log(`    Prim ${j}: ${count} vertices, Mode: ${prim.getMode()}`);
        totalPrimitives++;
        totalVertices += count;
        
        // Check bounds
        if (position) {
            const min = position.getMin([0,0,0]);
            const max = position.getMax([0,0,0]);
            console.log(`      Bounds: Min[${min}], Max[${max}]`);
        }
      });
    });

    console.log(`\n📊 Total Vertices: ${totalVertices}`);
    
    if (totalVertices === 0) {
        console.error('❌ MODEL HAS NO GEOMETRY! This explains the blank render.');
    } else {
        console.log('✅ Model has geometry.');
    }

  } catch (e) {
    console.error('❌ Failed to parse GLB:', e.message);
  }
}

inspectDroneModel();

