-- Schema for Skin & Berries
-- Generated from src/types/supabase.ts

-- Enums
CREATE TYPE dispatch_status AS ENUM ('pendiente', 'despachado', 'recibido', 'anulada');
CREATE TYPE store_type AS ENUM ('warehouse', 'store', 'event');
CREATE TYPE user_role AS ENUM ('admin', 'store_manager', 'master', 'operador', 'consulta', 'mercadeo', 'ventas');

-- Tables
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  price NUMERIC,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  schedule TEXT,
  type store_type DEFAULT 'store',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  job_title TEXT,
  role user_role DEFAULT 'consulta',
  assigned_stores TEXT[], -- Storing store IDs as text array for simplicity or reference
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dispatch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  status dispatch_status DEFAULT 'pendiente',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  dispatched_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dispatch_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES dispatch_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  dispatch_qty INTEGER NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  base_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE store_inventory (
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL DEFAULT 0,
  base_stock INTEGER NOT NULL DEFAULT 0,
  last_counted_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (store_id, product_id)
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_inventory ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Admin has full access, others restricted)
-- These are basic policies to get things running.
CREATE POLICY "Public products viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Public stores viewable by everyone" ON stores FOR SELECT USING (true);
CREATE POLICY "Profiles viewable by self or admin" ON profiles FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
