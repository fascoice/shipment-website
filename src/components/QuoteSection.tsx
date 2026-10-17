import React, { useState } from 'react';
import { 
  Calculator, 
  Plane, 
  Ship, 
  Truck, 
  Package, 
  ArrowRight, 
  Mail, 
  CheckCircle2, 
  Download, 
  Printer, 
  ShieldCheck, 
  Clock, 
  Globe2, 
  Boxes, 
  FileText, 
  Copy,
  Info,
  DollarSign
} from 'lucide-react';
import { submitEnterpriseQuote, sendEmailNotification } from '../services/api';
import { createQuote, isSupabaseConfigured } from '../lib/supabase';

interface QuoteSectionProps {
  onBookWithQuote: (params: {
    origin: string;
    destination: string;
    transportMode: string;
    packageType: string;
    weight: number;
    quantity: number;
    speed: 'Standard' | 'Express';
    declaredValue?: string;
    companyName?: string;
    shipperName?: string;
    shipperEmail?: string;
  }) => void;
}

export const QuoteSection: React.FC<QuoteSectionProps> = ({ onBookWithQuote }) => {
  // Transport Mode
  const [transportMode, setTransportMode] = useState<string>('Air Freight Priority');

  // Hubs
  const worldHubs = [
    { code: 'SOF', label: 'Sofia, Bulgaria (WTO Global HQ & European Air Hub)' },
    { code: 'LHR', label: 'London, United Kingdom (Heathrow Cargo Terminal)' },
    { code: 'FRA', label: 'Frankfurt, Germany (FRA European Cargo Center)' },
    { code: 'JFK', label: 'New York, United States (JFK International Terminal)' },
    { code: 'DXB', label: 'Dubai, United Arab Emirates (Al Maktoum Logistics City)' },
    { code: 'AMS', label: 'Amsterdam, Netherlands (Schiphol Cargo Hub)' },
    { code: 'SIN', label: 'Singapore (Changi Air & Maritime Port)' },
    { code: 'PVG', label: 'Shanghai, China (Pudong Air & Yangshan Deepwater)' },
    { code: 'NRT', label: 'Tokyo, Japan (Narita Air Cargo Terminal)' },
    { code: 'ZRH', label: 'Zurich, Switzerland (Kloten Airport Terminal)' },
    { code: 'CDG', label: 'Paris, France (Charles de Gaulle Cargo City)' },
    { code: 'VAR', label: 'Varna, Bulgaria (Black Sea Maritime Gateway)' },
  ];

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  // Commodity Category
  const commodities = [
    { id: 'Industrial', name: 'Industrial Machinery & Spares', baseHs: 'HS 8413' },
    { id: 'Electronics', name: 'High-Tech Electronics & Servers', baseHs: 'HS 8517' },
    { id: 'CleanEnergy', name: 'Solar Panels & Battery Inverters', baseHs: 'HS 8504' },
    { id: 'Medical', name: 'Medical Devices & Diagnostics', baseHs: 'HS 3004' },
    { id: 'Automotive', name: 'Automotive Components & Engine Parts', baseHs: 'HS 8708' },
    { id: 'General', name: 'General Commercial Merchandise', baseHs: 'HS 9901' },
    { id: 'Documents', name: 'Commercial Deeds & Manifests', baseHs: 'HS 4901' },
  ];
  const [selectedCommodity, setSelectedCommodity] = useState('General Commercial Merchandise');

  // Cargo Specs
  const [weightKg, setWeightKg] = useState<number>(120);
  const [pieces, setPieces] = useState<number>(2);
  const [lengthCm, setLengthCm] = useState<number>(80);
  const [widthCm, setWidthCm] = useState<number>(60);
  const [heightCm, setHeightCm] = useState<number>(50);
  const [declaredValueUsd, setDeclaredValueUsd] = useState<string>('8,500');
  const [incoterms, setIncoterms] = useState<string>('DAP');
  const [includeInsurance, setIncludeInsurance] = useState<boolean>(true);
  const [speed, setSpeed] = useState<'Standard' | 'Express'>('Standard');

  // Customer Contact for Email Dispatch
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Results & Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  // Volumetric weight: (L * W * H * pieces) / 5000 (IATA airfreight rule)
  const volumetricWeightKg = Math.round(((lengthCm * widthCm * heightCm * pieces) / 5000) * 10) / 10;
  const cbm = Math.round(((lengthCm * widthCm * heightCm * pieces) / 1000000) * 100) / 100;
  const chargeableWeightKg = Math.max(weightKg, volumetricWeightKg);

  // Tariff calculation
  let baseRate = 85;
  let ratePerKg = 4.5;
  let transitSla = '3 - 5 Business Days';

  if (transportMode.includes('Air')) {
    baseRate = 120;
    ratePerKg = speed === 'Express' ? 8.2 : 6.0;
    transitSla = speed === 'Express' ? '24 - 48 Hours Priority Air' : '3 - 5 Business Days Air Cargo';
  } else if (transportMode.includes('Ocean FCL')) {
    baseRate = 1450;
    ratePerKg = 0.4;
    transitSla = '14 - 24 Days Maritime Lane';
  } else if (transportMode.includes('Ocean LCL')) {
    baseRate = 320;
    ratePerKg = 1.6;
    transitSla = '18 - 28 Days Maritime Groupage';
  } else if (transportMode.includes('Overland')) {
    baseRate = 95;
    ratePerKg = 2.8;
    transitSla = '2 - 4 Days Motorway Linehaul';
  }

  const linehaulCost = Math.round(baseRate + chargeableWeightKg * ratePerKg);
  const fuelSurcharge = Math.round(linehaulCost * 0.12);
  const terminalHandling = 45;
  const customsBrokerage = 65;
  const insuranceCost = includeInsurance ? Math.max(35, Math.round((Number(declaredValueUsd.replace(/,/g, '')) || 5000) * 0.005)) : 0;
  const totalTariffUsd = linehaulCost + fuelSurcharge + terminalHandling + customsBrokerage + insuranceCost;

  // Handle Quote Request & Email Dispatch
  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please provide your business email so we can transmit this formal quotation.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const quoteRef = `WTO-QT-${randomSuffix}`;

    const quoteData = {
      quoteReference: quoteRef,
      customerName: contactName || companyName || 'Valued WTO Shipper',
      customerEmail: email,
      customerPhone: phone,
      companyName,
      origin,
      destination,
      transportMode,
      cargoType: selectedCommodity,
      weight: chargeableWeightKg,
      pieces,
      dimensions: `${lengthCm}x${widthCm}x${heightCm} cm (${cbm} CBM)`,
      incoterms,
      estimatedPrice: totalTariffUsd,
      currency: 'USD',
      estimatedTransit: transitSla,
      specialNotes,
    };

    try {
      // 1. Send to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          await createQuote({
            quoteReference: quoteRef,
            customerName: quoteData.customerName,
            customerEmail: email,
            customerPhone: phone,
            companyName,
            origin,
            destination,
            transportMode,
            cargoType: selectedCommodity,
            weight: chargeableWeightKg,
            pieces,
            dimensions: quoteData.dimensions,
            incoterms,
            estimatedPrice: totalTariffUsd,
            estimatedTransit: transitSla,
            specialNotes,
          });
        } catch (sbErr) {
          console.warn('Supabase quote save handled (fallback to server):', sbErr);
        }
      }

      // 2. Transmit to server API
      await submitEnterpriseQuote(quoteData);

      // 3. Dispatch formal notification email to shipper and central operations
      await sendEmailNotification({
        recipientEmail: email,
        subject: `[WTO Official Freight Quotation] Ref: ${quoteRef} - ${origin.split(' ')[0]} to ${destination.split(' ')[0]}`,
        body: `WORLD TRANSPORT OVERSEAS (WTO) - OFFICIAL FREIGHT TARIFF QUOTATION
========================================================================
Reference Code : ${quoteRef}
Date Issued    : ${new Date().toUTCString()}
Valid Until    : 30 Days From Issue

CLIENT SPECIFICATIONS:
------------------------------------------------------------------------
Company        : ${companyName || 'Corporate Shipper'}
Contact Name   : ${contactName || 'Trade Representative'}
Email Address  : ${email}
Phone / Mobile : ${phone || 'On Record'}

ROUTING & MULTIMODAL LOGISTICS:
------------------------------------------------------------------------
Origin Port    : ${origin}
Destination    : ${destination}
Carriage Mode  : ${transportMode}
Service Tier   : ${speed}
Est. Transit   : ${transitSla}
Commodity      : ${selectedCommodity}
Incoterms 2020 : ${incoterms}

CARGO WEIGHT & MEASUREMENTS:
------------------------------------------------------------------------
Gross Weight   : ${weightKg} kg
Volumetric Wt  : ${volumetricWeightKg} kg (IATA (L*W*H)/5000)
Chargeable Wt  : ${chargeableWeightKg} kg
Volume (CBM)   : ${cbm} CBM (${pieces} Packages)
Declared Value : $${declaredValueUsd} USD

ITEMIZED TARIFF BREAKDOWN (USD):
------------------------------------------------------------------------
1. Linehaul Base Freight              : $${linehaulCost.toLocaleString()} USD
2. Bunker / Fuel Surcharge (FSC)      : $${fuelSurcharge.toLocaleString()} USD
3. Terminal Handling Charges (THC)    : $${terminalHandling.toLocaleString()} USD
4. Export Customs Brokerage Filing    : $${customsBrokerage.toLocaleString()} USD
5. Comprehensive Transit Insurance    : $${insuranceCost.toLocaleString()} USD
------------------------------------------------------------------------
TOTAL ESTIMATED FREIGHT TARIFF        : $${totalTariffUsd.toLocaleString()} USD

Notes:
${specialNotes || 'Formal tariff locked for booking. Commercial invoice issued on consignment dispatch.'}

CENTRAL OPERATIONS DESK:
World Transport Overseas
Global HQ: Mimi Balkanska St 126, Sofia, Bulgaria
Official Operations Desk Email: overseasworldtransport@gmail.com
`,
        trackingNumber: quoteRef,
        type: 'quote_inquiry',
      });

      setQuoteSuccess({
        ...quoteData,
        linehaulCost,
        fuelSurcharge,
        terminalHandling,
        customsBrokerage,
        insuranceCost,
        totalTariffUsd,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit quotation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyQuoteRef = () => {
    if (quoteSuccess) {
      navigator.clipboard.writeText(quoteSuccess.quoteReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const buildMailtoForShipper = () => {
    if (!quoteSuccess) return '#';
    const subject = encodeURIComponent(`[WTO Freight Quotation] Ref: ${quoteSuccess.quoteReference} - ${origin.split(' ')[0]} to ${destination.split(' ')[0]}`);
    const body = encodeURIComponent(
`Attn: World Transport Overseas Operations Desk (overseasworldtransport@gmail.com)

Please find below my official freight quotation request for booking review:

Quotation Reference : ${quoteSuccess.quoteReference}
Origin Hub          : ${quoteSuccess.origin}
Destination Hub     : ${quoteSuccess.destination}
Carriage Method     : ${quoteSuccess.transportMode}
Chargeable Weight   : ${quoteSuccess.weight} kg (${pieces} packages)
Estimated Tariff    : $${quoteSuccess.totalTariffUsd} USD
Company             : ${companyName || 'Corporate Client'}
Contact Name        : ${contactName || 'Representative'}
Client Email        : ${email}
Telephone           : ${phone}

I would like to proceed with this quotation. Please confirm space allocation on the next departure schedule.
`
    );
    return `mailto:overseasworldtransport@gmail.com?cc=${email}&subject=${subject}&body=${body}`;
  };

  return (
    <section id="quote" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <Calculator className="w-3.5 h-3.5" />
            <span>Instant Freight Tariff & Door-to-Door Quotation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
            Get an Instant International Freight Quote
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Calculate accurate multimodal freight tariffs for Air, Ocean, and Overland corridors. Complete itemized quotations dispatched directly to your email and our 24/7 central desk at <span className="text-orange-400 font-semibold">overseasworldtransport@gmail.com</span>.
          </p>
        </div>

        {/* Modal-style Success Banner when Quote Created */}
        {quoteSuccess && (
          <div className="bg-slate-800/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-700">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Official Quotation Generated & Sent
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-300">Valid for 30 Days</span>
                  </div>
                  <h3 className="text-2xl font-black font-heading text-white mt-0.5">
                    Quotation Reference: {quoteSuccess.quoteReference}
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyQuoteRef}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedRef ? 'Copied Reference!' : 'Copy Ref'}</span>
                </button>

                <a
                  href={buildMailtoForShipper()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-md"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Open in Email App</span>
                </a>
              </div>
            </div>

            {/* Email notification card */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start space-x-3 text-xs text-emerald-200">
              <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300 block font-heading">
                  Quotation Dispatched to Your Inbox
                </strong>
                <p className="mt-0.5 leading-relaxed">
                  A formal PDF/manifest copy of this tariff has been dispatched to <strong>{quoteSuccess.customerEmail}</strong> and copied to the WTO Operations Desk (<strong>overseasworldtransport@gmail.com</strong>).
                </p>
              </div>
            </div>

            {/* Summary Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Logistics Corridor</span>
                <span className="text-xs text-white font-bold block">{quoteSuccess.transportMode}</span>
                <span className="text-[11px] text-slate-400 truncate block">{quoteSuccess.origin.split(' ')[0]} → {quoteSuccess.destination.split(' ')[0]}</span>
              </div>
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Chargeable Weight</span>
                <span className="text-xs text-white font-bold block">{quoteSuccess.weight} KG</span>
                <span className="text-[11px] text-slate-400 block">{pieces} pkgs • {cbm} CBM</span>
              </div>
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Transit Duration</span>
                <span className="text-xs text-emerald-400 font-bold block">{quoteSuccess.estimatedTransit}</span>
                <span className="text-[11px] text-slate-400 block">Scheduled Carrier Slot</span>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl text-white space-y-0.5 shadow-lg shadow-orange-500/20">
                <span className="text-[10px] uppercase font-black text-orange-200">Total Tariff (USD)</span>
                <div className="text-2xl font-black font-mono tracking-tight">${quoteSuccess.totalTariffUsd.toLocaleString()} USD</div>
                <span className="text-[10px] text-orange-100 block font-medium">All-Inclusive Door-to-Door</span>
              </div>
            </div>

            {/* Action to book immediately */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setQuoteSuccess(null)}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                ← Calculate Another Route / Tariff
              </button>

              <button
                onClick={() => {
                  onBookWithQuote({
                    origin,
                    destination,
                    transportMode,
                    packageType: selectedCommodity,
                    weight: chargeableWeightKg,
                    quantity: pieces,
                    speed,
                    declaredValue: declaredValueUsd,
                    companyName,
                    shipperName: contactName,
                    shipperEmail: email,
                  });
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/30 flex items-center justify-center space-x-2 cursor-pointer transition-transform active:scale-95"
              >
                <span>Proceed to Book Consignment with This Quote</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Quotation Workstation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Input Specification Form */}
          <div className="lg:col-span-7 bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl backdrop-blur-xl space-y-6">
            
            {/* 1. Transportation Mode Tabs */}
            <div>
              <label className="block text-xs font-bold text-orange-400 uppercase tracking-wider mb-2.5">
                1. Select Transportation Carriage Mode *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'Air Freight Priority', icon: Plane, label: 'Air Priority', transit: '24-48h' },
                  { name: 'Ocean FCL Container', icon: Ship, label: 'Ocean FCL', transit: '20ft/40ft' },
                  { name: 'Ocean LCL Consolidated', icon: Boxes, label: 'Ocean LCL', transit: 'Groupage' },
                  { name: 'Overland Road Freight', icon: Truck, label: 'Road Haulage', transit: '2-4 Days' },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSel = transportMode === mode.name;
                  return (
                    <button
                      key={mode.name}
                      type="button"
                      onClick={() => setTransportMode(mode.name)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                        isSel
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/25 ring-2 ring-orange-500/30'
                          : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-0.5" />
                      <span className="font-bold text-xs">{mode.label}</span>
                      <span className={`text-[10px] ${isSel ? 'text-orange-100' : 'text-slate-400'}`}>{mode.transit}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Origin & Destination Corridors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                  <span>Origin Gateway Hub *</span>
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="">Select departure origin gateway...</option>
                  {worldHubs.map((h) => (
                    <option key={h.code} value={h.label}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                  <span>Destination Hub / Airport *</span>
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="">Select arrival destination hub...</option>
                  {worldHubs.map((h) => (
                    <option key={h.code} value={h.label}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Commodity & Incoterms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Cargo Commodity Category
                </label>
                <select
                  value={selectedCommodity}
                  onChange={(e) => setSelectedCommodity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  {commodities.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.baseHs})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Incoterms 2020 Rules
                </label>
                <select
                  value={incoterms}
                  onChange={(e) => setIncoterms(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="DAP">DAP (Delivered at Place - Most Common)</option>
                  <option value="DDP">DDP (Delivered Duty Paid - All Clearances Covered)</option>
                  <option value="CIF">CIF (Cost, Insurance & Freight to Port)</option>
                  <option value="FOB">FOB (Free on Board Terminal)</option>
                  <option value="EXW">EXW (Ex Works Factory Pickup)</option>
                </select>
              </div>
            </div>

            {/* 4. Physical Dimensions & Weight */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Weight & Volumetric Metrics
                </label>
                <span className="text-[11px] text-orange-400 font-mono">
                  Chargeable Weight: <strong>{chargeableWeightKg} KG</strong> ({cbm} CBM)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Gross Wt (kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Packages</label>
                  <input
                    type="number"
                    min="1"
                    value={pieces}
                    onChange={(e) => setPieces(Number(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Length (cm)</label>
                  <input
                    type="number"
                    min="10"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value) || 10)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Width (cm)</label>
                  <input
                    type="number"
                    min="10"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value) || 10)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min="10"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value) || 10)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 5. Declared Value, Insurance & Speed */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Declared Value ($ USD)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={declaredValueUsd}
                    onChange={(e) => setDeclaredValueUsd(e.target.value)}
                    placeholder="e.g. 10,000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pl-7 text-xs text-white font-bold"
                  />
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Carrier Priority Speed
                </label>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                >
                  <option value="Standard">Standard Freight Schedule</option>
                  <option value="Express">Express Priority (Runway Boarding)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-5">
                <input
                  type="checkbox"
                  id="quote-insurance"
                  checked={includeInsurance}
                  onChange={(e) => setIncludeInsurance(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 bg-slate-900 border-slate-700 focus:ring-orange-500"
                />
                <label htmlFor="quote-insurance" className="text-xs text-slate-300 cursor-pointer font-medium">
                  Add Comprehensive Cargo Insurance
                </label>
              </div>
            </div>

            {/* 6. Contact Information for Email Dispatch */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-700 space-y-3">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                Official Email Quotation Dispatch Details
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Your Business / Personal Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="consignor@company.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. John Doe / Logistics Director"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. EuroTech Ltd"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Contact Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 20 7946 0912"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleRequestQuote}
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              <Mail className="w-4 h-4" />
              <span>{isSubmitting ? 'Transmitting Formal Quotation...' : 'Transmit Official Quotation to My Email'}</span>
            </button>

          </div>

          {/* Right: Live Tariff Breakdown Card */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Card Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-700/80">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Calculator className="w-4 h-4" />
                  <span>Itemized Tariff Statement</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-slate-300">
                  ESTIMATE (USD)
                </span>
              </div>

              {/* Total Price Banner */}
              <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  Total Estimated Freight Tariff
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                  ${totalTariffUsd.toLocaleString()} <span className="text-xs font-bold text-orange-400 font-sans">USD</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium pt-1">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Transit SLA: <strong>{transitSla}</strong></span>
                </div>
              </div>

              {/* Itemized Cost Breakdown Table */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-700/60 text-slate-300">
                  <span>1. Linehaul Base Carriage ({transportMode})</span>
                  <strong className="text-white font-mono">${linehaulCost.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/60 text-slate-300">
                  <span>2. Bunker / Aviation Fuel Surcharge (12%)</span>
                  <strong className="text-white font-mono">${fuelSurcharge.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/60 text-slate-300">
                  <span>3. Terminal Handling Charges (THC)</span>
                  <strong className="text-white font-mono">${terminalHandling.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/60 text-slate-300">
                  <span>4. Export Customs Brokerage Filing</span>
                  <strong className="text-white font-mono">${customsBrokerage.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/60 text-slate-300">
                  <span>5. Cargo All-Risk Marine Insurance</span>
                  <strong className="text-white font-mono">${insuranceCost.toLocaleString()}</strong>
                </div>
              </div>

              {/* Operational Guarantee Note */}
              <div className="p-3.5 bg-black/30 rounded-2xl border border-white/5 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>WTO Price Integrity Guarantee</span>
                </div>
                <p className="leading-relaxed">
                  No hidden surcharge. All consignments are backed by WTO European compliance standards. Formal waybill & customs docs are emailed by <strong>overseasworldtransport@gmail.com</strong>.
                </p>
              </div>

              {/* Direct Booking Shortcut */}
              <button
                type="button"
                onClick={() => {
                  onBookWithQuote({
                    origin,
                    destination,
                    transportMode,
                    packageType: selectedCommodity,
                    weight: chargeableWeightKg,
                    quantity: pieces,
                    speed,
                    declaredValue: declaredValueUsd,
                    companyName,
                    shipperName: contactName,
                    shipperEmail: email,
                  });
                }}
                className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Proceed to Book This Consignment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
