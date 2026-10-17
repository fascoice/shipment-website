import React from 'react';
import { Plane, Ship, Train, Truck, ArrowRight, ShieldCheck, Clock, Globe2, Sparkles, CheckCircle2 } from 'lucide-react';
import airFreightPlaneImg from '../assets/images/air_freight_plane_1790853997782.jpg';
import oceanShipImg from '../assets/images/ocean_container_ship_1790854011929.jpg';
import railTrainImg from '../assets/images/rail_cargo_train_1790854037049.jpg';
import cargoTruckImg from '../assets/images/highway_cargo_truck_1790854024429.jpg';

interface TransportationModesProps {
  onSelectMode: (modeName: string) => void;
}

export const TransportationModes: React.FC<TransportationModesProps> = ({ onSelectMode }) => {
  const modes = [
    {
      id: 'air',
      name: 'Air Freight & Express Flight Cargo',
      headline: 'Next-Flight-Out Priority & Dedicated Air Freighters',
      image: airFreightPlaneImg,
      icon: Plane,
      badge: 'Fastest Worldwide by Flight',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      description: 'Urgent intercontinental consignments transported via scheduled commercial flights and dedicated Boeing/Airbus cargo aircraft. Priority runway boarding with expedited customs clearance at Sofia, Frankfurt, London, New York, Dubai, and worldwide gateways.',
      highlights: [
        'Direct airport-to-airport & express flight doorstep delivery',
        'Temperature-controlled cold-chain for medical cargo',
        '24/7 flight telemetry & barcode tracking'
      ],
      speed: '24 - 72 Hours Worldwide',
      idealFor: 'Urgent parcels, electronics, diplomatic pouches, pharmaceuticals',
    },
    {
      id: 'ocean',
      name: 'Ocean & Maritime Container Shipping',
      headline: 'Full Container (FCL) & Consolidated (LCL) Shipping',
      image: oceanShipImg,
      icon: Ship,
      badge: 'Best For Heavy Bulk',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      description: 'High-capacity intercontinental maritime transport traversing Atlantic, Mediterranean, and Asian maritime corridors. Full 20ft & 40ft container options or consolidated groupage with secure bonded port warehousing.',
      highlights: [
        'FCL (Full Container) & LCL (Less-than-Container) loads',
        'Port-to-port and integrated multimodal onward delivery',
        'Customs brokerage and marine transit insurance included'
      ],
      speed: '14 - 28 Days Trans-Oceanic',
      idealFor: 'Heavy industrial machinery, vehicles, commercial merchandise, bulk inventory',
    },
    {
      id: 'rail',
      name: 'Intercontinental Rail Freight',
      headline: 'High-Capacity Continental Railway Cargo',
      image: railTrainImg,
      icon: Train,
      badge: 'Eco-Friendly & Reliable',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      description: 'Scheduled containerized freight trains connecting European trade corridors, central distribution hubs, and overland rail terminals. Immune to road congestion and extreme weather delays with steady predictable transit times.',
      highlights: [
        'Double-stack container wagons and bulk hoppers',
        'Low-carbon sustainable overland transportation',
        'Direct railway terminal customs inspection posts'
      ],
      speed: '7 - 14 Days Continental',
      idealFor: 'Raw commodities, construction equipment, bulk manufacturing parts',
    },
    {
      id: 'road',
      name: 'Cross-Border Road Transport & Haulage',
      headline: 'Articulated Highway Trucks & Doorstep Fleets',
      image: cargoTruckImg,
      icon: Truck,
      badge: 'Maximum Flexibility',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
      description: 'Extensive cross-border trucking network covering European motorway corridors, North American freight lanes, and Eurasian overland trade routes. Modern vehicle fleet with live satellite tracking and digital tamper seals.',
      highlights: [
        'Dedicated full truckload (FTL) and multi-drop LTL',
        'GPS satellite escorted convoys with emergency backup',
        'Same-day and next-day intra-regional doorstep delivery'
      ],
      speed: '1 - 3 Days Interstate / Regional',
      idealFor: 'E-commerce goods, retail distribution, household relocations, express packages',
    },
  ];

  return (
    <section id="transportation" className="py-20 bg-[#0A192F] text-white relative overflow-hidden">
      {/* Background Subtle Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-4 py-1.5 rounded-full text-xs font-semibold text-orange-400">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span className="uppercase tracking-wider font-bold">Multimodal Worldwide Transportation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white tracking-tight">
            Ship by Air Flight, Ocean Vessel, Rail & Road
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            World Transport Overseas links every corner of the globe. Choose your preferred mode of transportation or combine them for seamless multimodal delivery to 190+ countries worldwide.
          </p>
        </div>

        {/* Transportation Mode Cards Grid with Real Pictures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <div 
                key={mode.id}
                className="bg-slate-800/70 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-orange-500/50 transition-all duration-300 flex flex-col group"
              >
                {/* Visual Picture Container */}
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
                  <img 
                    src={mode.image} 
                    alt={mode.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Dark Gradient Overlay for Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent"></div>

                  {/* Mode Icon & Badge Overlay */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg">
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border backdrop-blur-md ${mode.badgeColor}`}>
                      {mode.badge}
                    </span>
                  </div>

                  {/* Bottom Image Overlay Title */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                      {mode.speed}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white font-heading mt-0.5">
                      {mode.name}
                    </h3>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5 bg-gradient-to-b from-slate-800/90 to-slate-900/90">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 mb-2">
                      {mode.headline}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                      {mode.description}
                    </p>

                    {/* Feature Highlights */}
                    <div className="space-y-2 pt-2 border-t border-slate-700/60 text-xs">
                      {mode.highlights.map((h, i) => (
                        <div key={i} className="flex items-start space-x-2 text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer & Action */}
                  <div className="pt-4 border-t border-slate-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Best For: </span>
                      <span>{mode.idealFor}</span>
                    </div>

                    <button
                      onClick={() => onSelectMode(mode.name)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 transition-all flex items-center justify-center space-x-2 shadow-md shadow-orange-500/25 shrink-0"
                    >
                      <span>Book This Mode</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Global Network Connectivity Reassurance */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/30">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-heading">
                Need a Custom Multimodal Route (Flight + Rail + Truck)?
              </h4>
              <p className="text-slate-400 mt-0.5">
                Our global operations desk in Sofia (Bulgaria HQ), London, Frankfurt, and Dubai coordinates custom transit routes across all 190+ countries.
              </p>
            </div>
          </div>

          <a
            href="mailto:overseasworldtransport@gmail.com?subject=Custom%20Multimodal%20Shipping%20Inquiry"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#0F2942] font-bold text-xs transition-colors shrink-0 flex items-center space-x-1.5 shadow-sm"
          >
            <span>Request Multimodal Route</span>
            <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
          </a>
        </div>

      </div>
    </section>
  );
};
