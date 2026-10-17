import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Search, 
  Plus, 
  ArrowRight, 
  User, 
  Mail, 
  Download,
  AlertCircle,
  ExternalLink,
  Layers,
  MapPin,
  ShieldCheck,
  Check,
  ChevronRight,
  Boxes,
  Compass,
  Building2,
  Calendar,
  LogOut,
  MessageSquare,
  Send,
  CreditCard,
  RefreshCw,
  Sparkles,
  Phone,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchCustomerShipments, 
  fetchCustomerOrders, 
  fetchShipmentUpdates,
  fetchChatMessages,
  sendChatMessage,
  subscribeToShipments,
  subscribeToChat,
  isSupabaseConfigured
} from '../lib/supabase';
import { ShipmentRow, ShipmentUpdateRow, OrderRow, ChatMessageRow, Shipment } from '../types';

interface CustomerDashboardProps {
  onNewShipment: () => void;
  onTrackShipment: (trackingNumber: string) => void;
  onOpenWaybill: (shipment: Shipment) => void;
  onContactSupport: () => void;
  onOpenAuth: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onNewShipment,
  onTrackShipment,
  onOpenWaybill,
  onContactSupport,
  onOpenAuth,
}) => {
  const { user, profile, signOut, isConfigured } = useAuth();

  const [activeTab, setActiveTab] = useState<'SHIPMENTS' | 'ORDERS' | 'CHAT'>('SHIPMENTS');
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected shipment & updates for vertical timeline
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRow | null>(null);
  const [shipmentUpdates, setShipmentUpdates] = useState<ShipmentUpdateRow[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'DELIVERED'>('ALL');

  // Live Chat Input
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load user data from Supabase
  const loadUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch shipments from Supabase
      const shipData = await fetchCustomerShipments(user.id);
      setShipments(shipData);

      if (shipData.length > 0) {
        setSelectedShipment(shipData[0]);
      }

      // 2. Fetch orders from Supabase
      const orderData = await fetchCustomerOrders(user.id);
      setOrders(orderData);

      // 3. Fetch chat messages from Supabase
      const chatData = await fetchChatMessages(user.id);
      setChatMessages(chatData);
    } catch (err) {
      console.error('Error loading Supabase customer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  // Load updates whenever selected shipment changes
  useEffect(() => {
    if (!selectedShipment) {
      setShipmentUpdates([]);
      return;
    }

    let isMounted = true;
    setLoadingUpdates(true);
    fetchShipmentUpdates(selectedShipment.id)
      .then((data) => {
        if (isMounted) {
          setShipmentUpdates(data);
          setLoadingUpdates(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoadingUpdates(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedShipment?.id]);

  // Realtime Subscriptions for Shipments & Chat
  useEffect(() => {
    if (!user || !isConfigured) return;

    // Listen for live shipment & milestone updates
    const unsubscribeShipments = subscribeToShipments((payload) => {
      loadUserData();
      if (selectedShipment && payload.new?.id === selectedShipment.id) {
        fetchShipmentUpdates(selectedShipment.id).then(setShipmentUpdates);
      }
    });

    // Listen for live incoming chat messages
    const unsubscribeChat = subscribeToChat(user.id, (payload) => {
      if (payload.new) {
        setChatMessages((prev) => [...prev, payload.new as ChatMessageRow]);
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });

    return () => {
      unsubscribeShipments();
      unsubscribeChat();
    };
  }, [user?.id, selectedShipment?.id, isConfigured]);

  // Send chat message to Supabase
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;

    const messageText = chatInput.trim();
    setChatInput('');
    setSendingChat(true);

    try {
      const inserted = await sendChatMessage({
        userId: user.id,
        message: messageText,
        senderType: 'customer',
      });

      setChatMessages((prev) => [...prev, inserted]);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);

      // Automated polite dispatch acknowledgment from server/support if needed
      setTimeout(async () => {
        try {
          const reply = await sendChatMessage({
            userId: user.id,
            message: `Hello ${profile?.full_name || 'Valued Customer'}, our dispatch coordinator has received your message regarding your consignments. All support matters are also logged to overseasworldtransport@gmail.com.`,
            senderType: 'support',
          });
          setChatMessages((prev) => [...prev, reply]);
          setTimeout(() => {
            chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        } catch (e) {
          // ignore
        }
      }, 1000);
    } catch (err: any) {
      console.error('Failed to send chat message:', err);
    } finally {
      setSendingChat(false);
    }
  };

  // Convert Supabase ShipmentRow to frontend Shipment type for Waybill Modal
  const convertToWaybillShipment = (row: ShipmentRow): Shipment => {
    return {
      id: row.id,
      trackingNumber: row.tracking_number,
      sender: {
        name: row.sender_name,
        email: profile?.email || '',
        phone: profile?.phone || '',
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
      tariffType: 'Assessed WTO Freight Tariff',
      status: (row.status as any) || 'In Transit',
      currentStage: (row.status as any) || 'In Transit',
      createdDate: new Date(row.created_at).toLocaleDateString(),
      estimatedDeliveryDate: row.estimated_delivery || '3 - 5 Business Days',
      lastUpdated: new Date(row.updated_at).toLocaleString(),
      currentLocation: row.current_location || row.origin,
      timeline: shipmentUpdates.map((u) => ({
        status: u.status,
        title: u.status,
        location: u.location,
        timestamp: new Date(u.updated_at).toLocaleString(),
        completed: true,
        note: u.description,
      })),
    };
  };

  // Filtered shipments
  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.receiver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shipment_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? s.status !== 'Delivered' && s.status !== 'Pending'
        : s.status.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCount = shipments.length;
  const deliveredCount = shipments.filter((s) => s.status === 'Delivered').length;
  const pendingCount = shipments.filter((s) => s.status === 'Pending').length;
  const activeCount = shipments.filter((s) => s.status !== 'Delivered' && s.status !== 'Pending').length;

  // IF USER IS NOT LOGGED IN
  if (!user) {
    return (
      <div className="py-20 bg-slate-50 min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0F2942] flex items-center justify-center mx-auto shadow-md border border-slate-200">
            <User className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              Supabase Customer Authentication
            </span>
            <h2 className="text-2xl font-extrabold text-[#0F2942] font-heading mt-3">
              Sign In to Access Customer Portal
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Customers can register, view their private shipments, monitor live vertical progress timelines, review order invoices, and use live chat support with dispatch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onOpenAuth}
              className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 shadow-md shadow-orange-500/30 flex items-center justify-center space-x-2 text-xs"
            >
              <span>Customer Sign In / Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onTrackShipment('')}
              className="px-5 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center space-x-2 text-xs shadow-xs"
            >
              <Search className="w-4 h-4 text-orange-500" />
              <span>Track With Tracking Number</span>
            </button>
          </div>

          {!isConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left text-xs space-y-1.5 text-amber-900">
              <span className="font-bold flex items-center space-x-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Supabase Configuration Notice</span>
              </span>
              <p className="text-[11px] text-amber-800">
                To connect your live database, add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment. Run the included <code>/supabase/schema.sql</code> script in your Supabase SQL editor.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* ======================================================== */}
        {/* CUSTOMER PROFILE BANNER (REAL DATA FROM SUPABASE PROFILES) */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-r from-[#0F2942] via-[#12314e] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white/20 shrink-0">
              {(profile?.full_name || user.email || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold font-heading">{profile?.full_name || 'Customer Account'}</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {profile?.role === 'admin' ? 'Authorized Admin' : 'Verified Supabase Customer'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-orange-300 border border-white/10">
                  ID: {user.id.substring(0, 8)}...
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1 text-orange-400" />
                  {user.email}
                </span>
                {profile?.phone && (
                  <span className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    {profile.phone}
                  </span>
                )}
                <span className="flex items-center text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                  Supabase Realtime Connected
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={loadUserData}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onNewShipment}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-xs font-bold text-white shadow-lg shadow-orange-500/30 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Book New Shipment</span>
            </button>
            <button
              onClick={signOut}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-xs font-bold text-rose-300 transition-colors flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Dashboard 4 Summary Cards (from Supabase Database) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Shipments</span>
              <div className="text-3xl font-extrabold text-[#0F2942] font-heading mt-1">{activeCount}</div>
              <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-block">Warehouse Sorting / In Transit</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivered</span>
              <div className="text-3xl font-extrabold text-emerald-600 font-heading mt-1">{deliveredCount}</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">Signed & Received</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Orders</span>
              <div className="text-3xl font-extrabold text-amber-600 font-heading mt-1">{pendingCount}</div>
              <span className="text-[11px] text-amber-600 font-semibold mt-1 inline-block">Awaiting Courier Pickup</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Consignments</span>
              <div className="text-3xl font-extrabold text-[#0F2942] font-heading mt-1">{totalCount}</div>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">Under Your Profile</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab('SHIPMENTS')}
            className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'SHIPMENTS'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>My Consignments ({shipments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'ORDERS'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Order & Payment Records ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'CHAT'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Dispatch Chat ({chatMessages.length})</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: SHIPMENTS & VERTICAL PROGRESS TIMELINE */}
        {/* ======================================================== */}
        {activeTab === 'SHIPMENTS' && (
          <div className="space-y-8 animate-in fade-in">
            
            {/* Live Vertical Progress Timeline */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-orange-100 text-orange-700 border border-orange-200">
                      Supabase Realtime Timeline
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Auto-Synced Facility Milestones</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#0F2942] font-heading mt-1">
                    Shipment Progress Timeline
                  </h2>
                </div>

                {/* Quick Shipment Selector Chips */}
                <div className="flex flex-wrap gap-2">
                  {shipments.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedShipment(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border flex items-center space-x-2 ${
                        selectedShipment?.id === s.id
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${s.status === 'Warehouse Sorting' ? 'bg-amber-400' : s.status === 'Out for Delivery' ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                      <span>{s.tracking_number}</span>
                      <span className="text-[10px] opacity-75 font-sans">({s.status})</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedShipment ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Shipment Overview Details */}
                  <div className="lg:col-span-4 bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Tracking</span>
                        <span className="font-mono text-base font-extrabold text-[#0F2942]">{selectedShipment.tracking_number}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-blue-100 text-blue-800 border-blue-200">
                        {selectedShipment.status}
                      </span>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Commodity / Service:</span>
                        <p className="font-bold text-slate-800">{selectedShipment.shipment_type}</p>
                        <p className="text-slate-500 text-[11px]">{selectedShipment.weight} kg weight</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-400 font-semibold block text-[10px]">Origin:</span>
                          <p className="font-bold text-slate-700 truncate">{selectedShipment.origin}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[10px]">Destination:</span>
                          <p className="font-bold text-slate-700 truncate">{selectedShipment.destination}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Current Location:</span>
                        <p className="font-bold text-orange-700 flex items-start space-x-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{selectedShipment.current_location || selectedShipment.origin}</span>
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Sender:</span>
                        <p className="font-bold text-slate-800">{selectedShipment.sender_name}</p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Recipient:</span>
                        <p className="font-bold text-slate-800">{selectedShipment.receiver_name}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col space-y-2">
                      <button
                        onClick={() => onOpenWaybill(convertToWaybillShipment(selectedShipment))}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#0F2942] hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Consignment Waybill</span>
                      </button>
                      <button
                        onClick={() => onTrackShipment(selectedShipment.tracking_number)}
                        className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-orange-500" />
                        <span>View Public Tracking Page</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Physical Vertical Progress Timeline */}
                  <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-5 h-5 text-orange-500" />
                        <h3 className="text-base font-bold text-[#0F2942] font-heading">
                          Facility Progress Timeline (Supabase Log)
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500">
                        {shipmentUpdates.length} Milestones Recorded
                      </span>
                    </div>

                    {loadingUpdates ? (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        Loading updates...
                      </div>
                    ) : shipmentUpdates.length > 0 ? (
                      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3.5 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {shipmentUpdates.map((step, idx) => {
                          const isLast = idx === shipmentUpdates.length - 1;
                          const isWarehouse = step.status.toLowerCase().includes('sorting');
                          const isOut = step.status.toLowerCase().includes('out for delivery');

                          return (
                            <div key={step.id || idx} className="relative group">
                              <div className={`absolute -left-6 sm:-left-8 top-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-sm z-10 ${
                                isLast ? 'bg-orange-500 text-white ring-4 ring-orange-200 animate-pulse' : 'bg-emerald-500 text-white'
                              }`}>
                                {isLast ? <span className="w-2.5 h-2.5 rounded-full bg-white"></span> : <Check className="w-4 h-4 stroke-[3]" />}
                              </div>

                              <div className={`p-4 rounded-2xl border ${
                                isLast ? 'bg-orange-50/40 border-orange-200 shadow-sm' : 'bg-slate-50/70 border-slate-200'
                              }`}>
                                <div className="flex flex-wrap justify-between items-start gap-2">
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                        isLast ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      }`}>
                                        {isLast ? 'LATEST STATUS' : 'COMPLETED'}
                                      </span>
                                      {isWarehouse && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
                                          <Boxes className="w-3 h-3 text-amber-700" />
                                          <span>Warehouse Sorting</span>
                                        </span>
                                      )}
                                      {isOut && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center space-x-1">
                                          <Truck className="w-3 h-3 text-emerald-700" />
                                          <span>Out for Delivery</span>
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-sm sm:text-base font-bold text-[#0F2942] font-heading mt-1">
                                      {step.status}
                                    </h4>
                                  </div>

                                  <span className="text-[11px] font-mono font-medium text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                                    {new Date(step.updated_at).toLocaleString()}
                                  </span>
                                </div>

                                <div className="mt-2 text-xs text-slate-600 flex items-center space-x-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                  <span className="font-medium text-slate-800">{step.location}</span>
                                </div>

                                {step.description && (
                                  <p className="mt-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 leading-relaxed font-sans">
                                    {step.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No progress updates logged for this shipment yet.
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <p>You have no active shipments yet.</p>
                  <button
                    onClick={onNewShipment}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors inline-flex items-center space-x-1.5 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Your First Shipment</span>
                  </button>
                </div>
              )}
            </div>

            {/* Consignments Table */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0F2942] font-heading">
                    My Shipments & Consignment Archive
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live from Supabase PostgreSQL <code>shipments</code> table with Row Level Security.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  {(['ALL', 'ACTIVE', 'PENDING', 'DELIVERED'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1.5 rounded-xl border transition-colors ${
                        statusFilter === f
                          ? 'bg-[#0F2942] text-white border-[#0F2942]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tracking number, recipient, destination or type..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Tracking No.</th>
                      <th className="px-4 py-3">Recipient & Destination</th>
                      <th className="px-4 py-3">Cargo Details</th>
                      <th className="px-4 py-3">Current Location</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredShipments.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#0F2942]">
                          <button
                            onClick={() => setSelectedShipment(s)}
                            className="hover:text-orange-600 transition-colors text-left font-bold"
                          >
                            {s.tracking_number}
                          </button>
                          <span className="block font-sans text-[11px] font-normal text-slate-400">
                            {new Date(s.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-900 block">{s.receiver_name}</span>
                          <span className="text-slate-500 text-[11px]">{s.destination}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-slate-800">{s.shipment_type}</span>
                          <span className="block text-slate-400 text-[11px]">{s.weight} kg</span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-700">
                          {s.current_location || s.origin}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            s.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedShipment(s)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                            >
                              <Layers className="w-3 h-3 text-orange-500" />
                              <span>Timeline</span>
                            </button>
                            <button
                              onClick={() => onOpenWaybill(convertToWaybillShipment(s))}
                              className="px-2.5 py-1 bg-[#0F2942] hover:bg-orange-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Waybill</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredShipments.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No shipments found.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ORDERS & PAYMENT INFORMATION */}
        {/* ======================================================== */}
        {activeTab === 'ORDERS' && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-[#0F2942] font-heading">
                Order Invoices & Payment Status
              </h2>
              <p className="text-xs text-slate-500">
                Managed in Supabase <code>orders</code> table. Official invoices are issued via overseasworldtransport@gmail.com.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Assessed Amount</th>
                    <th className="px-4 py-3">Payment Status</th>
                    <th className="px-4 py-3">Order Status</th>
                    <th className="px-4 py-3">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-[#0F2942]">
                        ORD-{ord.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        ${ord.amount || '45.00'} USD
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          ord.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.payment_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {ord.order_status}
                      </td>
                      <td className="px-4 py-3.5">
                        <a
                          href="mailto:overseasworldtransport@gmail.com?subject=Payment%20Confirmation%20Order"
                          className="text-orange-600 hover:underline font-bold text-[11px]"
                        >
                          Email Invoice Desk
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {orders.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs">
                No orders or invoices on record.
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: LIVE DISPATCH CHAT (SUPABASE REALTIME) */}
        {/* ======================================================== */}
        {activeTab === 'CHAT' && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-[#0F2942] font-heading">
                  Customer Live Support Chat
                </h2>
                <p className="text-xs text-slate-500">
                  Backed by Supabase Realtime (<code>chat_messages</code> table).
                </p>
              </div>
              <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                Realtime Channel Active
              </span>
            </div>

            {/* Chat Messages Box */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200 h-96 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>No messages yet. Send a message to WTO dispatch below.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.sender_type === 'customer';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#0F2942] text-white rounded-br-none shadow-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                        }`}
                      >
                        <p>{msg.message}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {isMe ? 'You' : 'WTO Dispatch'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message to dispatch or ask about your consignments..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-orange-500/25 disabled:opacity-50 transition-colors"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
