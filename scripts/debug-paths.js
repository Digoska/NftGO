const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://REDACTED_SUPABASE_URL';
const SUPABASE_KEY = 'REDACTED_ANON_KEY';

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

