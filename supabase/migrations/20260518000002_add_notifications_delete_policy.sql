-- Migration to add DELETE policy to notifications table if it wasn't applied in the previous schema migration
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);
