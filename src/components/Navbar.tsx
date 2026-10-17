import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Mail, 
  Menu, 
  X, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import wtoLogoImg from '../assets/images/wto_emblem_logo_1790855439455.jpg';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBookModal: () => void;
  onOpenAdminModal: () => void;
  onOpenCustomerModal?: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenBookModal,
  onOpenAdminModal,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Nav links
  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'transportation', label: 'Modes of Transport' },
    { id: 'services', label: 'Services' },
    { id: 'tracking', label: 'Track Shipment' },
    { id: 'book', label: 'Book Consignment' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  return (
    <header className="sticky top-0 z-50 transition-all duration-300">
      {/* Main Navbar */}
      <nav 
        className={`bg-white transition-shadow duration-300 border-b border-slate-200/80 ${
          isScrolled ? 'shadow-md shadow-slate-900/5' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo with User's Official WTO Emblem - Prominent and highly visible */}
            <div 
              onClick={() => handleNavClick('home')}
              className="cursor-pointer flex items-center space-x-3 sm:space-x-4 group"
            >
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-white p-1 flex items-center justify-center shadow-md shadow-slate-200/80 group-hover:scale-105 transition-transform duration-200 border border-slate-200 shrink-0">
                <img 
                  src={wtoLogoImg} 
                  alt="World Transport Overseas (WTO) Official Logo" 
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F2942] font-heading leading-tight">
                    WTO
                  </span>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 py-0.5 rounded-md shadow-xs">
                    Worldwide Shipping
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight leading-none mt-0.5">
                  WORLD TRANSPORT OVERSEAS
                </span>
                <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase hidden sm:block mt-1">
                  Air • Ocean • Rail • Road Logistics Network
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    activeTab === link.id
                      ? 'text-[#0F2942] bg-blue-50/80 border-b-2 border-orange-500'
                      : 'text-slate-600 hover:text-[#0F2942] hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Action Buttons: Email Icon to Send Email + Book Shipment */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Email Icon Button to Send Email */}
              <a
                href="mailto:overseasworldtransport@gmail.com?subject=Inquiry%20-%20World%20Transport%20Overseas%20Shipping"
                className="h-11 px-3.5 rounded-xl text-slate-700 hover:text-orange-500 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 transition-all shadow-xs flex items-center space-x-2 font-bold text-xs group cursor-pointer"
                title="Send Email to overseasworldtransport@gmail.com"
                aria-label="Send Email to overseasworldtransport@gmail.com"
              >
                <Mail className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-slate-700 group-hover:text-orange-600">Email Us</span>
              </a>

              <button
                onClick={onOpenBookModal}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 flex items-center space-x-1.5 group cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>Book a Shipment</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Mobile Header Actions: Email Icon + Menu Toggle */}
            <div className="flex items-center space-x-2 lg:hidden">
              <a
                href="mailto:overseasworldtransport@gmail.com?subject=Inquiry%20-%20World%20Transport%20Overseas%20Shipping"
                className="p-2.5 rounded-xl text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all flex items-center justify-center cursor-pointer"
                title="Send email to overseasworldtransport@gmail.com"
                aria-label="Send email"
              >
                <Mail className="w-5 h-5 text-orange-500" />
              </a>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl text-slate-700 hover:text-[#0F2942] hover:bg-slate-100 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-xl">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                    activeTab === link.id
                      ? 'bg-blue-50 text-[#0F2942] font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>

            {/* Mobile Direct Email Support */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <a
                href="mailto:overseasworldtransport@gmail.com?subject=Mobile%20Inquiry%20-%20World%20Transport%20Overseas"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <Mail className="w-4 h-4 text-orange-500" />
                <span>Email Customer Support</span>
              </a>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBookModal();
                }}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 shadow-md text-center flex items-center justify-center space-x-1.5"
              >
                <Package className="w-4 h-4" />
                <span>Book International Shipment</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
