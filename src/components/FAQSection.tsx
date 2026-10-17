import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Search, Mail, Phone } from 'lucide-react';
import { WebsiteContent } from '../types';

interface FAQSectionProps {
  websiteContent?: WebsiteContent | null;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ websiteContent }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');

  const defaultFaqs = [
    {
      q: 'How do I ship a package?',
      a: 'Shipping with World Transport Overseas (WTO) is simple: Click "Book a Shipment" on our website, fill in the sender, recipient, and package specifications, and submit your request. Our courier team will arrive at your specified pickup address or you can drop it off at any of our regional sorting hubs.',
    },
    {
      q: 'How can I track my shipment?',
      a: 'Enter your official WTO tracking number in the tracking bar on our homepage or Tracking page. You will see real-time milestone checkpoints, current sorting hub locations, flight/vessel telemetry, and estimated delivery times.',
    },
    {
      q: 'How long does delivery take?',
      a: 'International priority airfreight takes 24 to 72 hours worldwide. Standard international air cargo takes 3 to 5 business days. Intercontinental rail freight takes 7 to 14 days, and ocean container shipping takes 14 to 28 days depending on the oceanic lane.',
    },
    {
      q: 'What items can I ship?',
      a: 'We accept commercial goods, industrial machinery, clean energy & solar equipment, consumer electronics, luxury art, personal effects, and general cargo. We do NOT accept unauthorized hazardous explosives, contraband, or firearms.',
    },
    {
      q: 'Do you offer international shipping worldwide?',
      a: 'Yes! With our Global European Headquarters in Sofia, Bulgaria (Mimi Balkanska St 126), we operate scheduled flight cargo and ocean maritime routes connecting 190+ countries across the UK, Europe, North America, the UAE (Dubai), Asia, and Latin America with full customs clearance.',
    },
    {
      q: 'How is shipping calculated?',
      a: 'Shipping rates are determined by origin and destination international corridors, package weight (in kg), physical dimensions (for volumetric oversize items), transportation mode (Flight, Ocean, Rail, Road), and delivery speed. You can use our interactive Shipping Rates Calculator anytime.',
    },
    {
      q: 'Can I schedule a pickup?',
      a: 'Yes, we provide international doorstep and warehouse pickup globally. Simply specify your preferred pickup date, location, and address during booking, and our dispatch freight team will coordinate directly prior to arrival.',
    },
    {
      q: 'What happens if my package is delayed?',
      a: 'While we maintain a 99% on-time delivery record, rare delays caused by extreme weather or customs inspection post updates trigger immediate notifications. Every consignment is insured and monitored 24/7. You can contact our support anytime at overseasworldtransport@gmail.com.',
    },
    {
      q: 'Can businesses use your international shipping service?',
      a: 'Absolutely. We offer enterprise shipping contracts for e-commerce brands, manufacturers, distributors, and corporate offices with dedicated vehicle routes, discounted volume rates, 30-day billing cycles, and API tracking integrations.',
    },
    {
      q: 'How do I contact customer support?',
      a: 'You can reach WTO customer care 24/7 via email at overseasworldtransport@gmail.com, use our 24/7 live chat assistant on this website, or contact our international headquarters at Mimi Balkanska St 126, 1517 Sofia, Bulgaria.',
    },
  ];

  const activeFaqs = websiteContent?.faqs && websiteContent.faqs.length > 0
    ? websiteContent.faqs.map((f: any) => ({
        q: f.question || f.q,
        a: f.answer || f.a,
      }))
    : defaultFaqs;

  const filteredFaqs = activeFaqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] font-heading mt-3 tracking-tight">
            Common Shipping Questions Answered
          </h2>
          <p className="text-slate-600 text-base mt-3">
            Find quick answers regarding our domestic and international shipping services.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-8">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search FAQs (e.g. tracking, international, pickup, rates)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 pl-12 text-sm text-slate-800 focus:outline-none focus:border-orange-500 shadow-sm"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-4.5 text-left flex justify-between items-center space-x-4 focus:outline-none hover:bg-slate-100/80 transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base text-[#0F2942] font-heading">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-orange-500 text-white border-orange-500' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-xs">
              No matching questions found for "{searchTerm}". Please contact our support team.
            </div>
          )}
        </div>

        {/* Still have questions */}
        <div className="mt-12 bg-blue-50/70 border border-blue-200 rounded-3xl p-6 text-center space-y-3">
          <h4 className="text-base font-bold text-[#0F2942]">Still have a question?</h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Our shipping support officers are available 24/7 to provide personalized answers for unusual or oversized consignments.
          </p>
          <a
            href="mailto:overseasworldtransport@gmail.com"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-orange-600 px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Mail className="w-4 h-4" />
            <span>Email overseasworldtransport@gmail.com</span>
          </a>
        </div>

      </div>
    </section>
  );
};
