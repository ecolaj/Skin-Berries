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

-- 7. ENABLE REALTIME for all tables
-- This allows the frontend to listen for changes and update automatically.
-- Note: Make sure the publication 'supabase_realtime' exists (default in Supabase)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE stores;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE dispatch_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE dispatch_order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE store_inventory;

-- 8. DEFAULT ROLE & AUTO-PROFILE CREATION
-- Set default role to 'operador' for new profile entries
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'operador';

-- Function to handle new user creation from auth.users
-- This ensures that EVERY new user gets a profile and starts as an 'operador'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    new.email,
    'operador',
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
