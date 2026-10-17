import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Globe2, 
  Truck, 
  CheckCircle2, 
  Sparkles,
  Plane,
  Ship,
  Train,
  Users,
  X
} from 'lucide-react';
import { WebsiteContent } from '../types';
import wtoLogoImg from '../assets/images/wto_emblem_logo_1790855439455.jpg';
import cargoCrewImg from '../assets/images/wto_cargo_crew_1790855459042.jpg';
import { LiveWallpaper } from './LiveWallpaper';

interface HeroProps {
  onTrack: (trackingNumber: string) => void;
  onShipWithUs: () => void;
  onExploreTracking: () => void;
  websiteContent?: WebsiteContent | null;
}

export const Hero: React.FC<HeroProps> = ({
  onTrack,
  onShipWithUs,
  onExploreTracking,
  websiteContent,
}) => {
  const [trackingInput, setTrackingInput] = useState('');
  const [inputError, setInputError] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) {
      setInputError('Please enter a valid WTO tracking number');
      return;
    }
    setInputError('');
    onTrack(trackingInput.trim());
  };

  const headline = websiteContent?.hero?.headline || 'International Worldwide Shipping Across 190+ Countries';
  const subheading = websiteContent?.hero?.subheading || 'Connecting global trade corridors with premier commercial cargo air flights, ocean container shipping, trans-continental rail, and express road haulage.';
  const badgeText = websiteContent?.hero?.badgeText || 'Global Worldwide Shipping Network • Air, Sea, Rail & Road';
  const primaryCta = websiteContent?.hero?.primaryCtaText || 'Book International Shipment';
  const secondaryCta = websiteContent?.hero?.secondaryCtaText || 'Track Consignment';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#071322] via-[#0A192F] to-[#0F2942] text-white pt-10 pb-20 lg:pt-16 lg:pb-28">
      {/* Dynamic Animated Live Wallpaper (Interactive Global Flight & Radar Canvas) */}
      <LiveWallpaper />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 left-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Brand Logo & Trust Pill */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xl p-1 flex items-center justify-center shrink-0">
                <img src={wtoLogoImg} alt="WTO Official Emblem" className="w-full h-full object-contain" />
              </div>

              <div className="inline-flex items-center space-x-2 bg-slate-800/80 backdrop-blur-md border border-slate-700/80 px-4 py-1.5 rounded-full text-xs font-semibold text-slate-200">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-orange-400 font-bold uppercase tracking-wider">{badgeText}</span>
                <span className="text-slate-400">•</span>
                <span>Worldwide Coverage</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.12] text-white font-heading">
              {headline}
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              {subheading}
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={onShipWithUs}
                className="px-7 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 flex items-center space-x-2 group text-base cursor-pointer"
              >
                <span>{primaryCta}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onExploreTracking}
                className="px-7 py-3.5 rounded-xl font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 transition-all duration-200 backdrop-blur-sm text-base flex items-center space-x-2 cursor-pointer"
              >
                <Search className="w-4 h-4 text-orange-400" />
                <span>{secondaryCta}</span>
              </button>
            </div>

            {/* Quick Transport Means Selector Bar */}
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 block mb-2">
                Available Means of Transportation:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('transportation');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/90 hover:border-orange-500/50 transition-all flex items-center space-x-2 text-left group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">Flight Cargo</span>
                    <span className="text-[10px] text-slate-400">24-72h Worldwide</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('transportation');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/90 hover:border-orange-500/50 transition-all flex items-center space-x-2 text-left group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Ship className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">Ocean Vessel</span>
                    <span className="text-[10px] text-slate-400">Full & LCL Container</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('transportation');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/90 hover:border-orange-500/50 transition-all flex items-center space-x-2 text-left group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Train className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">Rail Freight</span>
                    <span className="text-[10px] text-slate-400">Continental Trains</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('transportation');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/90 hover:border-orange-500/50 transition-all flex items-center space-x-2 text-left group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">Road Haulage</span>
                    <span className="text-[10px] text-slate-400">Cross-Border Trucking</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Key Value Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 max-w-xl">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Insured Cargo Cover</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Real-Time GPS Tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Sofia HQ to Global Hubs</span>
              </div>
            </div>
          </div>

          {/* Right Column: Instant Package Tracking Card & Human Flight Dispatch Crew Card */}
          <div className="lg:col-span-5 space-y-5">
            {/* Tracking Card */}
            <div className="bg-white/95 backdrop-blur-xl text-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/40 border border-white/20 space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0F2942] text-white flex items-center justify-center font-bold shadow-md">
                    <Plane className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 block">
                      Live Consignment Lookup
                    </span>
                    <h3 className="text-lg font-bold font-heading text-[#0F2942]">
                      Track Worldwide Package
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  Live Dispatch
                </span>
              </div>

              <form onSubmit={handleTrackSubmit} className="space-y-3">
                <div>
                  <label 
                    htmlFor="hero-tracking-input" 
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Enter Tracking Number
                  </label>
                  <div className="relative">
                    <input
                      id="hero-tracking-input"
                      type="text"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pl-11 pr-10 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 uppercase"
                    />
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    {trackingInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setTrackingInput('');
                          setInputError('');
                        }}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                        title="Clear tracking input"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {inputError && (
                    <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center space-x-1">
                      <span>•</span>
                      <span>{inputError}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#0F2942] hover:bg-orange-600 transition-colors duration-200 shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Track Shipment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Highlights */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  Air Sorting
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  Flight Departure
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  Customs Cleared
                </span>
              </div>
            </div>

            {/* Human Related Picture Card: Air Cargo Flight Crew & Logistics Specialists */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-xl group bg-slate-900">
              <div className="h-44 sm:h-48 w-full overflow-hidden">
                <img 
                  src={cargoCrewImg} 
                  alt="WTO International Cargo Flight Crew and Dispatchers"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400">
                    WTO Global Operations Team
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white font-heading">
                  Dedicated Flight Cargo Crew & Dispatch Officers
                </h4>
                <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                  Coordinating daily air freighter departures and customs inspection across 190+ countries.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
