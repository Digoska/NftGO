const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing environment variables!');
  console.error('Make sure .env file exists with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPaths() {
  const { data: nfts, error } = await supabase.from('nfts').select('name, image_url');
  
  if (error) {
    console.error(error);
    return;
  }

  nfts.forEach(nft => {
    console.log(`Name: ${nft.name}, URL: ${nft.image_url}`);
  });
}

checkPaths();

