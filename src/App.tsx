import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Statistics } from './components/Statistics';
import { TransportationModes } from './components/TransportationModes';
import { ServicesSection } from './components/ServicesSection';
import { HowItWorks } from './components/HowItWorks';
import { ShipmentTracking } from './components/ShipmentTracking';
import { BookShipment } from './components/BookShipment';
import { CustomerDashboard } from './components/CustomerDashboard';
import { BusinessShipping } from './components/BusinessShipping';
import { PricingSection } from './components/PricingSection';
import { AboutSection } from './components/AboutSection';
import { WhyChooseUs } from './components/WhyChooseUs';
import { ReviewsSection } from './components/ReviewsSection';
import { FAQSection } from './components/FAQSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { AiChatAssistant } from './components/AiChatAssistant';
import { WaybillModal } from './components/WaybillModal';
import { AuthModal } from './components/AuthModal';
import { Shipment, WebsiteContent } from './types';
import { fetchWebsiteContent } from './services/api';
import { Globe, ArrowRight, ShieldCheck, Mail, Sparkles, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [targetTracking, setTargetTracking] = useState('');
  const [quotePrefill, setQuotePrefill] = useState<any>(null);
  const [selectedWaybillShipment, setSelectedWaybillShipment] = useState<Shipment | null>(null);
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent | null>(null);
  
  // Modals & Full Portal States
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCustomerPortalOpen, setIsCustomerPortalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'admin' | 'reset'>('login');

  // Load Website Content on Mount
  useEffect(() => {
    fetchWebsiteContent().then((data) => {
      if (data) {
        setWebsiteContent(data);
      }
    });
  }, []);

  const handleWebsiteContentUpdated = (newContent: WebsiteContent) => {
    setWebsiteContent(newContent);
  };

  // Section Routing: "each section link to each section, home should link to home"
  const handleNavigateToSection = (sectionId: string) => {
    setIsCustomerPortalOpen(false);
    setActiveTab(sectionId);

    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'customer') {
      setIsCustomerPortalOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'admin') {
      setIsAdminOpen(true);
      return;
    }

    // Scroll to specific section ID on the page
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleHeroTrack = (trackingNumber?: string) => {
    if (trackingNumber) {
      setTargetTracking(trackingNumber);
    }
    handleNavigateToSection('tracking');
  };

  const handleShipWithUs = () => {
    handleNavigateToSection('book');
  };

  const handleQuoteCalculated = (params: any) => {
    setQuotePrefill({
      pickupLocation: params.pickupLocation,
      destination: params.destination,
      packageType: params.packageType,
      weight: params.weight,
      quantity: params.quantity,
      speed: params.speed,
    });
    handleNavigateToSection('book');
  };

  const handleServiceSelect = (serviceName: string) => {
    setQuotePrefill((prev: any) => ({
      ...prev,
      packageType: serviceName,
      description: `Requested Service: ${serviceName}`,
    }));
    handleNavigateToSection('book');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Top Announcement Notice Banner (Editable via CMS) */}
      {websiteContent?.noticeBanner?.enabled && (
        <div className="bg-gradient-to-r from-[#0F2942] via-blue-900 to-[#0F2942] text-white text-xs py-2 px-4 border-b border-white/10 text-center font-medium flex items-center justify-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span>{websiteContent.noticeBanner.text}</span>
          <span className="hidden md:inline text-slate-400">•</span>
          <a
            href="mailto:overseasworldtransport@gmail.com"
            className="hidden md:inline font-bold text-orange-400 hover:text-white underline underline-offset-2 ml-1"
          >
            overseasworldtransport@gmail.com
          </a>
        </div>
      )}

      {/* Sticky Header Navigation */}
      <Navbar
        activeTab={isCustomerPortalOpen ? 'customer' : activeTab}
        setActiveTab={handleNavigateToSection}
        onOpenBookModal={() => handleNavigateToSection('book')}
        onOpenAdminModal={() => setIsAdminOpen(true)}
        onOpenCustomerModal={() => {
          setIsCustomerPortalOpen(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isCustomerPortalOpen ? (
          <div className="relative animate-in fade-in">
            {/* Top Return to Home Breadcrumb Bar */}
            <div className="bg-[#0F2942] text-white px-6 py-3 flex flex-wrap justify-between items-center text-xs border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-orange-400 uppercase tracking-wider">
                  Customer Portal & Tracking Center
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">World Transport Overseas</span>
              </div>
              <button
                onClick={() => handleNavigateToSection('home')}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <span>Return to Home Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Customer Dashboard with Vertical Progress Timeline */}
            <CustomerDashboard
              onNewShipment={() => handleNavigateToSection('book')}
              onTrackShipment={(trk) => {
                setIsCustomerPortalOpen(false);
                handleHeroTrack(trk);
              }}
              onOpenWaybill={(shp) => setSelectedWaybillShipment(shp)}
              onContactSupport={() => handleNavigateToSection('contact')}
              onOpenAuth={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
            />
          </div>
        ) : (
          <>
            {/* 1. Hero Section with quick package tracking form */}
            <Hero
              onTrack={handleHeroTrack}
              onShipWithUs={handleShipWithUs}
              onExploreTracking={() => handleNavigateToSection('tracking')}
              websiteContent={websiteContent}
            />

            {/* 2. Trust Statistics Section */}
            <Statistics websiteContent={websiteContent} />

            {/* 3. Multimodal Transportation Modes & Visual Gallery (Flight, Ocean, Rail, Road) */}
            <TransportationModes
              onSelectMode={(modeName) => {
                setQuotePrefill((prev: any) => ({
                  ...prev,
                  transportMode: modeName,
                }));
                handleNavigateToSection('book');
              }}
            />

            {/* 4. Services Section */}
            <ServicesSection onBookService={handleServiceSelect} />

            {/* 4. How It Works (4 Steps) */}
            <HowItWorks onStartBooking={handleShipWithUs} />

            {/* 5. Shipment Tracking Page / Module */}
            <ShipmentTracking
              initialTracking={targetTracking}
              onOpenWaybill={(shp) => setSelectedWaybillShipment(shp)}
            />

            {/* 6. Book a Shipment Page / Form with Professional Waybill Registration */}
            <BookShipment
              initialValues={quotePrefill}
              onBookingSuccess={(shp) => {
                setSelectedWaybillShipment(shp);
              }}
              onOpenWaybill={(shp) => setSelectedWaybillShipment(shp)}
              onTrackShipment={(trk) => handleHeroTrack(trk)}
            />

            {/* 7. Business / Corporate Shipping Section */}
            <BusinessShipping websiteContent={websiteContent} />

            {/* 8. Pricing Rates Section (Custom Quote on Request) */}
            <PricingSection onBookRate={handleServiceSelect} />

            {/* 9. About Us Section */}
            <AboutSection websiteContent={websiteContent} />

            {/* 10. Why Choose Us Section */}
            <WhyChooseUs />

            {/* 11. Customer Reviews Section */}
            <ReviewsSection />

            {/* 12. FAQ Section */}
            <FAQSection websiteContent={websiteContent} />

            {/* 13. Contact Section (Email only: overseasworldtransport@gmail.com) */}
            <ContactSection websiteContent={websiteContent} />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavClick={handleNavigateToSection}
        onOpenAdmin={() => setIsAdminOpen(true)}
        websiteContent={websiteContent}
      />

      {/* Floating 24/7 AI Live Chat & Voice Assistant (Gemini 3.8 Live & Flash) */}
      <AiChatAssistant
        onNavigateToBooking={handleShipWithUs}
        onNavigateToTracking={handleHeroTrack}
        onNavigateToRates={() => handleNavigateToSection('pricing')}
      />

      {/* Admin Dashboard Modal with Full Website CMS */}
      {isAdminOpen && (
        <AdminDashboard
          onClose={() => setIsAdminOpen(false)}
          onOpenWaybill={(shp) => setSelectedWaybillShipment(shp)}
          onWebsiteContentUpdated={handleWebsiteContentUpdated}
        />
      )}

      {/* Printable Consignment Waybill Modal */}
      <WaybillModal
        shipment={selectedWaybillShipment}
        onClose={() => setSelectedWaybillShipment(null)}
      />

      {/* Supabase Customer & Staff Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
        onSuccess={() => {
          setIsCustomerPortalOpen(true);
        }}
      />
    </div>
  );
}
