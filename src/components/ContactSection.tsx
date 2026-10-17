import React, { useState } from 'react';
import { 
  Mail, 
  MapPin, 
  Phone, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Building2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { sendContactMessage } from '../services/api';
import { WebsiteContent } from '../types';

interface ContactSectionProps {
  websiteContent?: WebsiteContent | null;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ websiteContent }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMsg('Please fill in your name, email, and message.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await sendContactMessage(formData);
      if (res.success) {
        setSuccessMsg(res.message);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      } else {
        setErrorMsg('Failed to send message. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg('Failed to connect to contact server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
            Get In Touch
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] font-heading mt-3 tracking-tight">
            Contact World Transport Overseas (WTO)
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            Have questions about a shipment, international freight contract, or payment verification? Our team is available 24/7.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Company Details Column */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Global HQ Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0F2942] text-white flex items-center justify-center">
                  <Building2 className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                    Corporate Entity
                  </span>
                  <h3 className="text-xl font-bold text-[#0F2942] font-heading">
                    World Transport Overseas (WTO)
                  </h3>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 pt-2 border-t border-slate-100">
                
                {/* Official Email */}
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 font-semibold block text-xs">Official Support & Payments Email:</span>
                    <a
                      href="mailto:overseasworldtransport@gmail.com"
                      className="font-bold text-blue-900 hover:text-orange-600 transition-colors text-sm break-all"
                    >
                      overseasworldtransport@gmail.com
                    </a>
                  </div>
                </div>

                {/* Headquarters Address */}
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 font-semibold block text-xs">Global European Headquarters:</span>
                    <p className="font-bold text-slate-900">
                      {websiteContent?.company?.hqAddress || 'Mimi Balkanska St 126, 1517 Sofia, Bulgaria'}
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 font-semibold block text-xs">Operational Hours:</span>
                    <p className="font-bold text-slate-900">
                      {websiteContent?.company?.supportHours || '24/7 Live Monitoring & Customs Clearance Support'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Direct Email Support Button */}
              <div className="pt-4 border-t border-slate-100">
                <a
                  href="mailto:overseasworldtransport@gmail.com?subject=Customer%20Support%20Request%20-%20WTO%20Shipping"
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 shadow-md flex items-center justify-center space-x-2 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Direct Email to Customer Support</span>
                </a>
              </div>
            </div>

            {/* Payment & Security Reassurance Card */}
            <div className="bg-[#0F2942] text-white p-6 rounded-3xl shadow-md space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-orange-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Payment Assurance</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                For official payment methods, commercial invoice generation, and electronic receipts, please direct inquiries to <strong>overseasworldtransport@gmail.com</strong>.
              </p>
            </div>

          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-900/5 border border-slate-200">
            <h3 className="text-xl font-bold text-[#0F2942] font-heading mb-2">
              Send Us a Message
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Fill in your inquiry below and our shipping desk will respond via email promptly.
            </p>

            {successMsg ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Message Delivered</h4>
                <p className="text-xs text-slate-700 max-w-sm mx-auto">
                  {successMsg}
                </p>
                <button
                  onClick={() => setSuccessMsg('')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Babatunde Lawal"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. yourname@domain.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +234 803 000 0000"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Rate Quote for 500kg Cargo / Tracking Help"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Your Message / Consignment Details *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your inquiry, tracking number, origin, destination, or payment confirmation question..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                  ></textarea>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-xl font-bold text-sm text-white bg-[#0F2942] hover:bg-orange-600 transition-all flex items-center justify-center space-x-2 shadow-md active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4 text-orange-400" />
                    <span>{loading ? 'Sending Message...' : 'Send Message'}</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    Your message will be delivered to overseasworldtransport@gmail.com
                  </p>
                </div>

              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
