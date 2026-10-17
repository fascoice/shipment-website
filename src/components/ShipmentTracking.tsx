import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Package, 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Truck, 
  AlertCircle, 
  Printer, 
  FileText, 
  Share2, 
  Mail,
  ShieldCheck,
  Building,
  RefreshCw,
  ArrowRight,
  X,
  RotateCcw
} from 'lucide-react';
import { Shipment } from '../types';
import { fetchShipmentByTracking } from '../services/api';
import { 
  fetchShipmentByTracking as fetchSupabaseTracking, 
  subscribeToShipments, 
  isSupabaseConfigured 
} from '../lib/supabase';

interface ShipmentTrackingProps {
  initialTracking?: string;
  onOpenWaybill: (shipment: Shipment) => void;
}

export const ShipmentTracking: React.FC<ShipmentTrackingProps> = ({
  initialTracking = '',
  onOpenWaybill,
}) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleClearTracking = () => {
    setShipment(null);
    setTrackingNumber('');
    setErrorMessage('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    const inputCard = document.getElementById('tracking-input-card');
    if (inputCard) {
      inputCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSearch = async (codeToSearch?: string) => {
    const code = (codeToSearch || trackingNumber).trim();
    if (!code) {
      setErrorMessage('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      // 1. If Supabase is configured, query live Supabase PostgreSQL tables
      if (isSupabaseConfigured()) {
        const { shipment: sbShip, updates: sbUpdates } = await fetchSupabaseTracking(code);
        if (sbShip) {
          const converted: Shipment = {
            id: sbShip.id,
            trackingNumber: sbShip.tracking_number,
            sender: {
              name: sbShip.sender_name,
              email: '',
              phone: '',
              address: sbShip.origin,
              city: sbShip.origin,
              state: '',
            },
            receiver: {
              name: sbShip.receiver_name,
              email: '',
              phone: '',
              address: sbShip.destination,
              city: sbShip.destination,
              state: '',
            },
            packageDetails: {
              type: sbShip.shipment_type,
              customItemName: sbShip.shipment_type,
              description: `${sbShip.shipment_type} (${sbShip.weight} kg)`,
              weight: Number(sbShip.weight) || 1,
              quantity: 1,
              value: 'Standard Customs Tariff',
              speed: sbShip.shipment_type.includes('Express') ? 'Express' : 'Standard',
            },
            pickupLocation: sbShip.origin,
            destination: sbShip.destination,
            price: Number(sbShip.weight) * 45,
            tariffType: 'Assessed WTO Freight Tariff',
            status: (sbShip.status as any) || 'In Transit',
            currentStage: (sbShip.status as any) || 'In Transit',
            createdDate: new Date(sbShip.created_at).toLocaleDateString(),
            estimatedDeliveryDate: sbShip.estimated_delivery || '3 - 5 Business Days',
            lastUpdated: new Date(sbShip.updated_at).toLocaleString(),
            currentLocation: sbShip.current_location || sbShip.origin,
            timeline: sbUpdates.length > 0 ? sbUpdates.map(u => ({
              status: u.status,
              title: u.status,
              location: u.location,
              timestamp: new Date(u.updated_at).toLocaleString(),
              completed: true,
              note: u.description,
            })) : [
              {
                status: sbShip.status,
                title: sbShip.status,
                location: sbShip.current_location || sbShip.origin,
                timestamp: new Date(sbShip.updated_at).toLocaleString(),
                completed: true,
                current: true,
              }
            ],
          };

          setShipment(converted);
          setTrackingNumber(sbShip.tracking_number);
          setLoading(false);
          return;
        }
      }

      // 2. Fallback to API endpoint
      const data = await fetchShipmentByTracking(code);
      if (data.found && data.shipment) {
        setShipment(data.shipment);
        setTrackingNumber(data.shipment.trackingNumber);
      } else {
        setShipment(null);
        setErrorMessage(
          data.error ||
            `I couldn't find a shipment with that tracking number. Please check the number and try again, or contact WTO customer support through mail (overseasworldtransport@gmail.com).`
        );
      }
    } catch (err: any) {
      setShipment(null);
      setErrorMessage(`I couldn't find a shipment with that tracking number. Please check the number and try again, or contact WTO customer support through mail (overseasworldtransport@gmail.com).`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTracking) {
      setTrackingNumber(initialTracking);
      handleSearch(initialTracking);
    }
  }, [initialTracking]);

  // Realtime subscription for tracking updates
  useEffect(() => {
    if (!shipment || !isSupabaseConfigured()) return;

    const unsubscribe = subscribeToShipments((payload) => {
      if (payload.new && (payload.new.tracking_number === shipment.trackingNumber || payload.new.shipment_id === shipment.id)) {
        handleSearch(shipment.trackingNumber);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [shipment?.id, shipment?.trackingNumber]);

  // Status step order
  const standardSteps = [
    'Shipment Booked',
    'Package Picked Up',
    'In Transit',
    'At Destination',
    'Out for Delivery',
    'Delivered',
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Out for Delivery':
        return 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
      case 'In Transit':
      case 'At Destination':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <section id="tracking" className="py-20 bg-slate-50 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
            Real-Time Shipment Visibility
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] font-heading mt-3 tracking-tight">
            Track Your Shipment
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            Enter your official WTO Consignment / Waybill number to view real-time location, delivery progress, and dispatcher details.
          </p>
        </div>

        {/* Tracking Input Card */}
        <div id="tracking-input-card" className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 border border-slate-200 mb-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={trackingNumber}
                onChange={(e) => {
                  setTrackingNumber(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter tracking number"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 font-mono text-base px-5 py-4 pl-12 pr-12 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all uppercase"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4.5" />
              {trackingNumber && (
                <button
                  type="button"
                  onClick={handleClearTracking}
                  className="absolute right-3.5 top-3.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors"
                  title="Clear tracking input"
                  aria-label="Clear tracking input"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="py-4 px-8 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center space-x-2 shrink-0 active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Package className="w-5 h-5" />
                )}
                <span>{loading ? 'Searching...' : 'Track Package'}</span>
              </button>

              {(trackingNumber || shipment) && (
                <button
                  type="button"
                  onClick={handleClearTracking}
                  className="py-4 px-5 rounded-2xl font-bold text-xs uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                  title="Clear tracking"
                >
                  <RotateCcw className="w-4 h-4 text-orange-600" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </form>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between space-x-3 animate-in fade-in">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{errorMessage}</p>
                  <p className="text-xs text-rose-700">
                    Please confirm the consignment number or email <a href="mailto:overseasworldtransport@gmail.com" className="underline font-bold">overseasworldtransport@gmail.com</a> for immediate dispatcher lookup.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearTracking}
                className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg shrink-0"
                title="Dismiss and clear"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tracking Result View */}
        {shipment && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            
            {/* Top Bar with Tracking Number & Current Status */}
            <div className="bg-[#0F2942] text-white p-6 sm:p-8 flex flex-wrap justify-between items-center gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">
                  <span>Official WTO Waybill</span>
                  <span>•</span>
                  <span>{shipment.packageDetails.speed} Speed</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                  {shipment.trackingNumber}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Last Updated: <span className="font-medium text-white">{shipment.lastUpdated}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <span className="text-[11px] uppercase font-bold text-slate-300 block">Current Status</span>
                  <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusBadge(shipment.status)}`}>
                    {shipment.status}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleClearTracking}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  title="Clear tracking and input another one"
                >
                  <RotateCcw className="w-4 h-4 text-orange-400" />
                  <span>Clear & Track Another</span>
                </button>

                <button
                  onClick={() => onOpenWaybill(shipment)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 transition-colors shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  title="View / Print Printable Consignment Waybill"
                >
                  <Printer className="w-4 h-4 text-orange-600" />
                  <span>View Waybill</span>
                </button>
              </div>
            </div>

            {/* Current Location Highlight Banner */}
            <div className="bg-orange-500 text-white px-6 py-3.5 flex flex-wrap items-center justify-between text-xs sm:text-sm font-semibold">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 shrink-0 animate-bounce" />
                <span>Current Real Location: <strong>{shipment.currentLocation}</strong></span>
              </div>
              <div className="flex items-center space-x-1 text-orange-100 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Est. Delivery: <strong>{shipment.estimatedDeliveryDate}</strong></span>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="p-6 sm:p-10 border-b border-slate-100">
              <h4 className="text-base font-bold text-[#0F2942] font-heading mb-8 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-orange-500" />
                <span>Shipment Progress Timeline</span>
              </h4>

              {/* Progress Milestones */}
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {standardSteps.map((stepName, idx) => {
                  const existingStep = shipment.timeline.find((t) => t.status === stepName);
                  const isCompleted = existingStep?.completed ?? false;
                  const isCurrent = existingStep?.current ?? false;

                  return (
                    <div key={stepName} className="relative flex items-start space-x-4">
                      {/* Step Circle / Dot */}
                      <div
                        className={`absolute -left-6 sm:-left-8 w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : isCurrent
                            ? 'bg-orange-500 text-white ring-4 ring-orange-200 animate-pulse'
                            : 'bg-slate-200 text-slate-500 border border-slate-300'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
                        <div className="flex flex-wrap justify-between items-start gap-1">
                          <h5 className={`text-sm font-bold ${isCurrent ? 'text-orange-600' : 'text-[#0F2942]'}`}>
                            {stepName} {isCompleted && '✓'}
                          </h5>
                          <span className="text-xs font-mono text-slate-500">
                            {existingStep?.timestamp || 'Pending Step'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {existingStep?.title || 'Operational checkpoint scheduled along route'}
                        </p>
                        {existingStep?.location && (
                          <div className="flex items-center space-x-1.5 mt-2 text-xs font-medium text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{existingStep.location}</span>
                          </div>
                        )}
                        {existingStep?.note && (
                          <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl font-medium">
                            {existingStep.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipment Metadata Details Grid */}
            <div className="p-6 sm:p-10 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              
              {/* Sender Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Sender (Origin)
                </span>
                <p className="text-sm font-bold text-slate-900">{shipment.sender.name}</p>
                <p className="text-slate-600">{shipment.sender.address}</p>
                <p className="font-semibold text-slate-800">{shipment.sender.city}, {shipment.sender.state}</p>
                <p className="text-slate-500 font-mono">{shipment.sender.phone}</p>
              </div>

              {/* Recipient Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Recipient (Destination)
                </span>
                <p className="text-sm font-bold text-slate-900">{shipment.receiver.name}</p>
                <p className="text-slate-600">{shipment.receiver.address}</p>
                <p className="font-semibold text-slate-800">{shipment.receiver.city}, {shipment.receiver.state}</p>
                <p className="text-slate-500 font-mono">{shipment.receiver.phone}</p>
              </div>

              {/* Package & Agent Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 md:col-span-2 lg:col-span-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cargo Specifications
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Package Type:</span>
                  <span className="font-bold text-slate-800">{shipment.packageDetails.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Weight:</span>
                  <span className="font-bold text-slate-800">{shipment.packageDetails.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Declared Value:</span>
                  <span className="font-bold text-emerald-700">{shipment.packageDetails.value}</span>
                </div>
                {shipment.deliveryAgent && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-slate-500 block mb-1">Assigned Delivery Agent:</span>
                    <p className="font-bold text-[#0F2942] flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-orange-500" />
                      <span>{shipment.deliveryAgent.name}</span>
                    </p>
                    <p className="text-slate-500 font-mono">Agent Code: {shipment.deliveryAgent.agentCode || 'WTO-DISP'}</p>
                  </div>
                )}
              </div>

            </div>

            {/* Need assistance footer & Track Another Button */}
            <div className="p-4 sm:p-6 bg-slate-100 border-t border-slate-200 flex flex-wrap justify-between items-center gap-4 text-xs text-slate-600">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Verified WTO Consignment Security Record</span>
                </div>
                <div>
                  <span>Need operational dispatch support? Contact </span>
                  <a href="mailto:overseasworldtransport@gmail.com" className="font-bold text-orange-600 underline">
                    overseasworldtransport@gmail.com
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearTracking}
                className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md shadow-orange-500/20 flex items-center space-x-2 cursor-pointer transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear & Track Another Consignment</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
