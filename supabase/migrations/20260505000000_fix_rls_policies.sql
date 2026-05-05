-- Fix RLS Policies for Skin & Berries
-- This migration adds the missing INSERT and UPDATE policies for key tables.

-- 1. STORES Table
-- Allow admin, master, and operador to insert and update stores
CREATE POLICY "Managers can insert stores" ON stores 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master', 'operador')
        )
    );

CREATE POLICY "Managers can update stores" ON stores 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master', 'operador')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master', 'operador')
        )
    );

-- 2. PRODUCTS Table
-- Allow anyone except 'consulta' to manage products
CREATE POLICY "Managers can insert products" ON products 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role NOT IN ('consulta')
        )
    );

CREATE POLICY "Managers can update products" ON products 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role NOT IN ('consulta')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role NOT IN ('consulta')
        )
    );

-- 3. STORE_INVENTORY Table
-- Allow anyone except 'consulta' to manage inventory
CREATE POLICY "Public inventory viewable by everyone" ON store_inventory FOR SELECT USING (true);

CREATE POLICY "Managers can manage inventory" ON store_inventory 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role NOT IN ('consulta')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role NOT IN ('consulta')
        )
    );

-- 4. DISPATCH_ORDERS Table
-- Allow anyone to see orders, but only non-consulta can create/update
CREATE POLICY "Public dispatch orders viewable by everyone" ON dispatch_orders FOR SELECT USING (true);

CREATE POLICY "Managers can insert orders" ON dispatch_orders 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role NOT IN ('consulta')
        )
    );

CREATE POLICY "Managers can update orders" ON dispatch_orders 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role NOT IN ('consulta')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role NOT IN ('consulta')
        )
    );

-- 5. DISPATCH_ORDER_ITEMS Table
CREATE POLICY "Public dispatch order items viewable by everyone" ON dispatch_order_items FOR SELECT USING (true);

CREATE POLICY "Managers can insert order items" ON dispatch_order_items 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role NOT IN ('consulta')
        )
    );

-- 6. STORAGE Policies (for product-images bucket)
CREATE POLICY "Public Access to product images" ON storage.objects FOR SELECT USING ( bucket_id = 'product-images' );
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );
CREATE POLICY "Authenticated users can update product images" ON storage.objects FOR UPDATE USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );
CREATE POLICY "Authenticated users can delete product images" ON storage.objects FOR DELETE USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );
