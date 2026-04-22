
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/CSP Project/Qlanka-pro/frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCenters() {
  const { data, error } = await supabase.from('service_centers').select('*');
  if (error) {
    console.error("Error fetching centers:", error);
  } else {
    console.log("Centers found:", data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

checkCenters();
