import React, { useState } from 'react';
import { Check, AlertCircle, ArrowRight, ShieldCheck, HelpCircle, Globe, Plane, Ship, Truck, Mail } from 'lucide-react';

interface PricingSectionProps {
  onBookRate: (serviceType: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onBookRate }) => {
  const [activeTab, setActiveTab] = useState<'AIR' | 'OCEAN' | 'OVERLAND'>('AIR');

  const airTiers = [
    {
      name: 'Priority International Air Courier',
      price: 'Custom Quote on Request',
      period: 'Tariff based on weight & dimensions',
      type: 'Documents, high-value samples, diplomatic pouches',
      weight: '0.5 kg to 10 kg',
      speed: '2 - 4 Business Days Worldwide',
      features: [
        'Direct Sofia Bulgaria HQ air corridor',
        'Customs export / import documentation included',
        'International barcode tracking & waybill',
        'Doorstep collection and secure handover',
      ],
      popular: false,
    },
    {
      name: 'Commercial Airfreight Cargo',
      price: 'Custom Quote on Request',
      period: 'Tariff assessed upon intake',
      type: 'Industrial electronics, medical reagents, equipment',
      weight: '10 kg to 500+ kg',
      speed: '3 - 5 Business Days',
      features: [
        'Scheduled cargo flights connecting Sofia, London, Frankfurt & New York',
        'Bonded airport sorting & cold-chain options',
        'Comprehensive international customs clearance handling',
        'Full transit marine & aviation cargo cover',
      ],
      popular: true,
    },
    {
      name: 'Emergency Aircraft Charter & Hand-Carry',
      price: 'Custom Quote on Request',
      period: 'Bespoke charter schedule',
      type: 'Urgent industrial parts, critical medical supplies',
      weight: 'Any capacity / palletized',
      speed: '24 - 48 Hours Guaranteed',
      features: [
        'Dedicated chartered aircraft routing',
        'Direct tarmac airside priority retrieval',
        'Dedicated WTO flight coordinator',
        '24/7 flight telemetry dispatch updates',
      ],
      popular: false,
    },
  ];

  const oceanTiers = [
    {
      name: 'Less Than Container Load (LCL)',
      price: 'Custom Quote on Request',
      period: 'Tariff per CBM (Cubic Meter)',
      type: 'Commercial merchandise, retail bulk, palletized crates',
      weight: 'Consolidated shipments (1 CBM to 15 CBM)',
      speed: '18 - 25 Days Transit',
      features: [
        'Consolidation at European & Asian sea hubs',
        'Major international ocean port bonded customs handling',
        'Secure weatherproof maritime containers',
        'Door-to-door or port-to-port options',
      ],
      popular: true,
    },
    {
      name: 'Full Container Load (FCL 20ft / 40ft)',
      price: 'Custom Quote on Request',
      period: 'Tariff per standard maritime container',
      type: 'Raw materials, heavy vehicles, project cargo',
      weight: 'Up to 28 Metric Tons per container',
      speed: 'Direct Sea Line Scheduling',
      features: [
        'Dedicated 20ft / 40ft High Cube containers',
        'Direct vessel booking with premier shipping lines',
        'Port demurrage risk mitigation protocol',
        'Offshore customs escort & delivery',
      ],
      popular: false,
    },
  ];

  const overlandTiers = [
    {
      name: 'Cross-Border Overland Freight',
      price: 'Custom Quote on Request',
      period: 'Tariff based on route & tonnage',
      type: 'Commercial goods, electronics, industrial equipment',
      weight: 'From 100 kg to full trailer load (30 Tons)',
      speed: '1 - 3 Days Regional',
      features: [
        'Daily linehaul routes across European & global motorway corridors',
        'Depot-to-depot or direct warehouse offloading',
        'Real-time GPS vehicle tracking',
        'Goods-in-transit comprehensive insurance',
      ],
      popular: true,
    },
    {
      name: 'Trans-Continental Freight Corridor',
      price: 'Custom Quote on Request',
      period: 'Tariff per transit manifest',
      type: 'Inter-regional trade goods & machinery',
      weight: 'Full truckload / multi-drop',
      speed: '3 - 7 Business Days',
      features: [
        'International customs transit documentation',
        'GPS-escorted transcontinental convoys',
        'Cross-border bonded border post clearance',
        'Multi-point distribution drops',
      ],
      popular: false,
    },
  ];

  const activeTiers = activeTab === 'AIR' ? airTiers : activeTab === 'OCEAN' ? oceanTiers : overlandTiers;

  return (
    <section id="pricing" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
            Transparent Tariff Framework
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] font-heading mt-3 tracking-tight">
            International Shipping Rates & Tariffs
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            In accordance with international freight standards, WTO provides customized quotes based on volumetric weight, route clearances, and fuel indices. No rigid or hidden fees.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex space-x-1 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('AIR')}
              className={`px-5 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                activeTab === 'AIR'
                  ? 'bg-[#0F2942] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>International Airfreight</span>
            </button>
            <button
              onClick={() => setActiveTab('OCEAN')}
              className={`px-5 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                activeTab === 'OCEAN'
                  ? 'bg-[#0F2942] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ship className="w-4 h-4" />
              <span>Ocean Container Freight</span>
            </button>
            <button
              onClick={() => setActiveTab('OVERLAND')}
              className={`px-5 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                activeTab === 'OVERLAND'
                  ? 'bg-[#0F2942] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Nationwide & Cross-Border</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid (No actual rigid price) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {activeTiers.map((tier, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-8 border flex flex-col justify-between transition-all duration-300 relative ${
                tier.popular
                  ? 'bg-white border-orange-500 shadow-xl ring-2 ring-orange-500/20 shadow-orange-500/10'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                  Most Requested Tariff
                </span>
              )}

              <div>
                <h3 className="text-xl font-bold text-[#0F2942] font-heading">{tier.name}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{tier.type}</p>

                {/* Tariff Quote Notice (No actual rigid price) */}
                <div className="my-6 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-inner">
                  <div className="text-xl sm:text-2xl font-black text-[#0F2942] font-heading">
                    {tier.price}
                  </div>
                  <span className="text-[11px] font-medium text-orange-600 block mt-1">
                    {tier.period}
                  </span>
                </div>

                <div className="space-y-2 py-3 border-y border-slate-200/80 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Cargo Capacity:</span>
                    <strong className="text-slate-800">{tier.weight}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Estimated SLA:</span>
                    <strong className="text-slate-800">{tier.speed}</strong>
                  </div>
                </div>

                {/* Features List */}
                <div className="pt-5 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    What is Included:
                  </span>
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start space-x-2.5 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => onBookRate(tier.name)}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                    tier.popular
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-[#0F2942] hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>Request Bespoke Tariff Quote</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Disclaimer / Invoicing Transparency */}
        <div className="mt-14 max-w-4xl mx-auto bg-slate-50 rounded-2xl p-6 border border-slate-200 flex items-start space-x-4 text-xs text-slate-600">
          <Mail className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-[#0F2942]">WTO Pricing Policy & Invoicing Transparency</h4>
            <p className="leading-relaxed">
              International shipping rates are customized based on destination port handling charges, volumetric packaging measurements, air/sea carrier surcharges, and customs clearance tariffs. Official electronic invoices and payment receipts are issued exclusively through our verified finance email at <strong>overseasworldtransport@gmail.com</strong>.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
