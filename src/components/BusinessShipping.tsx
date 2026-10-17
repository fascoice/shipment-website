import React, { useState } from 'react';
import { 
  Building2, 
  ShoppingBag, 
  Boxes, 
  Repeat, 
  Briefcase, 
  Truck, 
  ArrowRight, 
  Check, 
  Mail, 
  X,
  ShieldCheck,
  Send
} from 'lucide-react';
import { sendContactMessage } from '../services/api';
import { WebsiteContent } from '../types';

interface BusinessShippingProps {
  websiteContent?: WebsiteContent | null;
}

export const BusinessShipping: React.FC<BusinessShippingProps> = ({ websiteContent }) => {
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    monthlyVolume: '50 - 200 parcels / month',
    serviceNeeded: 'E-commerce Deliveries & Fulfillment',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const benefits = [
    {
      title: 'E-commerce Deliveries',
      desc: 'Seamless checkout dispatch, next-day delivery, and customer SMS alerts for high-growth online retailers.',
      icon: ShoppingBag,
    },
    {
      title: 'Bulk Freight & Cargo',
      desc: 'Dedicated haulage trucks and container consolidations for container imports, manufacturing supplies, and raw materials.',
      icon: Boxes,
    },
    {
      title: 'Scheduled Regular Pickups',
      desc: 'Automated daily or weekly collections straight from your facility, warehouse, or retail distribution branches.',
      icon: Repeat,
    },
    {
      title: 'Business-to-Business (B2B)',
      desc: 'Confidential commercial dispatch between corporate headquarters, vendors, law firms, and financial institutions.',
      icon: Briefcase,
    },
    {
      title: 'Customer Deliveries',
      desc: 'High-touch customer handover with professional courier appearance and electronic proof-of-delivery.',
      icon: Truck,
    },
    {
      title: 'Turnkey Order Fulfillment',
      desc: 'Bonded storage, inventory warehousing, picking, packing, and cross-docking across European, North American, and global hubs.',
      icon: Building2,
    },
  ];

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await sendContactMessage({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: `Corporate Partnership Request: ${formData.company} (${formData.monthlyVolume})`,
        message: `Service Required: ${formData.serviceNeeded}\nMonthly Volume: ${formData.monthlyVolume}\nDetails: ${formData.message}`,
      });
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        setPartnerModalOpen(false);
        setFormData({
          name: '',
          company: '',
          email: '',
          phone: '',
          monthlyVolume: '50 - 200 parcels / month',
          serviceNeeded: 'E-commerce Deliveries & Fulfillment',
          message: '',
        });
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
            Enterprise Global Shipping Infrastructure
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] font-heading mt-3 tracking-tight">
            {websiteContent?.business?.headline || 'Power Your Business With Reliable Global Shipping'}
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            {websiteContent?.business?.subheading || 'Scale your worldwide shipping effortlessly with custom volume pricing, dedicated fleet routes, and priority customs clearance.'}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="bg-slate-50 hover:bg-white rounded-3xl p-7 border border-slate-200/90 hover:border-orange-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-13 h-13 rounded-2xl bg-[#0F2942] text-white flex items-center justify-center mb-5 group-hover:bg-orange-500 transition-colors shadow-sm">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F2942] font-heading mb-2">
                    {b.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {b.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center text-xs font-semibold text-slate-500">
                  <Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0 stroke-[3]" />
                  <span>SLA Guarantee & Account Manager</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Corporate Partnership Banner */}
        <div className="mt-14 bg-gradient-to-br from-[#0F2942] via-[#153454] to-[#1E3A8A] rounded-3xl p-8 sm:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-3 max-w-2xl text-center lg:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-white/10 px-3 py-1 rounded-full">
              Tailored Corporate Accounts
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              Need custom volume pricing or dedicated courier routes?
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              We offer flexible 30-day net credit terms, API integrations for your e-commerce cart, and dedicated account managers.
            </p>
          </div>

          <button
            onClick={() => setPartnerModalOpen(true)}
            className="px-8 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-xl shadow-orange-500/30 transition-all flex items-center space-x-2 shrink-0 group active:scale-95"
          >
            <span>Partner With Us</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

      {/* Partner With Us Modal */}
      {partnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPartnerModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0F2942] font-heading">
                  Corporate Partnership Inquiry
                </h3>
                <span className="text-xs text-slate-500">
                  World Transport Overseas (WTO) Business Desk
                </span>
              </div>
            </div>

            {sentSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Inquiry Received</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Thank you! Our Corporate Shipping Director will review your proposal and email you our corporate tariff rate-card.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePartnerSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Tunde Adebayo"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company / Brand Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Apex Industrial Ltd"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Corporate Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tunde@company.ng"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234 803 000 0000"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Service Required</label>
                    <select
                      value={formData.serviceNeeded}
                      onChange={(e) => setFormData({ ...formData, serviceNeeded: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800"
                    >
                      <option>E-commerce Deliveries & Fulfillment</option>
                      <option>Nationwide Bulk Haulage</option>
                      <option>Daily Scheduled Office Pickups</option>
                      <option>International Air & Sea Freight</option>
                      <option>Customs Clearance Brokerage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Monthly Package Volume</label>
                    <select
                      value={formData.monthlyVolume}
                      onChange={(e) => setFormData({ ...formData, monthlyVolume: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800"
                    >
                      <option>50 - 200 parcels / month</option>
                      <option>200 - 1,000 parcels / month</option>
                      <option>1,000 - 5,000 parcels / month</option>
                      <option>5,000+ parcels / Enterprise contract</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Additional Requirements / Notes</label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your shipping routes, specific packing needs, or timelines..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 shadow-md flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sending ? 'Submitting Proposal...' : 'Submit Partnership Request'}</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    Inquiries are sent directly to overseasworldtransport@gmail.com
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
