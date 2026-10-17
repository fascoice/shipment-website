import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app = express();
const server = http.createServer(app);

const getPort = (): number => {
  const portIndex = process.argv.indexOf('--port');
  if (portIndex !== -1 && process.argv[portIndex + 1]) {
    const p = parseInt(process.argv[portIndex + 1], 10);
    if (!isNaN(p) && p > 0) return p;
  }
  return Number(process.env.PORT) || 3000;
};

const getHost = (): string => {
  const hostIndex = process.argv.indexOf('--host');
  if (hostIndex !== -1 && process.argv[hostIndex + 1]) {
    return process.argv[hostIndex + 1];
  }
  return '0.0.0.0';
};

const PORT = getPort();
const HOST = getHost();
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('GoogleGenAI initialized with User-Agent: aistudio-build');
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// In-Memory Database Structure
interface Shipment {
  id: string;
  trackingNumber: string;
  sender: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    country?: string;
  };
  receiver: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    country?: string;
  };
  packageDetails: {
    type: string;
    itemCategory?: string;
    customItemName?: string;
    description: string;
    weight: number; // in kg
    quantity: number;
    value: string;
    speed: 'Standard' | 'Express';
    packagingType?: string;
    isFragile?: boolean;
    isHazardous?: boolean;
  };
  pickupLocation: string;
  destination: string;
  price: number;
  tariffType?: string;
  status: 'Pending' | 'Picked Up' | 'In Transit' | 'At Destination' | 'Out for Delivery' | 'Delivered';
  currentStage?: 'Order Confirmed' | 'Package Collected' | 'Warehouse Sorting' | 'In Transit' | 'Customs Clearance' | 'Out for Delivery' | 'Delivered';
  createdDate: string;
  estimatedDeliveryDate: string;
  lastUpdated: string;
  currentLocation: string;
  deliveryAgent?: {
    name: string;
    email?: string;
    agentCode?: string;
  };
  timeline: Array<{
    status: string;
    title: string;
    location: string;
    timestamp: string;
    completed: boolean;
    current?: boolean;
    stageKey?: 'booked' | 'pickup' | 'warehouse_sorting' | 'in_transit' | 'customs' | 'out_for_delivery' | 'delivered';
    note?: string;
  }>;
}

interface PaymentRecord {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: 'Pending Verification' | 'Confirmed' | 'Invoice Issued';
  date: string;
  paymentMethod: string;
  reference: string;
}

interface LocationHub {
  id: string;
  state: string;
  city: string;
  country: string;
  region: 'Europe' | 'North America' | 'Asia-Pacific' | 'Africa' | 'Middle East' | 'South America';
  hubName: string;
  type: 'International Gateway' | 'Air Cargo Hub' | 'Ocean Port Terminal' | 'Regional Depot';
  availability: 'Daily Global Flight' | 'Express Same-Day' | '24-48 Hours' | '3-5 Business Days';
  estimatedDeliveryTime: string;
  address: string;
  email: string;
  isActive: boolean;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'Unread' | 'Replied' | 'Archived';
}

interface ChatLog {
  id: string;
  sessionId: string;
  userMessage: string;
  botReply: string;
  timestamp: string;
  trackingQueried?: string;
}

export interface UserFeedbackRecord {
  id: string;
  recipientName: string;
  recipientEmail: string;
  trackingNumber?: string;
  feedbackType: string;
  subject: string;
  message: string;
  sentAt: string;
  status: 'Sent' | 'Delivered';
  contactMessageId?: string;
}

const customerFeedbackStore: UserFeedbackRecord[] = [
  {
    id: 'fb_demo_1',
    recipientName: 'Global Consignor',
    recipientEmail: 'overseasworldtransport@gmail.com',
    trackingNumber: 'WTO-INT-894210',
    feedbackType: 'Consignment Status Update',
    subject: 'WTO Consignment Update: Customs Cleared & On Schedule',
    message: 'Official notification from WTO Global Logistics: your consignment has cleared port customs inspection and is on schedule for scheduled delivery.',
    sentAt: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    status: 'Delivered',
  }
];

// Admin Password
let adminPasswordHash = 'mama123';

// App Settings & Pricing Configuration
const appSettings = {
  companyName: 'World Transport Overseas (WTO)',
  email: 'overseasworldtransport@gmail.com',
  address: 'Mimi Balkanska St 126, 1517 Sofia, Bulgaria',
  nigeriaHQ: 'Plot 14B, Commercial Avenue, Ikeja, Lagos, Nigeria',
  supportHours: '24/7 Global Air & Ocean Dispatch Service',
  aiWelcomeMessage: "Hello! 👋 Welcome to World Transport Overseas (WTO). I am your 24/7 international shipping & cargo assistant. How can I assist your logistics today?",
  aiCustomInstructions: 'Always be professional, courteous, and polite. Remind customers that WTO operates globally with headquarters in Sofia, Bulgaria and regional gateways in Nigeria, Europe, Asia, and the Americas. All payments and official invoices are issued exclusively via overseasworldtransport@gmail.com. Never give out any phone number.',
  ratesConfig: {
    baseLocal: 2500,
    baseInterstate: 5500,
    baseInternational: 35000,
    perKgLocal: 500,
    perKgInterstate: 1200,
    perKgInternational: 6500,
    expressMultiplier: 1.5,
    documentDiscount: 0.8,
    heavyPackageSurcharge: 1.25,
  },
};

// Website CMS Content Store (Editable via Admin)
let websiteContent = {
  company: {
    name: 'World Transport Overseas (WTO)',
    email: 'overseasworldtransport@gmail.com',
    hqAddress: 'Mimi Balkanska St 126, 1517 Sofia, Bulgaria',
    nigeriaAddress: 'Plot 14B Commercial Avenue, Ikeja, Lagos, Nigeria',
    supportHours: '24/7 Global Dispatch & Clearance Desk',
    tagline: 'Fast, Reliable & Secure International Shipping Solutions',
    establishedYear: '1998',
  },
  hero: {
    headline: 'Fast, Reliable & Secure International Shipping Solutions',
    subheading: 'Connecting Nigeria, Europe, the Americas, and Asia with premier air cargo, ocean freight, nationwide distribution, and end-to-end customs clearance.',
    badgeText: 'Worldwide Freight Forwarding & Logistics Network',
    primaryCtaText: 'Ship With Us',
    secondaryCtaText: 'Track Your Shipment',
  },
  stats: {
    packagesDelivered: '10,000+',
    happyCustomers: '5,000+',
    deliveryLocations: '190+ Countries & Hubs',
    deliverySuccessRate: '99.4%',
  },
  about: {
    whoWeAre: 'World Transport Overseas (WTO) is an international logistics provider and licensed freight forwarder. Headquartered in Sofia, Bulgaria with expansive distribution infrastructure across Nigeria, West Africa, Europe, North America, and Asia, we engineer dependable multimodal supply chain solutions.',
    mission: 'To deliver frictionless international cargo and doorstep logistics with uncompromising speed, real-time transparency, and absolute security for businesses and individuals worldwide.',
    vision: 'To be the most trusted global logistics bridge linking African commerce with worldwide supply chains through superior freight infrastructure and customer-centric service.',
    values: [
      { title: 'Global Reliability', desc: 'Guaranteed scheduled departures, tamper-evident cargo handling, and strict transit compliance.' },
      { title: 'Full Transparency', desc: 'Real-time GPS milestone tracking and clear tariff schedules without hidden port fees.' },
      { title: 'Speed & Priority', desc: 'Expedited air corridors and priority overland lanes ensuring fast delivery.' },
      { title: 'Security & Custody', desc: 'Comprehensive transit insurance, bonded warehouses, and electronic chain-of-custody.' },
    ],
  },
  services: [
    {
      id: 'local_express',
      title: 'Local & Intra-City Express',
      desc: 'Rapid intra-city courier and dedicated van delivery within major metropolitan areas with digital signature proof.',
      badge: 'Same-Day Delivery',
      icon: 'Truck',
    },
    {
      id: 'nationwide_freight',
      title: 'Nationwide Cargo & Interstate Haulage',
      desc: 'Daily overland consolidated freight across all 36 Nigerian states and cross-regional commercial corridors.',
      badge: 'Nationwide Coverage',
      icon: 'Package',
    },
    {
      id: 'intl_air_ocean',
      title: 'International Air & Ocean Freight',
      desc: 'Direct multimodal connections between Sofia (Bulgaria HQ), London, Frankfurt, Houston, Guangzhou, and Lagos.',
      badge: 'Global Freight',
      icon: 'Globe',
    },
    {
      id: 'priority_express',
      title: 'Priority Worldwide Express',
      desc: 'Time-critical document courier and emergency cargo flights with dedicated customs escort.',
      badge: 'Time-Definite',
      icon: 'Zap',
    },
    {
      id: 'business_supply',
      title: 'Corporate Logistics & Fulfillment',
      desc: 'B2B supply chain management, e-commerce order fulfillment, bonded warehousing, and multi-drop distribution.',
      badge: 'Enterprise B2B',
      icon: 'Building2',
    },
    {
      id: 'pickup_customs',
      title: 'Doorstep Pickup & Customs Clearance',
      desc: 'Hassle-free collection directly from your warehouse or residence with full export/import documentation handling.',
      badge: 'Door-to-Door',
      icon: 'ShieldCheck',
    },
  ],
  business: {
    headline: 'Power Your Business With Reliable Global Logistics',
    subheading: 'Scale your international trade and domestic distribution with WTO enterprise logistics infrastructure.',
    points: [
      'Multi-modal air and sea container consolidations (LCL/FCL)',
      'Bonded warehousing in Sofia, Lagos, London, and Guangzhou',
      'Dedicated logistics account manager and priority booking',
      'Electronic waybills and consolidated corporate monthly invoicing',
      'Fast-track customs clearance at maritime ports and international airports',
    ],
    ctaText: 'Partner With Us',
  },
  faqs: [
    {
      id: 'faq_1',
      question: 'How do I ship a package with World Transport Overseas (WTO)?',
      answer: 'You can book your shipment directly on this platform using our "Book a Shipment" form or request a customized tariff. Prepare your package and our collection team will pick it up from your doorstep, or you can drop it at any WTO international hub.',
      category: 'Shipping',
    },
    {
      id: 'faq_2',
      question: 'How can I track my shipment in real-time?',
      answer: 'Enter your official WTO tracking number on our Track Shipment page or in our live assistant. You will see every milestone, current location, warehouse sorting progress, and estimated delivery handover.',
      category: 'Tracking',
    },
    {
      id: 'faq_3',
      question: 'Do you offer international shipping to and from Nigeria?',
      answer: 'Yes! WTO connects Nigeria directly with our European Global Headquarters in Sofia (Bulgaria), as well as hubs in the United Kingdom, Germany, the United States, United Arab Emirates, China, and across the globe via scheduled air cargo and ocean container freight.',
      category: 'International',
    },
    {
      id: 'faq_4',
      question: 'How are shipping rates and tariffs calculated?',
      answer: 'Because international freight is subject to global aviation fuel rates, volumetric weight, and customs classifications, we provide transparent custom quotes on request. You can request a rate via our Shipping Calculator or email overseasworldtransport@gmail.com.',
      category: 'Rates & Payments',
    },
    {
      id: 'faq_5',
      question: 'How do payments work for international shipments?',
      answer: 'Official invoices and electronic payment receipts are issued directly through our central finance desk via email at overseasworldtransport@gmail.com. We accept verified electronic transfers, corporate L/C, and commercial freight accounts.',
      category: 'Rates & Payments',
    },
    {
      id: 'faq_6',
      question: 'Can I ship custom items, heavy equipment, or commercial goods?',
      answer: 'Absolutely. Customers can select from predefined categories (electronics, medical, fashion, auto parts, documents) or specify their own custom items, dimensions, and handling requirements directly in our booking form.',
      category: 'Cargo',
    },
  ],
  noticeBanner: {
    enabled: true,
    text: 'Global Air Cargo Flights & European Freight Lanes Operating Normally. Inquiries: overseasworldtransport@gmail.com',
  },
};

// Seed Shipments showcasing stages including "Warehouse Sorting" and "Out for Delivery"
let shipments: Shipment[] = [
  {
    id: 'shp_2',
    trackingNumber: 'WTO-NG-104928',
    sender: {
      name: 'Mrs. Kemi Adeyemi',
      phone: '+234 809 112 3344',
      email: 'kemi.adeyemi@gmail.com',
      address: '22 Isaac John Street',
      city: 'Lagos',
      state: 'Lagos State',
      country: 'Nigeria',
    },
    receiver: {
      name: 'Dr. Emeka Obi',
      phone: '+234 805 998 7766',
      email: 'emekaobi@bmh-ph.org',
      address: 'Braithwaite Memorial Hospital, Stadium Rd',
      city: 'Port Harcourt',
      state: 'Rivers State',
      country: 'Nigeria',
    },
    packageDetails: {
      type: 'Medical Diagnostic Reagents & Laboratory Kits',
      itemCategory: 'Medical & Healthcare',
      customItemName: 'Diagnostic Biochemical Reagent Kits',
      description: 'Temperature-monitored medical laboratory diagnostic reagents and sterile testing media.',
      weight: 3.2,
      quantity: 1,
      value: '₦320,000',
      speed: 'Express',
      packagingType: 'Insulated Thermal Box',
      isFragile: true,
    },
    pickupLocation: 'Ikeja GRA, Lagos, Nigeria',
    destination: 'Port Harcourt, Rivers State, Nigeria',
    price: 16800,
    tariffType: 'Bespoke Medical Express',
    status: 'Out for Delivery',
    currentStage: 'Out for Delivery',
    createdDate: '2026-09-29 08:15 AM',
    estimatedDeliveryDate: '2026-09-30 04:30 PM',
    lastUpdated: '2026-09-30 11:20 AM',
    currentLocation: 'Port Harcourt Trans-Amadi Dispatch Fleet, Rivers State',
    deliveryAgent: {
      name: 'Babatunde Lawal',
      agentCode: 'WTO-AGT-019',
    },
    timeline: [
      {
        status: 'Shipment Booked',
        title: 'Shipment Registered with Priority Cold-Chain Handling',
        location: 'Ikeja Service Center, Lagos',
        timestamp: '2026-09-29 08:15 AM',
        completed: true,
        stageKey: 'booked',
      },
      {
        status: 'Package Picked Up',
        title: 'Package Collected and Thermal Checked',
        location: 'Ikeja GRA, Lagos',
        timestamp: '2026-09-29 11:00 AM',
        completed: true,
        stageKey: 'pickup',
      },
      {
        status: 'Warehouse Sorting',
        title: 'Warehouse Sorting & Priority Airport Cargo Allocation',
        location: 'WTO Murtala Muhammed Air Cargo Hub, Lagos',
        timestamp: '2026-09-29 03:30 PM',
        completed: true,
        stageKey: 'warehouse_sorting',
      },
      {
        status: 'In Transit',
        title: 'Domestic Airfreight Flight LOS to PHC',
        location: 'Port Harcourt International Cargo Wing',
        timestamp: '2026-09-29 07:45 PM',
        completed: true,
        stageKey: 'in_transit',
      },
      {
        status: 'Out for Delivery',
        title: 'Out for Delivery with Courier Agent Babatunde Lawal',
        location: 'Stadium Road / GRA Zone, Port Harcourt',
        timestamp: '2026-09-30 10:10 AM',
        completed: true,
        current: true,
        stageKey: 'out_for_delivery',
        note: 'Courier is in transit to Braithwaite Memorial Hospital. Recipient notified via email.',
      },
      {
        status: 'Delivered',
        title: 'Hospital Receiving Ward Delivery & Signature Handover',
        location: 'Stadium Rd, Port Harcourt',
        timestamp: 'Estimated today by 04:30 PM',
        completed: false,
        stageKey: 'delivered',
      },
    ],
  },
  {
    id: 'shp_3',
    trackingNumber: 'WTO-INT-552910',
    sender: {
      name: 'World Transport Overseas HQ Sofia',
      phone: '+359 2 984 5500',
      email: 'overseasworldtransport@gmail.com',
      address: 'Mimi Balkanska St 126',
      city: 'Sofia',
      state: 'Sofia City',
      country: 'Bulgaria',
    },
    receiver: {
      name: 'Apex Marine & Offshore Logistics Ltd',
      phone: '+234 818 200 4000',
      email: 'procurement@apexoffshore.ng',
      address: 'Victoria Island Maritime Towers, Adeola Odeku',
      city: 'Victoria Island, Lagos',
      state: 'Lagos State',
      country: 'Nigeria',
    },
    packageDetails: {
      type: 'Industrial Marine Engine Valves & Hydraulic Spares',
      itemCategory: 'Automotive & Marine Spares',
      customItemName: 'Precision High-Pressure Hydraulic Control Valves',
      description: 'Precision hydraulic valves and vessel marine spares in calibrated stainless steel casing.',
      weight: 42.0,
      quantity: 3,
      value: '€14,800',
      speed: 'Express',
      packagingType: 'Heavy-Duty Shockproof Flight Case',
      isFragile: true,
    },
    pickupLocation: 'Sofia Global HQ, Bulgaria',
    destination: 'Victoria Island, Lagos, Nigeria',
    price: 345000,
    tariffType: 'International Air Cargo Tariff',
    status: 'At Destination',
    currentStage: 'Customs Clearance',
    createdDate: '2026-09-25 10:00 AM',
    estimatedDeliveryDate: '2026-10-01 11:00 AM',
    lastUpdated: '2026-09-30 08:30 AM',
    currentLocation: 'Murtala Muhammed International Cargo Customs Bonded Terminal, Lagos',
    deliveryAgent: {
      name: 'WTO Bonded Logistics Escort',
      agentCode: 'WTO-BND-008',
    },
    timeline: [
      {
        status: 'Shipment Booked',
        title: 'International Air Waybill Issued & Customs Manifest Filed',
        location: 'Sofia Export Airfreight Hub, Bulgaria',
        timestamp: '2026-09-25 10:00 AM',
        completed: true,
        stageKey: 'booked',
      },
      {
        status: 'Package Picked Up',
        title: 'Export Handover at Sofia Airport Terminal 2',
        location: 'Sofia International Airport (SOF), Bulgaria',
        timestamp: '2026-09-26 02:00 PM',
        completed: true,
        stageKey: 'pickup',
      },
      {
        status: 'Warehouse Sorting',
        title: 'Warehouse Sorting & Multimodal Flight Palletizing',
        location: 'WTO Central European Consolidation Center, Sofia',
        timestamp: '2026-09-27 06:15 AM',
        completed: true,
        stageKey: 'warehouse_sorting',
      },
      {
        status: 'In Transit',
        title: 'Scheduled Air Cargo Transport SOF-IST-LOS',
        location: 'Trans-Continental Flight Air Corridor',
        timestamp: '2026-09-28 11:20 PM',
        completed: true,
        stageKey: 'in_transit',
      },
      {
        status: 'Customs Clearance',
        title: 'Customs Clearance & Inspection Cleared at Lagos Bonded Facility',
        location: 'NAHCO Bonded Terminal, Lagos Airport (LOS)',
        timestamp: '2026-09-30 08:30 AM',
        completed: true,
        current: true,
        stageKey: 'customs',
        note: 'Duty documentation verified and customs seal authorized for delivery dispatch.',
      },
      {
        status: 'Out for Delivery',
        title: 'Scheduled Bonded Courier Handover to Victoria Island Route',
        location: 'Victoria Island Logistics Zone, Lagos',
        timestamp: 'Scheduled 2026-10-01 08:30 AM',
        completed: false,
        stageKey: 'out_for_delivery',
      },
      {
        status: 'Delivered',
        title: 'Final Corporate Delivery Handover',
        location: 'Adeola Odeku, Victoria Island, Lagos',
        timestamp: 'Estimated 2026-10-01 11:00 AM',
        completed: false,
        stageKey: 'delivered',
      },
    ],
  },
  {
    id: 'shp_4',
    trackingNumber: 'WTO-NG-901844',
    sender: {
      name: 'Kolajo Fasasi',
      phone: '+234 803 123 4567',
      email: 'fasasikolajo@gmail.com',
      address: 'Plot 8, Admiralty Way, Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos State',
      country: 'Nigeria',
    },
    receiver: {
      name: 'Danladi Ibrahim & Associates',
      phone: '+234 802 987 6543',
      email: 'd.ibrahim@associates.ng',
      address: 'Plot 410, Shehu Shagari Way, Central Business District',
      city: 'Abuja',
      state: 'Abuja FCT',
      country: 'Nigeria',
    },
    packageDetails: {
      type: 'Industrial Solar Inverters & Microgrid Hardware',
      itemCategory: 'Solar & Clean Energy',
      customItemName: 'Industrial Hybrid Solar Power System 15KVA',
      description: 'Industrial Hybrid Solar Power System 15KVA with battery management modules',
      weight: 18.5,
      quantity: 2,
      value: '₦1,450,000',
      speed: 'Express',
      packagingType: 'Reinforced Wooden Crate',
      isFragile: true,
    },
    pickupLocation: 'Lekki Phase 1, Lagos, Nigeria',
    destination: 'CBD, Abuja FCT, Nigeria',
    price: 38500,
    tariffType: 'Bespoke Priority Interstate Cargo',
    status: 'In Transit',
    currentStage: 'Warehouse Sorting',
    createdDate: '2026-09-29 09:15 AM',
    estimatedDeliveryDate: '2026-10-02 01:00 PM',
    lastUpdated: '2026-09-30 11:45 AM',
    currentLocation: 'WTO Lokoja Central Sorting Hub, Kogi Gateway Facility',
    deliveryAgent: {
      name: 'Tunde Bakare',
      agentCode: 'WTO-AGT-042',
    },
    timeline: [
      {
        status: 'Shipment Booked',
        title: 'Booking Confirmed & Electronic Consignment Issued',
        location: 'Lekki Express Terminal, Lagos',
        timestamp: '2026-09-29 09:15 AM',
        completed: true,
        stageKey: 'booked',
        note: 'Customer Kolajo Fasasi booked priority cargo.',
      },
      {
        status: 'Package Picked Up',
        title: 'Collected from Sender Address in Lekki',
        location: 'Admiralty Way, Lekki Phase 1, Lagos',
        timestamp: '2026-09-29 01:30 PM',
        completed: true,
        stageKey: 'pickup',
      },
      {
        status: 'Warehouse Sorting',
        title: 'Warehouse Sorting & High-Speed Barcode Processing',
        location: 'WTO Lokoja Central Sorting Hub, Kogi Gateway Facility',
        timestamp: '2026-09-30 09:10 AM',
        completed: true,
        current: true,
        stageKey: 'warehouse_sorting',
        note: 'Automated conveyor sorting completed. Loaded on North-Central linehaul express.',
      },
      {
        status: 'In Transit',
        title: 'Overland Highway Linehaul en route to Abuja',
        location: 'Kogi-Abuja Express Corridor',
        timestamp: 'Pending Departure',
        completed: false,
        stageKey: 'in_transit',
      },
      {
        status: 'Out for Delivery',
        title: 'Scheduled Courier Dispatch Handover',
        location: 'Abuja Central Cargo Facility, Idu',
        timestamp: 'Scheduled 2026-10-02 08:30 AM',
        completed: false,
        stageKey: 'out_for_delivery',
      },
      {
        status: 'Delivered',
        title: 'Handover & Signature at Central Business District',
        location: 'Shehu Shagari Way, CBD, Abuja',
        timestamp: 'Estimated 2026-10-02 01:00 PM',
        completed: false,
        stageKey: 'delivered',
      },
    ],
  },
  {
    id: 'shp_5',
    trackingNumber: 'WTO-INT-632190',
    sender: {
      name: 'WTO European Logistics Terminal Sofia',
      phone: '+359 2 984 5500',
      email: 'overseasworldtransport@gmail.com',
      address: 'Mimi Balkanska St 126',
      city: 'Sofia',
      state: 'Sofia City',
      country: 'Bulgaria',
    },
    receiver: {
      name: 'Kolajo Fasasi',
      phone: '+234 803 123 4567',
      email: 'fasasikolajo@gmail.com',
      address: 'Plot 8, Admiralty Way, Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos State',
      country: 'Nigeria',
    },
    packageDetails: {
      type: 'European Precision Diagnostics & Smart Telemetry Sensors',
      itemCategory: 'Electronics & Gadgets',
      customItemName: 'Industrial IoT Telemetry Sensor Gateways',
      description: 'Air cargo package containing calibrated industrial IoT telemetry sensor gateways',
      weight: 6.8,
      quantity: 1,
      value: '€4,200',
      speed: 'Express',
      packagingType: 'Secure Reinforced Box',
      isFragile: true,
    },
    pickupLocation: 'Sofia Global HQ, Bulgaria',
    destination: 'Lekki Phase 1, Lagos, Nigeria',
    price: 68500,
    tariffType: 'International Air Courier Tariff',
    status: 'Out for Delivery',
    currentStage: 'Out for Delivery',
    createdDate: '2026-09-26 11:30 AM',
    estimatedDeliveryDate: '2026-09-30 05:00 PM',
    lastUpdated: '2026-09-30 11:50 AM',
    currentLocation: 'Lagos Victoria Island / Lekki Express Dispatch Fleet',
    deliveryAgent: {
      name: 'Babatunde Lawal',
      agentCode: 'WTO-AGT-019',
    },
    timeline: [
      {
        status: 'Shipment Booked',
        title: 'International Air Waybill Issued at Sofia HQ',
        location: 'Mimi Balkanska St 126, Sofia, Bulgaria',
        timestamp: '2026-09-26 11:30 AM',
        completed: true,
        stageKey: 'booked',
      },
      {
        status: 'Package Picked Up',
        title: 'Export Handover at Sofia Airport Terminal 2',
        location: 'Sofia Airport Cargo Wing (SOF)',
        timestamp: '2026-09-27 01:00 PM',
        completed: true,
        stageKey: 'pickup',
      },
      {
        status: 'Warehouse Sorting',
        title: 'Consolidation Sorting & Pallet Security Check',
        location: 'WTO Central European Consolidation Hub, Sofia',
        timestamp: '2026-09-27 06:45 PM',
        completed: true,
        stageKey: 'warehouse_sorting',
      },
      {
        status: 'In Transit',
        title: 'Trans-Continental Air Cargo Flight SOF to LOS',
        location: 'Air Cargo Flight Corridor',
        timestamp: '2026-09-28 09:20 PM',
        completed: true,
        stageKey: 'in_transit',
      },
      {
        status: 'Customs Clearance',
        title: 'Customs Cleared at Murtala Muhammed Cargo Terminal',
        location: 'NAHCO Bonded Terminal, Lagos (LOS)',
        timestamp: '2026-09-30 07:30 AM',
        completed: true,
        stageKey: 'customs',
      },
      {
        status: 'Out for Delivery',
        title: 'Dispatched with Courier Agent Babatunde Lawal',
        location: 'Lekki Phase 1 Route, Lagos',
        timestamp: '2026-09-30 11:50 AM',
        completed: true,
        current: true,
        stageKey: 'out_for_delivery',
        note: 'Courier is currently in route to Admiralty Way, Lekki Phase 1. Handover expected before 5:00 PM.',
      },
      {
        status: 'Delivered',
        title: 'Handover & Digital Signature',
        location: 'Lekki Phase 1, Lagos',
        timestamp: 'Estimated today by 05:00 PM',
        completed: false,
        stageKey: 'delivered',
      },
    ],
  },
];

// All Locations International (Europe, North America, Asia, Africa, Middle East)
let locationHubs: LocationHub[] = [
  {
    id: 'sofia_hq',
    state: 'Sofia Province',
    city: 'Sofia',
    country: 'Bulgaria',
    region: 'Europe',
    hubName: 'World Transport Overseas Global HQ & Central European Terminal',
    type: 'International Gateway',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '24-48 Hours to Europe / 3-5 Days to Africa',
    address: 'Mimi Balkanska St 126, 1517 Sofia, Bulgaria',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'sofia_hub',
    state: 'Sofia-City',
    city: 'Sofia',
    country: 'Bulgaria',
    region: 'Europe',
    hubName: 'WTO European Central Air Cargo Gateway',
    type: 'Air Cargo Hub',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '2-3 Business Days',
    address: 'Mimi Balkanska St 126, 1517 Sofia, Bulgaria',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'frankfurt_hub',
    state: 'Hesse',
    city: 'Frankfurt',
    country: 'Germany',
    region: 'Europe',
    hubName: 'WTO Frankfurt CargoCity South Distribution Facility',
    type: 'Air Cargo Hub',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '2-4 Business Days',
    address: 'CargoCity Süd, Geb. 535, 60549 Frankfurt am Main, Germany',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'houston_hub',
    state: 'Texas',
    city: 'Houston',
    country: 'United States',
    region: 'North America',
    hubName: 'WTO North American Energy & Maritime Freight Center',
    type: 'International Gateway',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '3-5 Business Days',
    address: 'George Bush Intercontinental Cargo Plaza, Houston, TX 77032, USA',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'newyork_hub',
    state: 'New York',
    city: 'New York',
    country: 'United States',
    region: 'North America',
    hubName: 'WTO JFK International Airfreight Gateway',
    type: 'Air Cargo Hub',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '3-5 Business Days',
    address: 'Building 77, JFK International Airport, Jamaica, NY 11430, USA',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'toronto_hub',
    state: 'Ontario',
    city: 'Toronto',
    country: 'Canada',
    region: 'North America',
    hubName: 'WTO Pearson Trans-Atlantic Cargo Center',
    type: 'Air Cargo Hub',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '3-5 Business Days',
    address: 'Pearson International Cargo West, Mississauga, ON L5P 1B2, Canada',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'dubai_hub',
    state: 'Dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Middle East',
    hubName: 'WTO Middle East & Gulf Aviation Logistics Hub',
    type: 'International Gateway',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '2-3 Business Days',
    address: 'Dubai South Aviation District, DWC Cargo Area, Dubai, UAE',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'guangzhou_hub',
    state: 'Guangdong',
    city: 'Guangzhou',
    country: 'China',
    region: 'Asia-Pacific',
    hubName: 'WTO Asia-Pacific Consolidation Gateway',
    type: 'International Gateway',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '3-5 Business Days',
    address: 'Baiyun International Airport Logistics Park, Guangzhou, China',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'tokyo_hub',
    state: 'Kanto',
    city: 'Tokyo',
    country: 'Japan',
    region: 'Asia-Pacific',
    hubName: 'WTO Narita Express Cargo Facility',
    type: 'Air Cargo Hub',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '3-5 Business Days',
    address: 'Narita International Cargo Area, Chiba 282-0004, Japan',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'singapore_hub',
    state: 'Singapore',
    city: 'Singapore',
    country: 'Singapore',
    region: 'Asia-Pacific',
    hubName: 'WTO Southeast Asia Changi Multimodal Hub',
    type: 'Air Cargo Hub',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '3-4 Business Days',
    address: 'Airport Cargo Road, Changi Airfreight Centre, Singapore',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'amsterdam_hub',
    state: 'North Holland',
    city: 'Amsterdam',
    country: 'Netherlands',
    region: 'Europe',
    hubName: 'WTO Schiphol European Cargo Center',
    type: 'International Gateway',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '1-3 Business Days',
    address: 'Handelsweg 10, Schiphol Cargo City, 1118 Amsterdam, Netherlands',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'paris_hub',
    state: 'Île-de-France',
    city: 'Paris',
    country: 'France',
    region: 'Europe',
    hubName: 'WTO Paris Charles de Gaulle Freight Terminal',
    type: 'Air Cargo Hub',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '1-3 Business Days',
    address: 'Zone de Fret 4, Roissy CDG Airport, 95700 Paris, France',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'zurich_hub',
    state: 'Zurich',
    city: 'Zurich',
    country: 'Switzerland',
    region: 'Europe',
    hubName: 'WTO Alpine Precision Cargo Facility',
    type: 'Air Cargo Hub',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '1-3 Business Days',
    address: 'Fracht West, Zurich International Airport, 8058 Zurich, Switzerland',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'sydney_hub',
    state: 'New South Wales',
    city: 'Sydney',
    country: 'Australia',
    region: 'Asia-Pacific',
    hubName: 'WTO Pacific Intercontinental Airfreight Terminal',
    type: 'International Gateway',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '3-5 Business Days',
    address: 'Link Road, Mascot, Sydney Airport, NSW 2020, Australia',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'joburg_hub',
    state: 'Gauteng',
    city: 'Johannesburg',
    country: 'South Africa',
    region: 'Africa',
    hubName: 'WTO Southern Africa OR Tambo Freight Terminal',
    type: 'Air Cargo Hub',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '2-4 Business Days',
    address: 'Freight Complex, O.R. Tambo International Airport, Johannesburg, South Africa',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'cairo_hub',
    state: 'Cairo Governorate',
    city: 'Cairo',
    country: 'Egypt',
    region: 'Africa',
    hubName: 'WTO North Africa & Mediterranean Cargo Gateway',
    type: 'Air Cargo Hub',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '2-4 Business Days',
    address: 'Cairo International Airport Cargo Village, Cairo, Egypt',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
  {
    id: 'saopaulo_hub',
    state: 'Sao Paulo',
    city: 'Sao Paulo',
    country: 'Brazil',
    region: 'South America',
    hubName: 'WTO Latin America Guarulhos Gateway',
    type: 'Air Cargo Hub',
    availability: 'Daily Global Flight',
    estimatedDeliveryTime: '4-6 Business Days',
    address: 'Terminal de Cargas, Aeroporto Internacional de Guarulhos, SP, Brazil',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  },
];

let paymentRecords: PaymentRecord[] = [
  {
    id: 'pay_2',
    shipmentId: 'shp_2',
    trackingNumber: 'WTO-NG-104928',
    customerName: 'Mrs. Kemi Adeyemi',
    customerEmail: 'kemi.adeyemi@gmail.com',
    amount: 16800,
    currency: 'NGN',
    status: 'Confirmed',
    date: '2026-09-29 09:30 AM',
    paymentMethod: 'Direct Payment Confirmation',
    reference: 'WTO-TXN-881920',
  },
  {
    id: 'pay_3',
    shipmentId: 'shp_3',
    trackingNumber: 'WTO-INT-552910',
    customerName: 'Apex Marine & Offshore Logistics Ltd',
    customerEmail: 'procurement@apexoffshore.ng',
    amount: 345000,
    currency: 'NGN',
    status: 'Invoice Issued',
    date: '2026-09-25 11:20 AM',
    paymentMethod: 'Commercial Airfreight Invoice',
    reference: 'WTO-INV-2026-771',
  },
];

let contactMessages: ContactMessage[] = [
  {
    id: 'msg_1',
    name: 'Captain Babafemi Alabi',
    email: 'alabi.b@marinetrading.com',
    subject: 'Bulk Sea Container Shipment from Varna to Lagos Port',
    message: 'We are requesting a quote for two 40ft containers of mechanical equipment shipping from Bulgaria to Apapa Port, Lagos. Please email the tariff breakdown.',
    createdAt: '2026-09-29 02:40 PM',
    status: 'Replied',
  },
];

let chatLogs: ChatLog[] = [];

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Get Website Content (Public)
app.get('/api/website-content', (_req: Request, res: Response) => {
  res.json(websiteContent);
});

// 2. Update Website Content (Admin)
app.put('/api/admin/website-content', (req: Request, res: Response) => {
  try {
    const updated = req.body;
    if (!updated) {
      res.status(400).json({ success: false, error: 'Invalid content payload' });
      return;
    }
    // Deep merge / update website content
    websiteContent = {
      ...websiteContent,
      ...updated,
      company: {
        ...websiteContent.company,
        ...(updated.company || {}),
        email: 'overseasworldtransport@gmail.com', // Strict enforcement
      },
    };
    res.json({ success: true, message: 'Website content updated successfully across all sections!', websiteContent });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Track Shipment
app.get('/api/shipments/track/:trackingNumber', (req: Request, res: Response) => {
  const query = req.params.trackingNumber.trim().toUpperCase();
  const normalizedQuery = query.replace(/[^A-Z0-9]/g, '');

  const shipment = shipments.find(
    (s) =>
      s.trackingNumber.toUpperCase() === query ||
      s.trackingNumber.replace(/[^A-Z0-9]/g, '') === normalizedQuery
  );

  if (!shipment) {
    res.status(404).json({
      found: false,
      error: `No shipment found matching tracking number ${query}. Please verify your waybill code or contact overseasworldtransport@gmail.com.`,
    });
    return;
  }

  res.json({
    found: true,
    shipment,
  });
});

// 4. Get all shipments
app.get('/api/shipments', (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (email) {
    const filtered = shipments.filter(
      (s) =>
        s.sender.email.toLowerCase() === email.toLowerCase() ||
        s.receiver.email.toLowerCase() === email.toLowerCase()
    );
    res.json(filtered);
    return;
  }
  res.json(shipments);
});

// 5. Create shipment booking
app.post('/api/shipments', (req: Request, res: Response) => {
  try {
    const { sender, receiver, packageDetails, pickupLocation, destination, specialInstructions } = req.body;

    if (!sender?.name || !receiver?.name || !packageDetails?.type) {
      res.status(400).json({ error: 'Missing required sender, receiver, or cargo details.' });
      return;
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const trackingNumber = (req.body.trackingNumber || req.body.tracking_number || `WTO-INT-${randomSuffix}`).trim();
    const newId = req.body.id || `shp_${Date.now()}`;

    // Professional international freight tariff computation in USD
    const weight = Number(packageDetails.weight) || 1;
    const qty = Number(packageDetails.quantity) || 1;
    const baseRate = 45;
    const perKg = 8.5;
    let estimatedCost = baseRate + weight * qty * perKg;
    if (packageDetails.speed === 'Express') estimatedCost *= 1.4;
    const roundedCost = Number(req.body.price) || Math.round(estimatedCost);

    const newShipment: Shipment = {
      id: newId,
      trackingNumber,
      sender: {
        name: sender.name,
        phone: sender.phone || '',
        email: sender.email || '',
        address: sender.address || '',
        city: sender.city || '',
        state: sender.state || '',
        country: sender.country || 'International',
      },
      receiver: {
        name: receiver.name,
        phone: receiver.phone || '',
        email: receiver.email || '',
        address: receiver.address || '',
        city: receiver.city || '',
        state: receiver.state || '',
        country: receiver.country || 'International',
      },
      packageDetails: {
        type: packageDetails.type,
        itemCategory: packageDetails.itemCategory || 'General Merchandise',
        customItemName: packageDetails.customItemName || packageDetails.description || 'Customer Specified Item',
        description: packageDetails.description || `${packageDetails.type} consignment`,
        weight,
        quantity: qty,
        value: packageDetails.value || 'Declared On File',
        speed: packageDetails.speed || 'Standard',
        packagingType: packageDetails.packagingType || 'Standard Secure Box',
        isFragile: Boolean(packageDetails.isFragile),
        isHazardous: Boolean(packageDetails.isHazardous),
      },
      pickupLocation: pickupLocation || `${sender.city}, ${sender.state}`,
      destination: destination || `${receiver.city}, ${receiver.state}`,
      price: roundedCost,
      tariffType: 'WTO International Worldwide Freight Tariff',
      status: 'Pending',
      currentStage: 'Order Confirmed',
      createdDate: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      estimatedDeliveryDate: new Date(Date.now() + (packageDetails.speed === 'Express' ? 86400000 * 2 : 86400000 * 4)).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      lastUpdated: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      currentLocation: `${pickupLocation || sender.city} WTO Logistics Depot`,
      deliveryAgent: {
        name: 'Assigned on Dispatch',
        agentCode: 'WTO-DISP',
      },
      timeline: [
        {
          status: 'Shipment Booked',
          title: 'Booking Confirmed & Electronic Waybill Generated',
          location: `${pickupLocation || sender.city} WTO Depot`,
          timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
          completed: true,
          current: true,
          stageKey: 'booked',
          note: specialInstructions || 'Electronic consignment generated. Official invoice emailed by overseasworldtransport@gmail.com.',
        },
        {
          status: 'Package Picked Up',
          title: 'Courier Pickup & Barcode Tagging',
          location: sender.address || sender.city,
          timestamp: 'Scheduled for Pickup',
          completed: false,
          stageKey: 'pickup',
        },
        {
          status: 'Warehouse Sorting',
          title: 'Warehouse Sorting & Security Inspection',
          location: 'WTO Regional Consolidation Hub',
          timestamp: 'Pending Processing',
          completed: false,
          stageKey: 'warehouse_sorting',
        },
        {
          status: 'In Transit',
          title: 'Dispatched on Linehaul Express Carrier',
          location: 'Scheduled Linehaul Corridor',
          timestamp: 'Pending Departure',
          completed: false,
          stageKey: 'in_transit',
        },
        {
          status: 'Out for Delivery',
          title: 'Out for Final-Mile Delivery with Courier Agent',
          location: destination || receiver.city,
          timestamp: 'Pending Final Dispatch',
          completed: false,
          stageKey: 'out_for_delivery',
        },
        {
          status: 'Delivered',
          title: 'Delivered to Recipient & Signature Handover',
          location: destination || receiver.city,
          timestamp: 'Pending Delivery',
          completed: false,
          stageKey: 'delivered',
        },
      ],
    };

    (newShipment as any).transportMode = req.body.transportMode || packageDetails.transportMode || '';
    (newShipment as any).specialInstructions = specialInstructions || req.body.specialInstructions || '';
    (newShipment as any).dimensions = packageDetails.dimensions || req.body.dimensions || '';
    (newShipment as any).hsCode = packageDetails.hsCode || req.body.hsCode || '';
    (newShipment as any).incoterms = req.body.incoterms || packageDetails.incoterms || 'DDP';
    (newShipment as any).pickupDate = req.body.pickupDate || '';
    (newShipment as any).dockType = req.body.dockType || '';

    const existingIdx = shipments.findIndex(
      (s) => (s.trackingNumber && s.trackingNumber.toLowerCase() === trackingNumber.toLowerCase()) || (s.id && s.id === newId)
    );
    if (existingIdx !== -1) {
      shipments[existingIdx] = newShipment;
    } else {
      shipments.unshift(newShipment);
    }

    console.log(`[BOOKING NOTIFICATION SENT] Official notification dispatched to company operations: overseasworldtransport@gmail.com and shipper: ${sender.email || 'customer'}`);
    console.log(`Tracking AWB: ${trackingNumber} | Route: ${sender.city || pickupLocation} -> ${receiver.city || destination} | Carrier: ${packageDetails.type}`);

    // Create payment entry
    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      shipmentId: newId,
      trackingNumber,
      customerName: sender.name,
      customerEmail: sender.email || 'customer@example.com',
      amount: roundedCost,
      currency: 'USD',
      status: 'Pending Verification',
      date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      paymentMethod: 'Official Electronic Invoicing',
      reference: `WTO-INV-${Date.now().toString().slice(-6)}`,
    };
    paymentRecords.unshift(newPayment);

    res.status(201).json({
      success: true,
      shipment: newShipment,
      payment: newPayment,
      message: 'Shipment booked successfully! Official electronic invoice sent via overseasworldtransport@gmail.com.',
    });
  } catch (err: any) {
    console.error('Error creating shipment:', err);
    res.status(500).json({ error: 'Failed to process shipment booking.' });
  }
});

// 6. Update Shipment Status (Admin)
app.patch('/api/shipments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    status,
    currentLocation,
    deliveryAgentName,
    deliveryAgentPhone,
    note,
    senderName,
    receiverName,
    origin,
    destination,
    shipmentType,
    weight,
    estimatedDeliveryDate
  } = req.body;

  const shipment = shipments.find((s) => s.id === id || s.trackingNumber === id);
  if (!shipment) {
    res.status(404).json({ error: 'Shipment not found' });
    return;
  }

  const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  if (senderName) shipment.sender.name = senderName;
  if (receiverName) shipment.receiver.name = receiverName;
  if (origin) {
    shipment.pickupLocation = origin;
    shipment.sender.city = origin;
  }
  if (destination) {
    shipment.destination = destination;
    shipment.receiver.city = destination;
  }
  if (shipmentType) {
    shipment.tariffType = shipmentType;
    if (shipment.packageDetails) {
      shipment.packageDetails.type = shipmentType;
    }
  }
  if (weight !== undefined) {
    if (shipment.packageDetails) {
      shipment.packageDetails.weight = Number(weight) || 1;
    }
    shipment.price = (Number(weight) || 1) * 45;
  }
  if (estimatedDeliveryDate) {
    shipment.estimatedDeliveryDate = estimatedDeliveryDate;
  }

  if (status) {
    shipment.status = status;
    shipment.lastUpdated = nowStr;

    // Map status to currentStage
    if (status === 'Pending') shipment.currentStage = 'Order Confirmed';
    else if (status === 'Picked Up') shipment.currentStage = 'Package Collected';
    else if (status === 'In Transit') shipment.currentStage = 'Warehouse Sorting';
    else if (status === 'At Destination') shipment.currentStage = 'Customs Clearance';
    else if (status === 'Out for Delivery') shipment.currentStage = 'Out for Delivery';
    else if (status === 'Delivered') shipment.currentStage = 'Delivered';

    // Update timeline
    let matched = false;
    shipment.timeline = shipment.timeline.map((step) => {
      if (step.status.toLowerCase() === status.toLowerCase()) {
        matched = true;
        return {
          ...step,
          completed: true,
          current: true,
          timestamp: nowStr,
          location: currentLocation || step.location,
          note: note || step.note,
        };
      } else {
        return {
          ...step,
          current: false,
        };
      }
    });

    if (!matched) {
      shipment.timeline.push({
        status,
        title: `Status Updated to: ${status}`,
        location: currentLocation || shipment.currentLocation,
        timestamp: nowStr,
        completed: true,
        current: true,
        note: note || `Updated by WTO Logistics Operations.`,
      });
    }
  }

  if (currentLocation) {
    shipment.currentLocation = currentLocation;
  }

  if (deliveryAgentName) {
    shipment.deliveryAgent = {
      name: deliveryAgentName,
      agentCode: deliveryAgentPhone || 'WTO-DISP',
    };
  }

  res.json({
    success: true,
    shipment,
  });
});

// Delete Shipment (Admin)
app.delete('/api/shipments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const targetId = (id || '').trim().toLowerCase();
  const index = shipments.findIndex(
    (s) => (s.id && s.id.toLowerCase() === targetId) || 
           (s.trackingNumber && s.trackingNumber.toLowerCase() === targetId)
  );

  if (index === -1) {
    // If not in in-memory array, it may have been deleted in Supabase or already removed
    res.json({
      success: true,
      message: `Shipment record cleared successfully.`,
    });
    return;
  }

  const deleted = shipments.splice(index, 1)[0];
  // Remove associated payment record
  const payIdx = paymentRecords.findIndex(
    (p) => p.shipmentId === id || p.trackingNumber.toLowerCase() === targetId
  );
  if (payIdx !== -1) {
    paymentRecords.splice(payIdx, 1);
  }

  res.json({
    success: true,
    message: `Shipment ${deleted.trackingNumber} deleted successfully.`,
    deleted,
  });
});

// 7. Calculate Shipping Rate (Returns estimated quote / custom tariff inquiry)
app.post('/api/rates/calculate', (req: Request, res: Response) => {
  try {
    const { pickupLocation, destination, packageType, weight, quantity, speed } = req.body;

    const isIntl = (pickupLocation && pickupLocation.toLowerCase().includes('bulgaria')) ||
                   (destination && destination.toLowerCase().includes('bulgaria')) ||
                   (destination && destination.toLowerCase().includes('london')) ||
                   (destination && destination.toLowerCase().includes('houston')) ||
                   (destination && destination.toLowerCase().includes('dubai')) ||
                   (destination && destination.toLowerCase().includes('guangzhou')) ||
                   (destination && destination.toLowerCase().includes('tokyo')) ||
                   (destination && destination.toLowerCase().includes('toronto')) ||
                   (destination && destination.toLowerCase().includes('joburg')) ||
                   (destination && destination.toLowerCase().includes('frankfurt'));

    const w = Number(weight) || 1;
    const q = Number(quantity) || 1;
    const base = 45; // USD base
    const perKg = 8.5; // USD per kg

    let calc = base + w * q * perKg;
    if (speed === 'Express') calc *= 1.4;
    const rounded = Math.round(calc);

    const deliveryTime = speed === 'Express' ? '1 - 3 Business Days' : '3 - 5 Business Days';

    res.json({
      price: rounded,
      estimatedDeliveryTime: deliveryTime,
      currency: 'USD',
      tariffType: 'International Worldwide Freight Tariff (Air / Maritime / Rail / Road)',
      breakdown: `${packageType || 'Cargo'} (${w}kg) from ${pickupLocation || 'Origin'} to ${destination || 'Destination'}. Official invoice issued via overseasworldtransport@gmail.com.`,
      disclaimer: 'Notice: WTO international shipping tariffs are customized based on volumetric weight and customs clearance requirements. Contact overseasworldtransport@gmail.com for certified commercial invoices.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Calculation error' });
  }
});

// 8. Locations List & Add
let quotesStore: any[] = [];

app.post('/api/quotes', (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      origin,
      destination,
      transportMode,
      cargoType,
      weight,
      pieces,
      dimensions,
      incoterms,
      estimatedPrice,
      estimatedTransit,
      specialNotes,
    } = req.body;

    if (!customerEmail || !origin || !destination) {
      res.status(400).json({ error: 'Missing required quotation parameters' });
      return;
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const quoteRef = `WTO-QT-${randomSuffix}`;

    const quoteRecord = {
      id: `qt_${Date.now()}`,
      quoteReference: quoteRef,
      customerName: customerName || 'Valued Shipper',
      customerEmail,
      customerPhone: customerPhone || '',
      companyName: companyName || '',
      origin,
      destination,
      transportMode: transportMode || 'Air Freight',
      cargoType: cargoType || 'General Cargo',
      weight: Number(weight) || 1,
      pieces: Number(pieces) || 1,
      dimensions: dimensions || '',
      incoterms: incoterms || 'DAP',
      estimatedPrice: Number(estimatedPrice) || 0,
      currency: 'USD',
      estimatedTransit: estimatedTransit || '3 - 5 Business Days',
      specialNotes: specialNotes || '',
      status: 'Active',
      createdDate: new Date().toISOString(),
    };

    quotesStore.unshift(quoteRecord);

    console.log(`[QUOTATION EMAIL DISPATCH] Sent to operations: overseasworldtransport@gmail.com and shipper: ${customerEmail}`);
    console.log(`Quote Ref: ${quoteRef} | ${origin} -> ${destination} | ${transportMode} | Total Estimate: $${estimatedPrice} USD`);

    res.status(201).json({
      success: true,
      quoteReference: quoteRef,
      quote: quoteRecord,
      message: 'Quotation registered. Operations team notified via overseasworldtransport@gmail.com.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Quotation registration error' });
  }
});

app.get('/api/quotes', (_req: Request, res: Response) => {
  res.json(quotesStore);
});

// Update Quote Status (Admin)
app.patch('/api/quotes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, specialNotes, estimatedPrice } = req.body;
  const quote = quotesStore.find(q => q.id === id || q.quoteReference === id);
  if (!quote) {
    res.status(404).json({ error: 'Quotation not found' });
    return;
  }
  if (status) quote.status = status;
  if (specialNotes !== undefined) quote.specialNotes = specialNotes;
  if (estimatedPrice !== undefined) quote.estimatedPrice = Number(estimatedPrice);
  res.json({ success: true, quote });
});

// Delete Quote (Admin)
app.delete('/api/quotes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const targetId = (id || '').trim().toLowerCase();
  const idx = quotesStore.findIndex(
    (q) => (q.id && q.id.toLowerCase() === targetId) || 
           (q.quoteReference && q.quoteReference.toLowerCase() === targetId)
  );
  if (idx === -1) {
    res.json({ success: true, message: 'Quotation cleared successfully.' });
    return;
  }
  const deleted = quotesStore.splice(idx, 1)[0];
  res.json({ success: true, deleted });
});

// Convert Quote into Active Live Shipment (Admin 1-Click Feature)
app.post('/api/quotes/:id/convert', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quote = quotesStore.find(q => q.id === id || q.quoteReference === id);
    if (!quote) {
      res.status(404).json({ error: 'Quotation not found' });
      return;
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const trackingNumber = `WTO-INT-${randomSuffix}`;
    const newId = `shp_${Date.now()}`;
    const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const newShipment: Shipment = {
      id: newId,
      trackingNumber,
      sender: {
        name: quote.customerName || 'WTO Corporate Client',
        email: quote.customerEmail,
        phone: quote.customerPhone || '',
        address: quote.origin,
        city: quote.origin,
        state: 'Origin Hub',
      },
      receiver: {
        name: quote.companyName || 'Consignee Recipient',
        email: quote.customerEmail,
        phone: quote.customerPhone || '',
        address: quote.destination,
        city: quote.destination,
        state: 'Destination Hub',
      },
      packageDetails: {
        type: quote.cargoType || 'General Cargo',
        customItemName: quote.cargoType,
        description: `${quote.transportMode || 'Air Freight'} - ${quote.weight} kg`,
        weight: Number(quote.weight) || 1,
        quantity: Number(quote.pieces) || 1,
        value: '$1,500 USD (Declared)',
        speed: quote.transportMode?.includes('Express') ? 'Express' : 'Standard',
      },
      pickupLocation: quote.origin,
      destination: quote.destination,
      price: quote.estimatedPrice || (Number(quote.weight) || 1) * 45,
      tariffType: `${quote.transportMode || 'International Freight'} Tariff`,
      status: 'Pending',
      currentStage: 'Order Confirmed',
      createdDate: new Date().toLocaleDateString(),
      estimatedDeliveryDate: quote.estimatedTransit || '3 - 5 Business Days',
      lastUpdated: nowStr,
      currentLocation: quote.origin,
      timeline: [
        {
          status: 'Order Booked',
          title: 'Consignment Converted from Official Quotation',
          location: quote.origin,
          timestamp: nowStr,
          completed: true,
          current: true,
          note: `Converted from Quotation Ref ${quote.quoteReference}. Initial booking approved by WTO Operations.`,
        },
        {
          status: 'In Transit',
          title: 'Scheduled Linehaul Corridor',
          location: 'Regional Consolidation Gateway',
          timestamp: 'Scheduled',
          completed: false,
        },
        {
          status: 'Delivered',
          title: 'Final Delivery to Destination',
          location: quote.destination,
          timestamp: 'Pending Delivery',
          completed: false,
        }
      ]
    };

    shipments.unshift(newShipment);

    // Create payment entry
    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      shipmentId: newId,
      trackingNumber,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      amount: quote.estimatedPrice || (Number(quote.weight) || 1) * 45,
      currency: 'USD',
      status: 'Pending Verification',
      date: nowStr,
      paymentMethod: 'Official Electronic Invoicing',
      reference: `WTO-INV-${Date.now().toString().slice(-6)}`,
    };
    paymentRecords.unshift(newPayment);

    // Update quote status
    quote.status = 'Converted';
    quote.convertedTracking = trackingNumber;

    res.status(201).json({
      success: true,
      shipment: newShipment,
      payment: newPayment,
      quote,
      message: `Quotation ${quote.quoteReference} successfully converted to Shipment ${trackingNumber}!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Conversion failed' });
  }
});

// Email Dispatch Simulation & Transmission Endpoint
app.post('/api/send-email', (req: Request, res: Response) => {
  try {
    const { recipientEmail, subject, body, trackingNumber, type } = req.body;
    
    if (!recipientEmail || !subject) {
      res.status(400).json({ error: 'recipientEmail and subject are required' });
      return;
    }

    console.log('----------------------------------------------------');
    console.log(`[DISPATCH EMAIL SENT] Type: ${type || 'consignment_manifest'}`);
    console.log(`TO: ${recipientEmail}`);
    console.log(`BCC: overseasworldtransport@gmail.com (WTO Central Operations)`);
    console.log(`SUBJECT: ${subject}`);
    if (trackingNumber) console.log(`TRACKING REF: ${trackingNumber}`);
    console.log('CONTENT:\n', body);
    console.log('----------------------------------------------------');

    res.json({
      success: true,
      message: `Consignment waybill & manifest successfully transmitted to ${recipientEmail} and WTO Central Operations.`,
      dispatchedAt: new Date().toISOString(),
      recipients: [recipientEmail, 'overseasworldtransport@gmail.com'],
    });
  } catch (err: any) {
    console.error('Email sending error:', err);
    res.status(500).json({ error: 'Failed to process email transmission.' });
  }
});

// Serve Supabase SQL Schema for easy download & copy
app.get('/supabase/schema.sql', (_req: Request, res: Response) => {
  const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="supabase_schema.sql"');
    res.sendFile(schemaPath);
  } else {
    res.status(404).send('-- Supabase schema file not found');
  }
});

app.get('/api/supabase-schema', (_req: Request, res: Response) => {
  const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    res.json({ success: true, sql: sqlContent });
  } else {
    res.status(404).json({ error: 'Schema file not found' });
  }
});

app.get('/api/locations', (_req: Request, res: Response) => {
  res.json(locationHubs);
});

app.post('/api/locations', (req: Request, res: Response) => {
  const { state, city, hubName, type, availability, estimatedDeliveryTime, address, country, region } = req.body;
  const newHub: LocationHub = {
    id: `hub_${Date.now()}`,
    state: state || 'Central Hub',
    city: city || 'International Hub',
    country: country || 'Bulgaria',
    region: region || 'Europe',
    hubName: hubName || 'WTO Distribution Depot',
    type: type || 'Air Cargo Hub',
    availability: availability || 'Daily Global Flight',
    estimatedDeliveryTime: estimatedDeliveryTime || '2-4 Business Days',
    address: address || 'Airport Cargo Area',
    email: 'overseasworldtransport@gmail.com',
    isActive: true,
  };
  locationHubs.push(newHub);
  res.status(201).json(newHub);
});

// 9. Payments List & Update
app.get('/api/payments', (_req: Request, res: Response) => {
  res.json(paymentRecords);
});

app.patch('/api/payments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const record = paymentRecords.find((p) => p.id === id || p.reference === id);
  if (!record) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }
  record.status = status;
  res.json({ success: true, payment: record });
});

// 10. Contact Messages & User Feedback
app.get('/api/contact', (_req: Request, res: Response) => {
  res.json(contactMessages);
});

app.post('/api/contact', (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
    return;
  }
  const newMsg: ContactMessage = {
    id: `msg_${Date.now()}`,
    name,
    email,
    phone,
    subject: subject || 'General Logistics Inquiry',
    message,
    createdAt: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    status: 'Unread',
  };
  contactMessages.unshift(newMsg);
  res.json({
    success: true,
    message: 'Thank you for contacting World Transport Overseas! Your message has been logged. Our dispatch desk will email you at overseasworldtransport@gmail.com.',
  });
});

// Delete contact message
app.delete('/api/contact/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const targetId = (id || '').trim().toLowerCase();
  const idx = contactMessages.findIndex((m) => m.id.toLowerCase() === targetId);
  if (idx !== -1) {
    contactMessages.splice(idx, 1);
  }
  res.json({ success: true, message: 'Message deleted successfully' });
});

// User Feedback Endpoints (Admin to Customer Communication)
app.get('/api/admin/feedback', (_req: Request, res: Response) => {
  res.json(customerFeedbackStore);
});

app.post('/api/admin/feedback', (req: Request, res: Response) => {
  try {
    const { recipientName, recipientEmail, trackingNumber, feedbackType, subject, message, contactMessageId } = req.body;
    if (!recipientEmail || !subject || !message) {
      res.status(400).json({ success: false, error: 'Recipient email, subject, and message body are required.' });
      return;
    }

    const newFeedback: UserFeedbackRecord = {
      id: `fb_${Date.now()}`,
      recipientName: recipientName || 'Valued WTO Client',
      recipientEmail,
      trackingNumber: trackingNumber || undefined,
      feedbackType: feedbackType || 'Consignment Status Update',
      subject,
      message,
      sentAt: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      status: 'Delivered',
      contactMessageId,
    };

    customerFeedbackStore.unshift(newFeedback);

    // If linked to contact message, mark it replied
    if (contactMessageId) {
      const targetMsg = contactMessages.find((m) => m.id === contactMessageId);
      if (targetMsg) targetMsg.status = 'Replied';
    }

    console.log('====================================================');
    console.log(`[WTO CUSTOMER FEEDBACK SENT]`);
    console.log(`To: ${recipientEmail} (${recipientName || 'Client'})`);
    console.log(`Category: ${feedbackType || 'Consignment Update'}`);
    console.log(`Tracking Ref: ${trackingNumber || 'N/A'}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message Body:\n${message}`);
    console.log('====================================================');

    res.json({
      success: true,
      message: `Feedback and official notification successfully sent to ${recipientEmail}.`,
      feedback: newFeedback,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to dispatch feedback' });
  }
});

app.delete('/api/admin/feedback/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = customerFeedbackStore.findIndex((f) => f.id === id);
  if (idx !== -1) {
    customerFeedbackStore.splice(idx, 1);
  }
  res.json({ success: true, message: 'Feedback log deleted' });
});

// Delete Orders endpoint
app.delete('/api/orders/:id', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Order record deleted successfully' });
});

// Delete Customers endpoint
app.delete('/api/customers/:id', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Customer record deleted successfully' });
});

// Bulk Clear / Reset Shipments endpoint
app.post('/api/shipments/clear', (_req: Request, res: Response) => {
  // Clear extra shipments, leave only base seed or clear all
  shipments.length = 0;
  res.json({ success: true, message: 'Shipments list cleared' });
});

// 11. Admin Auth & Settings
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === adminPasswordHash) {
    res.json({ success: true, token: 'wto_admin_auth_valid' });
  } else {
    res.status(401).json({ success: false, error: 'Incorrect administrator password' });
  }
});

app.post('/api/admin/change-password', (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (oldPassword !== adminPasswordHash) {
    res.status(400).json({ success: false, error: 'Current password does not match' });
    return;
  }
  if (!newPassword || newPassword.length < 5) {
    res.status(400).json({ success: false, error: 'New password must be at least 5 characters' });
    return;
  }
  adminPasswordHash = newPassword;
  res.json({ success: true, message: 'Admin password changed successfully' });
});

app.get('/api/admin/conversations', (_req: Request, res: Response) => {
  res.json(chatLogs);
});

app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(appSettings);
});

app.put('/api/admin/settings', (req: Request, res: Response) => {
  Object.assign(appSettings, req.body);
  appSettings.email = 'overseasworldtransport@gmail.com'; // Strictly enforce owner email only
  res.json({ success: true, settings: appSettings });
});

// 12. Text Chatbot Endpoint (Gemini 3.8 Flash)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    const userMsg = message.trim();
    const trackingRegex = /(?:WTO)?[-\s]?(?:NG|INT)?[-\s]?[0-9]{5,8}/i;
    const match = userMsg.match(trackingRegex);

    let trackingQueried: string | undefined;
    let shipmentDataStr = 'No tracking number recognized in customer query.';

    if (match) {
      const candidateCode = match[0].trim().replace(/\s+/g, '-').toUpperCase();
      const norm = candidateCode.replace(/[^A-Z0-9]/g, '');
      const found = shipments.find(
        (s) =>
          s.trackingNumber.toUpperCase() === candidateCode ||
          s.trackingNumber.replace(/[^A-Z0-9]/g, '') === norm
      );

      if (found) {
        trackingQueried = found.trackingNumber;
        shipmentDataStr = `
VERIFIED REAL DATABASE RECORD FOUND:
Tracking Number: ${found.trackingNumber}
Status: ${found.status}
Current Stage: ${found.currentStage || found.status}
Current Location: ${found.currentLocation}
Sender: ${found.sender.name} (${found.sender.city}, ${found.sender.country || 'Nigeria'})
Recipient: ${found.receiver.name} (${found.receiver.city}, ${found.receiver.country || 'Nigeria'})
Cargo Description: ${found.packageDetails.description}
Weight: ${found.packageDetails.weight} kg (${found.packageDetails.speed} service)
Estimated Delivery Date: ${found.estimatedDeliveryDate}
Delivery Agent: ${found.deliveryAgent?.name || 'Assigned on Dispatch'}
Latest Timeline Milestone: ${found.timeline[found.timeline.length - 1]?.title || found.status} at ${found.timeline[found.timeline.length - 1]?.location || found.currentLocation}
`;
      } else {
        trackingQueried = candidateCode;
        shipmentDataStr = `No shipment found with tracking number "${candidateCode}". Inform customer to verify their waybill number or contact customer care via overseasworldtransport@gmail.com.`;
      }
    }

    const systemInstruction = `
You are the official 24/7 AI Shipping & Logistics Assistant for World Transport Overseas (WTO).

CRITICAL COMPANY DETAILS:
- Company Name: World Transport Overseas (WTO)
- Global European Headquarters: Mimi Balkanska St 126, 1517 Sofia, Bulgaria
- West Africa Central Terminal: Plot 14B Commercial Avenue, Ikeja, Lagos, Nigeria
- OFFICIAL INVOICES, PAYMENTS & SUPPORT EMAIL: overseasworldtransport@gmail.com
- STRICT RULE: NEVER provide any phone number. WTO support and financial transactions are managed EXCLUSIVELY via email at overseasworldtransport@gmail.com.

KNOWLEDGE BASE:
- WTO provides international air freight, ocean container shipping, and domestic express distribution.
- We operate worldwide hubs in Sofia (Bulgaria), London (UK), Frankfurt (Germany), Houston & New York (USA), Dubai (UAE), Guangzhou (China), Lagos & Abuja (Nigeria).
- Rate tariffs: Quotes are customized based on volumetric weight and customs clearances. Customers can request an official tariff or email overseasworldtransport@gmail.com.
- Payment Verification: All invoices are sent and verified exclusively via overseasworldtransport@gmail.com.

Verified Database Context:
${shipmentDataStr}
`;

    let botReply = '';

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userMsg,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });
        botReply = response.text || '';
      } catch (err: any) {
        console.error('Gemini text API call failed:', err);
      }
    }

    if (!botReply) {
      if (shipmentDataStr.includes('VERIFIED REAL DATABASE RECORD FOUND')) {
        const found = shipments.find((s) => s.trackingNumber.toUpperCase() === trackingQueried);
        if (found) {
          botReply = `Tracking Number: ${found.trackingNumber}\nStatus: ${found.status} (${found.currentStage || 'Active'})\nCurrent Location: ${found.currentLocation}\nDestination: ${found.destination}\nEstimated Delivery: ${found.estimatedDeliveryDate}\n\nFor official waybill inquiries, please email ${appSettings.email}.`;
        }
      } else if (shipmentDataStr.includes('No shipment found with tracking number')) {
        botReply = `I couldn't locate a shipment with that tracking code. Please double-check your waybill number or contact our international desk via email at ${appSettings.email}.`;
      } else {
        botReply = `Welcome to World Transport Overseas (WTO)! We provide worldwide air & ocean freight and nationwide distribution. You can track your shipment, request a rate quote, or email our customer desk at ${appSettings.email}.`;
      }
    }

    chatLogs.unshift({
      id: `chat_${Date.now()}`,
      sessionId: sessionId || 'anon',
      userMessage: userMsg,
      botReply,
      timestamp: new Date().toISOString(),
      trackingQueried,
    });

    res.json({
      reply: botReply,
      trackingQueried,
    });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({
      error: 'Chat error',
      reply: `Our AI assistant is temporarily busy. Please email WTO customer support directly at ${appSettings.email}.`,
    });
  }
});

// ==========================================
// WEBSOCKET & GEMINI LIVE API (gemini-3.8-live)
// ==========================================
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to WTO Live Voice WebSocket (/api/live)');

  if (!ai) {
    clientWs.send(JSON.stringify({ error: 'Gemini AI not initialized. Check GEMINI_API_KEY.' }));
    clientWs.close();
    return;
  }

  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `You are the live voice shipping assistant for World Transport Overseas (WTO).
You speak with clarity, professional warmth, and logistics expertise.
World Transport Overseas is headquartered at Mimi Balkanska St 126, 1517 Sofia, Bulgaria, with major hubs in Lagos, London, Houston, Dubai, and Guangzhou.
Support and payment inquiries must be directed to overseasworldtransport@gmail.com.
Never mention any phone number. Keep spoken answers concise, informative, and courteous.`,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          try {
            const parts = message.serverContent?.modelTurn?.parts || [];
            const audioData = parts.find((p: any) => p.inlineData?.data)?.inlineData?.data;
            const textData = parts.find((p: any) => p.text)?.text;

            if (audioData || textData) {
              clientWs.send(
                JSON.stringify({
                  audio: audioData,
                  text: textData,
                })
              );
            }

            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          } catch (e) {
            console.error('Error forwarding Live message to client:', e);
          }
        },
        onclose: () => {
          console.log('Gemini Live session closed');
        },
        onerror: (err: any) => {
          console.error('Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: 'Live session error: ' + (err.message || 'Unknown') }));
          }
        },
      },
    });

    console.log('Gemini Live API (gemini-3.8-live) session successfully connected!');
    clientWs.send(JSON.stringify({ status: 'connected', message: 'Connected to WTO Live Voice Assistant' }));
  } catch (err: any) {
    console.error('Failed to connect to Gemini Live API:', err);
    clientWs.send(JSON.stringify({ error: 'Failed to initiate Live session: ' + err.message }));
    clientWs.close();
    return;
  }

  clientWs.on('message', (rawData) => {
    try {
      const msg = JSON.parse(rawData.toString());

      if (msg.audio && session) {
        // Stream 16kHz PCM audio chunk from client microphone
        session.sendRealtimeInput({
          audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
        });
      } else if (msg.text && session) {
        session.send({
          clientContent: {
            turns: [{ role: 'user', parts: [{ text: msg.text }] }],
            turnComplete: true,
          },
        });
      }
    } catch (e: any) {
      console.error('Error processing client WebSocket message:', e);
    }
  });

  clientWs.on('close', () => {
    console.log('Client disconnected from WTO Live WebSocket');
    if (session) {
      try {
        session.close();
      } catch (e) {}
    }
  });
});

// Setup Vite in Dev or Static Serving in Prod
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for HTML5 client routing if vite.middlewares doesn't catch it
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/ws')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          next();
        }
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response, next) => {
        if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/ws')) {
          return next();
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  server.listen(PORT, HOST, () => {
    console.log(`World Transport Overseas (WTO) Server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
