import React, { useState, useEffect } from 'react';
import wtoLogoImg from '../assets/images/wto_emblem_logo_1790855439455.jpg';
import { 
  Lock, 
  Package, 
  Truck, 
  MapPin, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Plus, 
  Edit, 
  Check, 
  X, 
  AlertCircle, 
  Search, 
  KeyRound, 
  FileText, 
  DollarSign, 
  Clock, 
  RefreshCw, 
  ExternalLink, 
  Printer, 
  Layout, 
  Globe2, 
  Trash2, 
  Sparkles, 
  Save, 
  HelpCircle, 
  Building2, 
  Layers,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Database,
  Copy,
  Download,
  Eye,
  EyeOff,
  Mail,
  Send,
  Inbox,
  RotateCcw
} from 'lucide-react';
import { 
  ShipmentRow, 
  ProfileRow, 
  OrderRow, 
  Shipment, 
  WebsiteContent,
  QuoteRow,
  ContactMessage
} from '../types';
import { 
  fetchAllShipments, 
  createShipment, 
  updateShipment, 
  deleteShipment, 
  addShipmentMilestone,
  fetchAllCustomers, 
  fetchAllOrders, 
  updateOrderStatus, 
  generateTrackingNumber, 
  fetchAllQuotes,
  isSupabaseConfigured,
  deleteOrder,
  deleteProfile
} from '../lib/supabase';
import { 
  fetchWebsiteContent, 
  updateWebsiteContent,
  fetchAllShipments as fetchApiShipments,
  deleteShipmentApi,
  updateShipmentFullApi,
  fetchAllEnterpriseQuotes,
  updateQuoteApi,
  deleteQuoteApi,
  convertQuoteToShipmentApi,
  sendEmailNotification,
  createShipmentBooking,
  fetchContactMessages,
  deleteContactMessage,
  fetchSentFeedback,
  sendFeedbackToUser,
  deleteSentFeedback,
  deleteOrderApi,
  deleteCustomerApi,
  clearAllShipmentsApi
} from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
  onClose: () => void;
  onOpenWaybill: (shipment: Shipment) => void;
  onWebsiteContentUpdated?: (content: WebsiteContent) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onClose, 
  onOpenWaybill,
  onWebsiteContentUpdated 
}) => {
  const { user, profile, isAdmin: isUserAdmin, signIn } = useAuth();

  // Admin authentication state: automatically granted if signed in as admin, or via staff password/login
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isUserAdmin);
  const [staffEmail, setStaffEmail] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'SHIPMENTS' | 'NEW_SHIPMENT' | 'QUOTES' | 'CUSTOMERS' | 'ORDERS' | 'WEBSITE_CMS' | 'FEEDBACK'
  >('SHIPMENTS');

  // Supabase & Cloud Data states
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [customers, setCustomers] = useState<ProfileRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [sentFeedbackList, setSentFeedbackList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderRow | null>(null);
  const [convertingQuoteId, setConvertingQuoteId] = useState<string | null>(null);

  // Full User Booking Details Modal (to inspect all what the user booked)
  const [viewingBookingDetails, setViewingBookingDetails] = useState<ShipmentRow | null>(null);

  // User Feedback & Communication Modal / State
  const [feedbackComposer, setFeedbackComposer] = useState<{
    isOpen: boolean;
    recipientName: string;
    recipientEmail: string;
    trackingNumber: string;
    feedbackType: string;
    subject: string;
    message: string;
    contactMessageId?: string;
  }>({
    isOpen: false,
    recipientName: '',
    recipientEmail: '',
    trackingNumber: '',
    feedbackType: 'Consignment Status Update',
    subject: '',
    message: '',
  });
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // Website CMS state
  const [websiteContentData, setWebsiteContentData] = useState<WebsiteContent | null>(null);
  const [cmsSaveMsg, setCmsSaveMsg] = useState({ text: '', isError: false });
  const [cmsSection, setCmsSection] = useState<'BANNER' | 'HERO' | 'STATS' | 'ABOUT' | 'SERVICES' | 'BUSINESS' | 'CONTACT' | 'FAQS'>('HERO');

  // In-app Delete Confirmation Modal state (prevents iframe confirm() blocking)
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'shipment' | 'quote' | 'customer' | 'order' | 'message' | 'feedback';
    id: string;
    label: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status & Location Update Modal state
  const [editingShipment, setEditingShipment] = useState<ShipmentRow | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Edit Shipment Full Information Modal state
  const [editingShipmentDetails, setEditingShipmentDetails] = useState<ShipmentRow | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // New Shipment Creation state
  const [newShipmentData, setNewShipmentData] = useState({
    trackingNumber: generateTrackingNumber(true),
    senderName: '',
    senderEmail: 'operations@wto.com',
    senderPhone: '',
    senderAddress: '',
    receiverName: '',
    receiverEmail: '',
    receiverPhone: '',
    receiverAddress: '',
    origin: '',
    destination: '',
    shipmentType: 'International Airfreight',
    weight: 2.5,
    pieces: 1,
    cargoDescription: '',
    declaredValue: '',
    price: 0,
    status: 'Order Booked',
    estimatedDelivery: '3 - 5 Business Days',
    currentLocation: '',
  });
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [shipmentSuccessMsg, setShipmentSuccessMsg] = useState('');

  // Update order status state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (isUserAdmin) {
      setIsAuthenticated(true);
    }
  }, [isUserAdmin]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const getDeletedShipmentIds = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('wto_deleted_shipments') || '[]');
    } catch {
      return [];
    }
  };

  const recordDeletedShipment = (id: string, label?: string) => {
    try {
      const list = getDeletedShipmentIds();
      if (id && !list.includes(id.toLowerCase())) list.push(id.toLowerCase());
      if (label && !list.includes(label.toLowerCase())) list.push(label.toLowerCase());
      localStorage.setItem('wto_deleted_shipments', JSON.stringify(list));
    } catch (e) {
      console.warn('Error saving deleted shipments:', e);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const deletedIds = getDeletedShipmentIds();

      // 1. Fetch shipments from both Supabase & API & Local Storage
      const [shipData, apiShips, msgs, feedbackLogs] = await Promise.all([
        fetchAllShipments().catch(() => [] as ShipmentRow[]),
        fetchApiShipments().catch(() => [] as Shipment[]),
        fetchContactMessages().catch(() => [] as ContactMessage[]),
        fetchSentFeedback().catch(() => [] as any[]),
      ]);

      setContactMessages(msgs || []);
      setSentFeedbackList(feedbackLogs || []);

      // Get local cached booked shipments
      let localBooked: Shipment[] = [];
      try {
        localBooked = JSON.parse(localStorage.getItem('wto_booked_shipments') || '[]');
      } catch {}

      // Combine API and local bookings
      const allApiAndLocal = [...localBooked, ...(apiShips || [])];

      const mappedFromApi: ShipmentRow[] = allApiAndLocal.map((s: any) => ({
        id: s.id || `shp_${Date.now()}`,
        tracking_number: s.trackingNumber || s.tracking_number || '',
        customer_id: null,
        sender_name: s.sender?.name || s.sender_name || 'WTO Shipper',
        sender_email: s.sender?.email || s.sender_email || '',
        sender_phone: s.sender?.phone || s.sender_phone || '',
        sender_address: s.sender?.address ? `${s.sender.address}, ${s.sender.city || ''} ${s.sender.country || ''}` : (s.sender_address || ''),
        receiver_name: s.receiver?.name || s.receiver_name || 'Consignee',
        receiver_email: s.receiver?.email || s.receiver_email || '',
        receiver_phone: s.receiver?.phone || s.receiver_phone || '',
        receiver_address: s.receiver?.address ? `${s.receiver.address}, ${s.receiver.city || ''} ${s.receiver.country || ''}` : (s.receiver_address || ''),
        origin: s.pickupLocation || s.origin || 'Origin Gateway',
        destination: s.destination || 'Destination Hub',
        shipment_type: s.tariffType || s.packageDetails?.type || s.shipment_type || 'International Worldwide Shipping',
        transport_mode: s.transportMode || s.packageDetails?.type || s.transport_mode || 'Air Freight & Express Cargo Flights',
        cargo_description: s.packageDetails?.description || s.packageDetails?.customItemName || s.cargo_description || 'General Merchandise',
        hs_code: s.hsCode || s.packageDetails?.hsCode || s.hs_code || 'HS 8413.60',
        weight: Number(s.packageDetails?.weight) || Number(s.weight) || 5.0,
        pieces: Number(s.packageDetails?.quantity) || Number(s.pieces) || 1,
        dimensions_cm: s.packageDetails?.dimensions || s.dimensions || s.dimensions_cm || '40x30x20 cm',
        declared_value: s.packageDetails?.value || s.declared_value || '$500 USD',
        incoterms: s.incoterms || s.packageDetails?.incoterms || 'DDP',
        packaging_type: s.packageDetails?.packagingType || s.packaging_type || 'Standard Secure Box',
        is_fragile: Boolean(s.packageDetails?.isFragile ?? s.is_fragile),
        is_hazardous: Boolean(s.packageDetails?.isHazardous ?? s.is_hazardous),
        is_insured: Boolean(s.is_insured ?? true),
        pickup_date: s.pickupDate || s.pickup_date || new Date().toISOString().split('T')[0],
        special_instructions: s.specialInstructions || s.special_instructions || '',
        price: Number(s.price) || 120,
        currency: 'USD',
        status: s.status || 'Pending',
        estimated_delivery: s.estimatedDeliveryDate || s.estimated_delivery || '3 - 5 Business Days',
        current_location: s.currentLocation || s.current_location || s.pickupLocation || 'WTO Logistics Hub',
        created_at: s.createdDate || s.created_at || new Date().toISOString(),
        updated_at: s.lastUpdated || s.updated_at || new Date().toISOString(),
      }));

      // Merge Supabase + Mapped API, deduplicating by tracking_number and id
      const mergedMap = new Map<string, ShipmentRow>();

      // First add Supabase items
      for (const s of (shipData || [])) {
        const key = (s.tracking_number || s.id || '').trim().toLowerCase();
        if (key && !deletedIds.includes(key) && !deletedIds.includes(s.id?.toLowerCase())) {
          mergedMap.set(key, s);
        }
      }

      // Then add or augment with API / local bookings
      for (const s of mappedFromApi) {
        const key = (s.tracking_number || s.id || '').trim().toLowerCase();
        if (key && !deletedIds.includes(key) && !deletedIds.includes(s.id?.toLowerCase())) {
          if (!mergedMap.has(key)) {
            mergedMap.set(key, s);
          } else {
            const existing = mergedMap.get(key)!;
            mergedMap.set(key, {
              ...s,
              ...existing,
              transport_mode: existing.transport_mode || s.transport_mode,
              cargo_description: existing.cargo_description || s.cargo_description,
              hs_code: existing.hs_code || s.hs_code,
              dimensions_cm: existing.dimensions_cm || s.dimensions_cm,
              declared_value: existing.declared_value || s.declared_value,
              special_instructions: existing.special_instructions || s.special_instructions,
              incoterms: existing.incoterms || s.incoterms,
              pickup_date: existing.pickup_date || s.pickup_date,
              pieces: existing.pieces || s.pieces,
            });
          }
        }
      }

      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setShipments(mergedList);

      // 2. Fetch customers
      const custData = await fetchAllCustomers();
      setCustomers(custData || []);

      // 3. Fetch orders
      const ordData = await fetchAllOrders();
      setOrders(ordData || []);

      // 4. Fetch quotes
      const sbQuotes = await fetchAllQuotes();
      if (sbQuotes && sbQuotes.length > 0) {
        setQuotes(sbQuotes);
      } else {
        const apiQuotes = await fetchAllEnterpriseQuotes();
        setQuotes(apiQuotes || []);
      }

      // 5. Fetch website content
      const content = await fetchWebsiteContent();
      if (content) setWebsiteContentData(content);
    } catch (err: any) {
      console.warn('Notice loading admin data:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Check requested password mama123
    if (passwordInput.trim() === 'mama123') {
      setIsAuthenticated(true);
      return;
    }

    if (staffEmail) {
      try {
        await signIn({ email: staffEmail, password: passwordInput });
        setIsAuthenticated(true);
        return;
      } catch (err: any) {
        // Fall through to error
      }
    }
    
    setLoginError('Invalid access password. Please enter the authorized Admin password.');
  };

  // Convert to frontend Shipment for waybill view
  const toWaybillShipment = (row: ShipmentRow): Shipment => {
    return {
      id: row.id,
      trackingNumber: row.tracking_number,
      sender: {
        name: row.sender_name,
        email: '',
        phone: '',
        address: row.origin,
        city: row.origin,
        state: '',
      },
      receiver: {
        name: row.receiver_name,
        email: '',
        phone: '',
        address: row.destination,
        city: row.destination,
        state: '',
      },
      packageDetails: {
        type: row.shipment_type,
        customItemName: row.shipment_type,
        description: `${row.shipment_type} (${row.weight} kg)`,
        weight: Number(row.weight) || 1,
        quantity: 1,
        value: 'Standard Customs Tariff',
        speed: row.shipment_type.includes('Express') ? 'Express' : 'Standard',
      },
      pickupLocation: row.origin,
      destination: row.destination,
      price: Number(row.weight) * 45,
      tariffType: 'Official Assessed Freight Tariff',
      status: (row.status as any) || 'In Transit',
      createdDate: new Date(row.created_at).toLocaleDateString(),
      estimatedDeliveryDate: row.estimated_delivery || '3 - 5 Business Days',
      lastUpdated: new Date(row.updated_at).toLocaleString(),
      currentLocation: row.current_location || row.origin,
      timeline: [],
    };
  };

  // Handle Create Shipment
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShipmentData.senderName || !newShipmentData.receiverName || !newShipmentData.origin || !newShipmentData.destination) {
      alert('Please fill in sender, recipient, origin, and destination.');
      return;
    }

    setCreatingShipment(true);
    setShipmentSuccessMsg('');

    try {
      let createdTracking = newShipmentData.trackingNumber;

      // 1. Try Supabase create
      try {
        const created = await createShipment({
          trackingNumber: newShipmentData.trackingNumber,
          senderName: newShipmentData.senderName,
          senderEmail: newShipmentData.senderEmail,
          senderPhone: newShipmentData.senderPhone,
          senderAddress: newShipmentData.senderAddress,
          receiverName: newShipmentData.receiverName,
          receiverEmail: newShipmentData.receiverEmail,
          receiverPhone: newShipmentData.receiverPhone,
          receiverAddress: newShipmentData.receiverAddress,
          origin: newShipmentData.origin,
          destination: newShipmentData.destination,
          shipmentType: newShipmentData.shipmentType,
          cargoDescription: newShipmentData.cargoDescription,
          weight: Number(newShipmentData.weight) || 1,
          pieces: Number(newShipmentData.pieces) || 1,
          declaredValue: newShipmentData.declaredValue,
          price: Number(newShipmentData.price) || (Number(newShipmentData.weight) || 1) * 45,
          status: newShipmentData.status,
          estimatedDelivery: newShipmentData.estimatedDelivery,
          currentLocation: newShipmentData.currentLocation || newShipmentData.origin,
        });
        createdTracking = created.tracking_number;
      } catch (sbErr) {
        console.warn('Supabase create notice (syncing to local API):', sbErr);
      }

      // 2. Also register via server API for full synchronization
      await createShipmentBooking({
        sender: {
          name: newShipmentData.senderName,
          email: newShipmentData.senderEmail,
          phone: newShipmentData.senderPhone,
          address: newShipmentData.senderAddress || newShipmentData.origin,
          city: newShipmentData.origin,
          state: 'Origin Hub',
        },
        receiver: {
          name: newShipmentData.receiverName,
          email: newShipmentData.receiverEmail,
          phone: newShipmentData.receiverPhone,
          address: newShipmentData.receiverAddress || newShipmentData.destination,
          city: newShipmentData.destination,
          state: 'Destination Hub',
        },
        pickupLocation: newShipmentData.origin,
        destination: newShipmentData.destination,
        tariffType: newShipmentData.shipmentType,
        packageDetails: {
          type: newShipmentData.shipmentType,
          description: `${newShipmentData.cargoDescription || newShipmentData.shipmentType} (${newShipmentData.weight}kg)`,
          weight: Number(newShipmentData.weight) || 1,
          quantity: Number(newShipmentData.pieces) || 1,
          value: newShipmentData.declaredValue || '$1,500 USD',
          speed: newShipmentData.shipmentType.includes('Express') ? 'Express' : 'Standard',
        },
        trackingNumber: createdTracking,
        estimatedDeliveryDate: newShipmentData.estimatedDelivery,
        price: Number(newShipmentData.price) || (Number(newShipmentData.weight) || 1) * 45,
      });

      setShipmentSuccessMsg(`Consignment ${createdTracking} created and booked into WTO International Network!`);
      showToast(`Consignment ${createdTracking} created!`);
      await loadAllData();

      // Reset form with a fresh tracking number
      setNewShipmentData({
        trackingNumber: generateTrackingNumber(true),
        senderName: '',
        senderEmail: 'operations@wto.com',
        senderPhone: '',
        senderAddress: '',
        receiverName: '',
        receiverEmail: '',
        receiverPhone: '',
        receiverAddress: '',
        origin: '',
        destination: '',
        shipmentType: 'International Airfreight',
        weight: 2.5,
        pieces: 1,
        cargoDescription: '',
        declaredValue: '',
        price: 0,
        status: 'Order Booked',
        estimatedDelivery: '3 - 5 Business Days',
        currentLocation: '',
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to create shipment.');
    } finally {
      setCreatingShipment(false);
    }
  };

  // Handle Update Status & Location
  const handleUpdateStatusAndLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;

    setUpdatingStatus(true);
    try {
      const loc = newLocation || editingShipment.current_location || editingShipment.origin;
      const note = statusNote || `Status updated to ${newStatus} at facility ${loc}.`;

      // 1. Try Supabase milestone
      try {
        await addShipmentMilestone({
          shipmentId: editingShipment.id,
          status: newStatus,
          location: loc,
          description: note,
        });
      } catch (sbErr) {
        console.warn('Supabase milestone notice (syncing via API):', sbErr);
      }

      // 2. Sync to local API
      await updateShipmentFullApi(editingShipment.id, {
        status: newStatus,
        currentLocation: loc,
        note: note,
      });

      showToast(`Shipment ${editingShipment.tracking_number} status updated to ${newStatus}`);
      await loadAllData();
      setEditingShipment(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update shipment status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Save Full Shipment Details
  const handleSaveShipmentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipmentDetails) return;

    setSavingDetails(true);
    try {
      try {
        await updateShipment(editingShipmentDetails.id, {
          sender_name: editingShipmentDetails.sender_name,
          receiver_name: editingShipmentDetails.receiver_name,
          origin: editingShipmentDetails.origin,
          destination: editingShipmentDetails.destination,
          shipment_type: editingShipmentDetails.shipment_type,
          weight: Number(editingShipmentDetails.weight) || 1,
          estimated_delivery: editingShipmentDetails.estimated_delivery,
        });
      } catch (sbErr) {
        console.warn('Supabase update notice:', sbErr);
      }

      await updateShipmentFullApi(editingShipmentDetails.id, {
        senderName: editingShipmentDetails.sender_name,
        receiverName: editingShipmentDetails.receiver_name,
        origin: editingShipmentDetails.origin,
        destination: editingShipmentDetails.destination,
        shipmentType: editingShipmentDetails.shipment_type,
        weight: Number(editingShipmentDetails.weight) || 1,
        estimatedDeliveryDate: editingShipmentDetails.estimated_delivery,
      });

      showToast(`Shipment ${editingShipmentDetails.tracking_number} details saved.`);
      await loadAllData();
      setEditingShipmentDetails(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save shipment details.');
    } finally {
      setSavingDetails(false);
    }
  };

  // Handle Delete Confirmation Execution
  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const { type, id, label } = itemToDelete;

    try {
      if (type === 'shipment') {
        // Record in deleted tracking numbers / ids so it never resurrects
        recordDeletedShipment(id, label);

        // 1. Optimistically remove from UI immediately
        setShipments((prev) => prev.filter((s) => s.id !== id && s.tracking_number !== label));

        // 2. Remove in Supabase (cascades timeline updates and orders)
        try {
          await deleteShipment(id);
          if (label && label !== id) {
            await deleteShipment(label);
          }
        } catch (sbErr) {
          console.warn('Supabase delete notice:', sbErr);
        }

        // 3. Remove in backend API server memory store
        try {
          await deleteShipmentApi(id);
          if (label && label !== id) {
            await deleteShipmentApi(label);
          }
        } catch (apiErr) {
          console.warn('Backend API delete notice:', apiErr);
        }

        // 4. Remove from client local storage cache
        try {
          const cached = JSON.parse(localStorage.getItem('wto_booked_shipments') || '[]');
          const updated = cached.filter((s: any) => s.id !== id && s.trackingNumber !== label && s.tracking_number !== label);
          localStorage.setItem('wto_booked_shipments', JSON.stringify(updated));
        } catch {}

        showToast(`Consignment ${label} permanently deleted.`);
      } else if (type === 'quote') {
        setQuotes((prev) =>
          prev.filter((q) => q.id !== id && (q.quote_reference || q.quoteReference) !== label)
        );
        try {
          await deleteQuoteApi(id);
        } catch (err) {
          console.warn('Quote delete notice:', err);
        }
        showToast(`Quotation ${label} deleted.`);
      } else if (type === 'customer') {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        try {
          await deleteProfile(id);
          await deleteCustomerApi(id);
        } catch (err) {
          console.warn('Customer delete notice:', err);
        }
        showToast(`Customer account record removed.`);
      } else if (type === 'order') {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        try {
          await deleteOrder(id);
          await deleteOrderApi(id);
        } catch (err) {
          console.warn('Order delete notice:', err);
        }
        showToast(`Order record deleted.`);
      } else if (type === 'message') {
        setContactMessages((prev) => prev.filter((m) => m.id !== id));
        try {
          await deleteContactMessage(id);
        } catch (err) {
          console.warn('Message delete notice:', err);
        }
        showToast(`Customer inquiry deleted.`);
      } else if (type === 'feedback') {
        setSentFeedbackList((prev) => prev.filter((f) => f.id !== id));
        try {
          await deleteSentFeedback(id);
        } catch (err) {
          console.warn('Feedback delete notice:', err);
        }
        showToast(`Feedback log entry deleted.`);
      }

      setItemToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to complete deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Trigger Delete Dialogs
  const handleDeleteShipment = (id: string, tracking: string) => {
    setItemToDelete({
      type: 'shipment',
      id,
      label: tracking,
    });
  };

  const handleDeleteQuote = (id: string, ref: string) => {
    setItemToDelete({
      type: 'quote',
      id,
      label: ref,
    });
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    setItemToDelete({
      type: 'customer',
      id,
      label: name,
    });
  };

  const handleDeleteOrder = (id: string) => {
    setItemToDelete({
      type: 'order',
      id,
      label: `Order ${id.slice(0, 8)}`,
    });
  };

  const handleDeleteMessage = (id: string, name: string) => {
    setItemToDelete({
      type: 'message',
      id,
      label: `Inquiry from ${name}`,
    });
  };

  const handleDeleteFeedback = (id: string, recipient: string) => {
    setItemToDelete({
      type: 'feedback',
      id,
      label: `Notice to ${recipient}`,
    });
  };

  // Quick Open Feedback Composer from any shipment or message
  const handleOpenFeedbackForShipment = (s: ShipmentRow) => {
    setFeedbackComposer({
      isOpen: true,
      recipientName: s.sender_name || 'Valued Consignor',
      recipientEmail: s.sender_email || '',
      trackingNumber: s.tracking_number,
      feedbackType: 'Consignment Status Update',
      subject: `WTO Consignment Update [${s.tracking_number}] - Current Status: ${s.status}`,
      message: `Dear ${s.sender_name || 'Shipper/Consignee'},\n\nThis is an official operational update regarding your WTO consignment #${s.tracking_number} routed from ${s.origin} to ${s.destination}.\n\nCurrent Status: ${s.status}\nCurrent Location: ${s.current_location || s.origin}\nEstimated Delivery: ${s.estimated_delivery}\n\nPlease let us know if you require any customs documentation assistance or expedited clearance.\n\nBest regards,\nWTO Central Operations Desk\noverseasworldtransport@gmail.com`,
    });
  };

  const handleOpenFeedbackForMessage = (m: ContactMessage) => {
    setFeedbackComposer({
      isOpen: true,
      recipientName: m.name,
      recipientEmail: m.email,
      trackingNumber: '',
      feedbackType: 'Customer Inquiry Response',
      subject: `Re: ${m.subject || 'Your Logistics Inquiry to World Transport Overseas'}`,
      message: `Dear ${m.name},\n\nThank you for reaching out to World Transport Overseas (WTO) regarding "${m.subject}".\n\n[Write your response details here]\n\nOur 24/7 global freight team is at your disposal for any international shipping, customs brokerage, and cargo charters.\n\nWarm regards,\nWTO Customer Relations & Dispatch Desk\noverseasworldtransport@gmail.com`,
      contactMessageId: m.id,
    });
  };

  // Execute Dispatching Feedback
  const handleSendFeedback = async () => {
    if (!feedbackComposer.recipientEmail || !feedbackComposer.subject || !feedbackComposer.message) {
      alert('Please fill out the recipient email, subject line, and message body.');
      return;
    }
    setSendingFeedback(true);
    try {
      const res = await sendFeedbackToUser({
        recipientName: feedbackComposer.recipientName,
        recipientEmail: feedbackComposer.recipientEmail,
        trackingNumber: feedbackComposer.trackingNumber,
        feedbackType: feedbackComposer.feedbackType,
        subject: feedbackComposer.subject,
        message: feedbackComposer.message,
        contactMessageId: feedbackComposer.contactMessageId,
      });

      if (res.success) {
        showToast(`Feedback successfully sent to ${feedbackComposer.recipientEmail}`);
        setFeedbackComposer({
          isOpen: false,
          recipientName: '',
          recipientEmail: '',
          trackingNumber: '',
          feedbackType: 'Consignment Status Update',
          subject: '',
          message: '',
        });
        // Refresh feedback list and messages
        const updatedFeedbacks = await fetchSentFeedback();
        setSentFeedbackList(updatedFeedbacks || []);
        const updatedMsgs = await fetchContactMessages();
        setContactMessages(updatedMsgs || []);
      } else {
        alert(res.error || 'Failed to dispatch feedback.');
      }
    } catch (err: any) {
      alert(err.message || 'Error transmitting feedback.');
    } finally {
      setSendingFeedback(false);
    }
  };

  // Handle Order Status Toggle (Paid / Pending)
  const handleTogglePaymentStatus = async (order: OrderRow) => {
    const nextStatus = order.payment_status === 'paid' ? 'pending' : 'paid';
    setUpdatingOrderId(order.id);
    try {
      try {
        await updateOrderStatus({
          orderId: order.id,
          paymentStatus: nextStatus as any,
          orderStatus: nextStatus === 'paid' ? 'confirmed' : 'processing',
        });
      } catch (sbErr) {
        console.warn('Supabase order update notice:', sbErr);
      }
      showToast(`Order ${order.id.slice(0, 8)} marked as ${nextStatus.toUpperCase()}`);
      await loadAllData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle Convert Quote to Live Consignment
  const handleConvertQuoteToShipment = async (quote: any) => {
    const quoteId = quote.id || quote.quote_reference || quote.quoteReference;
    setConvertingQuoteId(quoteId);
    try {
      const res = await convertQuoteToShipmentApi(quoteId);
      if (res.success) {
        showToast(`Quotation converted to live shipment: ${res.shipment?.trackingNumber}!`);
        await loadAllData();
        setActiveTab('SHIPMENTS');
      } else {
        alert(res.error || 'Failed to convert quotation.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to convert quotation.');
    } finally {
      setConvertingQuoteId(null);
    }
  };

  // Handle Update Quote Status
  const handleUpdateQuoteStatus = async (quoteId: string, status: string) => {
    try {
      await updateQuoteApi(quoteId, { status });
      showToast(`Quotation status set to ${status}`);
      await loadAllData();
    } catch (err: any) {
      alert('Failed to update quote status.');
    }
  };

  // Export Shipments to CSV
  const handleExportCSV = () => {
    if (shipments.length === 0) {
      alert('No shipments to export.');
      return;
    }
    const headers = [
      'Tracking Number',
      'Sender Name',
      'Sender City/Origin',
      'Receiver Name',
      'Destination',
      'Shipment Type',
      'Weight (kg)',
      'Current Location',
      'Status',
      'Estimated Delivery',
      'Created Date'
    ];

    const rows = shipments.map(s => [
      `"${s.tracking_number}"`,
      `"${s.sender_name}"`,
      `"${s.origin}"`,
      `"${s.receiver_name}"`,
      `"${s.destination}"`,
      `"${s.shipment_type}"`,
      s.weight,
      `"${s.current_location || s.origin}"`,
      `"${s.status}"`,
      `"${s.estimated_delivery}"`,
      `"${new Date(s.created_at).toLocaleDateString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WTO_Consignments_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Consignments Manifest CSV downloaded.');
  };

  // Filtered shipments with statusFilter & search
  const filteredShipments = shipments.filter((s) => {
    const matchesStatus = statusFilter === 'ALL' || s.status.toLowerCase() === statusFilter.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (
      s.tracking_number.toLowerCase().includes(q) ||
      s.sender_name.toLowerCase().includes(q) ||
      s.receiver_name.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
    return matchesStatus && matchesSearch;
  });

  // Filtered quotes
  const filteredQuotes = quotes.filter((q) => {
    const s = searchQuery.toLowerCase();
    const ref = (q.quote_reference || q.quoteReference || '').toLowerCase();
    const name = (q.customer_name || q.customerName || '').toLowerCase();
    const email = (q.customer_email || q.customerEmail || '').toLowerCase();
    const orig = (q.origin || '').toLowerCase();
    const dest = (q.destination || '').toLowerCase();
    return !s || ref.includes(s) || name.includes(s) || email.includes(s) || orig.includes(s) || dest.includes(s);
  });

  // Filtered customers
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      c.role.toLowerCase().includes(q)
    );
  });

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.payment_status.toLowerCase().includes(q) ||
      o.order_status.toLowerCase().includes(q) ||
      (o.shipment?.tracking_number && o.shipment.tracking_number.toLowerCase().includes(q))
    );
  });

  // ==============================================================================
  // LOGIN SCREEN
  // ==============================================================================
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white flex items-center justify-center mx-auto shadow-md border border-slate-200 p-1">
              <img src={wtoLogoImg} alt="WTO Official Emblem" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-xl font-extrabold text-[#0F2942] font-heading">
              WTO Admin Management Suite
            </h2>
            <p className="text-xs text-slate-500">
              Restricted portal. Enter the admin master password to access.
            </p>
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Staff Email (Optional if using master code)
              </label>
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="staff@wto.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Admin Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 pl-9 pr-10 text-slate-800 font-bold tracking-wider"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 shadow-md text-xs"
            >
              Sign In to Admin Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==============================================================================
  // AUTHENTICATED ADMIN DASHBOARD
  // ==============================================================================
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 rounded-3xl w-full max-w-7xl max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* Top Header */}
        <div className="bg-[#0F2942] text-white px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight font-heading">
                  WTO International Shipping Management Suite
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Realtime Cloud Sync</span>
                </span>
              </div>
              <span className="text-xs text-slate-300">
                Connected User: {user?.email || 'admin@wto.com'} • Active Master Dispatch Desk
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
              title="Download Consignments CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
              title="Print Manifest / Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Log</span>
            </button>
            <button
              onClick={loadAllData}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-300 transition-colors"
            >
              Logout
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-6 py-2.5 flex items-center justify-between shadow-inner animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage('')} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* Operational KPI Metric Strip */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Consignments</span>
            <span className="text-lg font-black text-[#0F2942] font-heading">{shipments.length}</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">In Transit / Hub</span>
            <span className="text-lg font-black text-orange-600 font-heading">
              {shipments.filter(s => s.status !== 'Delivered' && s.status !== 'Pending').length}
            </span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Delivered Final-Mile</span>
            <span className="text-lg font-black text-emerald-600 font-heading">
              {shipments.filter(s => s.status === 'Delivered').length}
            </span>
          </div>
          <div 
            onClick={() => setActiveTab('QUOTES')}
            className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 transition-colors"
          >
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Freight RFQ Quotes</span>
            <div className="flex items-center space-x-1">
              <span className="text-lg font-black text-purple-700 font-heading">{quotes.length}</span>
              <span className="text-[10px] text-purple-500 font-bold ml-1">Inquiries</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Invoiced Billing</span>
            <span className="text-lg font-black text-[#0F2942] font-heading">
              ${orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center gap-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('SHIPMENTS')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all ${
              activeTab === 'SHIPMENTS'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4 text-orange-400" />
            <span>Manage Shipments ({shipments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('NEW_SHIPMENT')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all ${
              activeTab === 'NEW_SHIPMENT'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Shipment (Gen Tracking)</span>
          </button>

          <button
            onClick={() => setActiveTab('QUOTES')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all ${
              activeTab === 'QUOTES'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Freight Quotations ({quotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all ${
              activeTab === 'CUSTOMERS'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Customers ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all ${
              activeTab === 'ORDERS'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Orders & Invoices ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('WEBSITE_CMS')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all ${
              activeTab === 'WEBSITE_CMS'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layout className="w-4 h-4 text-pink-400" />
            <span>Website CMS</span>
          </button>

          <button
            onClick={() => setActiveTab('FEEDBACK')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all ${
              activeTab === 'FEEDBACK'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Customer Feedback & Messages ({contactMessages.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: MANAGE SHIPMENTS */}
          {/* ======================================================== */}
          {activeTab === 'SHIPMENTS' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0F2942] font-heading">
                    Active Consignments & Live Tracking Data
                  </h3>
                  <p className="text-xs text-slate-500">
                    Realtime consignment manifest. Update operational status, facility checkpoints, or edit waybills.
                  </p>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tracking, sender, destination..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 pl-9 pr-8 text-xs text-slate-800"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {(searchQuery || statusFilter !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('ALL');
                      }}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1 shrink-0 cursor-pointer"
                      title="Clear and reset filters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Clear Filter</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('NEW_SHIPMENT')}
                    className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New</span>
                  </button>
                  {shipments.length > 0 && (
                    <button
                      onClick={() => setShowClearAllModal(true)}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-1 shrink-0 cursor-pointer"
                      title="Clear all shipments"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span className="hidden sm:inline">Clear All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                <span className="text-[11px] text-slate-400 uppercase font-bold mr-1">Filter:</span>
                {[
                  { id: 'ALL', label: 'All Statuses' },
                  { id: 'Order Booked', label: 'Order Booked' },
                  { id: 'Picked Up', label: 'Picked Up' },
                  { id: 'Warehouse Sorting', label: 'Warehouse Sorting' },
                  { id: 'In Transit', label: 'In Transit' },
                  { id: 'At Destination', label: 'At Destination' },
                  { id: 'Out for Delivery', label: 'Out for Delivery' },
                  { id: 'Delivered', label: 'Delivered' },
                  { id: 'Pending', label: 'Pending' }
                ].map(pill => (
                  <button
                    key={pill.id}
                    onClick={() => setStatusFilter(pill.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                      statusFilter === pill.id
                        ? 'bg-[#0F2942] text-white font-bold shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Tracking Number</th>
                      <th className="px-4 py-3">Sender & Recipient</th>
                      <th className="px-4 py-3">Route (Origin → Destination)</th>
                      <th className="px-4 py-3">Type & Weight</th>
                      <th className="px-4 py-3">Current Location</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredShipments.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#0F2942]">
                          {s.tracking_number}
                          <span className="block font-sans text-[10px] text-slate-400 font-normal">
                            {new Date(s.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 block">{s.sender_name}</span>
                          <span className="text-slate-500 text-[11px]">→ {s.receiver_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800">{s.origin}</span>
                          <span className="text-slate-400 block text-[11px]">→ {s.destination}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800">{s.shipment_type}</span>
                          <span className="text-slate-400 block text-[11px]">{s.weight} kg</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-orange-700 flex items-center space-x-1 mt-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{s.current_location || s.origin}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            s.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'Warehouse Sorting'
                              ? 'bg-amber-100 text-amber-800'
                              : s.status === 'Out for Delivery'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setViewingBookingDetails(s)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                              title="View Full Booking Manifest"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Details</span>
                            </button>
                            <button
                              onClick={() => handleOpenFeedbackForShipment(s)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                              title="Send Feedback or Notice to User"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Feedback</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingShipment(s);
                                setNewStatus(s.status);
                                setNewLocation(s.current_location || s.origin);
                                setStatusNote('');
                              }}
                              className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                              title="Update Status and Location"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>Status</span>
                            </button>
                            <button
                              onClick={() => setEditingShipmentDetails(s)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                              title="Edit Full Information"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onOpenWaybill(toWaybillShipment(s))}
                              className="px-2 py-1 bg-[#0F2942] hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Waybill"
                            >
                              <FileText className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteShipment(s.id, s.tracking_number)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs cursor-pointer"
                              title="Delete Consignment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ADD SHIPMENT (AUTOMATIC TRACKING NUMBER) */}
          {/* ======================================================== */}
          {activeTab === 'NEW_SHIPMENT' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 max-w-4xl mx-auto animate-in fade-in">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-[#0F2942] font-heading">
                    Add Consignment to Supabase Database
                  </h3>
                  <p className="text-xs text-slate-500">
                    Creates row in <code>shipments</code>, logs initial status in <code>shipment_updates</code>, and registers invoice in <code>orders</code>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setNewShipmentData({ ...newShipmentData, trackingNumber: generateTrackingNumber(true) })}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate New Tracking No.</span>
                </button>
              </div>

              {shipmentSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{shipmentSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Tracking Number (Generated) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.trackingNumber}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, trackingNumber: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Sender Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.senderName}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, senderName: e.target.value })}
                      placeholder="e.g. Alhaji Babatunde Alabi"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.receiverName}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, receiverName: e.target.value })}
                      placeholder="e.g. Nikolai Dimitrov"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Origin Location * (Self-Input)
                    </label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.origin}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, origin: e.target.value })}
                      placeholder="Enter departure city, port, or terminal..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Destination Location * (Self-Input)
                    </label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.destination}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, destination: e.target.value })}
                      placeholder="Enter destination city, port, or hub..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Shipment Type
                    </label>
                    <select
                      value={newShipmentData.shipmentType}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, shipmentType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                    >
                      <option value="Air Flight & Express Cargo">Air Flight & Express Cargo</option>
                      <option value="International Airfreight">International Airfreight</option>
                      <option value="Ocean Freight Container">Ocean Freight Container</option>
                      <option value="Intercontinental Rail Cargo">Intercontinental Rail Cargo</option>
                      <option value="Trans-Continental Truck Haulage">Trans-Continental Truck Haulage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newShipmentData.weight}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, weight: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Initial Status
                    </label>
                    <select
                      value={newShipmentData.status}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, status: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Order Booked">Order Booked</option>
                      <option value="Picked Up">Picked Up</option>
                      <option value="Warehouse Sorting">Warehouse Sorting</option>
                      <option value="In Transit">In Transit</option>
                      <option value="At Destination">At Destination</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Current Location
                    </label>
                    <input
                      type="text"
                      value={newShipmentData.currentLocation}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, currentLocation: e.target.value })}
                      placeholder="Defaults to Origin"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingShipment}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/30 flex items-center space-x-2"
                  >
                    <span>{creatingShipment ? 'Saving to Supabase...' : 'Save Shipment & Issue Tracking ID'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: FREIGHT RFQ QUOTATIONS */}
          {/* ======================================================== */}
          {activeTab === 'QUOTES' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0F2942] font-heading">
                    Freight Quotation Inquiries & Commercial RFQs
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live quotation inquiries received from the public website portal. Convert inquiries to active consignments with 1-click.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search quote ref, client, route..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 pl-9 text-xs text-slate-800"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Quote Reference</th>
                      <th className="px-4 py-3">Shipper / Company</th>
                      <th className="px-4 py-3">Route Corridor</th>
                      <th className="px-4 py-3">Transport & Cargo</th>
                      <th className="px-4 py-3">Tariff Estimate</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQuotes.map((q) => {
                      const quoteRef = q.quote_reference || q.quoteReference || `WTO-QT-${q.id.slice(-6)}`;
                      const custName = q.customer_name || q.customerName || 'Corporate Shipper';
                      const custEmail = q.customer_email || q.customerEmail || '';
                      const origin = q.origin || 'Origin Hub';
                      const dest = q.destination || 'Destination Hub';
                      const mode = q.transport_mode || q.transportMode || 'Air Freight';
                      const weight = q.weight || 1;
                      const price = q.estimated_price || q.estimatedPrice || 0;
                      const status = q.status || 'Active';
                      const createdDate = q.created_at ? new Date(q.created_at).toLocaleDateString() : (q.createdDate ? new Date(q.createdDate).toLocaleDateString() : 'Today');

                      return (
                        <tr key={q.id || quoteRef} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-[#0F2942]">
                            {quoteRef}
                            <span className="block font-sans text-[10px] text-slate-400 font-normal">
                              {createdDate}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 block">{custName}</span>
                            <span className="text-slate-500 text-[11px]">{custEmail}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800">{origin}</span>
                            <span className="text-slate-400 block text-[11px]">→ {dest}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800">{mode}</span>
                            <span className="text-slate-400 block text-[11px]">{weight} kg</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-700">
                            ${Number(price).toLocaleString()} USD
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              status === 'Converted' || status === 'Booked'
                                ? 'bg-emerald-100 text-emerald-800'
                                : status === 'Accepted'
                                ? 'bg-blue-100 text-blue-800'
                                : status === 'Quoted'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {status !== 'Converted' && (
                                <button
                                  disabled={convertingQuoteId === (q.id || quoteRef)}
                                  onClick={() => handleConvertQuoteToShipment(q)}
                                  className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1 cursor-pointer transition-all disabled:opacity-50"
                                  title="Convert Quote into Live Shipment with Tracking ID"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>{convertingQuoteId === (q.id || quoteRef) ? 'Converting...' : 'Book Consignment'}</span>
                                </button>
                              )}

                              <button
                                onClick={async () => {
                                  const subject = `Official WTO Commercial Freight Quotation Ref: ${quoteRef}`;
                                  const body = `Dear ${custName},\n\nThank you for requesting an official international freight quotation from World Transport Overseas (WTO).\n\nCORRIDOR: ${origin} → ${dest}\nSERVICE: ${mode}\nWEIGHT: ${weight} kg\nESTIMATED TARIFF: $${price} USD\n\nPlease reply directly to this notice or contact overseasworldtransport@gmail.com with your cargo readiness date.\n\nBest regards,\nWTO Central Logistics Operations Desk\nSofia, Bulgaria HQ | Lagos Regional Hub`;
                                  await sendEmailNotification({
                                    recipientEmail: custEmail || 'overseasworldtransport@gmail.com',
                                    subject,
                                    body,
                                    type: 'quote_inquiry'
                                  });
                                  showToast(`Quotation email dispatched to ${custEmail || 'client'}`);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                                title="Send Formal Quote Email"
                              >
                                <Mail className="w-3 h-3" />
                              </button>

                              <button
                                onClick={() => handleDeleteQuote(q.id || quoteRef, quoteRef)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs"
                                title="Delete Quote"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredQuotes.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-xs">
                  No quotation inquiries found. Customers can submit quote requests from the &quot;Get a Freight Quote&quot; section on the homepage.
                </div>
              )}
            </div>
          )}
          {/* ======================================================== */}
          {activeTab === 'CUSTOMERS' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0F2942] font-heading">
                    Registered Customers (Supabase <code>profiles</code> table)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Accounts registered through Supabase Authentication.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search customer name or email..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 pl-9 text-xs text-slate-800"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Customer ID</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Registered Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">
                          {c.id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {c.full_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {c.email}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {c.phone || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            c.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {c.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setItemToDelete({ type: 'customer', id: c.id, label: c.full_name || c.email })}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredCustomers.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No customers found.
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: ORDERS & PAYMENT STATUS */}
          {/* ======================================================== */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0F2942] font-heading">
                    Orders & Payment Status Management
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live from Supabase <code>orders</code> table. Review and toggle payment verification.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by order or tracking..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 pl-9 text-xs text-slate-800"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Associated Tracking</th>
                      <th className="px-4 py-3">Tariff Amount</th>
                      <th className="px-4 py-3">Payment Status</th>
                      <th className="px-4 py-3">Order Status</th>
                      <th className="px-4 py-3">Created Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#0F2942]">
                          ORD-{o.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                          {o.shipment?.tracking_number || '—'}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          ${o.amount || '45.00'} USD
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            o.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {o.payment_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {o.order_status}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(o.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setSelectedInvoiceOrder(o)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-[#0F2942] hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                              title="View Official Invoice Receipt"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>
                            <button
                              disabled={updatingOrderId === o.id}
                              onClick={() => handleTogglePaymentStatus(o)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                o.payment_status === 'paid'
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {updatingOrderId === o.id
                                ? 'Updating...'
                                : o.payment_status === 'paid'
                                ? 'Mark as Pending'
                                : 'Mark as Paid ✓'}
                            </button>
                            <button
                              onClick={() => setItemToDelete({ type: 'order', id: o.id, label: `ORD-${o.id.substring(0, 8).toUpperCase()}` })}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="Delete Order Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredOrders.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No orders recorded yet.
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: COMPREHENSIVE LIVE WEBSITE CMS (EDIT WHOLE WEBSITE) */}
          {/* ======================================================== */}
          {activeTab === 'WEBSITE_CMS' && websiteContentData && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-8 max-w-5xl mx-auto animate-in fade-in shadow-xs">
              
              {/* Header with Title and Quick Save Button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="text-xl font-extrabold text-[#0F2942] font-heading">
                      Live Website Content Management (Full CMS)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Edit headlines, announcements, services, stats, about texts, company addresses, and FAQs across the entire website.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setCmsSaveMsg({ text: 'Publishing changes...', isError: false });
                    try {
                      const res = await updateWebsiteContent(websiteContentData);
                      if (res.success) {
                        setCmsSaveMsg({ text: 'All website changes successfully published live!', isError: false });
                        showToast('Website content updated live!');
                        onWebsiteContentUpdated?.(websiteContentData);
                      } else {
                        setCmsSaveMsg({ text: res.error || 'Failed to save changes.', isError: true });
                      }
                    } catch (err: any) {
                      setCmsSaveMsg({ text: err.message, isError: true });
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 flex items-center space-x-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Publish All Changes Live</span>
                </button>
              </div>

              {/* Status Message */}
              {cmsSaveMsg.text && (
                <div className={`p-4 rounded-2xl text-xs flex items-center space-x-2.5 ${
                  cmsSaveMsg.isError 
                    ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{cmsSaveMsg.text}</span>
                </div>
              )}

              {/* CMS Category Sub-Navigation Pills */}
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
                {[
                  { id: 'BANNER', label: '📢 Notice Banner' },
                  { id: 'HERO', label: '🚀 Hero Headline' },
                  { id: 'STATS', label: '📊 Statistics' },
                  { id: 'ABOUT', label: '🏢 About & Values' },
                  { id: 'SERVICES', label: '✈️ Services' },
                  { id: 'BUSINESS', label: '💼 Corporate' },
                  { id: 'CONTACT', label: '📍 Contact & HQ' },
                  { id: 'FAQS', label: '❓ FAQ Section' },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setCmsSection(sec.id as any)}
                    className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                      cmsSection === sec.id
                        ? 'bg-[#0F2942] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>

              {/* SECTION 1: NOTICE BANNER */}
              {cmsSection === 'BANNER' && (
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-sm text-[#0F2942]">Top Announcement Notice Banner</h4>
                      <p className="text-xs text-slate-500">Appears at the very top of the screen above the header.</p>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={websiteContentData.noticeBanner?.enabled ?? true}
                        onChange={(e) => setWebsiteContentData({
                          ...websiteContentData,
                          noticeBanner: {
                            ...websiteContentData.noticeBanner,
                            enabled: e.target.checked,
                            text: websiteContentData.noticeBanner?.text || '24/7 Global Air & Maritime Shipping Network • 190+ Countries Worldwide',
                          },
                        })}
                        className="rounded text-orange-500 focus:ring-orange-400 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Enable Banner</span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Banner Announcement Text</label>
                    <input
                      type="text"
                      value={websiteContentData.noticeBanner?.text || ''}
                      onChange={(e) => setWebsiteContentData({
                        ...websiteContentData,
                        noticeBanner: {
                          ...websiteContentData.noticeBanner,
                          enabled: true,
                          text: e.target.value,
                        },
                      })}
                      placeholder="e.g. 24/7 Global Air & Maritime Shipping Network • 190+ Countries Worldwide"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-semibold"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <span>Official inquiries email displayed on banner: <strong>overseasworldtransport@gmail.com</strong></span>
                  </div>
                </div>
              )}

              {/* SECTION 2: HERO */}
              {cmsSection === 'HERO' && (
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-[#0F2942] pb-2 border-b border-slate-200">
                      Hero Section (Homepage Cover)
                    </h4>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Top Trust Badge / Pill Text</label>
                    <input
                      type="text"
                      value={websiteContentData.hero.badgeText || ''}
                      onChange={(e) => setWebsiteContentData({
                        ...websiteContentData,
                        hero: { ...websiteContentData.hero, badgeText: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Main Headline</label>
                    <input
                      type="text"
                      value={websiteContentData.hero.headline}
                      onChange={(e) => setWebsiteContentData({
                        ...websiteContentData,
                        hero: { ...websiteContentData.hero, headline: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-extrabold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Subheading / Description</label>
                    <textarea
                      rows={3}
                      value={websiteContentData.hero.subheading}
                      onChange={(e) => setWebsiteContentData({
                        ...websiteContentData,
                        hero: { ...websiteContentData.hero, subheading: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Primary CTA Button Text</label>
                      <input
                        type="text"
                        value={websiteContentData.hero.primaryCtaText || 'Book International Shipment'}
                        onChange={(e) => setWebsiteContentData({
                          ...websiteContentData,
                          hero: { ...websiteContentData.hero, primaryCtaText: e.target.value }
                        })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Secondary CTA Button Text</label>
                      <input
                        type="text"
                        value={websiteContentData.hero.secondaryCtaText || 'Track Consignment'}
                        onChange={(e) => setWebsiteContentData({
                          ...websiteContentData,
                          hero: { ...websiteContentData.hero, secondaryCtaText: e.target.value }
                        })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: STATISTICS */}
              {cmsSection === 'STATS' && (
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-sm text-[#0F2942] pb-2 border-b border-slate-200">
                    Trust Statistics & Live Metric Counters
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Packages Delivered</label>
                      <input
                        type="text"
                        value={websiteContentData.stats?.packagesDelivered || '10,000+'}
                        onChange={(e) => setWebsiteContentData({
                          ...websiteContentData,
                          stats: { ...websiteContentData.stats, packagesDelivered: e.target.value }
                        })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Happy Customers</label>
                      <input
                        type="text"
                        value={websiteContentData.stats?.happyCustomers || '5,000+'}
                        onChange={(e) => setWebsiteContentData({
                          ...websiteContentData,
                          stats: { ...websiteContentData.stats, happyCustomers: e.target.value }
                        })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Delivery Destinations & Hubs</label>
                      <input
                        type="text"
                        value={websiteContentData.stats?.deliveryLocations || '190+ Countries & Hubs'}
                        onChange={(e) => setWebsiteContentData({
                          ...websiteContentData,
                          stats: { ...websiteContentData.stats, deliveryLocations: e.target.value }
                        })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Delivery Success Rate</label>
                      <input
                        type="text"
                        value={websiteContentData.stats?.deliverySuccessRate || '99.4%'}
                        onChange={(e) => setWebsiteContentData({
                          ...websiteContentData,
                          stats: { ...websiteContentData.stats, deliverySuccessRate: e.target.value }
                        })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: ABOUT US & VALUES */}
              {cmsSection === 'ABOUT' && (
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-sm text-[#0F2942] pb-2 border-b border-slate-200">
                    About World Transport Overseas & Corporate Values
                  </h4>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Who We Are</label>
                    <textarea
                      rows={3}
                      value={websiteContentData.about?.whoWeAre || ''}
                      onChange={(e) => setWebsiteContentData({
                        ...websiteContentData,
                        about: { ...websiteContentData.about, whoWeAre: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Corporate Mission</label>
                    <textarea
                      rows={2}
                      value={websiteContentData.about?.mission || ''}
                      onChange={(e) => setWebsiteContentData({
                        ...websiteContentData,
                        about: { ...websiteContentData.about, mission: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Corporate Vision</label>
                    <textarea
                      rows={2}
                      value={websiteContentData.about?.vision || ''}
                      onChange={(e) => setWebsiteContentData({
                        ...websiteContentData,
                        about: { ...websiteContentData.about, vision: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <span className="block font-bold text-xs uppercase text-slate-700">Core Corporate Values</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(websiteContentData.about?.values || []).map((val, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                          <input
                            type="text"
                            value={val.title}
                            onChange={(e) => {
                              const updatedVals = [...(websiteContentData.about?.values || [])];
                              updatedVals[idx] = { ...updatedVals[idx], title: e.target.value };
                              setWebsiteContentData({
                                ...websiteContentData,
                                about: { ...websiteContentData.about, values: updatedVals },
                              });
                            }}
                            className="w-full font-bold text-xs text-[#0F2942] border-b border-slate-200 pb-1 focus:outline-none"
                            placeholder="Value Title"
                          />
                          <textarea
                            rows={2}
                            value={val.desc}
                            onChange={(e) => {
                              const updatedVals = [...(websiteContentData.about?.values || [])];
                              updatedVals[idx] = { ...updatedVals[idx], desc: e.target.value };
                              setWebsiteContentData({
                                ...websiteContentData,
                                about: { ...websiteContentData.about, values: updatedVals },
                              });
                            }}
                            className="w-full text-[11px] text-slate-600 bg-transparent resize-none focus:outline-none"
                            placeholder="Value Description"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: SERVICES */}
              {cmsSection === 'SERVICES' && (
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-sm text-[#0F2942] pb-2 border-b border-slate-200">
                    Services Section Offerings
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(websiteContentData.services || []).map((svc, sIdx) => (
                      <div key={svc.id || sIdx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-orange-600">Service #{sIdx + 1}</span>
                          <input
                            type="text"
                            value={svc.badge || ''}
                            onChange={(e) => {
                              const newSvcs = [...websiteContentData.services];
                              newSvcs[sIdx] = { ...newSvcs[sIdx], badge: e.target.value };
                              setWebsiteContentData({ ...websiteContentData, services: newSvcs });
                            }}
                            placeholder="Badge (e.g. Fastest)"
                            className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-700"
                          />
                        </div>
                        <input
                          type="text"
                          value={svc.title}
                          onChange={(e) => {
                            const newSvcs = [...websiteContentData.services];
                            newSvcs[sIdx] = { ...newSvcs[sIdx], title: e.target.value };
                            setWebsiteContentData({ ...websiteContentData, services: newSvcs });
                          }}
                          className="w-full font-bold text-xs text-slate-900 border-b border-slate-200 pb-1"
                        />
                        <textarea
                          rows={2}
                          value={svc.desc}
                          onChange={(e) => {
                            const newSvcs = [...websiteContentData.services];
                            newSvcs[sIdx] = { ...newSvcs[sIdx], desc: e.target.value };
                            setWebsiteContentData({ ...websiteContentData, services: newSvcs });
                          }}
                          className="w-full text-xs text-slate-600 bg-transparent resize-none border border-slate-200 rounded p-1.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 6: BUSINESS & CORPORATE */}
              {cmsSection === 'BUSINESS' && (
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-sm text-[#0F2942] pb-2 border-b border-slate-200">
                    Corporate & Enterprise Logistics Section
                  </h4>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Section Headline</label>
                    <input
                      type="text"
                      value={websiteContentData.business?.headline || ''}
                      onChange={(e) => setWebsiteContentData({
                        ...websiteContentData,
                        business: { ...websiteContentData.business, headline: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Section Subheading</label>
                    <textarea
                      rows={2}
                      value={websiteContentData.business?.subheading || ''}
                      onChange={(e) => setWebsiteContentData({
                        ...websiteContentData,
                        business: { ...websiteContentData.business, subheading: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 7: CONTACT & HEADQUARTERS */}
              {cmsSection === 'CONTACT' && (
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-sm text-[#0F2942] pb-2 border-b border-slate-200">
                    Company Information, Headquarters & Support
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Company Legal Name</label>
                      <input
                        type="text"
                        value={websiteContentData.company?.name || 'World Transport Overseas (WTO)'}
                        onChange={(e) => setWebsiteContentData({
                          ...websiteContentData,
                          company: { ...websiteContentData.company, name: e.target.value }
                        })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Official Company Email</label>
                      <input
                        type="email"
                        value="overseasworldtransport@gmail.com"
                        readOnly
                        className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-600 font-mono font-bold cursor-not-allowed"
                        title="Strictly enforced official support address"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Global European Headquarters (Sofia)</label>
                      <input
                        type="text"
                        value={websiteContentData.company?.hqAddress || 'Mimi Balkanska St 126, 1517 Sofia, Bulgaria'}
                        onChange={(e) => setWebsiteContentData({
                          ...websiteContentData,
                          company: { ...websiteContentData.company, hqAddress: e.target.value }
                        })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Regional Cargo Gateway Hub</label>
                      <input
                        type="text"
                        value={websiteContentData.company?.internationalHubAddress || 'European Central Logistics Air Gateway, Sofia, Bulgaria'}
                        onChange={(e) => setWebsiteContentData({
                          ...websiteContentData,
                          company: { ...websiteContentData.company, internationalHubAddress: e.target.value }
                        })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Operational Support Hours</label>
                      <input
                        type="text"
                        value={websiteContentData.company?.supportHours || '24/7 Global Dispatch & Clearance Desk'}
                        onChange={(e) => setWebsiteContentData({
                          ...websiteContentData,
                          company: { ...websiteContentData.company, supportHours: e.target.value }
                        })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Brand Tagline</label>
                      <input
                        type="text"
                        value={websiteContentData.company?.tagline || 'Fast, Reliable & Secure International Shipping Solutions'}
                        onChange={(e) => setWebsiteContentData({
                          ...websiteContentData,
                          company: { ...websiteContentData.company, tagline: e.target.value }
                        })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 8: FAQ EDITOR */}
              {cmsSection === 'FAQS' && (
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <h4 className="font-bold text-sm text-[#0F2942]">Frequently Asked Questions (FAQ Editor)</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newFaq = {
                          id: `faq_${Date.now()}`,
                          question: 'New Question Title',
                          answer: 'Detailed response goes here.',
                          category: 'General',
                        };
                        setWebsiteContentData({
                          ...websiteContentData,
                          faqs: [...(websiteContentData.faqs || []), newFaq],
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add FAQ</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(websiteContentData.faqs || []).map((faq, fIdx) => (
                      <div key={faq.id || fIdx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => {
                              const updatedFaqs = [...(websiteContentData.faqs || [])];
                              updatedFaqs[fIdx] = { ...updatedFaqs[fIdx], question: e.target.value };
                              setWebsiteContentData({ ...websiteContentData, faqs: updatedFaqs });
                            }}
                            placeholder="Question"
                            className="w-full font-bold text-xs text-slate-900 border-b border-slate-200 pb-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updatedFaqs = (websiteContentData.faqs || []).filter((_, i) => i !== fIdx);
                              setWebsiteContentData({ ...websiteContentData, faqs: updatedFaqs });
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            title="Delete FAQ item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => {
                            const updatedFaqs = [...(websiteContentData.faqs || [])];
                            updatedFaqs[fIdx] = { ...updatedFaqs[fIdx], answer: e.target.value };
                            setWebsiteContentData({ ...websiteContentData, faqs: updatedFaqs });
                          }}
                          placeholder="Answer"
                          className="w-full text-xs text-slate-600 border border-slate-200 rounded p-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Sticky Action Bar */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-xs text-slate-500">
                  Changes will be saved into the central API and reflected immediately live.
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    setCmsSaveMsg({ text: 'Publishing changes...', isError: false });
                    try {
                      const res = await updateWebsiteContent(websiteContentData);
                      if (res.success) {
                        setCmsSaveMsg({ text: 'All website changes successfully published live!', isError: false });
                        showToast('Website content updated live!');
                        onWebsiteContentUpdated?.(websiteContentData);
                      } else {
                        setCmsSaveMsg({ text: res.error || 'Failed to save changes.', isError: true });
                      }
                    } catch (err: any) {
                      setCmsSaveMsg({ text: err.message, isError: true });
                    }
                  }}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Publish All Changes Live</span>
                </button>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: CUSTOMER FEEDBACK & OPERATIONS DISPATCH NOTICES */}
          {/* ======================================================== */}
          {activeTab === 'FEEDBACK' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0F2942] font-heading flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-orange-500" />
                    <span>Customer Feedback, Communications & Inquiries</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Respond to website contact requests, send feedback to shippers, or dispatch consignment updates.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFeedbackComposer({
                    isOpen: true,
                    recipientName: '',
                    recipientEmail: '',
                    trackingNumber: '',
                    feedbackType: 'Consignment Status Update',
                    subject: 'Official Update from World Transport Overseas (WTO)',
                    message: '',
                  })}
                  className="px-4 py-2.5 rounded-xl bg-[#0F2942] hover:bg-orange-600 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>+ Compose Customer Feedback</span>
                </button>
              </div>

              {/* KPI Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Inquiries Received</span>
                    <span className="text-lg font-black text-slate-900">{contactMessages.length} Messages</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Pending / Unanswered</span>
                    <span className="text-lg font-black text-amber-700">
                      {contactMessages.filter(m => m.status === 'Unread').length} Awaiting Reply
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Sent Feedback Dispatched</span>
                    <span className="text-lg font-black text-emerald-700">
                      {sentFeedbackList.length} Transmitted
                    </span>
                  </div>
                </div>
              </div>

              {/* Inquiries & Feedback Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Column 1: Website Contact Inquiries (8 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#0F2942] flex items-center space-x-2">
                      <span>Customer Inquiries Inbox</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                        {contactMessages.length}
                      </span>
                    </h4>
                  </div>

                  {contactMessages.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                      No customer inquiries recorded yet. When visitors submit the contact form or request freight assistance, they will appear here.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contactMessages.map((msg) => (
                        <div key={msg.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-[#0F2942]">{msg.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  msg.status === 'Replied'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {msg.status || 'Unread'}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 font-mono block mt-0.5">
                                {msg.email} {msg.phone && `• ${msg.phone}`}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                              {msg.createdAt}
                            </span>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="font-bold text-xs text-slate-800 block mb-1">
                              Subject: {msg.subject}
                            </span>
                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                              {msg.message}
                            </p>
                          </div>

                          <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleOpenFeedbackForMessage(msg)}
                              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                            >
                              <Send className="w-3 h-3" />
                              <span>Reply & Send Feedback</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id, msg.name)}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs cursor-pointer"
                              title="Delete inquiry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 2: Sent Feedback & Operations Communications (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#0F2942] flex items-center space-x-2">
                      <span>Sent Feedback History</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {sentFeedbackList.length}
                      </span>
                    </h4>
                  </div>

                  {sentFeedbackList.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                      No sent feedback logged yet. Use the feedback composer or reply to any inquiry to log official communications.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sentFeedbackList.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="font-bold text-slate-900 block">{item.recipientName}</span>
                              <span className="text-[11px] text-slate-500 font-mono">{item.recipientEmail}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold shrink-0">
                              ✓ {item.status || 'Delivered'}
                            </span>
                          </div>

                          {item.trackingNumber && (
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold rounded text-[10px]">
                              AWB: {item.trackingNumber}
                            </span>
                          )}

                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="font-semibold text-slate-800 block text-[11px] mb-0.5">
                              {item.subject}
                            </span>
                            <p className="text-[11px] text-slate-600 line-clamp-3">
                              {item.message}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span>Sent: {item.sentAt}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteFeedback(item.id, item.recipientEmail)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded"
                              title="Delete log entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* MODAL: OFFICIAL INVOICE RECEIPT */}
        {selectedInvoiceOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 text-xs">
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white flex items-center justify-center shadow-md border border-slate-200 p-0.5">
                    <img src={wtoLogoImg} alt="WTO Official Emblem" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-[#0F2942] font-heading">
                      Official Commercial Freight Invoice
                    </h4>
                    <span className="font-mono text-slate-500 font-bold block">
                      INV-{selectedInvoiceOrder.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Status</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                    selectedInvoiceOrder.payment_status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {selectedInvoiceOrder.payment_status.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Issue</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedInvoiceOrder.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Invoice Breakdown Details */}
              <div className="space-y-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex justify-between text-slate-600">
                  <span>Associated Consignment:</span>
                  <span className="font-mono font-bold text-[#0F2942]">
                    {selectedInvoiceOrder.shipment?.tracking_number || 'WTO-AWB-DIRECT'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Billing Shipper:</span>
                  <span className="font-bold text-slate-800">
                    {selectedInvoiceOrder.customer?.full_name || selectedInvoiceOrder.shipment?.sender_name || 'Valued Corporate Shipper'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Corridor Route:</span>
                  <span className="font-medium text-slate-800">
                    {selectedInvoiceOrder.shipment?.origin || 'Sofia, Bulgaria'} → {selectedInvoiceOrder.shipment?.destination || 'International Destination'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tariff Classification:</span>
                  <span className="font-medium text-slate-800">
                    {selectedInvoiceOrder.shipment?.shipment_type || 'Standard International Airfreight'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Total Invoiced Amount:</span>
                  <span className="text-lg font-black text-emerald-700">
                    ${Number(selectedInvoiceOrder.amount || 45).toLocaleString()} USD
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                Official invoices and settlements are verified exclusively via <strong className="underline">overseasworldtransport@gmail.com</strong>. All international cargo is covered under standard WTO airway transit conventions.
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="px-5 py-2 bg-[#0F2942] hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: UPDATE STATUS & LOCATION */}
        {editingShipment && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-base text-[#0F2942]">Update Shipment Status & Location</h4>
                  <span className="font-mono text-slate-500 font-bold">{editingShipment.tracking_number}</span>
                </div>
                <button onClick={() => setEditingShipment(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleUpdateStatusAndLocation} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">New Status *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Order Booked">Order Booked</option>
                    <option value="Picked Up">Picked Up</option>
                    <option value="Warehouse Sorting">Warehouse Sorting</option>
                    <option value="In Transit">In Transit</option>
                    <option value="At Destination">At Destination</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Current Facility / Location *</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Sofia Central Freight Depot, Frankfurt CargoCity or JFK Terminal"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Milestone Description / Handler Note</label>
                  <textarea
                    rows={2}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g. Barcode scanned at air sorting bay. Cleared for outbound flight."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingShipment(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md"
                  >
                    {updatingStatus ? 'Updating...' : 'Publish Update to Realtime'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT FULL SHIPMENT DETAILS */}
        {editingShipmentDetails && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-base text-[#0F2942]">Edit Shipment Information</h4>
                  <span className="font-mono text-slate-500 font-bold">{editingShipmentDetails.tracking_number}</span>
                </div>
                <button onClick={() => setEditingShipmentDetails(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleSaveShipmentDetails} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Sender Name</label>
                    <input
                      type="text"
                      value={editingShipmentDetails.sender_name}
                      onChange={(e) => setEditingShipmentDetails({ ...editingShipmentDetails, sender_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Receiver Name</label>
                    <input
                      type="text"
                      value={editingShipmentDetails.receiver_name}
                      onChange={(e) => setEditingShipmentDetails({ ...editingShipmentDetails, receiver_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Origin</label>
                    <input
                      type="text"
                      value={editingShipmentDetails.origin}
                      onChange={(e) => setEditingShipmentDetails({ ...editingShipmentDetails, origin: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Destination</label>
                    <input
                      type="text"
                      value={editingShipmentDetails.destination}
                      onChange={(e) => setEditingShipmentDetails({ ...editingShipmentDetails, destination: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Shipment Type</label>
                    <input
                      type="text"
                      value={editingShipmentDetails.shipment_type}
                      onChange={(e) => setEditingShipmentDetails({ ...editingShipmentDetails, shipment_type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingShipmentDetails.weight}
                      onChange={(e) => setEditingShipmentDetails({ ...editingShipmentDetails, weight: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingShipmentDetails(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDetails}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                  >
                    {savingDetails ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: FULL USER BOOKING DETAILS (Displays ALL what the user booked) */}
        {viewingBookingDetails && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 my-8 text-xs">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white flex items-center justify-center shrink-0 border border-slate-200 p-0.5">
                    <img src={wtoLogoImg} alt="WTO Official Emblem" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-base text-[#0F2942] font-heading">
                        Complete Consignment Booking Manifest
                      </h4>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-orange-100 text-orange-800">
                        {viewingBookingDetails.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="font-mono text-sm font-bold text-[#0F2942]">
                        {viewingBookingDetails.tracking_number}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(viewingBookingDetails.tracking_number);
                          showToast('Tracking number copied to clipboard!');
                        }}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                        title="Copy tracking number"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingBookingDetails(null)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer self-end sm:self-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status & Key Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Transport Mode</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block">
                    {viewingBookingDetails.transport_mode || viewingBookingDetails.shipment_type || 'Air Freight Express'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Location</span>
                  <span className="font-bold text-orange-700 text-[11px] truncate block">
                    {viewingBookingDetails.current_location || viewingBookingDetails.origin}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Estimated Delivery</span>
                  <span className="font-bold text-emerald-700 text-[11px] block">
                    {viewingBookingDetails.estimated_delivery}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Booking Date</span>
                  <span className="font-bold text-slate-700 text-[11px] block">
                    {new Date(viewingBookingDetails.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Shipper & Consignee Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Shipper */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-200/80">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Shipper (Consignor) Details
                    </h5>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Name / Entity:</span>
                      <span className="font-bold text-slate-900">{viewingBookingDetails.sender_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Email Address:</span>
                      <a href={`mailto:${viewingBookingDetails.sender_email}`} className="text-orange-600 font-mono hover:underline">
                        {viewingBookingDetails.sender_email || 'Not specified'}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Phone Number:</span>
                      <span className="font-mono text-slate-700">{viewingBookingDetails.sender_phone || 'Declared on File'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Origin Location / Address:</span>
                      <span className="text-slate-800 font-medium">
                        {viewingBookingDetails.sender_address || viewingBookingDetails.origin}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consignee */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-200/80">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Consignee (Recipient) Details
                    </h5>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Recipient Name:</span>
                      <span className="font-bold text-slate-900">{viewingBookingDetails.receiver_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Email Address:</span>
                      <a href={`mailto:${viewingBookingDetails.receiver_email}`} className="text-orange-600 font-mono hover:underline">
                        {viewingBookingDetails.receiver_email || 'Not specified'}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Phone Number:</span>
                      <span className="font-mono text-slate-700">{viewingBookingDetails.receiver_phone || 'Declared on File'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Destination Address:</span>
                      <span className="text-slate-800 font-medium">
                        {viewingBookingDetails.receiver_address || viewingBookingDetails.destination}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Complete Cargo Specifications */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-orange-500" />
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Cargo Specifications & Logistics Package
                    </h5>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {viewingBookingDetails.is_fragile && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                        Fragile
                      </span>
                    )}
                    {viewingBookingDetails.is_hazardous && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Hazardous DGR
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Insured
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Commodity</span>
                    <span className="font-bold text-slate-800">{viewingBookingDetails.cargo_description || 'General Cargo'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">HS Tariff Code</span>
                    <span className="font-mono font-bold text-slate-800">{viewingBookingDetails.hs_code || 'HS 8413.60'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Weight / Pieces</span>
                    <span className="font-bold text-slate-800">{viewingBookingDetails.weight} kg ({viewingBookingDetails.pieces || 1} Pcs)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Dimensions</span>
                    <span className="font-mono font-bold text-slate-800">{viewingBookingDetails.dimensions_cm || '40x30x20 cm'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Declared Value</span>
                    <span className="font-bold text-emerald-700">{viewingBookingDetails.declared_value || '$500 USD'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Incoterms</span>
                    <span className="font-bold text-purple-700">{viewingBookingDetails.incoterms || 'DDP - Delivered Duty Paid'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Packaging Type</span>
                    <span className="font-bold text-slate-800">{viewingBookingDetails.packaging_type || 'Standard Secure Box'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Tariff Rate</span>
                    <span className="font-bold text-slate-900">${viewingBookingDetails.price || 120} USD</span>
                  </div>
                </div>

                {viewingBookingDetails.special_instructions && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Loading Protocol & Special Instructions
                    </span>
                    <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                      {viewingBookingDetails.special_instructions}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingBookingDetails;
                    setViewingBookingDetails(null);
                    handleOpenFeedbackForShipment(target);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Feedback to User</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingBookingDetails;
                      setViewingBookingDetails(null);
                      setEditingShipment(target);
                      setNewStatus(target.status);
                      setNewLocation(target.current_location || target.origin);
                      setStatusNote('');
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Update Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingBookingDetails;
                      setViewingBookingDetails(null);
                      onOpenWaybill(toWaybillShipment(target));
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-[#0F2942] hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Print Waybill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingBookingDetails;
                      setViewingBookingDetails(null);
                      handleDeleteShipment(target.id, target.tracking_number);
                    }}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer"
                    title="Delete Consignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewingBookingDetails(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: SEND FEEDBACK TO USER */}
        {feedbackComposer.isOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 my-8 text-xs">
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-[#0F2942] font-heading">
                      Send Feedback / Dispatch Notice to Customer
                    </h4>
                    <span className="text-slate-500 text-xs">
                      Official communication dispatched from overseasworldtransport@gmail.com
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFeedbackComposer({ ...feedbackComposer, isOpen: false })}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Recipient details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer / Recipient Name</label>
                  <input
                    type="text"
                    value={feedbackComposer.recipientName}
                    onChange={(e) => setFeedbackComposer({ ...feedbackComposer, recipientName: e.target.value })}
                    placeholder="e.g. John Doe or Shipper"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer Email Address *</label>
                  <input
                    type="email"
                    required
                    value={feedbackComposer.recipientEmail}
                    onChange={(e) => setFeedbackComposer({ ...feedbackComposer, recipientEmail: e.target.value })}
                    placeholder="e.g. client@example.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Tracking reference & category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tracking Number (Optional)</label>
                  <input
                    type="text"
                    value={feedbackComposer.trackingNumber}
                    onChange={(e) => setFeedbackComposer({ ...feedbackComposer, trackingNumber: e.target.value })}
                    placeholder="Enter tracking number"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Notice Category</label>
                  <select
                    value={feedbackComposer.feedbackType}
                    onChange={(e) => {
                      const val = e.target.value;
                      let newSub = feedbackComposer.subject;
                      if (!newSub || newSub.includes('WTO Consignment Update')) {
                        if (val === 'Customs Clearance Notice') newSub = `WTO Customs Notice [${feedbackComposer.trackingNumber || 'Consignment'}] - Clearance In Progress`;
                        else if (val === 'Scheduled Delivery Confirmation') newSub = `WTO Delivery Notice [${feedbackComposer.trackingNumber || 'Consignment'}] - Out for Final Handover`;
                        else if (val === 'Customer Inquiry Response') newSub = `WTO Logistics Operations: Reply to Your Request`;
                      }
                      setFeedbackComposer({ ...feedbackComposer, feedbackType: val, subject: newSub });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  >
                    <option value="Consignment Status Update">Consignment Status Update</option>
                    <option value="Customs Clearance Notice">Customs Clearance Notice</option>
                    <option value="Scheduled Delivery Confirmation">Scheduled Delivery Confirmation</option>
                    <option value="Customer Inquiry Response">Customer Inquiry Response</option>
                    <option value="Billing & Invoicing Note">Billing & Invoicing Note</option>
                    <option value="Urgent Document Request">Urgent Document Request</option>
                  </select>
                </div>
              </div>

              {/* Quick Template Chips */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                  Quick Fill Message Template:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      label: '✈️ Linehaul Dispatched',
                      body: 'Your consignment has been loaded on the scheduled international linehaul carrier and is currently in transit to the destination terminal hub.',
                    },
                    {
                      label: '🛃 Customs Cleared',
                      body: 'Official notice: customs clearance protocols have concluded successfully with all port duties and electronic waybills stamped.',
                    },
                    {
                      label: '🚚 Out for Delivery',
                      body: 'Your package is out for final-mile delivery with our authorized courier personnel. Please ensure the designated recipient is available to sign.',
                    },
                    {
                      label: '📄 Documentation Requested',
                      body: 'Kindly provide the commercial invoice and consignee identity certificate to overseasworldtransport@gmail.com to proceed with terminal clearance.',
                    },
                  ].map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => setFeedbackComposer({ ...feedbackComposer, message: tpl.body })}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Subject Line *</label>
                <input
                  type="text"
                  required
                  value={feedbackComposer.subject}
                  onChange={(e) => setFeedbackComposer({ ...feedbackComposer, subject: e.target.value })}
                  placeholder="Subject line of official email / notification"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Official Message Body *</label>
                <textarea
                  rows={6}
                  required
                  value={feedbackComposer.message}
                  onChange={(e) => setFeedbackComposer({ ...feedbackComposer, message: e.target.value })}
                  placeholder="Type feedback, delivery notes, or status explanation for the customer..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-xs font-mono leading-relaxed"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={sendingFeedback}
                  onClick={() => setFeedbackComposer({ ...feedbackComposer, isOpen: false })}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={sendingFeedback}
                  onClick={handleSendFeedback}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingFeedback ? 'animate-spin' : ''}`} />
                  <span>{sendingFeedback ? 'Transmitting Notice...' : 'Send Feedback to Customer'}</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: CLEAR ALL SHIPMENTS CONFIRMATION */}
        {showClearAllModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 text-xs">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 font-heading">
                    Clear Consignments List?
                  </h4>
                  <span className="text-slate-500 text-xs">
                    Reset active consignment manifest table.
                  </span>
                </div>
              </div>

              <p className="text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                This will clear the current consignments list from your admin display and backend memory store. New bookings will continue to be added as users book shipments.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearAllModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await clearAllShipmentsApi();
                      const toDelete = shipments.map((s) => [s.id, s.tracking_number]).flat().filter(Boolean) as string[];
                      const existingDeleted = getDeletedShipmentIds();
                      const combined = Array.from(new Set([...existingDeleted, ...toDelete.map((x) => x.toLowerCase())]));
                      localStorage.setItem('wto_deleted_shipments', JSON.stringify(combined));
                      localStorage.removeItem('wto_booked_shipments');
                      setShipments([]);
                      showToast('All consignments cleared successfully.');
                    } catch (e) {
                      setShipments([]);
                      localStorage.removeItem('wto_booked_shipments');
                    } finally {
                      setShowClearAllModal(false);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: IN-APP DELETE CONFIRMATION DIALOG (Works in iframe) */}
        {itemToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 font-heading">
                    Confirm Permanent Deletion
                  </h4>
                  <span className="text-xs text-slate-500">
                    This action will erase the record from the live database.
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Target Record: {itemToDelete.type.toUpperCase()}
                </span>
                <p className="text-sm font-mono font-bold text-[#0F2942] break-all">
                  {itemToDelete.label}
                </p>
                <p className="text-xs text-slate-600">
                  Are you sure you want to permanently delete this {itemToDelete.type}?
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={executeDelete}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  {isDeleting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
