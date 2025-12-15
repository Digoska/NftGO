const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://REDACTED_SUPABASE_URL';
// ⚠️ SERVICE ROLE KEY - Admin scripts only, never use in app
const SUPABASE_SERVICE_ROLE_KEY = 'REDACTED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateThumbnailUrls() {
  console.log('🚀 Starting thumbnail URL updates...\n');

  const { data: nfts, error } = await supabase.from('nfts').select('*');
  
  if (error) {
    console.error('❌ Error fetching NFTs:', error);
    return;
  }

  console.log(`📦 Found ${nfts.length} NFT records to process\n`);

  for (const nft of nfts) {
    if (!nft.image_url) continue;
    
    // Only process 3D models (GLB/GLTF)
    if (!nft.image_url.toLowerCase().endsWith('.glb') && !nft.image_url.toLowerCase().endsWith('.gltf')) {
      console.log(`Skipping non-3D file: ${nft.name}`);
      continue;
    }

    const filename = nft.image_url.split('/').pop();
    const decodedFilename = decodeURIComponent(filename);
    const thumbnailName = decodedFilename.replace(/\.(glb|gltf)$/i, '.png');
    
    const { data } = supabase.storage
      .from('nft-thumbnails')
      .getPublicUrl(thumbnailName);

    const { error: updateError } = await supabase
      .from('nfts')
      .update({ thumbnail_url: data.publicUrl })
      .eq('id', nft.id);

    if (updateError) {
      console.error(`❌ Failed to update ${nft.name}:`, updateError.message);
    } else {
      console.log(`✅ Updated: ${nft.name} → ${data.publicUrl}`);
    }
  }

  console.log('\n📊 Verifying updates...');
  const { data: verification, error: verifyError } = await supabase
    .from('nfts')
    .select('name, thumbnail_url')
    .not('thumbnail_url', 'is', null);

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError);
  } else {
    console.log(`Found ${verification ? verification.length : 0} NFTs with thumbnails:`);
    if (verification) {
      verification.forEach(nft => console.log(`  - ${nft.name}: ${nft.thumbnail_url}`));
    }
  }
}

updateThumbnailUrls();
