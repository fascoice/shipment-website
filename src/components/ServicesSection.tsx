import React, { useState } from 'react';
import { 
  Truck, 
  Globe, 
  Plane, 
  Zap, 
  Building2, 
  ArrowRight, 
  Check, 
  X,
  Shield,
  Clock,
  Ship,
  Train
} from 'lucide-react';

interface ServicesSectionProps {
  onBookService: (serviceName: string) => void;
}

interface ServiceItem {
  id: string;
  name: string;
  shortDesc: string;
  icon: any;
  tag: string;
  tagColor: string;
  features: string[];
  fullDetails: {
    overview: string;
    sla: string;
    coverage: string;
    idealFor: string;
    startingPrice: string;
  };
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onBookService }) => {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // 100% Pure International Worldwide Shipping across 190+ Countries
  const services: ServiceItem[] = [
    {
      id: 'air-flight-freight',
      name: 'International Air Freight & Flight Cargo',
      shortDesc: 'Priority commercial flights and dedicated Boeing/Airbus air cargo freighters.',
      icon: Plane,
      tag: 'Fastest Worldwide (24-72h)',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
      features: [
        'Next-flight-out priority runway booking & expedited tarmac loading',
        'Airport-to-airport and direct air doorstep delivery across 190+ countries',
        'Temperature-controlled cold-chain for sensitive pharmaceuticals & high-tech'
      ],
      fullDetails: {
        overview: 'WTO partners with premier international airlines and operates dedicated cargo charters. Consignments are tracked with flight telemetry from takeoff to landing.',
        sla: '24 to 72 hours intercontinental',
        coverage: '190+ countries globally with priority gateways in Sofia, London, Frankfurt, New York, and Dubai',
        idealFor: 'Urgent electronics, commercial samples, time-critical equipment, pharmaceuticals',
        startingPrice: 'Custom Quote / Tariff on Request'
      }
    },
    {
      id: 'ocean-container-freight',
      name: 'Ocean & Maritime Container Shipping',
      shortDesc: 'Full Container (FCL) and Consolidated Groupage (LCL) deep-sea shipping.',
      icon: Ship,
      tag: 'Best For Heavy Bulk',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      features: [
        'Standard 20ft & 40ft High-Cube container options plus refrigerated reefers',
        'Port-to-port and integrated intermodal inland carriage',
        'Complete marine transit insurance and automated bill of lading'
      ],
      fullDetails: {
        overview: 'Cost-effective high-capacity ocean shipping connecting major global seaports across the Atlantic, Mediterranean, and Asian maritime lanes with bonded warehouse facilities.',
        sla: '14 to 28 days trans-oceanic',
        coverage: 'Major international deep-water container ports worldwide',
        idealFor: 'Industrial heavy machinery, vehicle consignments, raw materials, bulk inventory',
        startingPrice: 'Custom Quote / Tariff on Request'
      }
    },
    {
      id: 'intercontinental-rail',
      name: 'Intercontinental Rail Freight',
      shortDesc: 'Scheduled containerized freight trains across continental rail corridors.',
      icon: Train,
      tag: 'Eco-Friendly & Reliable',
      tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
      features: [
        'Direct railway terminal container loading and customs bonded posts',
        'Immune to highway traffic congestion and severe road weather delays',
        'Significant carbon footprint reduction compared to road transport'
      ],
      fullDetails: {
        overview: 'Scheduled block train cargo services linking European manufacturing centers and cross-continental distribution terminals with steady, predictable transit schedules.',
        sla: '7 to 14 days continental transit',
        coverage: 'European and trans-continental railway networks',
        idealFor: 'Automotive components, industrial parts, energy equipment, heavy manufactured goods',
        startingPrice: 'Custom Quote / Tariff on Request'
      }
    },
    {
      id: 'crossborder-trucking',
      name: 'Trans-Continental Road Haulage',
      shortDesc: 'Articulated highway freight trucks and international cross-border convoys.',
      icon: Truck,
      tag: 'Direct Overland Haulage',
      tagColor: 'bg-orange-50 text-orange-700 border-orange-200',
      features: [
        'Dedicated Full Truckload (FTL) and Less-than-Truckload (LTL) groupage',
        'GPS satellite escorted convoys with digital electronic tamper seals',
        'Direct border customs inspection post clearance assistance'
      ],
      fullDetails: {
        overview: 'Modern high-capacity articulated highway fleet providing door-to-door cross-border haulage between central distribution terminals, seaport terminals, and client facilities.',
        sla: '2 to 5 days cross-border',
        coverage: 'International highway corridors and bonded overland freight lanes',
        idealFor: 'Palletized retail freight, consumer goods, factory equipment, general cargo',
        startingPrice: 'Custom Quote / Tariff on Request'
      }
    },
    {
      id: 'global-express-courier',
      name: 'Worldwide Express Air Courier',
      shortDesc: 'Time-critical next-flight-out express delivery for urgent parcels and documents.',
      icon: Zap,
      tag: 'Urgent Priority (Next Flight)',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
      features: [
        'Dedicated onboard couriers and priority baggage compartment clearance',
        'Immediate customs green-lane processing upon flight arrival',
        'Continuous live dispatch telemetry with instant delivery signature'
      ],
      fullDetails: {
        overview: 'When hours make the difference, our Express Air Courier tier routes your package onto the very next commercial departure with hand-carry options available.',
        sla: '24 to 48 hours worldwide',
        coverage: 'All major international airport hubs worldwide',
        idealFor: 'Legal instruments, diplomatic pouches, aerospace AOG parts, emergency medical items',
        startingPrice: 'Custom Quote / Expedited Tariff'
      }
    },
    {
      id: 'business-supply-chain',
      name: 'Enterprise Corporate Shipping & Customs',
      shortDesc: 'Turnkey international freight contracts, bonded warehousing, and trade compliance.',
      icon: Building2,
      tag: 'Enterprise & B2B Contracts',
      tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      features: [
        'Dedicated corporate freight director & 30-day corporate billing cycles',
        'Licensed international customs brokerage and tariff classification',
        'Custom REST API tracking integration for ERP and enterprise systems'
      ],
      fullDetails: {
        overview: 'Full-service freight forwarding and supply chain management for multinational corporations, industrial producers, and global trading houses.',
        sla: 'Custom Enterprise Service Level Agreements (SLAs)',
        coverage: 'Global trade corridors with bonded terminals in Sofia, London, Frankfurt, New York, and Dubai',
        idealFor: 'Multinational corporations, importers/exporters, distributors, industrial manufacturers',
        startingPrice: 'Tailored Corporate Contracts / Tariff on Request'
      }
    }
  ];

  return (
    <section id="services" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/80 px-3 py-1 rounded-full border border-orange-200">
            End-To-End Worldwide Shipping Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] font-heading mt-3 tracking-tight">
            International Freight & Multimodal Transport
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            Worldwide shipping solutions engineered for speed, safety, and regulatory compliance across air, sea, rail, and road.
          </p>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div 
                key={service.id}
                className="bg-white rounded-3xl p-7 border border-slate-200/90 hover:border-orange-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#0F2942] group-hover:bg-[#0F2942] group-hover:text-orange-400 flex items-center justify-center transition-colors shadow-xs">
                      <Icon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${service.tagColor}`}>
                      {service.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#0F2942] font-heading mb-2 group-hover:text-orange-600 transition-colors">
                    {service.name}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                    {service.shortDesc}
                  </p>

                  <div className="space-y-2.5 pt-4 border-t border-slate-100">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs text-slate-600">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedService(service)}
                    className="text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View Service Specs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onBookService(service.name)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2942] text-white hover:bg-orange-600 transition-colors shadow-xs cursor-pointer"
                  >
                    Book Service
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 space-y-6">
            
            <button 
              onClick={() => setSelectedService(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0F2942] text-orange-400 flex items-center justify-center">
                {React.createElement(selectedService.icon, { className: 'w-7 h-7 stroke-[2]' })}
              </div>
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${selectedService.tagColor}`}>
                  {selectedService.tag}
                </span>
                <h3 className="text-2xl font-extrabold text-[#0F2942] font-heading mt-1">
                  {selectedService.name}
                </h3>
              </div>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 pt-4">
              {selectedService.fullDetails.overview}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 mr-1 text-orange-500" />
                  Estimated Transit Time
                </span>
                <p className="font-bold text-[#0F2942] text-sm">
                  {selectedService.fullDetails.sla}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5 mr-1 text-blue-500" />
                  Service Coverage
                </span>
                <p className="font-bold text-[#0F2942] text-sm">
                  {selectedService.fullDetails.coverage}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  Ideal Consignment Types
                </span>
                <p className="text-slate-700 text-xs leading-relaxed">
                  {selectedService.fullDetails.idealFor}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">Pricing Structure</span>
                <span className="text-sm font-extrabold text-[#0F2942]">
                  {selectedService.fullDetails.startingPrice}
                </span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedService(null)}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const name = selectedService.name;
                    setSelectedService(null);
                    onBookService(name);
                  }}
                  className="w-1/2 sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 cursor-pointer"
                >
                  Book This Service
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};
