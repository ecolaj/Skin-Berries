const { createClient } = require('@supabase/supabase-js');

const newRef = 'tizwbskyvaejhcajukbn';
const newKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpendic2t5dmFlamhjYWp1a2JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0OTMyMSwiZXhwIjoyMDkyMDI1MzIxfQ.cRB4AwAVZGqXaI0mvrroB1zqL6imT0WuYdM0UkwcJeE';

const supabase = createClient(`https://${newRef}.supabase.co`, newKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function listUsers() {
    console.log('--- Listing Auth Users ---');
    try {
        const { data: { users }, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;
        console.log(`Total users found: ${users.length}`);
        users.forEach(u => {
            console.log(`- Email: ${u.email}, ID: ${u.id}, Confirmed: ${u.email_confirmed_at ? 'Yes' : 'No'}`);
        });
    } catch (e) {
        console.error('Error:', e.message);
    }
}

listUsers();
