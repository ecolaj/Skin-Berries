-- Migration to add a sequential, human-friendly order number to dispatch_orders and recreate the view

-- 1. Add order_number column of type SERIAL
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS order_number SERIAL;

-- 2. Ensure order_number is UNIQUE
ALTER TABLE dispatch_orders ADD CONSTRAINT dispatch_orders_order_number_key UNIQUE (order_number);

-- 3. Drop the old view first to prevent PostgreSQL signature mismatch errors (column shift)
DROP VIEW IF EXISTS dispatch_orders_view;

-- 4. Recreate the view dispatch_orders_view to expose order_number
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
        SELECT json_build_object(
            'id', s.id,
            'name', s.name,
            'type', s.type
        )
        FROM stores s
        WHERE s.id = disp.store_id
    ) AS stores
FROM dispatch_orders disp;
