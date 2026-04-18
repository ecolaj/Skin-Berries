const { execSync } = require('child_process');

const newRef = 'tizwbskyvaejhcajukbn';
const newKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpendic2t5dmFlamhjYWp1a2JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0OTMyMSwiZXhwIjoyMDkyMDI1MzIxfQ.cRB4AwAVZGqXaI0mvrroB1zqL6imT0WuYdM0UkwcJeE';
const ip = '172.64.149.246';

async function checkUsers() {
    console.log('--- Checking Auth Users in New Project ---');
    try {
        // We use the REST API to query auth schema if possible, or we use a SQL RPC if one exists.
        // Actually, we can just try to hit the auth/v1/user endpoint with service_role? 
        // No, let's use the REST API to query the 'auth' schema if permitted, 
        // though usually REST is only for'public'.
        // Let's try to see if there's any info in the 'profiles' table first.
        
        const profileCmd = `C:\\Windows\\System32\\curl.exe -s -H "apikey: ${newKey}" -H "Authorization: Bearer ${newKey}" "https://${newRef}.supabase.co/rest/v1/profiles?select=email,id" --resolve "${newRef}.supabase.co:443:${ip}"`;
        const profiles = JSON.parse(execSync(profileCmd).toString());
        console.log(`Found ${profiles.length} profiles.`);
        if (profiles.length > 0) {
            console.log('First 5 profiles:', profiles.slice(0, 5));
        }

        // Now let's try to check if we can reach auth info.
        // Usually we can't query auth.users via REST unless we have a specific RPC.
        // But we can check if there's an RPC for migrating users.
        
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkUsers();
