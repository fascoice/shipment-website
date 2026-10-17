-- ==============================================================================
-- WORLD TRANSPORT OVERSEAS (WTO) - SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- ==============================================================================
-- Run this script in your Supabase Project:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard
-- 2. Navigate to: SQL Editor -> New Query
-- 3. Paste this entire script and click "RUN" (green button)
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLE: profiles (User Accounts & Roles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ------------------------------------------------------------------------------
-- 2. TABLE: shipments (Consignments, Air Waybills & Ocean Bills of Lading)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Consignor (Sender)
  sender_name TEXT NOT NULL,
  sender_email TEXT DEFAULT '',
  sender_phone TEXT DEFAULT '',
  sender_address TEXT DEFAULT '',
  origin TEXT NOT NULL,
  
  -- Consignee (Receiver)
  receiver_name TEXT NOT NULL,
  receiver_email TEXT DEFAULT '',
  receiver_phone TEXT DEFAULT '',
  receiver_address TEXT DEFAULT '',
  destination TEXT NOT NULL,
  
  -- Cargo Specifications
  transport_mode TEXT NOT NULL DEFAULT 'Air Freight & Express Cargo',
  shipment_type TEXT NOT NULL DEFAULT 'Standard Commercial Cargo',
  cargo_description TEXT DEFAULT '',
  hs_code TEXT DEFAULT '',
  weight NUMERIC NOT NULL DEFAULT 1.0,
  pieces INTEGER NOT NULL DEFAULT 1,
  dimensions_cm TEXT DEFAULT '',
  volumetric_weight NUMERIC DEFAULT 0.0,
  declared_value TEXT DEFAULT 'Declared On Commercial File',
  incoterms TEXT DEFAULT 'DAP',
  packaging_type TEXT DEFAULT 'Reinforced Secure Carton',
  is_fragile BOOLEAN DEFAULT false,
  is_hazardous BOOLEAN DEFAULT false,
  is_insured BOOLEAN DEFAULT true,
  pickup_date DATE DEFAULT CURRENT_DATE,
  special_instructions TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 150.0,
  currency TEXT DEFAULT 'USD',
  
  -- Transit Status
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'Order Booked', 'Picked Up', 'Warehouse Sorting', 'Customs Clearance', 'In Transit', 'At Destination', 'Out for Delivery', 'Delivered', 'Cancelled')
  ),
  estimated_delivery TEXT DEFAULT '3 - 5 Business Days',
  current_location TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_customer ON public.shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. TABLE: shipment_updates (Physical Progress Timeline & Telemetry Milestones)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipment_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_shipment_updates_shipment_id ON public.shipment_updates(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_updates_updated_at ON public.shipment_updates(updated_at ASC);

-- ------------------------------------------------------------------------------
-- 4. TABLE: quotes (Enterprise Freight Quotation Inquiries)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_reference TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  transport_mode TEXT NOT NULL DEFAULT 'Air Freight',
  cargo_type TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  pieces INTEGER NOT NULL DEFAULT 1,
  dimensions TEXT DEFAULT '',
  incoterms TEXT DEFAULT 'DAP',
  estimated_price NUMERIC NOT NULL DEFAULT 0.0,
  currency TEXT DEFAULT 'USD',
  estimated_transit TEXT DEFAULT '',
  special_notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Accepted', 'Booked', 'Archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_quotes_ref ON public.quotes(quote_reference);
CREATE INDEX IF NOT EXISTS idx_quotes_email ON public.quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. TABLE: orders (Commercial Invoices & Billing)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0.0,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
  order_status TEXT NOT NULL DEFAULT 'processing' CHECK (order_status IN ('processing', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipment ON public.orders(shipment_id);

-- ------------------------------------------------------------------------------
-- 6. TABLE: chat_messages (Live Customer & Dispatch Support)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin', 'support', 'ai')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- SHIPMENTS POLICIES (Allows public tracking & booking)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "shipments_select_policy" ON public.shipments;
CREATE POLICY "shipments_select_policy" ON public.shipments
  FOR SELECT USING (true); -- Public tracking by tracking_number and viewing own

DROP POLICY IF EXISTS "shipments_insert_policy" ON public.shipments;
CREATE POLICY "shipments_insert_policy" ON public.shipments
  FOR INSERT WITH CHECK (true); -- Allows public bookings from web visitors

DROP POLICY IF EXISTS "shipments_update_policy" ON public.shipments;
CREATE POLICY "shipments_update_policy" ON public.shipments
  FOR UPDATE USING (public.is_admin() OR (auth.uid() = customer_id AND status = 'Pending'));

DROP POLICY IF EXISTS "shipments_delete_policy" ON public.shipments;
CREATE POLICY "shipments_delete_policy" ON public.shipments
  FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- SHIPMENT_UPDATES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "shipment_updates_select_policy" ON public.shipment_updates;
CREATE POLICY "shipment_updates_select_policy" ON public.shipment_updates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "shipment_updates_insert_policy" ON public.shipment_updates;
CREATE POLICY "shipment_updates_insert_policy" ON public.shipment_updates
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "shipment_updates_admin_policy" ON public.shipment_updates;
CREATE POLICY "shipment_updates_admin_policy" ON public.shipment_updates
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- QUOTES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "quotes_select_policy" ON public.quotes;
CREATE POLICY "quotes_select_policy" ON public.quotes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "quotes_insert_policy" ON public.quotes;
CREATE POLICY "quotes_insert_policy" ON public.quotes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "quotes_admin_policy" ON public.quotes;
CREATE POLICY "quotes_admin_policy" ON public.quotes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- ORDERS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT USING (auth.uid() = customer_id OR public.is_admin());

DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
CREATE POLICY "orders_insert_policy" ON public.orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
CREATE POLICY "orders_update_policy" ON public.orders
  FOR UPDATE USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- CHAT_MESSAGES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "chat_messages_select_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_select_policy" ON public.chat_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "chat_messages_insert_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_policy" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT := 'customer';
BEGIN
  IF NEW.email = 'overseasworldtransport@gmail.com' OR (NEW.raw_user_meta_data->>'role') = 'admin' THEN
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- REALTIME PUBLICATIONS
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'shipments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'shipment_updates') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shipment_updates;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'quotes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;

-- ==============================================================================
-- SAMPLE INITIAL SEED SHIPMENTS
-- ==============================================================================
INSERT INTO public.shipments (
  tracking_number,
  sender_name,
  sender_email,
  origin,
  receiver_name,
  receiver_email,
  destination,
  transport_mode,
  shipment_type,
  cargo_description,
  hs_code,
  weight,
  pieces,
  declared_value,
  incoterms,
  packaging_type,
  price,
  status,
  estimated_delivery,
  current_location
) VALUES
(
  'WTO-INT-849201',
  'EuroTech Automation Ltd',
  'dispatch@eurotech-de.com',
  'Sofia (Bulgaria - Global HQ)',
  'Precision Industrial UK',
  'procurement@precisionuk.co.uk',
  'London (United Kingdom - Heathrow Cargo)',
  'Air Freight & Express Cargo',
  'Industrial Robotics & Servo Actuators',
  'Precision servo motors, high-speed circuit controllers, fiber optic sensors',
  'HS 8501.52',
  42.5,
  3,
  '$14,500 USD',
  'DAP',
  'Reinforced Wooden Crate',
  485.0,
  'In Transit',
  'Tomorrow by 14:00 GMT',
  'Sofia International Airport (SOF) Air Cargo Terminal'
),
(
  'WTO-INT-104928',
  'Hanseatic Maritime Components GmbH',
  'logistics@hanseatic-hh.de',
  'Frankfurt (Germany - CargoCity Süd)',
  'Atlantic Marine Engineering',
  'receiving@atlanticmarine-us.com',
  'New York (USA - JFK Air Cargo)',
  'Air Flight Priority Express',
  'Marine Hydraulic Pump Replacements',
  'Certified marine hydraulic pump components and emergency pressure seals',
  'HS 8413.60',
  88.0,
  2,
  '$22,000 USD',
  'CIF',
  'Euro Pallet with Weatherproof Shrinkwrap',
  840.0,
  'Customs Clearance',
  '2 Business Days',
  'JFK International Airport Cargo Building 77, NY'
),
(
  'WTO-INT-552910',
  'Nordic Renewable Systems AB',
  'shipping@nordicrenewable.se',
  'Amsterdam (Netherlands - Schiphol Cargo)',
  'Gulf Energy Grid LLC',
  'imports@gulfenergy-ae.com',
  'Dubai (UAE - DWC Aviation Hub)',
  'Ocean & Maritime Container',
  'High-Capacity Solar Inverters & Grid Modules',
  'Utility scale commercial PV inverters and lithium storage connectors',
  'HS 8504.40',
  1250.0,
  8,
  '$78,000 USD',
  'FOB',
  'Full Container Load (FCL 20ft Box)',
  3450.0,
  'In Transit',
  '12 Days Trans-Oceanic',
  'Suez Maritime Gateway Corridor'
)
ON CONFLICT (tracking_number) DO NOTHING;

-- Seed initial milestone updates for sample shipments
INSERT INTO public.shipment_updates (shipment_id, status, location, description)
SELECT id, 'Order Booked', origin, 'Air Waybill issued and registered in WTO central operations database.'
FROM public.shipments WHERE tracking_number = 'WTO-INT-849201'
ON CONFLICT DO NOTHING;

INSERT INTO public.shipment_updates (shipment_id, status, location, description)
SELECT id, 'Warehouse Sorting', 'Sofia Global Hub', 'Airside x-ray scanning, weight inspection and customs export clearance certified.'
FROM public.shipments WHERE tracking_number = 'WTO-INT-849201'
ON CONFLICT DO NOTHING;
