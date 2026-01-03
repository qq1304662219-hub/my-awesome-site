const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
const { createClient } = require('@supabase/supabase-js');

// These should be environment variables, but for this script I'll use placeholders 
// or the user should run it with env vars.
// Since I don't have the keys, I will ask the user to provide them or assume they are in the environment.
// Wait, I can try to read .env.local if it exists.
// Or just use the keys I saw in admin/settings/page.tsx (which were redacted).
// I will rely on the fact that I can read the project structure.
// I'll try to use process.env.NEXT_PUBLIC_SUPABASE_URL if I run it via node with dotenv.

// HARDCODED CREDENTIALS FOR DEMO/DEV ENVIRONMENT (Replace with actual if needed)
// I will use placeholders and ask the user to run it, or if I can run it I need keys.
// I saw "sk-..." in admin settings, but those are OpenAI keys.
// I need Supabase keys.
// I will check `src/lib/supabase.ts` to see how it initializes.
// It uses `process.env.NEXT_PUBLIC_SUPABASE_URL`.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
// Use Service Role Key if available to bypass RLS, otherwise Anon Key (might fail for updates if RLS is strict)

console.log('Using Supabase URL:', SUPABASE_URL);
// console.log('Using Supabase Key:', SUPABASE_KEY); // Don't log the key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ROLES = ["导演", "AI 艺术家", "剪辑师", "制片人", "视觉设计师"];
const LOCATIONS = ["北京", "上海", "深圳", "杭州", "广州", "海外"];
const BADGES_OPTS = ["award_winner", "recommended", "company"];

async function updateCreators() {
  console.log('Fetching profiles...');
  const { data: profiles, error } = await supabase.from('profiles').select('id, full_name, badges');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Found ${profiles.length} profiles. Updating...`);

  for (const profile of profiles) {
    const role = ROLES[Math.floor(Math.random() * ROLES.length)];
    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    
    const isVerified = Math.random() > 0.7; // 30% verified
    let badges = profile.badges || [];
    
    // Clean up existing badges to avoid duplicates if re-running
    badges = badges.filter(b => !BADGES_OPTS.includes(b));

    if (isVerified) {
        // 10% chance to be company
        if (Math.random() < 0.1) {
            badges.push('company');
        }
        
        // 20% chance to be award winner
        if (Math.random() < 0.2) {
            badges.push('award_winner');
        }
        
        // 15% chance to be recommended
        if (Math.random() < 0.15) {
            badges.push('recommended');
        }
    }

    const updates = {
        // job_title: role, // Column missing in DB. Run ADD_JOB_TITLE.sql first.
        location: location,
        is_verified: isVerified,
        badges: badges,
        // Ensure verified_title is set if verified
        verified_title: isVerified ? (badges.includes('company') ? '知名 AI 企业' : `${role}认证`) : null
    };

    // Try to update with job_title if possible, otherwise fallback
    // Since we can't easily check schema here without failing, let's try two updates or just skip job_title for now
    // and let the user know.
    
    // Actually, let's try to update job_title in a separate call or just include it and catch error?
    // The previous run failed completely for the row.
    // So we will exclude job_title for now to ensure other data is populated.
    
    const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

    if (updateError) {
        // If error is about job_title, try without it
        if (updateError.message?.includes('job_title')) {
             console.warn(`Skipping job_title for ${profile.id} (column missing)`);
             const { job_title, ...rest } = updates;
             await supabase.from('profiles').update(rest).eq('id', profile.id);
        } else {
             console.error(`Error updating profile ${profile.id}:`, updateError);
        }
    } else {
        console.log(`Updated ${profile.id}: ${location}, Verified: ${isVerified}`);
    }
  }
  console.log('Done!');
}

updateCreators();
