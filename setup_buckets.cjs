const { execSync } = require('child_process');
const fs = require('fs');

const newRef = 'tizwbskyvaejhcajukbn';
const newKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpendic2t5dmFlamhjYWp1a2JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0OTMyMSwiZXhwIjoyMDkyMDI1MzIxfQ.cRB4AwAVZGqXaI0mvrroB1zqL6imT0WuYdM0UkwcJeE';
const ip = '172.64.149.246';
const buckets = ['product-images', 'avatars', 'mail'];

buckets.forEach(bucket => {
    console.log(`Creating bucket: ${bucket}`);
    const body = JSON.stringify({ id: bucket, name: bucket, public: true });
    // Escape quotes for the shell
    const escapedBody = body.replace(/"/g, '\\"');
    try {
        const cmd = `C:\\Windows\\System32\\curl.exe -s -X POST -H "apikey: ${newKey}" -H "Authorization: Bearer ${newKey}" -H "Content-Type: application/json" -d "${escapedBody}" "https://${newRef}.supabase.co/storage/v1/bucket" --resolve "${newRef}.supabase.co:443:${ip}"`;
        const res = execSync(cmd).toString();
        console.log(`Response: ${res}`);
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
});
