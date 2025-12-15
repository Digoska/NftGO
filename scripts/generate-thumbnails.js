const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://REDACTED_SUPABASE_URL';
// ⚠️ SERVICE ROLE KEY - Admin scripts only, never use in app
const SUPABASE_SERVICE_ROLE_KEY = 'REDACTED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEMP_DIR = path.join(__dirname, 'temp_glb');
const OUTPUT_DIR = path.join(__dirname, 'thumbnails');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function generateThumbnails() {
  console.log('🚀 Starting thumbnail generation via DB lookup...\n');

  // Fetch NFTs from DB to get the filenames
  const { data: nfts, error: dbError } = await supabase
    .from('nfts')
    .select('name, image_url');

  if (dbError) {
    console.error('❌ Error fetching NFTs from DB:', dbError);
    return;
  }

  console.log(`📦 Found ${nfts.length} NFT records in DB\n`);

  for (const nft of nfts) {
    if (!nft.image_url) continue;
    
    // Check if it's a GLB file
    if (!nft.image_url.toLowerCase().endsWith('.glb')) {
      console.log(`Skipping non-GLB: ${nft.name}`);
      continue;
    }

    // Extract filename from URL
    // URL format: .../nfts/filename.glb
    const fileName = nft.image_url.split('/').pop();
    // Decode URI component in case of spaces etc (e.g. %20)
    const decodedFileName = decodeURIComponent(fileName);

    console.log(`Processing: ${decodedFileName} (for ${nft.name})`);

    try {
      // Download file
      const { data: glbData, error: downloadError } = await supabase.storage
        .from('nfts')
        .download(decodedFileName);

      if (downloadError) {
        console.error(`  ⚠️ Download failed for ${decodedFileName}:`, downloadError.message);
        continue;
      }

      const tempPath = path.join(TEMP_DIR, decodedFileName);
      const buffer = Buffer.from(await glbData.arrayBuffer());
      fs.writeFileSync(tempPath, buffer);

      const thumbnailName = decodedFileName.replace(/\.glb$/i, '.png');
      const thumbnailPath = path.join(OUTPUT_DIR, thumbnailName);

      // Create a stylized 3D cube icon placeholder
      // Replaces the previous text-based placeholder
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

      console.log(`  ✅ Generated: ${thumbnailName}`);

      // Upload thumbnail
      const thumbnailBuffer = fs.readFileSync(thumbnailPath);
      const { error: uploadError } = await supabase.storage
        .from('nft-thumbnails')
        .upload(thumbnailName, thumbnailBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) throw uploadError;

      console.log(`  📤 Uploaded: ${thumbnailName}\n`);

    } catch (err) {
      console.error(`  ❌ Error processing ${decodedFileName}:`, err.message);
    }
  }

  console.log('✨ Thumbnail generation complete!');
}

generateThumbnails();
