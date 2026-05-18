-- Allow all authenticated users to select profiles so they can assign dispatches and see other active users
DROP POLICY IF EXISTS "Profiles viewable by self or admin" ON profiles;

CREATE POLICY "Profiles are viewable by all authenticated users" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);
