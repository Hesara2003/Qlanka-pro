
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://titgwsurqbtzsxemsgee.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpdGd3c3VycWJ0enN4ZW1zZ2VlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU5MzAyNiwiZXhwIjoyMDkyMTY5MDI2fQ.LAM2gZoshbxWl85lHHmxeVcPaBy9sxcFr_3xQbw_vAQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCenters() {
  const { data, error } = await supabase.from('service_centers').select('*');
  if (error) {
    console.error("Error fetching centers:", error);
  } else {
    console.log("Centers found (Service Role):", data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

checkCenters();
