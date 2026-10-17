import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Radio, 
  Receipt, 
  Headphones, 
  Map, 
  Briefcase, 
  CheckCircle2, 
  Check 
} from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const points = [
    {
      title: 'Fast Delivery',
      desc: 'Optimized transit lanes and dedicated carriers ensure express dispatches beat estimated handover deadlines.',
      icon: Zap,
    },
    {
      title: 'Secure Package Handling',
      desc: 'Barcode scanning at every checkpoint with tamper-evident packaging and transit security seals.',
      icon: ShieldCheck,
    },
    {
      title: 'Real-Time Tracking',
      desc: 'Instant 24/7 visibility into package location, departure times, sorting facility handovers, and courier contact.',
      icon: Radio,
    },
    {
      title: 'Transparent Pricing',
      desc: 'Clear upfront pricing with no unexpected hidden depot surcharges or weight penalties.',
      icon: Receipt,
    },
    {
      title: 'Professional Support',
      desc: 'Dedicated shipping coordinators ready to answer questions via overseasworldtransport@gmail.com 24/7.',
      icon: Headphones,
    },
    {
      title: 'Worldwide Coverage',
      desc: 'Extensive multimodal shipping network connecting 190+ countries with priority customs clearance gateways.',
      icon: Map,
    },
    {
      title: 'Business Solutions',
      desc: 'Scalable corporate shipping for e-commerce, warehousing, bulk freight, and custom API tracking.',
      icon: Briefcase,
    },
    {
      title: 'Reliable Customer Service',
      desc: 'Proactive email status notifications, signed proof-of-delivery receipts, and responsive care.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
            The WTO Worldwide Shipping Advantage
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] font-heading mt-3 tracking-tight">
            Why Choose World Transport Overseas?
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            Built on a heritage of global freight standards, we bring enterprise precision to every parcel we deliver.
          </p>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#0F2942] text-white group-hover:bg-orange-500 transition-colors flex items-center justify-center mb-4 shadow-sm">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F2942] font-heading mb-2 flex items-center">
                    <Check className="w-4 h-4 text-emerald-500 mr-1.5 stroke-[3] shrink-0" />
                    <span>{p.title}</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-slate-400 group-hover:text-orange-600 transition-colors">
                  WTO Standard 0{idx + 1}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
