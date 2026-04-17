const { execSync } = require('child_process');
const fs = require('fs');

const oldRef = 'qvloqfezgaxckvxdbxtc';
const oldKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bG9xZmV6Z2F4Y2t2eGRieHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3NTM4NSwiZXhwIjoyMDg4NzUxMzg1fQ.Fg1D_Lk8mkoW5Nn1gL2-VlftKkqbs0vq5COD_gracmQ';
const ip = '172.64.149.246';

try {
    const cmd = `C:\\Windows\\System32\\curl.exe -s -H "apikey: ${oldKey}" "https://${oldRef}.supabase.co/rest/v1/" --resolve "${oldRef}.supabase.co:443:${ip}"`;
    const raw = execSync(cmd).toString();
    const api = JSON.parse(raw);
    const rpcs = Object.keys(api.paths).filter(p => p.startsWith('/rpc/'));
    console.log('--- RPCs Encontradas ---');
    console.log(JSON.stringify(rpcs, null, 2));
} catch (e) {
    console.error('Error:', e.message);
}
