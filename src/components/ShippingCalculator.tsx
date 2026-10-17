import React, { useState } from 'react';
import { 
  Calculator, 
  MapPin, 
  Package, 
  ArrowRight, 
  Clock, 
  Check, 
  ShieldCheck, 
  HelpCircle,
  Sparkles,
  Globe2,
  Mail,
  Box
} from 'lucide-react';
import { calculateShippingRate } from '../services/api';

interface ShippingCalculatorProps {
  onRequestShipment: (params: {
    pickupLocation: string;
    destination: string;
    packageType: string;
    weight: number;
    quantity: number;
    speed: 'Standard' | 'Express';
    estimatedPrice?: number;
  }) => void;
}

export const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({ onRequestShipment }) => {
  // Predefined Item Categories
  const itemCategories = [
    { id: 'Electronics', label: 'Electronics & Gadgets', icon: '📱' },
    { id: 'Fashion', label: 'Fashion & Wears', icon: '👗' },
    { id: 'Documents', label: 'Documents & Passports', icon: '📄' },
    { id: 'Automotive', label: 'Automotive Spares', icon: '🚗' },
    { id: 'Medical', label: 'Medical Diagnostics', icon: '💊' },
    { id: 'Industrial', label: 'Heavy Machinery & Tools', icon: '🏭' },
    { id: 'SolarPower', label: 'Solar & Inverters', icon: '☀️' },
    { id: 'Household', label: 'Household & Relocation', icon: '📦' },
    { id: 'Custom', label: 'Custom Commodity', icon: '✍️' },
  ];

  // International Locations
  const internationalLocations = [
    'Sofia (Bulgaria - Global HQ)',
    'London (United Kingdom - Heathrow Cargo)',
    'Frankfurt (Germany - CargoCity Süd)',
    'Houston (USA - Energy & Maritime Port)',
    'New York (USA - JFK Air Cargo)',
    'Toronto (Canada - Pearson Cargo)',
    'Dubai (UAE - DWC Aviation Hub)',
    'Guangzhou (China - Baiyun International Cargo)',
    'Tokyo (Japan - Narita Hub)',
    'Singapore (Changi International Cargo Hub)',
    'Amsterdam (Netherlands - Schiphol Cargo)',
    'Paris (France - CDG European Terminal)',
    'Zurich (Switzerland - Alpine Freight)',
    'Sydney (Australia - Pacific Gateway)',
    'Johannesburg (South Africa - OR Tambo)',
    'Cairo (Egypt - Mediterranean Gateway)',
    'Sao Paulo (Brazil - Guarulhos Cargo)',
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>('Electronics');
  const [customItemName, setCustomItemName] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState<number>(3.5);
  const [quantity, setQuantity] = useState<number>(1);
  const [speed, setSpeed] = useState<'Standard' | 'Express'>('Standard');
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<{
    estimatedDeliveryTime: string;
    tariffCategory: string;
    breakdown: string;
  } | null>(null);

  const getEffectiveItemName = () => {
    if (selectedCategory === 'Custom') {
      return customItemName || 'Custom Cargo Item';
    }
    return itemCategories.find((c) => c.id === selectedCategory)?.label || 'General Cargo';
  };

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCalculating(true);
    try {
      const finalItem = getEffectiveItemName();
      const data = await calculateShippingRate({
        pickupLocation,
        destination,
        packageType: finalItem,
        weight: Number(weight) || 1,
        quantity: Number(quantity) || 1,
        speed,
      });
      setResult({
        estimatedDeliveryTime: data.estimatedDeliveryTime,
        tariffCategory: data.tariffType || 'Custom Tariff on Request',
        breakdown: `${finalItem} (${weight}kg) from ${pickupLocation} to ${destination} via ${speed}`,
      });
    } catch (err) {
      const isIntl = pickupLocation.includes('Bulgaria') || destination.includes('Bulgaria') || destination.includes('London') || destination.includes('Houston') || destination.includes('Dubai');
      setResult({
        estimatedDeliveryTime: isIntl ? (speed === 'Express' ? '3 - 5 Business Days' : '5 - 8 Business Days') : (speed === 'Express' ? 'Same-Day / 24 Hours' : '2 - 3 Business Days'),
        tariffCategory: isIntl ? 'International Freight Tariff (Custom Quote on Request)' : 'Interstate Consolidated Tariff',
        breakdown: `${getEffectiveItemName()} (${weight}kg) via ${speed} delivery`,
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleBookEstimate = () => {
    onRequestShipment({
      pickupLocation,
      destination,
      packageType: getEffectiveItemName(),
      weight: Number(weight) || 1,
      quantity: Number(quantity) || 1,
      speed,
    });
  };

  return (
    <section id="rates" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
            Interactive Freight Tariff Estimator
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] font-heading mt-3 tracking-tight">
            Calculate International Shipping & Tariff
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            Pick your exact item category, choose international routes, and estimate transit parameters. Formal invoices are issued directly via our central dispatch desk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form Column */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 border border-slate-200 space-y-6">
            <form onSubmit={handleCalculate} className="space-y-5">
              
              {/* Customer Item Picker (Self-Select) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pick Your Item / Commodity Category *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                  {itemCategories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center space-x-2 ${
                        selectedCategory === cat.id
                          ? 'bg-orange-50 border-orange-500 text-orange-950 ring-2 ring-orange-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>

                {selectedCategory === 'Custom' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      required
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="Type your custom item name (e.g. 200 Solar LED Lanterns, Hydraulic Pump)"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Origin and Destination (All International & Self-Input) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    <span>Origin / Pickup Location * (Self-Input)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="calc-pickup-locations"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder="Enter pickup city or cargo terminal..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                    <datalist id="calc-pickup-locations">
                      {internationalLocations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </datalist>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Type any city or choose from suggested international hubs.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Globe2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Destination Location * (Self-Input)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="calc-dest-locations"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Enter destination city, port, or country..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                    <datalist id="calc-dest-locations">
                      {internationalLocations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </datalist>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Type any destination city, state, or country worldwide.
                  </span>
                </div>
              </div>

              {/* Weight, Quantity, Speed */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Package Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery Speed
                  </label>
                  <select
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="Standard">Standard Freight</option>
                    <option value="Express">Express Priority (Air)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={calculating}
                className="w-full py-3.5 bg-[#0F2942] hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <Calculator className="w-4 h-4" />
                <span>{calculating ? 'Analyzing Tariff Rules...' : 'Compute Estimated Transit & Tariff'}</span>
              </button>
            </form>
          </div>

          {/* Right Result Card (No actual rigid price) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0F2942] via-[#153456] to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-orange-500/20 blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                Tariff Classification Summary
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white">
                WTO AIR & OCEAN NETWORK
              </span>
            </div>

            {result ? (
              <div className="space-y-5">
                <div>
                  <span className="text-xs text-slate-300 font-medium block">Invoicing Classification:</span>
                  <div className="text-2xl sm:text-3xl font-extrabold font-heading text-white mt-1">
                    Custom Quote on Request
                  </div>
                  <span className="text-xs text-orange-300 font-semibold mt-1 inline-block">
                    {result.tariffCategory}
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2.5 border border-white/10 text-xs">
                  <div className="flex justify-between items-center text-slate-200">
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      <span>Estimated Transit SLA:</span>
                    </span>
                    <strong className="text-white font-mono">{result.estimatedDeliveryTime}</strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-200">
                    <span className="flex items-center space-x-1.5">
                      <Package className="w-3.5 h-3.5 text-blue-400" />
                      <span>Item Selected:</span>
                    </span>
                    <strong className="text-white truncate max-w-[180px]">{getEffectiveItemName()}</strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-200">
                    <span className="flex items-center space-x-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Routing:</span>
                    </span>
                    <strong className="text-white text-[11px] truncate max-w-[180px]">{pickupLocation.split(' ')[0]} → {destination.split(' ')[0]}</strong>
                  </div>
                </div>

                {/* Transparency Notice */}
                <div className="p-3.5 bg-black/20 rounded-xl border border-white/10 text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center space-x-1 text-orange-400 font-bold">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Official Billing Notice</span>
                  </div>
                  <p className="leading-relaxed text-slate-300">
                    WTO does not charge rigid, inaccurate flat fees. An official itemized invoice will be forwarded to your email from <strong>overseasworldtransport@gmail.com</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleBookEstimate}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/30 flex items-center justify-center space-x-2 transition-transform active:scale-95"
                >
                  <span>Request This Consignment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-300">Enter parameters and click compute to analyze tariff rules.</p>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
