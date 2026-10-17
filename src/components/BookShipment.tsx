import React, { useState } from 'react';
import { 
  Package, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  ShieldCheck, 
  AlertCircle, 
  Mail, 
  FileText, 
  Copy, 
  Printer, 
  Truck, 
  Plane, 
  Ship, 
  Train, 
  Database, 
  Building2, 
  ExternalLink,
  Send,
  Boxes,
  Compass
} from 'lucide-react';
import { createShipmentBooking, sendEmailNotification } from '../services/api';
import { Shipment } from '../types';
import { createShipment, isSupabaseConfigured, generateTrackingNumber } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface BookShipmentProps {
  initialValues?: any;
  onBookingSuccess: (shipment: Shipment) => void;
  onOpenWaybill: (shipment: Shipment) => void;
  onTrackShipment?: (trackingNumber: string) => void;
}

export const BookShipment: React.FC<BookShipmentProps> = ({
  initialValues,
  onBookingSuccess,
  onOpenWaybill,
  onTrackShipment,
}) => {
  const { user } = useAuth();

  // Active Wizard Step
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Transportation Means
  const transportModes = [
    {
      id: 'flight',
      name: 'Air Freight & Express Cargo Flights',
      icon: Plane,
      transit: '24 - 72 Hours Worldwide',
      badge: 'Fastest Transit',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      description: 'Priority commercial flight cargo & dedicated freighter allocation with express tarmac clearance.',
    },
    {
      id: 'ocean',
      name: 'Ocean & Maritime Container Vessel',
      icon: Ship,
      transit: '14 - 28 Days Trans-Oceanic',
      badge: 'Cost-Effective Bulk',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      description: 'Full Container Load (FCL 20ft/40ft) or consolidated Less-Than-Container (LCL) sea freight.',
    },
    {
      id: 'rail',
      name: 'Intercontinental Rail Freight',
      icon: Train,
      transit: '7 - 14 Days Continental',
      badge: 'Eco-Friendly & Reliable',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      description: 'Scheduled containerized freight trains connecting European and Eurasian trade corridors.',
    },
    {
      id: 'road',
      name: 'Cross-Border Overland & Highway Haulage',
      icon: Truck,
      transit: '1 - 3 Days Regional',
      badge: 'Flexible Doorstep',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
      description: 'GPS-escorted articulated trucks and express linehaul vans across international motorway routes.',
    },
  ];

  const [selectedTransportMode, setSelectedTransportMode] = useState<string>(
    initialValues?.transportMode || 'Air Freight & Express Cargo Flights'
  );

  // Commodity Categories
  const commodityCategories = [
    { id: 'Industrial', label: 'Industrial Machinery & Spares', hsCode: 'HS 8413.60', icon: '🏭', desc: 'Pumps, hydraulic valves, machine equipment' },
    { id: 'Electronics', label: 'High-Tech & Semiconductor Electronics', hsCode: 'HS 8517.62', icon: '💻', desc: 'Servers, circuit boards, telecommunication devices' },
    { id: 'CleanEnergy', label: 'Solar & Renewable Energy Equipment', hsCode: 'HS 8504.40', icon: '☀️', desc: 'Inverters, battery storage packs, solar panels' },
    { id: 'Medical', label: 'Pharmaceutical & Cold-Chain Medical', hsCode: 'HS 3004.90', icon: '🩺', desc: 'Laboratory reagents, diagnostic kits, clinical equipment' },
    { id: 'Automotive', label: 'Automotive & Marine Components', hsCode: 'HS 8708.29', icon: '🚗', desc: 'Powertrain parts, marine navigation gear, engine spares' },
    { id: 'Documents', label: 'Commercial Legal Documents & Deeds', hsCode: 'HS 4901.99', icon: '📑', desc: 'Notarized manifests, contracts, financial instruments' },
    { id: 'Personal', label: 'Household Relocation & High-Value Effects', hsCode: 'HS 9403.20', icon: '📦', desc: 'Diplomatic baggage, personal relocation, boxed cargo' },
    { id: 'Custom', label: 'Custom Commodity (Enter Your Own)', hsCode: 'HS 9999.99', icon: '✍️', desc: 'Custom international commercial consignment' },
  ];

  const [selectedCommodity, setSelectedCommodity] = useState<string>('Industrial');
  const [customCommodityName, setCustomCommodityName] = useState<string>('');
  const [hsCodeInput, setHsCodeInput] = useState<string>('HS 8413.60');

  // International Strategic Hubs
  const internationalLocations = [
    { city: 'Sofia', country: 'Bulgaria', label: 'Sofia (Bulgaria - Global Corporate HQ & Cargo Terminal)' },
    { city: 'London', country: 'United Kingdom', label: 'London (United Kingdom - International Freight Terminal)' },
    { city: 'Frankfurt', country: 'Germany', label: 'Frankfurt (Germany - CargoCity Süd Main Hub)' },
    { city: 'New York', country: 'United States', label: 'New York (USA - JFK Air Cargo Gateway)' },
    { city: 'Houston', country: 'United States', label: 'Houston (USA - Energy & Maritime Port Complex)' },
    { city: 'Dubai', country: 'United Arab Emirates', label: 'Dubai (UAE - DWC Aviation Logistics Hub)' },
    { city: 'Singapore', country: 'Singapore', label: 'Singapore (Changi International Cargo Terminal)' },
    { city: 'Tokyo', country: 'Japan', label: 'Tokyo (Japan - Narita Logistics Hub)' },
    { city: 'Guangzhou', country: 'China', label: 'Guangzhou (China - Baiyun International Cargo)' },
    { city: 'Amsterdam', country: 'Netherlands', label: 'Amsterdam (Netherlands - Schiphol Logistics Centre)' },
    { city: 'Paris', country: 'France', label: 'Paris (France - Charles de Gaulle Airfreight)' },
    { city: 'Zurich', country: 'Switzerland', label: 'Zurich (Switzerland - Alpine Freight Center)' },
    { city: 'Sydney', country: 'Australia', label: 'Sydney (Australia - Kingsford Smith Terminal)' },
    { city: 'Toronto', country: 'Canada', label: 'Toronto (Canada - Pearson Cargo Logistics)' },
    { city: 'Johannesburg', country: 'South Africa', label: 'Johannesburg (South Africa - OR Tambo Cargo)' },
    { city: 'Sao Paulo', country: 'Brazil', label: 'Sao Paulo (Brazil - Guarulhos Cargo Center)' },
  ];

  // 1. Consignor (Shipper) Details - Neutral without hardcoded example values
  const [consignor, setConsignor] = useState({
    name: initialValues?.senderName || '',
    company: initialValues?.senderCompany || '',
    email: initialValues?.senderEmail || (user?.email || ''),
    phone: initialValues?.senderPhone || '',
    address: initialValues?.senderAddress || '',
    city: initialValues?.pickupLocation || '',
    state: '',
    country: '',
    eoriNumber: '',
  });

  // 2. Consignee (Receiver) Details - Neutral without hardcoded example values
  const [consignee, setConsignee] = useState({
    name: initialValues?.receiverName || '',
    company: initialValues?.receiverCompany || '',
    email: initialValues?.receiverEmail || '',
    phone: initialValues?.receiverPhone || '',
    address: initialValues?.receiverAddress || '',
    city: initialValues?.destination || '',
    state: '',
    country: '',
    vatNumber: '',
  });

  // 3. Cargo Specifications
  const [cargoSpecs, setCargoSpecs] = useState({
    description: initialValues?.packageType || '',
    weightKg: initialValues?.weight || 25,
    piecesCount: initialValues?.quantity || 1,
    lengthCm: 60,
    widthCm: 40,
    heightCm: 40,
    declaredValueUsd: '5,000',
    incoterms: 'DAP',
    packagingType: 'Standard Heavy-Duty Euro-Pallet',
    isTemperatureControlled: false,
    isFragile: true,
    isHazardousDgr: false,
    isCargoInsuranceIncluded: true,
    speedService: (initialValues?.speed as 'Standard' | 'Express') || 'Standard',
  });

  // 4. Pickup & Dispatch Scheduling
  const [dispatchInfo, setDispatchInfo] = useState({
    pickupDate: new Date(Date.now() + 86400000).toISOString().substring(0, 10),
    timeWindow: 'Morning (09:00 - 13:00 GMT)',
    dockType: 'Forklift Loading Dock Available',
    specialInstructions: 'Commercial invoice & packing list attached to outer container side.',
  });

  // Submission & Confirmation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedShipment, setConfirmedShipment] = useState<Shipment | null>(null);
  const [emailDispatched, setEmailDispatched] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [additionalEmail, setAdditionalEmail] = useState('');
  const [additionalEmailSent, setAdditionalEmailSent] = useState(false);
  const [sendingAdditional, setSendingAdditional] = useState(false);

  // Volumetric weight calculation (Standard IATA formula: (L x W x H in cm) / 5000)
  const volumetricWeightKg = Math.round(
    ((Number(cargoSpecs.lengthCm) || 1) *
      (Number(cargoSpecs.widthCm) || 1) *
      (Number(cargoSpecs.heightCm) || 1) *
      (Number(cargoSpecs.piecesCount) || 1)) /
      5000
  );
  const chargeableWeightKg = Math.max(Number(cargoSpecs.weightKg) || 1, volumetricWeightKg);

  // Estimated Tariff Calculation (USD)
  const baseFreight = selectedTransportMode.includes('Ocean') ? 350 : selectedTransportMode.includes('Air') ? 120 : 80;
  const perKgRate = selectedTransportMode.includes('Ocean') ? 1.8 : selectedTransportMode.includes('Air') ? 7.5 : 3.5;
  let estimatedFreightUsd = baseFreight + chargeableWeightKg * perKgRate;
  if (cargoSpecs.speedService === 'Express') estimatedFreightUsd *= 1.35;
  if (cargoSpecs.isCargoInsuranceIncluded) estimatedFreightUsd += 45;
  const finalCalculatedPrice = Math.round(estimatedFreightUsd);

  const getEffectiveCommodity = () => {
    if (selectedCommodity === 'Custom') {
      return customCommodityName || 'Custom Industrial Cargo';
    }
    return commodityCategories.find((c) => c.id === selectedCommodity)?.label || 'General Commercial Cargo';
  };

  const handleCommoditySelect = (id: string, defaultHs: string) => {
    setSelectedCommodity(id);
    setHsCodeInput(defaultHs);
  };

  // Submit Official Consignment Booking
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consignor.name || !consignor.email || !consignee.name || !consignee.email) {
      setErrorMessage('Please complete all required Consignor and Consignee contact details.');
      setActiveStep(2);
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    const fullCommodityName = getEffectiveCommodity();
    const finalDescription = cargoSpecs.description || `${fullCommodityName} (${chargeableWeightKg}kg chargeable weight) via ${selectedTransportMode}`;
    const generatedTracking = generateTrackingNumber(true);

    try {
      // 1. Connect to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const sbShipment = await createShipment({
            trackingNumber: generatedTracking,
            customerId: user?.id || null,
            senderName: consignor.name,
            senderEmail: consignor.email,
            senderPhone: consignor.phone,
            senderAddress: consignor.address,
            origin: consignor.city,
            receiverName: consignee.name,
            receiverEmail: consignee.email,
            receiverPhone: consignee.phone,
            receiverAddress: consignee.address,
            destination: consignee.city,
            transportMode: selectedTransportMode,
            shipmentType: `${selectedTransportMode} • ${fullCommodityName}`,
            cargoDescription: finalDescription,
            hsCode: hsCodeInput,
            weight: Number(cargoSpecs.weightKg) || 1,
            pieces: Number(cargoSpecs.piecesCount) || 1,
            dimensionsCm: `${cargoSpecs.lengthCm}x${cargoSpecs.widthCm}x${cargoSpecs.heightCm} cm`,
            volumetricWeight: volumetricWeightKg,
            declaredValue: `$${cargoSpecs.declaredValueUsd} USD`,
            incoterms: cargoSpecs.incoterms,
            packagingType: cargoSpecs.packagingType,
            isFragile: cargoSpecs.isFragile,
            isHazardous: cargoSpecs.isHazardousDgr,
            isInsured: cargoSpecs.isCargoInsuranceIncluded,
            pickupDate: dispatchInfo.pickupDate,
            specialInstructions: `${dispatchInfo.dockType}. ${dispatchInfo.specialInstructions}`,
            price: finalCalculatedPrice,
            status: 'Pending',
            estimatedDelivery: cargoSpecs.speedService === 'Express' ? '1 - 3 Business Days' : '3 - 5 Business Days',
            currentLocation: consignor.city,
          });

          const converted: Shipment = {
            id: sbShipment.id,
            trackingNumber: sbShipment.tracking_number,
            sender: consignor,
            receiver: consignee,
            packageDetails: {
              type: `${selectedTransportMode} • ${fullCommodityName}`,
              itemCategory: selectedCommodity,
              customItemName: fullCommodityName,
              description: finalDescription,
              weight: Number(cargoSpecs.weightKg),
              quantity: Number(cargoSpecs.piecesCount),
              value: `$${cargoSpecs.declaredValueUsd} USD`,
              speed: cargoSpecs.speedService,
              packagingType: cargoSpecs.packagingType,
              isFragile: cargoSpecs.isFragile,
              isHazardous: cargoSpecs.isHazardousDgr,
            },
            pickupLocation: consignor.city,
            destination: consignee.city,
            price: finalCalculatedPrice,
            tariffType: 'WTO International Worldwide Freight Tariff',
            status: 'Pending',
            currentStage: 'Order Confirmed' as any,
            createdDate: new Date().toLocaleDateString(),
            estimatedDeliveryDate: sbShipment.estimated_delivery || '3 - 5 Business Days',
            lastUpdated: new Date().toLocaleString(),
            currentLocation: consignor.city,
            timeline: [
              {
                status: 'Order Booked',
                title: 'Electronic Air Waybill (AWB) Issued',
                location: consignor.city,
                timestamp: new Date().toLocaleString(),
                completed: true,
                current: true,
                note: `Air Waybill registered in WTO Global Network via ${selectedTransportMode}. Operations notified: overseasworldtransport@gmail.com.`,
              },
            ],
          };

          setConfirmedShipment(converted);
          setEmailDispatched(true);
          onBookingSuccess(converted);

          // Transmit email manifest to central operations and customer
          const manifestBody = `WORLD TRANSPORT OVERSEAS (WTO) - OFFICIAL ELECTRONIC AIR WAYBILL (AWB)
========================================================================
AWB Tracking No : ${converted.trackingNumber}
Booking Date    : ${new Date().toUTCString()}
Status          : Registered & Confirmed
Transport Mode  : ${selectedTransportMode}

SHIPPER (CONSIGNOR):
------------------------------------------------------------------------
Name / Company  : ${consignor.name}
Email Address   : ${consignor.email}
Phone Number    : ${consignor.phone || 'N/A'}
Origin Address  : ${consignor.address || 'Declared on File'}, ${consignor.city}, ${consignor.country}

CONSIGNEE (RECIPIENT):
------------------------------------------------------------------------
Recipient Name  : ${consignee.name}
Email Address   : ${consignee.email}
Phone Number    : ${consignee.phone || 'N/A'}
Destination     : ${consignee.address || 'Declared on File'}, ${consignee.city}, ${consignee.country}

CARGO SPECIFICATIONS:
------------------------------------------------------------------------
Transport Mode  : ${selectedTransportMode}
Commodity       : ${fullCommodityName} (${hsCodeInput})
Chargeable Wt   : ${chargeableWeightKg} kg (${cargoSpecs.piecesCount} packages)
Dimensions      : ${cargoSpecs.lengthCm}x${cargoSpecs.widthCm}x${cargoSpecs.heightCm} cm
Declared Value  : $${cargoSpecs.declaredValueUsd} USD
Incoterms 2020  : ${cargoSpecs.incoterms}
Commercial Terms: Corporate Direct Invoicing on File (${cargoSpecs.incoterms})
Scheduled Pickup: ${dispatchInfo.pickupDate} (${dispatchInfo.timeWindow})
Loading Protocol: ${dispatchInfo.dockType}
Instructions    : ${dispatchInfo.specialInstructions}

Your consignment has been recorded into the WTO Global Operations network.
Official Operations Desk: overseasworldtransport@gmail.com
`;

          // 1. Send booking manifest to company central operations email
          sendEmailNotification({
            recipientEmail: 'overseasworldtransport@gmail.com',
            subject: `[NEW CONSIGNMENT BOOKING] AWB: ${converted.trackingNumber} - ${consignor.city || 'Origin'} to ${consignee.city || 'Destination'}`,
            body: manifestBody,
            trackingNumber: converted.trackingNumber,
            type: 'shipment_booking',
          }).catch(console.warn);

          // 2. Send booking confirmation to customer
          sendEmailNotification({
            recipientEmail: consignor.email,
            subject: `[WTO Official Air Waybill] Consignment ${converted.trackingNumber} - ${consignor.city || 'Origin'} to ${consignee.city || 'Destination'}`,
            body: manifestBody,
            trackingNumber: converted.trackingNumber,
            type: 'shipment_booking',
          }).catch(console.warn);

          // 3. Synchronize with server API memory store so Admin Dashboard sees it everywhere
          try {
            await createShipmentBooking({
              id: converted.id,
              trackingNumber: converted.trackingNumber,
              sender: consignor,
              receiver: consignee,
              packageDetails: {
                type: `${selectedTransportMode} • ${fullCommodityName}`,
                itemCategory: selectedCommodity,
                customItemName: fullCommodityName,
                description: finalDescription,
                weight: Number(cargoSpecs.weightKg),
                quantity: Number(cargoSpecs.piecesCount),
                dimensions: `${cargoSpecs.lengthCm}x${cargoSpecs.widthCm}x${cargoSpecs.heightCm} cm`,
                value: `$${cargoSpecs.declaredValueUsd} USD`,
                speed: cargoSpecs.speedService,
                packagingType: cargoSpecs.packagingType,
                isFragile: cargoSpecs.isFragile,
                isHazardous: cargoSpecs.isHazardousDgr,
                hsCode: hsCodeInput,
                incoterms: cargoSpecs.incoterms,
              },
              pickupLocation: consignor.city,
              destination: consignee.city,
              price: finalCalculatedPrice,
              transportMode: selectedTransportMode,
              pickupDate: dispatchInfo.pickupDate,
              dockType: dispatchInfo.dockType,
              specialInstructions: `${dispatchInfo.dockType}. ${dispatchInfo.specialInstructions}`,
            });
          } catch (syncErr) {
            console.warn('Notice syncing shipment booking with server:', syncErr);
          }

          // 4. Save to client storage backup
          try {
            const cachedBookings = JSON.parse(localStorage.getItem('wto_booked_shipments') || '[]');
            cachedBookings.unshift(converted);
            localStorage.setItem('wto_booked_shipments', JSON.stringify(cachedBookings.slice(0, 50)));
          } catch (e) {
            console.warn('Notice caching to local storage:', e);
          }

          return;
        } catch (sbError: any) {
          console.warn('Supabase booking notice (fallback to server dispatch):', sbError?.message || sbError);
        }
      }

      // 2. Server API Dispatch Fallback
      const payload = {
        sender: consignor,
        receiver: consignee,
        packageDetails: {
          type: `${selectedTransportMode} • ${fullCommodityName}`,
          itemCategory: selectedCommodity,
          customItemName: fullCommodityName,
          description: finalDescription,
          weight: Number(cargoSpecs.weightKg),
          quantity: Number(cargoSpecs.piecesCount),
          dimensions: `${cargoSpecs.lengthCm}x${cargoSpecs.widthCm}x${cargoSpecs.heightCm} cm`,
          value: `$${cargoSpecs.declaredValueUsd} USD`,
          speed: cargoSpecs.speedService,
          packagingType: cargoSpecs.packagingType,
          isFragile: cargoSpecs.isFragile,
          isHazardous: cargoSpecs.isHazardousDgr,
        },
        pickupLocation: consignor.city,
        destination: consignee.city,
        specialInstructions: `${dispatchInfo.dockType}. ${dispatchInfo.specialInstructions}`,
      };

      const res = await createShipmentBooking(payload);

      if (res.success && res.shipment) {
        setConfirmedShipment(res.shipment);
        setEmailDispatched(true);
        onBookingSuccess(res.shipment);

        // Cache booking in local storage
        try {
          const cachedBookings = JSON.parse(localStorage.getItem('wto_booked_shipments') || '[]');
          cachedBookings.unshift(res.shipment);
          localStorage.setItem('wto_booked_shipments', JSON.stringify(cachedBookings.slice(0, 50)));
        } catch (e) {
          console.warn('Notice caching to local storage:', e);
        }

        const manifestBody = `WORLD TRANSPORT OVERSEAS (WTO) - OFFICIAL ELECTRONIC AIR WAYBILL (AWB)
========================================================================
AWB Tracking No : ${res.shipment.trackingNumber}
Booking Date    : ${new Date().toUTCString()}
Status          : Registered & Confirmed
Transport Mode  : ${selectedTransportMode}

SHIPPER (CONSIGNOR):
------------------------------------------------------------------------
Name / Company  : ${consignor.name}
Email Address   : ${consignor.email}
Origin          : ${consignor.city || 'Origin'}, ${consignor.country}

CONSIGNEE (RECIPIENT):
------------------------------------------------------------------------
Recipient Name  : ${consignee.name}
Email Address   : ${consignee.email}
Destination     : ${consignee.city || 'Destination'}, ${consignee.country}

CARGO SPECIFICATIONS:
------------------------------------------------------------------------
Transport Mode  : ${selectedTransportMode}
Commodity       : ${fullCommodityName} (${hsCodeInput})
Chargeable Wt   : ${chargeableWeightKg} kg
Commercial Terms: Corporate Direct Invoicing on File (${cargoSpecs.incoterms})
Pickup Slot     : ${dispatchInfo.pickupDate} (${dispatchInfo.timeWindow})

WTO Global Operations Desk: overseasworldtransport@gmail.com
`;

        // Transmit booking manifest to company email
        sendEmailNotification({
          recipientEmail: 'overseasworldtransport@gmail.com',
          subject: `[NEW CONSIGNMENT BOOKING] AWB: ${res.shipment.trackingNumber} - ${consignor.city || 'Origin'} to ${consignee.city || 'Destination'}`,
          body: manifestBody,
          trackingNumber: res.shipment.trackingNumber,
          type: 'shipment_booking',
        }).catch(console.warn);

        // Transmit confirmation to customer
        sendEmailNotification({
          recipientEmail: consignor.email,
          subject: `[WTO Official Air Waybill] Consignment ${res.shipment.trackingNumber} - ${consignor.city || 'Origin'} to ${consignee.city || 'Destination'}`,
          body: manifestBody,
          trackingNumber: res.shipment.trackingNumber,
          type: 'shipment_booking',
        }).catch(console.warn);
      } else {
        setErrorMessage(res.error || 'Failed to submit consignment manifest.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error transmitting consignment booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAdditionalEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!additionalEmail || !confirmedShipment) return;
    setSendingAdditional(true);
    try {
      await sendEmailNotification({
        recipientEmail: additionalEmail,
        subject: `[FORWARDED WAYBILL] WTO Consignment ${confirmedShipment.trackingNumber} (${consignor.city} to ${consignee.city})`,
        body: `WORLD TRANSPORT OVERSEAS (WTO) - FORWARDED AIR WAYBILL MANIFEST
========================================================================
AWB Tracking No : ${confirmedShipment.trackingNumber}
Shipper         : ${consignor.name} (${consignor.email})
Consignee       : ${consignee.name} (${consignee.email})
Transport Corridor: ${selectedTransportMode}
Chargeable Wt   : ${chargeableWeightKg} kg (${cargoSpecs.piecesCount} pkgs)
Total Tariff    : $${finalCalculatedPrice.toLocaleString()} USD (${cargoSpecs.incoterms})
Scheduled Handover: ${dispatchInfo.pickupDate} (${dispatchInfo.timeWindow})

You have been sent a copy of this official consignment manifest.
WTO Operations Desk: overseasworldtransport@gmail.com
`,
        trackingNumber: confirmedShipment.trackingNumber,
        type: 'shipment_booking',
      });
      setAdditionalEmailSent(true);
      setTimeout(() => setAdditionalEmailSent(false), 4000);
    } catch (err) {
      console.warn('Additional email dispatch notice:', err);
    } finally {
      setSendingAdditional(false);
    }
  };

  // Generate Email Pre-filled Mailto
  const buildEmailManifestMailto = () => {
    if (!confirmedShipment) return '';
    const subject = encodeURIComponent(`OFFICIAL AWB BOOKING DISPATCH: ${confirmedShipment.trackingNumber} [${consignor.name}]`);
    const body = encodeURIComponent(
`WORLD TRANSPORT OVERSEAS (WTO) - ELECTRONIC AIR WAYBILL / CARGO DISPATCH MANIFEST
========================================================================
Consignment Tracking Number : ${confirmedShipment.trackingNumber}
Transport Mode              : ${selectedTransportMode}
Service Speed               : ${cargoSpecs.speedService} (Estimated ${confirmedShipment.estimatedDeliveryDate})
Booking Date & Time         : ${new Date().toUTCString()}

1. CONSIGNOR (SHIPPER):
------------------------------------------------------------------------
Name / Entity     : ${consignor.name} ${consignor.company ? `(${consignor.company})` : ''}
Email Address     : ${consignor.email}
Phone Number      : ${consignor.phone || 'N/A'}
Facility Address  : ${consignor.address || 'Declared on Commercial Invoice'}
Departure Hub     : ${consignor.city}

2. CONSIGNEE (RECEIVER):
------------------------------------------------------------------------
Name / Entity     : ${consignee.name} ${consignee.company ? `(${consignee.company})` : ''}
Email Address     : ${consignee.email}
Phone Number      : ${consignee.phone || 'N/A'}
Destination Address: ${consignee.address || 'Declared on File'}
Arrival Hub       : ${consignee.city}

3. CARGO & CUSTOMS SPECIFICATIONS:
------------------------------------------------------------------------
Commodity Type    : ${getEffectiveCommodity()}
HS Tariff Code    : ${hsCodeInput}
Gross Weight      : ${cargoSpecs.weightKg} kg
Volumetric Weight : ${volumetricWeightKg} kg (Dimensions: ${cargoSpecs.lengthCm}x${cargoSpecs.widthCm}x${cargoSpecs.heightCm} cm)
Chargeable Weight : ${chargeableWeightKg} kg
Number of Pieces  : ${cargoSpecs.piecesCount}
Packaging Format  : ${cargoSpecs.packagingType}
Declared Customs  : $${cargoSpecs.declaredValueUsd} USD
Incoterms 2020    : ${cargoSpecs.incoterms}
Cargo Insurance   : ${cargoSpecs.isCargoInsuranceIncluded ? 'Covered (WTO Comprehensive Transit Policy)' : 'Standard Carrier Liability'}
Special Handling  : ${cargoSpecs.isFragile ? '[FRAGILE] ' : ''}${cargoSpecs.isTemperatureControlled ? '[COLD-CHAIN] ' : ''}${cargoSpecs.isHazardousDgr ? '[IATA DGR] ' : ''}

4. PICKUP & DISPATCH:
------------------------------------------------------------------------
Scheduled Date    : ${dispatchInfo.pickupDate} (${dispatchInfo.timeWindow})
Loading Protocol  : ${dispatchInfo.dockType}
Instructions      : ${dispatchInfo.specialInstructions}
Estimated Tariff  : $${finalCalculatedPrice.toLocaleString()} USD

Please confirm receipt, verify customs documentation, and issue formal airway stamp.
Dedicated Operations Email: overseasworldtransport@gmail.com
`
    );
    return `mailto:overseasworldtransport@gmail.com,${consignor.email}?subject=${subject}&body=${body}`;
  };

  const handleCopyTrackingCode = () => {
    if (confirmedShipment) {
      navigator.clipboard.writeText(confirmedShipment.trackingNumber);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2500);
    }
  };

  // ============================================================================
  // SUCCESSFUL BOOKING CONFIRMATION SCREEN
  // ============================================================================
  if (confirmedShipment) {
    const mailtoLink = buildEmailManifestMailto();

    return (
      <section id="book" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 animate-in zoom-in-95 duration-300">
          
          {/* Header Banner */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center space-y-6">
            
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-400/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Air Waybill (AWB) Dispatched to Central Operations</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-heading tracking-tight text-white">
                Consignment Successfully Booked & Registered
              </h2>
              <p className="text-slate-300 text-sm max-w-xl mx-auto">
                Your international multimodal consignment has been recorded in the WTO global registry and transmitted to central dispatch.
              </p>
            </div>

            {/* Official Tracking Number Box */}
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-orange-500/50 max-w-xl mx-auto space-y-4 text-center shadow-2xl shadow-orange-500/10">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs font-bold uppercase tracking-wider">
                <span>✓ Official International Tracking Number Assigned</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <span className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-white selection:bg-orange-500">
                  {confirmedShipment.trackingNumber}
                </span>
                <button
                  onClick={handleCopyTrackingCode}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white transition-all cursor-pointer font-bold text-xs flex items-center space-x-1.5 shadow-sm"
                  title="Copy Tracking Number"
                >
                  <Copy className="w-4 h-4 text-orange-400" />
                  <span>{copiedTracking ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              {copiedTracking && (
                <span className="text-xs text-emerald-400 font-semibold block animate-in fade-in">
                  ✓ Tracking number copied to clipboard!
                </span>
              )}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    if (onTrackShipment) {
                      onTrackShipment(confirmedShipment.trackingNumber);
                    } else {
                      const el = document.getElementById('tracking');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Track This Consignment Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Email Notification Status */}
            <div className="bg-orange-500/10 border border-orange-400/30 rounded-2xl p-4 max-w-xl mx-auto flex items-start space-x-3 text-left text-xs text-orange-200">
              <Mail className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-orange-300 block font-heading">
                  Dispatch Notification Transmitted
                </strong>
                <p>
                  A complete booking notice with cargo manifest has been transmitted to operations at <strong>overseasworldtransport@gmail.com</strong> and to the consignor address <strong>{consignor.email}</strong>.
                </p>
              </div>
            </div>

            {/* Manifest Quick Overview Table */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 text-xs text-slate-300 text-left max-w-2xl mx-auto space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">Flight / Vessel Manifest Summary</span>
                <span className="font-mono text-orange-400 font-bold">{confirmedShipment.trackingNumber}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Shipper (Consignor)</span>
                  <span className="text-white font-semibold">{consignor.name}</span>
                  <span className="block text-slate-400 text-[11px] truncate">{consignor.city || consignor.address}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Recipient (Consignee)</span>
                  <span className="text-white font-semibold">{consignee.name}</span>
                  <span className="block text-slate-400 text-[11px] truncate">{consignee.city || consignee.address}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Transport & Commodity</span>
                  <span className="text-white font-semibold">{selectedTransportMode}</span>
                  <span className="block text-slate-400 text-[11px]">{getEffectiveCommodity()} ({hsCodeInput})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Chargeable Weight & Terms</span>
                  <span className="text-white font-semibold">{chargeableWeightKg} kg ({cargoSpecs.piecesCount} {cargoSpecs.piecesCount === 1 ? 'Unit' : 'Units'})</span>
                  <span className="block text-emerald-400 font-semibold text-xs">Corporate Direct Invoicing on File ({cargoSpecs.incoterms})</span>
                </div>
              </div>
            </div>

            {/* Forward Copy to Another Email Input */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-xs max-w-2xl mx-auto space-y-2 text-left">
              <div className="flex items-center space-x-2 text-slate-300 font-bold">
                <Mail className="w-4 h-4 text-orange-400" />
                <span>Send Waybill Copy to Additional Email (Customs Broker, Accountant, or Buyer)</span>
              </div>
              <form onSubmit={handleSendAdditionalEmail} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  value={additionalEmail}
                  onChange={(e) => setAdditionalEmail(e.target.value)}
                  placeholder="broker@logistics.com or recipient@client.com"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={sendingAdditional}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all cursor-pointer text-xs shrink-0 flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingAdditional ? 'Transmitting...' : 'Send Waybill Copy'}</span>
                </button>
              </form>
              {additionalEmailSent && (
                <div className="text-emerald-400 font-semibold text-[11px] flex items-center space-x-1 animate-in fade-in">
                  <span>✓ Electronic air waybill copy successfully transmitted to {additionalEmail}!</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a
                href={mailtoLink}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Open Email Client & Send Waybill to Operations</span>
              </a>

              <button
                onClick={() => onOpenWaybill(confirmedShipment)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span>View & Print Official Air Waybill</span>
              </button>

              <button
                onClick={() => {
                  setConfirmedShipment(null);
                  setActiveStep(1);
                }}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-colors"
              >
                Book Another Consignment
              </button>
            </div>

          </div>

        </div>
      </section>
    );
  }

  // ============================================================================
  // PROFESSIONAL BOOKING WIZARD FORM
  // ============================================================================
  return (
    <section id="book" className="py-20 bg-slate-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <Boxes className="w-3.5 h-3.5" />
            <span>Official International Consignment Booking</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
            Air Waybill (AWB) & Multimodal Freight Dispatch
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Register your international commercial consignment directly into World Transport Overseas. Automated export clearance, route scheduling, and email dispatch to <span className="text-orange-400 font-semibold">overseasworldtransport@gmail.com</span>.
          </p>
        </div>

        {/* Step Indicator Bar */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 text-xs font-bold">
            {[
              { num: 1, label: '1. Transport Mode' },
              { num: 2, label: '2. Consignor & Shipper' },
              { num: 3, label: '3. Consignee Details' },
              { num: 4, label: '4. Cargo & Customs' },
              { num: 5, label: '5. Review & Confirm' },
            ].map((step) => (
              <button
                key={step.num}
                type="button"
                onClick={() => setActiveStep(step.num as any)}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeStep === step.num
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{step.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmitBooking} className="max-w-4xl mx-auto bg-slate-900/90 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-8">
          
          {/* ============================================================ */}
          {/* STEP 1: TRANSPORT MODE SELECTION */}
          {/* ============================================================ */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">Step 1 of 5</span>
                <h3 className="text-xl font-bold font-heading text-white mt-1">
                  Select Multimodal Transportation Corridor
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose the primary carriage method according to your required transit speed and volume.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transportModes.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = selectedTransportMode === mode.name;
                  return (
                    <div
                      key={mode.id}
                      onClick={() => setSelectedTransportMode(mode.name)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${mode.badgeColor}`}>
                          {mode.badge}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white font-heading">
                          {mode.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {mode.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center">
                          <Clock className="w-3.5 h-3.5 text-orange-400 mr-1" />
                          {mode.transit}
                        </span>
                        <span className={`font-bold ${isSelected ? 'text-orange-400' : 'text-slate-500'}`}>
                          {isSelected ? '✓ Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md shadow-orange-500/20"
                >
                  <span>Continue to Consignor Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: CONSIGNOR (SHIPPER / ORIGIN) */}
          {/* ============================================================ */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">Step 2 of 5</span>
                <h3 className="text-xl font-bold font-heading text-white mt-1">
                  Consignor (Shipper) & Origin Hub Information
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter details for the entity dispatching the cargo. Status notifications will be sent to this email.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Shipper / Company Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={consignor.name}
                    onChange={(e) => setConsignor({ ...consignor, name: e.target.value })}
                    placeholder="e.g. EuroTech Systems Ltd"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Shipper Email Address (For Notifications) *
                  </label>
                  <input
                    type="email"
                    required
                    value={consignor.email}
                    onChange={(e) => setConsignor({ ...consignor, email: e.target.value })}
                    placeholder="shipper@company.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Direct Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={consignor.phone}
                    onChange={(e) => setConsignor({ ...consignor, phone: e.target.value })}
                    placeholder="+44 20 7946 0912"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Shipper EORI / Tax ID / Commercial Ref (Optional)
                  </label>
                  <input
                    type="text"
                    value={consignor.eoriNumber}
                    onChange={(e) => setConsignor({ ...consignor, eoriNumber: e.target.value })}
                    placeholder="e.g. GB123456789000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Departure Airport / Port / City Terminal *
                  </label>
                  <input
                    type="text"
                    required
                    list="consignor-locations-list"
                    value={consignor.city}
                    onChange={(e) => setConsignor({ ...consignor, city: e.target.value })}
                    placeholder="Enter departure city, airport terminal, or seaport hub..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                  <datalist id="consignor-locations-list">
                    {internationalLocations.map((loc) => (
                      <option key={loc.city} value={loc.label} />
                    ))}
                  </datalist>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Warehouse / Loading Facility Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={consignor.address}
                    onChange={(e) => setConsignor({ ...consignor, address: e.target.value })}
                    placeholder="Enter warehouse, street, or loading facility address..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-2"
                >
                  <span>Continue to Consignee Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: CONSIGNEE (RECEIVER / DESTINATION) */}
          {/* ============================================================ */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">Step 3 of 5</span>
                <h3 className="text-xl font-bold font-heading text-white mt-1">
                  Consignee (Recipient) & Destination Hub Information
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter details for the receiving party and final delivery facility or bonded warehouse.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Consignee Full Name / Receiving Enterprise *
                  </label>
                  <input
                    type="text"
                    required
                    value={consignee.name}
                    onChange={(e) => setConsignee({ ...consignee, name: e.target.value })}
                    placeholder="Enter consignee or receiving company name..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Consignee Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={consignee.email}
                    onChange={(e) => setConsignee({ ...consignee, email: e.target.value })}
                    placeholder="imports@recipient.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Receiver Phone Number
                  </label>
                  <input
                    type="tel"
                    value={consignee.phone}
                    onChange={(e) => setConsignee({ ...consignee, phone: e.target.value })}
                    placeholder="Enter recipient contact phone number..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Customs Broker / VAT Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={consignee.vatNumber}
                    onChange={(e) => setConsignee({ ...consignee, vatNumber: e.target.value })}
                    placeholder="Enter customs broker or VAT number (optional)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Arrival Airport / Port / City Destination *
                  </label>
                  <input
                    type="text"
                    required
                    list="consignee-locations-list"
                    value={consignee.city}
                    onChange={(e) => setConsignee({ ...consignee, city: e.target.value })}
                    placeholder="Enter destination city, airport, or seaport hub..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                  <datalist id="consignee-locations-list">
                    {internationalLocations.map((loc) => (
                      <option key={loc.city} value={loc.label} />
                    ))}
                  </datalist>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Final Delivery Street / Warehouse Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={consignee.address}
                    onChange={(e) => setConsignee({ ...consignee, address: e.target.value })}
                    placeholder="Enter destination street address or warehouse facility..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-2"
                >
                  <span>Continue to Cargo Specifications</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: CARGO SPECIFICATIONS & CUSTOMS */}
          {/* ============================================================ */}
          {activeStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">Step 4 of 5</span>
                <h3 className="text-xl font-bold font-heading text-white mt-1">
                  Cargo Specifications, Dimensions & Customs Declarations
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Declare commodity classification, harmonized HS tariff code, volumetric weight, and handling requirements.
                </p>
              </div>

              {/* Commodity Categories Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase">
                  Commercial Commodity Classification *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {commodityCategories.map((c) => {
                    const isSelected = selectedCommodity === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleCommoditySelect(c.id, c.hsCode)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-orange-500/10 border-orange-500 text-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xl block mb-1">{c.icon}</span>
                        <span className="text-xs font-bold block leading-tight text-white">{c.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{c.hsCode}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedCommodity === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Specify Custom Commodity Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customCommodityName}
                    onChange={(e) => setCustomCommodityName(e.target.value)}
                    placeholder="Enter precise commercial item description..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
              )}

              {/* Weights & Dimensions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Gross Weight (kg) *
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={cargoSpecs.weightKg}
                    onChange={(e) => setCargoSpecs({ ...cargoSpecs, weightKg: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Number of Pieces / Cartons *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cargoSpecs.piecesCount}
                    onChange={(e) => setCargoSpecs({ ...cargoSpecs, piecesCount: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    HS Tariff Code
                  </label>
                  <input
                    type="text"
                    value={hsCodeInput}
                    onChange={(e) => setHsCodeInput(e.target.value)}
                    placeholder="e.g. HS 8517.62"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Declared Value (USD $)
                  </label>
                  <input
                    type="text"
                    value={cargoSpecs.declaredValueUsd}
                    onChange={(e) => setCargoSpecs({ ...cargoSpecs, declaredValueUsd: e.target.value })}
                    placeholder="e.g. 5,000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Package Dimensions & Volumetric Weight Indicator */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300 uppercase">Package Dimensions (per piece in cm):</span>
                  <span className="text-orange-400 font-mono text-[11px]">
                    IATA Volumetric: <strong>{volumetricWeightKg} kg</strong> (Chargeable: <strong>{chargeableWeightKg} kg</strong>)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block text-[10px] mb-1">Length (cm)</label>
                    <input
                      type="number"
                      min="5"
                      value={cargoSpecs.lengthCm}
                      onChange={(e) => setCargoSpecs({ ...cargoSpecs, lengthCm: Number(e.target.value) || 10 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[10px] mb-1">Width (cm)</label>
                    <input
                      type="number"
                      min="5"
                      value={cargoSpecs.widthCm}
                      onChange={(e) => setCargoSpecs({ ...cargoSpecs, widthCm: Number(e.target.value) || 10 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[10px] mb-1">Height (cm)</label>
                    <input
                      type="number"
                      min="5"
                      value={cargoSpecs.heightCm}
                      onChange={(e) => setCargoSpecs({ ...cargoSpecs, heightCm: Number(e.target.value) || 10 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Incoterms & Packaging Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Incoterms 2020 Rules
                  </label>
                  <select
                    value={cargoSpecs.incoterms}
                    onChange={(e) => setCargoSpecs({ ...cargoSpecs, incoterms: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                  >
                    <option value="DAP">DAP - Delivered at Place (Recommended)</option>
                    <option value="CIF">CIF - Cost, Insurance and Freight</option>
                    <option value="FOB">FOB - Free on Board (Port of Origin)</option>
                    <option value="EXW">EXW - Ex Works (Shipper Premises)</option>
                    <option value="DDP">DDP - Delivered Duty Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Packaging Format
                  </label>
                  <select
                    value={cargoSpecs.packagingType}
                    onChange={(e) => setCargoSpecs({ ...cargoSpecs, packagingType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                  >
                    <option value="Standard Heavy-Duty Euro-Pallet">Standard Heavy-Duty Euro-Pallet (120x80cm)</option>
                    <option value="Reinforced Wooden Crate">Export Certified Wooden Crate (Heat Treated ISPM-15)</option>
                    <option value="Corrugated Fiberboard Carton">Double-Wall Fiberboard Cartons</option>
                    <option value="Full Maritime Container (20ft Box)">Full Container Load (FCL 20ft Box)</option>
                    <option value="Full Maritime Container (40ft High-Cube)">Full Container Load (FCL 40ft High-Cube)</option>
                  </select>
                </div>
              </div>

              {/* Handling Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <label className="flex items-center space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cargoSpecs.isCargoInsuranceIncluded}
                    onChange={(e) => setCargoSpecs({ ...cargoSpecs, isCargoInsuranceIncluded: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded border-slate-700"
                  />
                  <span className="text-slate-300 font-semibold">Full Cargo Insurance Cover</span>
                </label>

                <label className="flex items-center space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cargoSpecs.isFragile}
                    onChange={(e) => setCargoSpecs({ ...cargoSpecs, isFragile: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded border-slate-700"
                  />
                  <span className="text-slate-300 font-semibold">Fragile / High-Sensitivity</span>
                </label>

                <label className="flex items-center space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cargoSpecs.isHazardousDgr}
                    onChange={(e) => setCargoSpecs({ ...cargoSpecs, isHazardousDgr: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded border-slate-700"
                  />
                  <span className="text-slate-300 font-semibold">IATA / IMO DGR Declaration</span>
                </label>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(5)}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-2"
                >
                  <span>Continue to Review & Confirm</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: REVIEW, PICKUP SCHEDULING & CONFIRMATION */}
          {/* ============================================================ */}
          {activeStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">Step 5 of 5</span>
                <h3 className="text-xl font-bold font-heading text-white mt-1">
                  Review Waybill Manifest & Dispatch Scheduling
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm dispatch scheduling, verify manifest line items, and transmit the consignment to operations.
                </p>
              </div>

              {/* Pickup & Loading Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Scheduled Handover / Pickup Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dispatchInfo.pickupDate}
                    onChange={(e) => setDispatchInfo({ ...dispatchInfo, pickupDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Preferred Time Window
                  </label>
                  <select
                    value={dispatchInfo.timeWindow}
                    onChange={(e) => setDispatchInfo({ ...dispatchInfo, timeWindow: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                  >
                    <option value="Morning (09:00 - 13:00 GMT)">Morning (09:00 - 13:00 GMT)</option>
                    <option value="Afternoon (13:00 - 17:00 GMT)">Afternoon (13:00 - 17:00 GMT)</option>
                    <option value="24/7 Priority Express Ramp Pickup">24/7 Priority Express Airside Handover</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Loading Protocol & Dock Requirements
                  </label>
                  <input
                    type="text"
                    value={dispatchInfo.dockType}
                    onChange={(e) => setDispatchInfo({ ...dispatchInfo, dockType: e.target.value })}
                    placeholder="e.g. Tailgate lift required, ground floor loading bay..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
              </div>

              {/* Comprehensive Manifest Summary Card */}
              <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 text-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-white uppercase tracking-wider">
                      Official Pre-Transmission Air Waybill Manifest
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    {selectedTransportMode}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-300">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Origin (Consignor)</span>
                    <strong className="text-white block">{consignor.name}</strong>
                    <span className="text-slate-400 text-[11px] block">{consignor.city}</span>
                    <span className="text-slate-500 text-[11px] block">Email: {consignor.email}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Destination (Consignee)</span>
                    <strong className="text-white block">{consignee.name}</strong>
                    <span className="text-slate-400 text-[11px] block">{consignee.city}</span>
                    <span className="text-slate-500 text-[11px] block">Email: {consignee.email}</span>
                  </div>

                  <div className="space-y-1 border-t border-slate-900 pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Cargo & Classification</span>
                    <strong className="text-white block">{getEffectiveCommodity()}</strong>
                    <span className="text-slate-400 text-[11px] block">HS Code: {hsCodeInput} | Declared: ${cargoSpecs.declaredValueUsd} USD</span>
                  </div>

                  <div className="space-y-1 border-t border-slate-900 pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Weight & Volume</span>
                    <strong className="text-white block">{cargoSpecs.weightKg} kg gross ({chargeableWeightKg} kg chargeable)</strong>
                    <span className="text-slate-400 text-[11px] block">{cargoSpecs.piecesCount} {cargoSpecs.piecesCount === 1 ? 'Piece' : 'Pieces'} ({cargoSpecs.packagingType})</span>
                  </div>
                </div>

                {/* Commercial Terms & Corporate Invoicing */}
                <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Commercial Billing & Freight Terms ({cargoSpecs.incoterms})</span>
                    <span className="text-lg font-bold text-emerald-400">
                      Corporate Direct Invoicing on File
                    </span>
                    <span className="text-[11px] text-slate-400 block">Official electronic invoice issued directly to shipper with zero upfront booking fees.</span>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <span className="text-orange-400 font-semibold block">Company Operations Target:</span>
                    <span className="text-white font-medium">overseasworldtransport@gmail.com</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Back to Cargo Specs
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-extrabold text-sm shadow-xl shadow-orange-500/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Registering Consignment & Dispatching Notice...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Official Booking & Transmit Air Waybill</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>

      </div>
    </section>
  );
};
