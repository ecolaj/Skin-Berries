-- Migration to add id_orden column to dispatch_orders and dispatch_order_items

-- 1. Drop existing trigger if it exists from previous migration attempt
DROP TRIGGER IF EXISTS trg_set_dispatch_item_id_orden ON dispatch_order_items;
DROP FUNCTION IF EXISTS set_dispatch_item_id_orden();

-- 2. Drop the id_orden column from dispatch_order_items if it exists
ALTER TABLE dispatch_order_items DROP COLUMN IF EXISTS id_orden CASCADE;

-- 3. Drop the id_orden / order_number column from dispatch_orders if it exists
ALTER TABLE dispatch_orders DROP COLUMN IF EXISTS id_orden CASCADE;
ALTER TABLE dispatch_orders DROP COLUMN IF EXISTS order_number CASCADE;

-- 4. Add id_orden as a generated column in dispatch_orders
ALTER TABLE dispatch_orders ADD COLUMN id_orden TEXT GENERATED ALWAYS AS (UPPER(substring(id::text from 1 for 8))) STORED;

-- 5. Add id_orden as a generated column in dispatch_order_items
ALTER TABLE dispatch_order_items ADD COLUMN id_orden TEXT GENERATED ALWAYS AS (UPPER(substring(order_id::text from 1 for 8))) STORED;

-- 6. Recreate the view dispatch_orders_view to expose id_orden instead of order_number
DROP VIEW IF EXISTS dispatch_orders_view;
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
