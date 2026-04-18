const { createClient } = require('@supabase/supabase-js');

const newRef = 'tizwbskyvaejhcajukbn';
const newKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpendic2t5dmFlamhjYWp1a2JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0OTMyMSwiZXhwIjoyMDkyMDI1MzIxfQ.cRB4AwAVZGqXaI0mvrroB1zqL6imT0WuYdM0UkwcJeE';

const supabase = createClient(`https://${newRef}.supabase.co`, newKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetAdmin() {
    const email = 'admin@admin.com';
    const newPassword = 'admin123';
    
    console.log(`--- Resetting password for ${email} ---`);
    try {
        // Find user ID first
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const user = users.find(u => u.email === email);
        if (!user) {
            console.log('User not found. Creating it...');
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                password: newPassword,
                email_confirm: true
            });
            if (createError) throw createError;
            console.log('User created successfully.');
        } else {
            const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
                user.id,
                { password: newPassword }
            );
            if (updateError) throw updateError;
            console.log('Password updated successfully.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

resetAdmin();
