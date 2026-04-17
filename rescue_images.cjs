const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const oldRef = 'qvloqfezgaxckvxdbxtc';
const oldKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bG9xZmV6Z2F4Y2t2eGRieHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3NTM4NSwiZXhwIjoyMDg4NzUxMzg1fQ.Fg1D_Lk8mkoW5Nn1gL2-VlftKkqbs0vq5COD_gracmQ';
const newRef = 'tizwbskyvaejhcajukbn';
const newKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpendic2t5dmFlamhjYWp1a2JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0OTMyMSwiZXhwIjoyMDkyMDI1MzIxfQ.cRB4AwAVZGqXaI0mvrroB1zqL6imT0WuYdM0UkwcJeE';
const ip = '172.64.149.246';

const tempDir = path.join('C:', 'Users', 'Erick Colaj', '.gemini', 'antigravity', 'brain', '37a6b01b-a00a-4197-af1d-d02031c3d51a', 'temp_images');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

async function rescue() {
    console.log('--- Rescuing Product Images ---');
    
    // 1. List files
    const listCmd = `C:\\Windows\\System32\\curl.exe -s -X POST -H "apikey: ${oldKey}" -H "Authorization: Bearer ${oldKey}" -H "Content-Type: application/json" -d "{\\"prefix\\":\\"\\"}" "https://${oldRef}.supabase.co/storage/v1/object/list/product-images" --resolve "${oldRef}.supabase.co:443:${ip}"`;
    const listRaw = execSync(listCmd).toString();
    console.log('Raw list response:', listRaw);
    const listRes = JSON.parse(listRaw);
    
    if (!Array.isArray(listRes)) {
        console.error('Expected array but got:', typeof listRes);
        return;
    }
    
    console.log(`Found ${listRes.length} items in old bucket.`);
    
    for (const item of listRes) {
        if (item.name === '.emptyFolderPlaceholder') continue;
        
        console.log(`Processing: ${item.name}`);
        const localPath = path.join(tempDir, item.name);
        
        // 2. Download
        try {
            const downCmd = `C:\\Windows\\System32\\curl.exe -s -H "apikey: ${oldKey}" -H "Authorization: Bearer ${oldKey}" "https://${oldRef}.supabase.co/storage/v1/object/product-images/${item.name}" --resolve "${oldRef}.supabase.co:443:${ip}" -o "${localPath}"`;
            execSync(downCmd);
            console.log(`  Downloaded: ${item.name}`);
            
            // 3. Upload to new
            const upCmd = `C:\\Windows\\System32\\curl.exe -s -X POST -H "apikey: ${newKey}" -H "Authorization: Bearer ${newKey}" -F "cacheControl=3600" -F "upsert=true" -F "file=@${localPath}" "https://${newRef}.supabase.co/storage/v1/object/product-images/${item.name}" --resolve "${newRef}.supabase.co:443:${ip}"`;
            const upRes = execSync(upCmd).toString();
            console.log(`  Uploaded: ${item.name}`);
        } catch (e) {
            console.error(`  Error processing ${item.name}: ${e.message}`);
        }
    }
    console.log('--- Rescue Operation Finished ---');
}

rescue();
