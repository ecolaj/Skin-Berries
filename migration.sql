-- 1. Add "gerente" to user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gerente';

-- 2. Add "revision_pendiente", "aprobacion_pendiente" to dispatch_status
ALTER TYPE dispatch_status ADD VALUE IF NOT EXISTS 'revision_pendiente';
ALTER TYPE dispatch_status ADD VALUE IF NOT EXISTS 'aprobacion_pendiente';

-- 3. Add columns to dispatch_orders
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Add columns to dispatch_order_items
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

CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);
