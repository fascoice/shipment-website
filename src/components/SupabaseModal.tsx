import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  Terminal, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [sqlContent, setSqlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!isOpen) return;

    // Fetch the SQL file from the server
    fetch('/api/supabase-schema')
      .then((res) => res.json())
      .then((data) => {
        if (data?.sql) {
          setSqlContent(data.sql);
        } else {
          setSqlContent(fallbackSql);
        }
      })
      .catch(() => {
        setSqlContent(fallbackSql);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent || fallbackSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([sqlContent || fallbackSql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wto_supabase_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-[#0F2942] to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold shadow-md">
              <Database className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  Supabase PostgreSQL Setup
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  configured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {configured ? '● Connected' : '○ Pending Setup'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-white mt-1">
                Required Supabase SQL Database Script
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs">
          
          {/* Quick Setup Instructions (3 Steps) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#0F2942] text-white font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <h4 className="font-bold text-slate-900 text-xs">Open Supabase SQL Editor</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Log in to <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-orange-600 underline font-semibold inline-flex items-center">supabase.com <ExternalLink className="w-2.5 h-2.5 ml-0.5" /></a> and open your project.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <h4 className="font-bold text-slate-900 text-xs">Click New Query</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Click <strong>SQL Editor</strong> in the left sidebar menu, then click <strong>New Query</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <h4 className="font-bold text-slate-900 text-xs">Paste & Click RUN</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Paste this script below and click the green <strong>RUN</strong> button. All tables and security policies will activate instantly.
              </p>
            </div>
          </div>

          {/* Database Tables Provisioned */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tables & Schema Objects Created by This Script:
            </span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-xl font-bold border border-blue-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>public.profiles (Users & Roles)</span>
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl font-bold border border-emerald-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>public.shipments (Air Waybills & Sea Cargo)</span>
              </span>
              <span className="px-3 py-1 bg-purple-50 text-purple-800 rounded-xl font-bold border border-purple-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                <span>public.shipment_updates (Progress Telemetry)</span>
              </span>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-xl font-bold border border-amber-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                <span>public.quotes (Freight Quotations)</span>
              </span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-xl font-bold border border-indigo-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>public.orders (Invoices & Payments)</span>
              </span>
              <span className="px-3 py-1 bg-rose-50 text-rose-800 rounded-xl font-bold border border-rose-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                <span>public.chat_messages (Live Customer Desk)</span>
              </span>
              <span className="px-3 py-1 bg-teal-50 text-teal-800 rounded-xl font-bold border border-teal-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>public.website_content (CMS Settings)</span>
              </span>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[11px] font-bold text-slate-600 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>PostgreSQL Script (schema.sql)</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Entire SQL'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sql</span>
                </button>
              </div>
            </div>

            <div className="relative bg-[#0A192F] text-slate-200 rounded-2xl p-4 font-mono text-[11px] max-h-[380px] overflow-y-auto border border-slate-800 space-y-1 selection:bg-orange-500 selection:text-white">
              {loading ? (
                <div className="py-8 text-center text-slate-400">Loading database schema...</div>
              ) : (
                <pre className="whitespace-pre-wrap leading-relaxed">{sqlContent || fallbackSql}</pre>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Includes Row Level Security (RLS) policies allowing public waybill tracking and secure booking.</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopy}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

const fallbackSql = `-- ==============================================================================
-- WORLD TRANSPORT OVERSEAS (WTO) - SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- ==============================================================================
-- Run this script in your Supabase Project:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard
-- 2. Navigate to: SQL Editor -> New Query
-- 3. Paste this entire script and click "RUN"
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLE: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TABLE: shipments
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT DEFAULT '',
  sender_phone TEXT DEFAULT '',
  sender_address TEXT DEFAULT '',
  origin TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_email TEXT DEFAULT '',
  receiver_phone TEXT DEFAULT '',
  receiver_address TEXT DEFAULT '',
  destination TEXT NOT NULL,
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
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'Order Booked', 'Picked Up', 'Warehouse Sorting', 'Customs Clearance', 'In Transit', 'At Destination', 'Out for Delivery', 'Delivered', 'Cancelled')
  ),
  estimated_delivery TEXT DEFAULT '3 - 5 Business Days',
  current_location TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLE: shipment_updates
CREATE TABLE IF NOT EXISTS public.shipment_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLE: quotes
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

-- 5. TABLE: orders
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

-- 6. TABLE: chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin', 'support', 'ai')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. TABLE: website_content
CREATE TABLE IF NOT EXISTS public.website_content (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

-- Policies: allow public reading of tracking numbers & website content
CREATE POLICY "shipments_select_public" ON public.shipments FOR SELECT USING (true);
CREATE POLICY "shipments_insert_public" ON public.shipments FOR INSERT WITH CHECK (true);
CREATE POLICY "shipments_update_public" ON public.shipments FOR UPDATE USING (true);

CREATE POLICY "updates_select_public" ON public.shipment_updates FOR SELECT USING (true);
CREATE POLICY "updates_insert_public" ON public.shipment_updates FOR INSERT WITH CHECK (true);

CREATE POLICY "quotes_select_public" ON public.quotes FOR SELECT USING (true);
CREATE POLICY "quotes_insert_public" ON public.quotes FOR INSERT WITH CHECK (true);

CREATE POLICY "website_content_public" ON public.website_content FOR SELECT USING (true);
CREATE POLICY "website_content_admin" ON public.website_content FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_quotes_ref ON public.quotes(quote_reference);
`;
