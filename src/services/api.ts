import { Shipment, LocationHub, PaymentRecord, ContactMessage } from '../types';

export const API_BASE = '/api';

export async function fetchShipmentByTracking(trackingNumber: string): Promise<{ found: boolean; shipment?: Shipment; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/shipments/track/${encodeURIComponent(trackingNumber)}`);
    const data = await res.json();
    if (!res.ok) {
      return { found: false, error: data.error || 'Shipment not found' };
    }
    return data;
  } catch (err: any) {
    return { found: false, error: err.message || 'Network error fetching shipment' };
  }
}

export async function fetchAllShipments(email?: string): Promise<Shipment[]> {
  try {
    const url = email ? `${API_BASE}/shipments?email=${encodeURIComponent(email)}` : `${API_BASE}/shipments`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch shipments', err);
    return [];
  }
}

export async function createShipmentBooking(payload: any): Promise<{ success: boolean; shipment?: Shipment; payment?: PaymentRecord; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/shipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to create booking' };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error creating booking' };
  }
}

export async function updateShipmentStatus(id: string, payload: {
  status?: string;
  currentLocation?: string;
  deliveryAgentName?: string;
  deliveryAgentPhone?: string;
  note?: string;
}): Promise<{ success: boolean; shipment?: Shipment; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/shipments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function calculateShippingRate(params: {
  pickupLocation: string;
  destination: string;
  packageType: string;
  weight: number;
  quantity?: number;
  speed: string;
}): Promise<{ price: number; estimatedDeliveryTime: string; currency: string; breakdown: string; tariffType?: string; disclaimer?: string }> {
  const res = await fetch(`${API_BASE}/rates/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error('Rate calculation failed');
  }
  return await res.json();
}

export async function fetchLocations(): Promise<LocationHub[]> {
  try {
    const res = await fetch(`${API_BASE}/locations`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch locations', err);
    return [];
  }
}

export async function addLocation(payload: Partial<LocationHub>): Promise<LocationHub> {
  const res = await fetch(`${API_BASE}/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function fetchPayments(): Promise<PaymentRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/payments`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch payments', err);
    return [];
  }
}

export async function updatePaymentStatus(id: string, status: string): Promise<any> {
  const res = await fetch(`${API_BASE}/payments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return await res.json();
}

export async function sendContactMessage(payload: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  try {
    const res = await fetch(`${API_BASE}/contact`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function sendChatMessage(message: string, sessionId?: string): Promise<{ reply: string; trackingQueried?: string }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });
  if (!res.ok) {
    throw new Error('AI Assistant is currently unavailable');
  }
  return await res.json();
}

export async function adminLogin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminChangePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/admin/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  return await res.json();
}

export async function fetchAdminConversations(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/conversations`);
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function fetchAdminSettings(): Promise<any> {
  const res = await fetch(`${API_BASE}/settings`);
  return await res.json();
}

export async function updateAdminSettings(settings: any): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return await res.json();
}

export async function fetchWebsiteContent(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/website-content`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch website content', err);
    return null;
  }
}

export async function updateWebsiteContent(content: any): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/website-content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function submitEnterpriseQuote(payload: any): Promise<{ success: boolean; quoteReference?: string; quote?: any; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit quote inquiry.' };
  }
}

export async function fetchAllEnterpriseQuotes(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/quotes`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function sendEmailNotification(payload: {
  recipientEmail: string;
  subject: string;
  body: string;
  trackingNumber?: string;
  type?: 'shipment_booking' | 'quote_inquiry' | 'general';
}): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: true, message: 'Notification recorded for email dispatch.' };
  }
}

export async function deleteShipmentApi(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/shipments/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateShipmentFullApi(id: string, payload: any): Promise<{ success: boolean; shipment?: Shipment; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/shipments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateQuoteApi(id: string, payload: any): Promise<{ success: boolean; quote?: any }> {
  try {
    const res = await fetch(`${API_BASE}/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false };
  }
}

export async function deleteQuoteApi(id: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/quotes/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false };
  }
}

export async function convertQuoteToShipmentApi(id: string): Promise<{ success: boolean; shipment?: Shipment; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/quotes/${id}/convert`, {
      method: 'POST',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Contact Messages & User Feedback APIs
// -------------------------------------------------------------
export async function deleteContactMessage(id: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/contact/${id}`, { method: 'DELETE' });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

export async function fetchSentFeedback(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/feedback`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch feedback logs', err);
    return [];
  }
}

export async function sendFeedbackToUser(payload: {
  recipientName: string;
  recipientEmail: string;
  trackingNumber?: string;
  feedbackType: string;
  subject: string;
  message: string;
  contactMessageId?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error sending feedback' };
  }
}

export async function deleteSentFeedback(id: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/admin/feedback/${id}`, { method: 'DELETE' });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

export async function deleteOrderApi(id: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

export async function deleteCustomerApi(id: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

export async function clearAllShipmentsApi(): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/shipments/clear`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

