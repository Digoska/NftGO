const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wkpgupdorbgcthmjoybe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcGd1cGRvcmJnY3RobWpveWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzQ5ODgsImV4cCI6MjA3OTc1MDk4OH0.Fe2h0WOODk3CECn1ucaV74TcILRJwZnnZHSoL40da5Q';

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

