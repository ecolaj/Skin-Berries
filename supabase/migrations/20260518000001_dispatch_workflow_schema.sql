-- 1. Add "gerente" to user_role type
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gerente';

-- 2. Add "revision_pendiente" and "aprobacion_pendiente" to dispatch_status type
ALTER TYPE dispatch_status ADD VALUE IF NOT EXISTS 'revision_pendiente';
ALTER TYPE dispatch_status ADD VALUE IF NOT EXISTS 'aprobacion_pendiente';

-- 3. Add columns and explicit foreign key for created_by to dispatch_orders table
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Ensure created_by has an explicit foreign key referencing profiles(id) to disambiguate joins
ALTER TABLE dispatch_orders DROP CONSTRAINT IF EXISTS dispatch_orders_created_by_profiles_fkey;
ALTER TABLE dispatch_orders 
    ADD CONSTRAINT dispatch_orders_created_by_profiles_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Add columns to dispatch_order_items table
ALTER TABLE dispatch_order_items ADD COLUMN IF NOT EXISTS requested_qty INTEGER;
ALTER TABLE dispatch_order_items ADD COLUMN IF NOT EXISTS reviewed_qty INTEGER;

-- Initialize requested_qty for existing records to prevent null issues
UPDATE dispatch_order_items SET requested_qty = dispatch_qty WHERE requested_qty IS NULL;

-- 5. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist before recreating
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create a custom view to solve PostgREST relationship ambiguity issues when querying dispatch_orders
CREATE OR REPLACE VIEW dispatch_orders_view 
WITH (security_invoker = true) AS
SELECT 
    disp.*,
    (
        SELECT json_build_object('full_name', p.full_name)
        FROM profiles p
        WHERE p.id = disp.created_by
    ) AS profiles,
    (
        SELECT json_build_object('id', s.id, 'name', s.name, 'type', s.type)
        FROM stores s
        WHERE s.id = disp.store_id
    ) AS stores
FROM dispatch_orders disp;
