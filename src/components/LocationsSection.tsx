import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Globe2, 
  Clock, 
  Mail, 
  Building, 
  Navigation, 
  CheckCircle, 
  Truck, 
  ArrowRight,
  Plane,
  Compass
} from 'lucide-react';
import { LocationHub } from '../types';
import { fetchLocations } from '../services/api';

interface LocationsSectionProps {
  onSelectLocationForQuote?: (cityName: string) => void;
}

export const LocationsSection: React.FC<LocationsSectionProps> = ({ onSelectLocationForQuote }) => {
  const [locations, setLocations] = useState<LocationHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EUROPE' | 'NORTH_AMERICA' | 'ASIA_PACIFIC' | 'AFRICA' | 'OTHER'>('ALL');
  const [selectedHub, setSelectedHub] = useState<LocationHub | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const data = await fetchLocations();
      setLocations(data);
      if (data.length > 0) {
        setSelectedHub(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.hubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.country && loc.country.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      activeFilter === 'ALL'
        ? true
        : activeFilter === 'EUROPE'
        ? loc.region === 'Europe'
        : activeFilter === 'NORTH_AMERICA'
        ? loc.region === 'North America'
        : activeFilter === 'ASIA_PACIFIC'
        ? loc.region === 'Asia-Pacific'
        : activeFilter === 'AFRICA'
        ? loc.region === 'Africa'
        : loc.region === 'Middle East' || loc.region === 'South America';

    return matchesSearch && matchesFilter;
  });

  return (
    <section id="locations" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
            Global Hubs & Strategic Terminals
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] font-heading mt-3 tracking-tight">
            Supported International Locations & Sorting Depots
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            With centralized European Headquarters in Sofia (Bulgaria), and strategic air & maritime hubs across London, Frankfurt, Houston, New York, Dubai, Singapore, and Guangzhou.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-900/5 border border-slate-200 mb-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country, city, or strategic cargo hub..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pl-11 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-xs font-bold">
              {[
                { id: 'ALL', label: 'All Global Hubs' },
                { id: 'EUROPE', label: 'Europe (Sofia HQ)' },
                { id: 'NORTH_AMERICA', label: 'North America' },
                { id: 'ASIA_PACIFIC', label: 'Asia-Pacific' },
                { id: 'OTHER', label: 'Middle East & LATAM' },
                { id: 'AFRICA', label: 'Africa' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-2 rounded-xl border transition-colors ${
                    activeFilter === tab.id
                      ? 'bg-[#0F2942] text-white border-[#0F2942]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Locations Grid & Interactive Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Hubs Cards Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredLocations.map((loc) => {
              const isSelected = selectedHub?.id === loc.id;
              const isSofiaHQ = loc.city.toLowerCase() === 'sofia';

              return (
                <div
                  key={loc.id}
                  onClick={() => setSelectedHub(loc)}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-orange-500 shadow-lg ring-2 ring-orange-400/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isSofiaHQ
                          ? 'bg-orange-100 text-orange-800 border border-orange-300'
                          : 'bg-blue-50 text-blue-800'
                      }`}>
                        {isSofiaHQ ? 'Global European HQ' : loc.type}
                      </span>
                      <span className="text-xs font-semibold text-orange-600 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{loc.estimatedDeliveryTime}</span>
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#0F2942] font-heading">
                      {loc.city}, {loc.country || loc.state}
                    </h4>
                    <span className="text-xs text-slate-500 font-medium block mb-2">
                      Region: {loc.region || 'International'}
                    </span>

                    <p className="text-xs font-semibold text-slate-700 mb-1">
                      {loc.hubName}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {loc.address}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>{loc.availability}</span>
                    </span>
                    <span className="text-slate-400 text-xs font-semibold">
                      Click to select
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredLocations.length === 0 && (
              <div className="sm:col-span-2 text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
                No international delivery locations found matching "{searchQuery}".
              </div>
            )}
          </div>

          {/* Interactive Hub Detail Card (No owner phone number) */}
          <div className="lg:col-span-4 sticky top-28">
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-900/5 border border-slate-200 space-y-6">
              
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-[#0F2942] text-white flex items-center justify-center">
                  <Building className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                    Selected Operations Depot
                  </span>
                  <h3 className="text-lg font-bold text-[#0F2942] font-heading">
                    {selectedHub ? selectedHub.hubName : 'WTO International Shipping Gateway'}
                  </h3>
                </div>
              </div>

              {selectedHub ? (
                <div className="space-y-4 text-xs">
                  {/* Stylized Visual Hub Graphic */}
                  <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0F2942] to-blue-900 p-4 relative overflow-hidden flex flex-col justify-between text-white shadow-inner">
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    </div>
                    <div className="relative z-10 flex justify-between items-start">
                      <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">
                        WTO NODE: {selectedHub.id.toUpperCase()}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    </div>

                    <div className="relative z-10">
                      <p className="text-xs text-orange-300 font-bold">{selectedHub.country || selectedHub.state}</p>
                      <p className="text-lg font-extrabold font-heading text-white">{selectedHub.city}</p>
                      <p className="text-[11px] text-slate-300 flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3 h-3 text-orange-400" />
                        <span>SLA: {selectedHub.estimatedDeliveryTime}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[11px]">Address:</span>
                      <p className="font-bold text-slate-800">{selectedHub.address}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[11px]">Facility Type:</span>
                      <p className="font-bold text-slate-800">{selectedHub.type} ({selectedHub.availability})</p>
                    </div>
                    {/* ONLY EMAIL - NO PHONE NUMBER */}
                    <div>
                      <span className="text-slate-400 font-semibold block text-[11px]">Dispatch & Inquiries Email:</span>
                      <a 
                        href="mailto:overseasworldtransport@gmail.com" 
                        className="font-bold text-blue-900 hover:text-orange-600 transition-colors"
                      >
                        overseasworldtransport@gmail.com
                      </a>
                    </div>
                  </div>

                  {onSelectLocationForQuote && (
                    <button
                      onClick={() => onSelectLocationForQuote(selectedHub.city)}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-[#0F2942] hover:bg-orange-600 transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <span>Ship to or from {selectedHub.city}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Select any hub to view dispatch parameters.</p>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
