const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const oldRef = 'qvloqfezgaxckvxdbxtc';
const oldKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bG9xZmV6Z2F4Y2t2eGRieHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3NTM4NSwiZXhwIjoyMDg4NzUxMzg1fQ.Fg1D_Lk8mkoW5Nn1gL2-VlftKkqbs0vq5COD_gracmQ';
const newRef = 'tizwbskyvaejhcajukbn';
const newKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpendic2t5dmFlamhjYWp1a2JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0OTMyMSwiZXhwIjoyMDkyMDI1MzIxfQ.cRB4AwAVZGqXaI0mvrroB1zqL6imT0WuYdM0UkwcJeE';
const ip = '172.64.149.246';

const tempDir = path.join('C:', 'Users', 'Erick Colaj', '.gemini', 'antigravity', 'brain', '37a6b01b-a00a-4197-af1d-d02031c3d51a', 'temp_mail');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

async function rescueMail() {
    console.log('--- Rescuing Mail Assets ---');
    
    // 1. List files in 'mail'
    const listCmd = `C:\\Windows\\System32\\curl.exe -s -X POST -H "apikey: ${oldKey}" -H "Authorization: Bearer ${oldKey}" -H "Content-Type: application/json" -d "{\\"prefix\\":\\"\\"}" "https://${oldRef}.supabase.co/storage/v1/object/list/mail" --resolve "${oldRef}.supabase.co:443:${ip}"`;
    const listRes = JSON.parse(execSync(listCmd).toString());
    
    console.log(`Found ${listRes.length} items in old mail bucket.`);
    
    for (const item of listRes) {
        if (item.name === '.emptyFolderPlaceholder') continue;
        
        console.log(`Processing: ${item.name}`);
        const localPath = path.join(tempDir, item.name);
        
        // 2. Download
        try {
            const downCmd = `C:\\Windows\\System32\\curl.exe -s -H "apikey: ${oldKey}" -H "Authorization: Bearer ${oldKey}" "https://${oldRef}.supabase.co/storage/v1/object/mail/${item.name}" --resolve "${oldRef}.supabase.co:443:${ip}" -o "${localPath}"`;
            execSync(downCmd);
            
            // 3. Upload to new
            const upCmd = `C:\\Windows\\System32\\curl.exe -s -X POST -H "apikey: ${newKey}" -H "Authorization: Bearer ${newKey}" -F "cacheControl=3600" -F "upsert=true" -F "file=@${localPath}" "https://${newRef}.supabase.co/storage/v1/object/mail/${item.name}" --resolve "${newRef}.supabase.co:443:${ip}"`;
            execSync(upCmd);
            console.log(`  Rescued: ${item.name}`);
        } catch (e) {
            console.error(`  Error processing ${item.name}: ${e.message}`);
        }
    }
}

rescueMail();
