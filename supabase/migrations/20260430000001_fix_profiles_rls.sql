-- Add UPDATE policy for profiles
-- This allows Admins and Masters to update any profile, 
-- and users to update their own profiles (full_name, job_title, avatar_url).

-- 1. Policy for users to update their own basic info
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. Policy for Admins/Masters to update anything in any profile
CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR p.role = 'master')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR p.role = 'master')
        )
    );
