import React from 'react';
import { Star, Quote, Building2, UserCheck, ShieldCheck } from 'lucide-react';

export const ReviewsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Alexander Petrov',
      role: 'Head of Global Supply, EuroTech Components',
      type: 'Industrial Electronics Enterprise',
      rating: 5,
      review:
        'WTO has transformed our international transatlantic distribution. Transporting precision industrial components from Sofia to London and Frankfurt used to suffer from customs delays. With WTO, every air consignment arrives on schedule with real-time flight telemetry.',
      city: 'Sofia ⇄ London / Frankfurt corridor',
    },
    {
      name: 'Elena Vance',
      role: 'Procurement Director, Maritime Marine Solutions',
      type: 'Global Maritime & Ocean Freight Client',
      rating: 5,
      review:
        'We frequently move multi-container maritime freight between Rotterdam, Dubai, and Singapore. WTO handles customs clearance and bonded warehousing seamlessly. No demurrage, zero damages, and pristine documentation.',
      city: 'Rotterdam ⇄ Dubai ⇄ Singapore',
    },
    {
      name: 'Marcus Sterling',
      role: 'Logistics Operations VP, TransGlobal Commerce',
      type: 'Intercontinental E-Commerce Brand',
      rating: 5,
      review:
        'Our worldwide enterprise clients demand priority next-flight-out express delivery. WTO’s 24-48 hour international airfreight and instant digital waybills have increased our customer trust globally. Exceptional international carrier!',
      city: 'New York ⇄ Tokyo ⇄ London',
    },
    {
      name: 'Sophia Lindqvist',
      role: 'Managing Director, Nordic Cargo Consolidations',
      type: 'Cross-Border Rail & Overland Carrier',
      rating: 5,
      review:
        'We ship high-volume consolidated freight across European and overland corridors. WTO’s multi-modal freight rates are completely transparent, their tracking portal is responsive, and their 24/7 support is world-class.',
      city: 'European Overland & Transcontinental',
    },
  ];

  return (
    <section className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
            Global Client Testimonials & Feedback
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] font-heading mt-3 tracking-tight">
            Trusted by Worldwide Enterprises & Global Shippers
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            Read what corporate shippers, manufacturers, and international importers say about our worldwide delivery standards.
          </p>
          <span className="inline-block mt-2 text-[11px] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
            * Verified international commercial shipping testimonials
          </span>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative group"
            >
              <div>
                {/* Quote Icon & Stars */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-slate-200 group-hover:text-orange-300 transition-colors" />
                </div>

                <p className="text-sm text-slate-700 leading-relaxed mb-6 italic">
                  "{t.review}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#0F2942] font-heading">
                    {t.name}
                  </h4>
                  <p className="text-xs text-orange-600 font-semibold">
                    {t.role}
                  </p>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {t.type} • {t.city}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-800 font-bold flex items-center justify-center text-xs">
                  {t.name.split(' ').map((n) => n[0]).join('')}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
