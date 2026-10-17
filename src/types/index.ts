export interface SenderReceiver {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country?: string;
}

export interface PackageDetails {
  type: string;
  itemCategory?: string;
  customItemName?: string;
  description: string;
  weight: number;
  quantity: number;
  value: string;
  speed: 'Standard' | 'Express';
  packagingType?: string;
  isFragile?: boolean;
  isHazardous?: boolean;
}

export interface TimelineStep {
  status: string;
  title: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
  stageKey?: 'booked' | 'pickup' | 'warehouse_sorting' | 'in_transit' | 'customs' | 'out_for_delivery' | 'delivered';
  note?: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  sender: SenderReceiver;
  receiver: SenderReceiver;
  packageDetails: PackageDetails;
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
  timeline: TimelineStep[];
}

export interface LocationHub {
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

export interface PaymentRecord {
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

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'Unread' | 'Replied' | 'Archived';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  trackingData?: any;
}

export interface WebsiteContent {
  company: {
    name: string;
    email: string;
    hqAddress: string;
    internationalHubAddress?: string;
    supportHours: string;
    tagline: string;
    establishedYear: string;
  };
  hero: {
    headline: string;
    subheading: string;
    badgeText: string;
    primaryCtaText: string;
    secondaryCtaText: string;
  };
  stats: {
    packagesDelivered: string;
    happyCustomers: string;
    deliveryLocations: string;
    deliverySuccessRate: string;
  };
  about: {
    whoWeAre: string;
    mission: string;
    vision: string;
    values: Array<{ title: string; desc: string }>;
  };
  services: Array<{
    id: string;
    title: string;
    desc: string;
    badge: string;
    icon: string;
  }>;
  business: {
    headline: string;
    subheading: string;
    points: string[];
    ctaText: string;
  };
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
  }>;
  noticeBanner: {
    enabled: boolean;
    text: string;
  };
}

// ------------------------------------------------------------------------------
// SUPABASE BACKEND ENTITIES
// ------------------------------------------------------------------------------
export interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  created_at: string;
}

export interface ShipmentRow {
  id: string;
  tracking_number: string;
  customer_id: string | null;
  sender_name: string;
  sender_email?: string;
  sender_phone?: string;
  sender_address?: string;
  origin: string;
  receiver_name: string;
  receiver_email?: string;
  receiver_phone?: string;
  receiver_address?: string;
  destination: string;
  transport_mode?: string;
  shipment_type: string;
  cargo_description?: string;
  hs_code?: string;
  weight: number;
  pieces?: number;
  dimensions_cm?: string;
  volumetric_weight?: number;
  declared_value?: string;
  incoterms?: string;
  packaging_type?: string;
  is_fragile?: boolean;
  is_hazardous?: boolean;
  is_insured?: boolean;
  pickup_date?: string;
  special_instructions?: string;
  price?: number;
  currency?: string;
  status: string;
  estimated_delivery: string;
  current_location: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteRow {
  id: string;
  quote_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  company_name?: string;
  origin: string;
  destination: string;
  transport_mode: string;
  cargo_type: string;
  weight: number;
  pieces: number;
  dimensions?: string;
  incoterms?: string;
  estimated_price: number;
  currency?: string;
  estimated_transit?: string;
  special_notes?: string;
  status: 'Active' | 'Accepted' | 'Booked' | 'Archived';
  created_at: string;
}

export interface ShipmentUpdateRow {
  id: string;
  shipment_id: string;
  status: string;
  location: string;
  description: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  customer_id: string | null;
  shipment_id: string | null;
  amount: number;
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  order_status: 'processing' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  shipment?: ShipmentRow;
  customer?: ProfileRow;
}

export interface ChatMessageRow {
  id: string;
  user_id: string | null;
  message: string;
  sender_type: 'customer' | 'admin' | 'support' | 'ai';
  created_at: string;
}

