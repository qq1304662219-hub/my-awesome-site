
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  console.log('URL:', supabaseUrl);
  console.log('Key:', serviceRoleKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createBuckets() {
  const buckets = ['videos', 'covers', 'avatars'];

  for (const bucket of buckets) {
    console.log(`Checking bucket: ${bucket}...`);
    const { data, error } = await supabase.storage.getBucket(bucket);
    
    if (error && (error.message.includes('not found') || error.status === 404)) {
      console.log(`Creating bucket: ${bucket}`);
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: bucket === 'videos' ? 524288000 : 10485760,
        allowedMimeTypes: bucket === 'videos' 
          ? ['video/mp4', 'video/quicktime', 'video/webm'] 
          : ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
      
      if (createError) {
        console.error(`Error creating ${bucket}:`, createError);
      } else {
        console.log(`Created ${bucket} successfully`);
      }
    } else if (data) {
      console.log(`Bucket ${bucket} already exists`);
      const { error: updateError } = await supabase.storage.updateBucket(bucket, { public: true });
      if (updateError) console.error(`Error updating ${bucket}:`, updateError);
    } else {
      console.error(`Error checking ${bucket}:`, error);
    }
  }
}

createBuckets();
