const { execSync } = require('child_process');
const oldRef = 'qvloqfezgaxckvxdbxtc';
const oldKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bG9xZmV6Z2F4Y2t2eGRieHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3NTM4NSwiZXhwIjoyMDg4NzUxMzg1fQ.Fg1D_Lk8mkoW5Nn1gL2-VlftKkqbs0vq5COD_gracmQ';
const ip = '172.64.149.246';

try {
    const cmd = \C:\\\\Windows\\\\System32\\\\curl.exe -s -H \"apikey: \\" \"https://\.supabase.co/rest/v1/\" --resolve \"\.supabase.co:443:\\"\;
    const res = JSON.parse(execSync(cmd).toString());
    const rpcs = Object.keys(res.paths).filter(p => p.startsWith('/rpc/'));
    console.log('RPCs Encontradas:', rpcs);
} catch (e) {
    console.error('Error:', e.message);
}
