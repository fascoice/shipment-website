import React from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Search, 
  HeartHandshake, 
  Globe2, 
  Building, 
  Award,
  Compass,
  Target
} from 'lucide-react';
import { WebsiteContent } from '../types';

interface AboutSectionProps {
  websiteContent?: WebsiteContent | null;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ websiteContent }) => {
  const values = websiteContent?.about?.values || [
    {
      title: 'Reliability',
      desc: 'We honor our delivery commitments under all circumstances with backup contingency routes and dedicated vehicle fleets.',
    },
    {
      title: 'Security',
      desc: 'Your consignments are guarded by digital tamper-proof seals, full transit insurance, and constant GPS escort tracking.',
    },
    {
      title: 'Speed',
      desc: 'Optimized international shipping corridors eliminate bottlenecks, ensuring your shipments arrive at record turnaround times.',
    },
    {
      title: 'Transparency',
      desc: 'No hidden fees or unexpected clearance surprises. Clear rate cards, live tracking, and digital waybills on every order.',
    },
    {
      title: 'Customer Satisfaction',
      desc: 'Our dedicated customer care desk ensures peace of mind from pickup to final recipient handover via overseasworldtransport@gmail.com.',
    },
  ];

  const team = [
    {
      name: 'Krasimir Dimitrov',
      role: 'Global Managing Director',
      location: 'Sofia, Bulgaria HQ',
      bio: 'Over 24 years in European freight forwarding, intercontinental supply chains, and bonded cargo shipping.',
    },
    {
      name: 'David Harrison',
      role: 'Director of UK & Transatlantic Operations',
      location: 'London, United Kingdom',
      bio: 'Over 18 years optimizing transatlantic air freight corridors, express chartering, and international multimodal transit.',
    },
    {
      name: 'Claire Laurent',
      role: 'Head of Global Customs Clearance & Trade Compliance',
      location: 'Frankfurt & Paris Hubs',
      bio: 'Licensed customs brokerage director ensuring zero-delay clearing across European and worldwide air/sea ports.',
    },
    {
      name: 'Boyan Stoyanov',
      role: 'Chief Shipping Technology Officer',
      location: 'Sofia & Remote',
      bio: 'Architect of WTO real-time container tracking, API telemetry, and automated route dispatch engines.',
    },
  ];

  const whoWeAre = websiteContent?.about?.whoWeAre || 
    'World Transport Overseas (WTO) is an international worldwide shipping network and licensed freight forwarder. Headquartered in Sofia, Bulgaria with distribution and port infrastructure across Europe, North America, the Middle East, and Asia, we transport cargo via air flight, ocean vessel, continental railway, and overland highway haulage.';

  const mission = websiteContent?.about?.mission || 
    'To deliver frictionless international cargo and doorstep worldwide shipping with uncompromising speed, real-time transparency, and absolute security for businesses and individuals worldwide.';

  const vision = websiteContent?.about?.vision || 
    'To be the most trusted global shipping bridge linking continental manufacturing with worldwide trade routes through superior air, maritime, rail, and road freight infrastructure.';

  return (
    <section id="about" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* Top Header & Who We Are */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
              About World Transport Overseas (WTO)
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] font-heading tracking-tight leading-tight">
              Global Worldwide Shipping Bridged With Freight Excellence
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              <strong>World Transport Overseas (WTO)</strong> operates with its Global Corporate Headquarters in <strong>Sofia, Bulgaria</strong> (Mimi Balkanska St 126, 1517 Sofia) and major international dispatch gateways across the United Kingdom, Europe, North America, and Asia.
            </p>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {whoWeAre}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-2xl font-black font-heading text-orange-500">20+</span>
                <p className="text-xs font-bold text-slate-700 mt-1">Years Global Heritage</p>
                <p className="text-[11px] text-slate-500">European & worldwide freight experience</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-2xl font-black font-heading text-[#0F2942]">190+</span>
                <p className="text-xs font-bold text-slate-700 mt-1">Countries Connected</p>
                <p className="text-[11px] text-slate-500">Scheduled air & ocean routes</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-gradient-to-br from-[#0F2942] to-[#1E3A8A] text-white p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="space-y-6 relative z-10">
                <div className="border-b border-white/10 pb-5">
                  <div className="flex items-center space-x-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <Target className="w-4 h-4" />
                    <span>Our Mission</span>
                  </div>
                  <h3 className="text-xl font-bold font-heading text-white">
                    Deliver Speed, Safety & Global Reach
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {mission}
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <Compass className="w-4 h-4" />
                    <span>Our Vision</span>
                  </div>
                  <h3 className="text-xl font-bold font-heading text-white">
                    The Most Trusted Worldwide Shipping Bridge
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {vision}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Values Section */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
              Our Guiding Principles
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F2942] font-heading mt-3">
              The Values That Drive WTO
            </h3>
            <p className="text-slate-600 text-sm mt-2">
              Every consignment in our possession is handled with uncompromising commitment to these core pillars.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {values.map((v, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#0F2942] text-orange-400 flex items-center justify-center mb-4 shadow-sm font-bold text-lg">
                    {i + 1}
                  </div>
                  <h4 className="text-base font-bold text-[#0F2942] font-heading mb-2">
                    {v.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leadership & Operations Team */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-orange-600 font-bold uppercase tracking-wider text-xs bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
              Experienced Freight Veterans
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F2942] font-heading mt-3">
              Our Leadership & Operations Team
            </h3>
            <p className="text-slate-600 text-sm mt-2">
              Seasoned supply chain directors managing multimodal maritime, aviation, and ground transport operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F2942] to-blue-800 text-white font-bold text-xl flex items-center justify-center font-heading shadow-md">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0F2942] font-heading">
                    {member.name}
                  </h4>
                  <span className="text-xs font-semibold text-orange-600 block">
                    {member.role}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {member.location}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
