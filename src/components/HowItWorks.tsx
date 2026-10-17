import React from 'react';
import { ClipboardList, Box, Truck, CheckCircle, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onStartBooking: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartBooking }) => {
  const steps = [
    {
      step: '01',
      title: 'Book a Shipment',
      desc: 'Enter your pickup and delivery details through our easy online portal.',
      icon: ClipboardList,
      color: 'bg-blue-600',
    },
    {
      step: '02',
      title: 'Package Your Item',
      desc: 'Prepare and securely package your shipment, or request our packing team.',
      icon: Box,
      color: 'bg-amber-500',
    },
    {
      step: '03',
      title: 'We Pick It Up',
      desc: 'Our delivery courier collects the package right from your doorstep or office.',
      icon: Truck,
      color: 'bg-orange-500',
    },
    {
      step: '04',
      title: 'Track & Receive',
      desc: 'Track your package with live GPS milestone alerts until safe recipient delivery.',
      icon: CheckCircle,
      color: 'bg-emerald-600',
    },
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/80 px-3 py-1 rounded-full border border-orange-200">
            Effortless Shipping Experience
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] font-heading mt-3 tracking-tight">
            How WTO Worldwide Shipping Works
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            Getting your items from sender to destination takes four simple, transparent steps.
          </p>
        </div>

        {/* Steps Grid with Connecting Line */}
        <div className="relative">
          {/* Desktop Connecting Line */}
          <div className="hidden lg:block absolute top-1/2 left-16 right-16 h-1 bg-gradient-to-r from-blue-200 via-orange-200 to-emerald-200 -translate-y-8 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-slate-50 hover:bg-white rounded-3xl p-7 border border-slate-200/90 hover:border-orange-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Step badge and icon */}
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl ${item.color} text-white flex items-center justify-center shadow-lg shadow-slate-900/10 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 stroke-[2.2]" />
                      </div>
                      <span className="text-3xl font-extrabold font-heading text-slate-300 group-hover:text-orange-500 transition-colors">
                        {item.step}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#0F2942] font-heading mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center text-xs font-bold text-orange-600">
                    <span>Step {index + 1} of 4</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-14 bg-gradient-to-r from-[#0F2942] to-[#1E3A8A] rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-950/15">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-2xl font-bold font-heading">
              Ready to send a parcel or cargo?
            </h3>
            <p className="text-slate-300 text-sm">
              Book online in less than 2 minutes or calculate immediate shipping costs.
            </p>
          </div>
          <button
            onClick={onStartBooking}
            className="px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 transition-all shadow-lg shadow-orange-500/30 shrink-0"
          >
            Start Shipping Now
          </button>
        </div>

      </div>
    </section>
  );
};
