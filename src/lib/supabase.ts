import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  ProfileRow, 
  ShipmentRow, 
  ShipmentUpdateRow, 
  OrderRow, 
  ChatMessageRow,
  QuoteRow 
} from '../types';

const rawUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  'https://swyssqtaggzocbmpxwvv.supabase.co'
).trim();

// Strip /rest/v1 or trailing slashes to keep the origin intact for Supabase JS client
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eXNzcXRhZ2d6b2NibXB4d3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NjcxNDgsImV4cCI6MjEwNjM0MzE0OH0.OA_dI2sgapofKym6lqx7nLVSVyU3i4uNcCF5nmpDSQI'
).trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseUrl.startsWith('https://')
  );
};

// Create the Supabase client instance
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// ==============================================================================
// 1. SUPABASE AUTHENTICATION
// ==============================================================================

export async function signUpCustomer({
  email,
  password,
  fullName,
  phone = '',
}: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role: 'customer',
      },
    },
  });

  if (error) throw error;

  // Insert profile row if not handled by trigger
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      email: data.user.email || email,
      phone: phone,
      role: 'customer',
    }).select().single();
  }

  return data;
}

export async function signInCustomer({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOutUser() {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPasswordForEmail(email: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}`,
  });

  if (error) throw error;
  return data;
}

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // If profile does not exist yet, create it from user metadata
    const newProfile: Partial<ProfileRow> = {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
      email: user.email || '',
      phone: user.user_metadata?.phone || '',
      role: user.email === 'overseasworldtransport@gmail.com' ? 'admin' : (user.user_metadata?.role || 'customer'),
    };
    const { data: created } = await supabase.from('profiles').insert(newProfile).select().single();
    return created || null;
  }

  return data as ProfileRow;
}

export async function updateProfile(id: string, updates: Partial<ProfileRow>) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ProfileRow;
}

export async function fetchAllCustomers(): Promise<ProfileRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase profiles query notice:', error.message || error);
      return [];
    }
    return (data || []) as ProfileRow[];
  } catch (err: any) {
    console.warn('Failed to query Supabase profiles:', err?.message || err);
    return [];
  }
}

// ==============================================================================
// 2. SHIPMENTS & TRACKING
// ==============================================================================

export function generateTrackingNumber(isInternational = true): string {
  const prefix = isInternational ? 'WTO-INT' : 'WTO-AIR';
  const randomSix = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomSix}`;
}

export async function fetchCustomerShipments(customerId: string): Promise<ShipmentRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase customer shipments query notice:', error.message || error);
      return [];
    }
    return (data || []) as ShipmentRow[];
  } catch (err: any) {
    console.warn('Failed to query Supabase customer shipments:', err?.message || err);
    return [];
  }
}

export async function fetchAllShipments(): Promise<ShipmentRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase shipments query notice (e.g. table not created yet):', error.message || error);
      return [];
    }
    return (data || []) as ShipmentRow[];
  } catch (err: any) {
    console.warn('Failed to query Supabase shipments:', err?.message || err);
    return [];
  }
}

export async function fetchShipmentByTracking(trackingNumber: string): Promise<{
  shipment: ShipmentRow | null;
  updates: ShipmentUpdateRow[];
}> {
  if (!isSupabaseConfigured()) {
    return { shipment: null, updates: [] };
  }

  try {
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('tracking_number', trackingNumber.trim().toUpperCase())
      .single();

    if (error || !shipment) {
      return { shipment: null, updates: [] };
    }

    const { data: updates } = await supabase
      .from('shipment_updates')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('updated_at', { ascending: true });

    return {
      shipment: shipment as ShipmentRow,
      updates: (updates || []) as ShipmentUpdateRow[],
    };
  } catch (err: any) {
    console.warn('Supabase tracking lookup handled:', err?.message || err);
    return { shipment: null, updates: [] };
  }
}

export async function createShipment({
  trackingNumber,
  customerId,
  senderName,
  senderEmail = '',
  senderPhone = '',
  senderAddress = '',
  origin,
  receiverName,
  receiverEmail = '',
  receiverPhone = '',
  receiverAddress = '',
  destination,
  transportMode = 'Air Freight & Express Cargo',
  shipmentType = 'Standard Commercial Cargo',
  cargoDescription = '',
  hsCode = '',
  weight = 1.0,
  pieces = 1,
  dimensionsCm = '',
  volumetricWeight = 0,
  declaredValue = 'Declared On File',
  incoterms = 'DAP',
  packagingType = 'Secure Carton',
  isFragile = false,
  isHazardous = false,
  isInsured = true,
  pickupDate,
  specialInstructions = '',
  price = 150,
  status = 'Pending',
  estimatedDelivery = '3 - 5 Business Days',
  currentLocation = '',
}: {
  trackingNumber?: string;
  customerId?: string | null;
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  senderAddress?: string;
  origin: string;
  receiverName: string;
  receiverEmail?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  destination: string;
  transportMode?: string;
  shipmentType?: string;
  cargoDescription?: string;
  hsCode?: string;
  weight?: number;
  pieces?: number;
  dimensionsCm?: string;
  volumetricWeight?: number;
  declaredValue?: string;
  incoterms?: string;
  packagingType?: string;
  isFragile?: boolean;
  isHazardous?: boolean;
  isInsured?: boolean;
  pickupDate?: string;
  specialInstructions?: string;
  price?: number;
  status?: string;
  estimatedDelivery?: string;
  currentLocation?: string;
}): Promise<ShipmentRow> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const finalTracking = trackingNumber || generateTrackingNumber(destination.includes('Bulgaria') || destination.includes('UK') || destination.includes('USA') || destination.includes('Dubai'));

  const payload: any = {
    tracking_number: finalTracking,
    customer_id: customerId || null,
    sender_name: senderName,
    origin: origin,
    receiver_name: receiverName,
    destination: destination,
    shipment_type: shipmentType,
    weight: Number(weight) || 1.0,
    status: status,
    estimated_delivery: estimatedDelivery,
    current_location: currentLocation || origin,
  };

  // Add extended fields if available
  if (senderEmail) payload.sender_email = senderEmail;
  if (senderPhone) payload.sender_phone = senderPhone;
  if (senderAddress) payload.sender_address = senderAddress;
  if (receiverEmail) payload.receiver_email = receiverEmail;
  if (receiverPhone) payload.receiver_phone = receiverPhone;
  if (receiverAddress) payload.receiver_address = receiverAddress;
  if (transportMode) payload.transport_mode = transportMode;
  if (cargoDescription) payload.cargo_description = cargoDescription;
  if (hsCode) payload.hs_code = hsCode;
  if (pieces) payload.pieces = Number(pieces);
  if (dimensionsCm) payload.dimensions_cm = dimensionsCm;
  if (volumetricWeight) payload.volumetric_weight = Number(volumetricWeight);
  if (declaredValue) payload.declared_value = declaredValue;
  if (incoterms) payload.incoterms = incoterms;
  if (packagingType) payload.packaging_type = packagingType;
  if (isFragile !== undefined) payload.is_fragile = isFragile;
  if (isHazardous !== undefined) payload.is_hazardous = isHazardous;
  if (isInsured !== undefined) payload.is_insured = isInsured;
  if (pickupDate) payload.pickup_date = pickupDate;
  if (specialInstructions) payload.special_instructions = specialInstructions;
  if (price) payload.price = Number(price);

  const { data: shipment, error } = await supabase
    .from('shipments')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  // Automatically insert the initial milestone into shipment_updates
  try {
    await supabase.from('shipment_updates').insert({
      shipment_id: shipment.id,
      status: status,
      location: origin,
      description: `Consignment registered in WTO international network. Route: ${origin} → ${destination} via ${transportMode}.`,
    });
  } catch (e) {
    console.warn('Milestone insert notice:', e);
  }

  // Automatically create a corresponding order invoice entry
  try {
    await supabase.from('orders').insert({
      customer_id: customerId || null,
      shipment_id: shipment.id,
      amount: price || (Number(weight) || 1.0) * 45,
      currency: 'USD',
      payment_status: 'pending',
      order_status: 'processing',
    });
  } catch (e) {
    console.warn('Order invoice notice:', e);
  }

  return shipment as ShipmentRow;
}

// ==============================================================================
// 3. ENTERPRISE QUOTATIONS
// ==============================================================================

export function generateQuoteReference(): string {
  const randomSix = Math.floor(100000 + Math.random() * 900000);
  return `WTO-QT-${randomSix}`;
}

export async function createQuote(payload: {
  quoteReference?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  origin: string;
  destination: string;
  transportMode: string;
  cargoType: string;
  weight: number;
  pieces?: number;
  dimensions?: string;
  incoterms?: string;
  estimatedPrice: number;
  estimatedTransit?: string;
  specialNotes?: string;
}): Promise<QuoteRow | null> {
  if (!isSupabaseConfigured()) return null;

  const quoteRef = payload.quoteReference || generateQuoteReference();

  try {
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        quote_reference: quoteRef,
        customer_name: payload.customerName,
        customer_email: payload.customerEmail,
        customer_phone: payload.customerPhone || '',
        company_name: payload.companyName || '',
        origin: payload.origin,
        destination: payload.destination,
        transport_mode: payload.transportMode,
        cargo_type: payload.cargoType,
        weight: Number(payload.weight) || 1.0,
        pieces: Number(payload.pieces) || 1,
        dimensions: payload.dimensions || '',
        incoterms: payload.incoterms || 'DAP',
        estimated_price: Number(payload.estimatedPrice) || 0.0,
        currency: 'USD',
        estimated_transit: payload.estimatedTransit || '',
        special_notes: payload.specialNotes || '',
        status: 'Active',
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase quote creation notice:', error.message || error);
      return null;
    }
    return data as QuoteRow;
  } catch (err: any) {
    console.warn('Failed to insert Supabase quote:', err?.message || err);
    return null;
  }
}

export async function fetchAllQuotes(): Promise<QuoteRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase quotes fetch notice:', error.message || error);
      return [];
    }
    return (data || []) as QuoteRow[];
  } catch (err: any) {
    console.warn('Failed to query quotes:', err?.message || err);
    return [];
  }
}

export async function updateShipment(id: string, updates: Partial<ShipmentRow>) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('shipments')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ShipmentRow;
}

export async function deleteShipment(id: string) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('shipment_updates').delete().eq('shipment_id', id);
  } catch (e) {
    console.warn('Notice deleting shipment updates:', e);
  }
  try {
    await supabase.from('orders').delete().eq('shipment_id', id);
  } catch (e) {
    console.warn('Notice deleting orders:', e);
  }
  const { error } = await supabase.from('shipments').delete().eq('id', id);
  if (error) {
    // Fallback: try deleting by tracking_number in case tracking number was provided
    const { error: err2 } = await supabase.from('shipments').delete().eq('tracking_number', id);
    if (err2) {
      console.warn('Supabase deleteShipment notice:', error.message || error);
    }
  }
}

// ==============================================================================
// 3. SHIPMENT UPDATES (TIMELINE MILESTONES)
// ==============================================================================

export async function fetchShipmentUpdates(shipmentId: string): Promise<ShipmentUpdateRow[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('shipment_updates')
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('updated_at', { ascending: true });

  if (error) throw error;
  return (data || []) as ShipmentUpdateRow[];
}

export async function addShipmentMilestone({
  shipmentId,
  status,
  location,
  description = '',
}: {
  shipmentId: string;
  status: string;
  location: string;
  description?: string;
}): Promise<ShipmentUpdateRow> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  // 1. Insert update row
  const { data, error } = await supabase
    .from('shipment_updates')
    .insert({
      shipment_id: shipmentId,
      status,
      location,
      description,
    })
    .select()
    .single();

  if (error) throw error;

  // 2. Synchronize main shipment's current status and current location
  await supabase
    .from('shipments')
    .update({
      status,
      current_location: location,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shipmentId);

  return data as ShipmentUpdateRow;
}

// ==============================================================================
// 4. ORDERS & PAYMENTS
// ==============================================================================

export async function fetchCustomerOrders(customerId: string): Promise<OrderRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, shipment:shipments(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase customer orders query notice:', error.message || error);
      return [];
    }
    return (data || []) as OrderRow[];
  } catch (err: any) {
    console.warn('Failed to query Supabase customer orders:', err?.message || err);
    return [];
  }
}

export async function fetchAllOrders(): Promise<OrderRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, shipment:shipments(*), customer:profiles(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase orders query notice:', error.message || error);
      return [];
    }
    return (data || []) as OrderRow[];
  } catch (err: any) {
    console.warn('Failed to query Supabase orders:', err?.message || err);
    return [];
  }
}

export async function updateOrderStatus({
  orderId,
  paymentStatus,
  orderStatus,
}: {
  orderId: string;
  paymentStatus?: 'pending' | 'paid' | 'refunded' | 'cancelled';
  orderStatus?: 'processing' | 'confirmed' | 'completed' | 'cancelled';
}) {
  if (!isSupabaseConfigured()) return null;

  const updates: any = {};
  if (paymentStatus) updates.payment_status = paymentStatus;
  if (orderStatus) updates.order_status = orderStatus;

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as OrderRow;
}

export async function deleteOrder(id: string) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('orders').delete().eq('id', id);
  } catch (e) {
    console.warn('Notice deleting order from Supabase:', e);
  }
}

export async function deleteProfile(id: string) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('profiles').delete().eq('id', id);
  } catch (e) {
    console.warn('Notice deleting profile from Supabase:', e);
  }
}

// ==============================================================================
// 5. LIVE CHAT MESSAGES
// ==============================================================================

export async function fetchChatMessages(userId?: string): Promise<ChatMessageRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    let query = supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase chat messages query notice:', error.message || error);
      return [];
    }
    return (data || []) as ChatMessageRow[];
  } catch (err: any) {
    console.warn('Failed to query Supabase chat messages:', err?.message || err);
    return [];
  }
}

export async function sendChatMessage({
  userId,
  message,
  senderType,
}: {
  userId?: string | null;
  message: string;
  senderType: 'customer' | 'admin' | 'support' | 'ai';
}): Promise<ChatMessageRow> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId || null,
      message,
      sender_type: senderType,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ChatMessageRow;
}

// ==============================================================================
// 6. REALTIME SUBSCRIPTIONS (POSTGRES CHANGES)
// ==============================================================================

export function subscribeToShipments(callback: (payload: any) => void) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase
    .channel('realtime:shipments')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'shipments' },
      (payload) => callback(payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'shipment_updates' },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToChat(userId: string | null, callback: (payload: any) => void) {
  if (!isSupabaseConfigured()) return () => {};

  const channelName = userId ? `realtime:chat:${userId}` : 'realtime:chat:all';
  const filter = userId ? `user_id=eq.${userId}` : undefined;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
