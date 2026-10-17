import React, { useState } from 'react';
import { 
  Globe, 
  Mail, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  FileText, 
  CheckCircle,
  X,
  Database
} from 'lucide-react';

import { WebsiteContent } from '../types';
import wtoLogoImg from '../assets/images/wto_logo_white_bg.jpg';

interface FooterProps {
  onNavClick: (tabId: string) => void;
  onOpenAdmin: () => void;
  websiteContent?: WebsiteContent | null;
}

export const Footer: React.FC<FooterProps> = ({ onNavClick, onOpenAdmin, websiteContent }) => {
  const [modalType, setModalType] = useState<'TERMS' | 'PRIVACY' | null>(null);

  return (
    <footer className="bg-[#0A192F] text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Company Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              onClick={() => onNavClick('home')}
              className="cursor-pointer flex items-center space-x-3 group"
            >
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center border border-slate-200 shadow-md shrink-0">
                <img src={wtoLogoImg} alt="WTO Official Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white font-heading">
                  WTO Worldwide Shipping
                </span>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  World Transport Overseas
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              World Transport Overseas (WTO) is an international worldwide shipping network providing global air cargo flights, ocean container vessel shipping, trans-continental rail freight, and cross-border express haulage to 190+ countries.
            </p>

            <div className="space-y-2 pt-2 text-slate-300">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>Global HQ: {websiteContent?.company?.hqAddress || 'Mimi Balkanska St 126, 1517 Sofia, Bulgaria'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <a href="mailto:overseasworldtransport@gmail.com" className="text-white hover:text-orange-400 transition-colors font-medium">
                  overseasworldtransport@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'About Us' },
                { id: 'transportation', label: 'Modes of Transport' },
                { id: 'services', label: 'Services' },
                { id: 'tracking', label: 'Track Shipment' },
                { id: 'book', label: 'Book Consignment' },
                { id: 'pricing', label: 'Shipping Rates' },
                { id: 'contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => {
                      onNavClick(link.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-orange-400 transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Column */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              International Services
            </h4>
            <ul className="space-y-2">
              {[
                'International Air Freight & Cargo Flights',
                'Ocean & Maritime Container Shipping',
                'Intercontinental Rail Freight',
                'Cross-Border Road & Express Haulage',
                'Worldwide Customs Clearance & Brokerage',
              ].map((service) => (
                <li key={service}>
                  <button
                    onClick={() => {
                      onNavClick('services');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-orange-400 transition-colors text-left"
                  >
                    {service}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:overseasworldtransport@gmail.com?subject=Help%20Center%20Inquiry%20-%20WTO"
                  className="hover:text-orange-400 transition-colors flex items-center space-x-1"
                >
                  <span>Help Center (Email)</span>
                </a>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('home')}
                  className="hover:text-orange-400 transition-colors"
                >
                  FAQ
                </button>
              </li>
              <li>
                <a 
                  href="mailto:overseasworldtransport@gmail.com?subject=Contact%20Support%20-%20WTO"
                  className="hover:text-orange-400 transition-colors"
                >
                  Contact Support (Email)
                </a>
              </li>
              <li>
                <button
                  onClick={() => setModalType('TERMS')}
                  className="hover:text-orange-400 transition-colors"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => setModalType('PRIVACY')}
                  className="hover:text-orange-400 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p className="text-slate-500">
            © 2026 World Transport Overseas (WTO). All Rights Reserved.
          </p>

          <div className="flex items-center space-x-4 text-slate-500">
            <span>Official Inquiries: overseasworldtransport@gmail.com</span>
            <span>•</span>
            {/* Admin Dashboard placed in footer as an icon */}
            <button
              onClick={onOpenAdmin}
              className="p-2 px-2.5 rounded-xl bg-slate-800/90 hover:bg-orange-500 text-slate-300 hover:text-white border border-slate-700/80 hover:border-orange-400 transition-all cursor-pointer shadow-sm group flex items-center space-x-1.5"
              title="Open Admin Dashboard"
              aria-label="Admin Dashboard"
            >
              <ShieldCheck className="w-4 h-4 text-orange-400 group-hover:text-white transition-colors" />
              <span className="text-[11px] font-bold">Admin</span>
            </button>
          </div>
        </div>

      </div>

      {/* Terms & Privacy Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-slate-800 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold font-heading text-[#0F2942] mb-3">
              {modalType === 'TERMS' ? 'Terms & Conditions of Carriage' : 'Privacy & Security Policy'}
            </h3>
            <span className="text-xs text-slate-500 block mb-4">
              World Transport Overseas (WTO) Standard Operating Regulations
            </span>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              {modalType === 'TERMS' ? (
                <>
                  <p>
                    1. <strong>Scope of Service:</strong> World Transport Overseas (WTO) operates domestic courier and multimodal international freight forwarding in accordance with standard bills of lading, airway bills, and applicable international conventions.
                  </p>
                  <p>
                    2. <strong>Payment & Billing:</strong> Direct invoices and payment verification instructions are issued by our corporate finance desk via official email: <strong>overseasworldtransport@gmail.com</strong>. No transaction is deemed confirmed without official verification.
                  </p>
                  <p>
                    3. <strong>Package Prohibitions:</strong> Customers warrant that consignments do not contain restricted contraband, illegal firearms, explosives, hazardous chemicals, or perishable goods lacking documentation.
                  </p>
                  <p>
                    4. <strong>Insurance & Liability:</strong> All shipments include basic transit loss indemnity up to declared value. High-value marine and air cargo are subject to commercial marine underwriting.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    1. <strong>Information Collection:</strong> WTO collects sender and receiver addresses, contact phone numbers, and shipment item descriptions solely for transit routing, customs clearance, and courier delivery handover.
                  </p>
                  <p>
                    2. <strong>Security Commitment:</strong> We do not store sensitive payment card information directly on our servers. All financial confirmations are managed securely via verified bank transfers and corporate accounting at <strong>overseasworldtransport@gmail.com</strong>.
                  </p>
                  <p>
                    3. <strong>Data Protection:</strong> Consignment tracking information is safeguarded and accessible only with valid tracking numbers. Customer details are never sold or rented to third-party marketing companies.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setModalType(null)}
                className="px-5 py-2.5 bg-[#0F2942] text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
