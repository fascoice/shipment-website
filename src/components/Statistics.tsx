import React, { useEffect, useState } from 'react';
import { PackageCheck, Users, MapPin, Award, ShieldAlert, Sparkles } from 'lucide-react';
import { WebsiteContent } from '../types';

interface StatisticsProps {
  websiteContent?: WebsiteContent | null;
}

export const Statistics: React.FC<StatisticsProps> = ({ websiteContent }) => {
  const [counts, setCounts] = useState({
    packages: 0,
    customers: 0,
    locations: 0,
    successRate: 0,
  });

  useEffect(() => {
    const duration = 1600;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(1, step / steps);
      const factor = 1 - Math.pow(1 - progress, 3);

      setCounts({
        packages: Math.floor(10000 * factor),
        customers: Math.floor(5000 * factor),
        locations: Math.floor(100 * factor),
        successRate: Math.floor(99 * factor),
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounts({
          packages: 10000,
          customers: 5000,
          locations: 100,
          successRate: 99,
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      id: 'packages',
      icon: PackageCheck,
      value: websiteContent?.stats?.packagesDelivered || `${counts.packages.toLocaleString()}+`,
      label: 'Packages Delivered',
      detail: 'Safely transported worldwide',
      color: 'from-blue-600 to-indigo-700',
      badge: 'Certified Handover',
    },
    {
      id: 'customers',
      icon: Users,
      value: websiteContent?.stats?.happyCustomers || `${counts.customers.toLocaleString()}+`,
      label: 'Satisfied Clients',
      detail: 'Corporate merchants & individuals',
      color: 'from-orange-500 to-amber-600',
      badge: 'Global Partners',
    },
    {
      id: 'locations',
      icon: MapPin,
      value: websiteContent?.stats?.deliveryLocations || '190+ Countries',
      label: 'International Delivery Hubs',
      detail: 'Europe, Americas, Asia & Africa',
      color: 'from-emerald-600 to-teal-700',
      badge: 'Worldwide Coverage',
    },
    {
      id: 'success',
      icon: Award,
      value: websiteContent?.stats?.deliverySuccessRate || `${counts.successRate}%`,
      label: 'Delivery Success Rate',
      detail: 'On-schedule physical arrival',
      color: 'from-blue-700 to-cyan-600',
      badge: 'SLA Guaranteed',
    },
  ];

  return (
    <section className="relative z-20 -mt-10 sm:-mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-900/5 border border-slate-200/80 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                  {stat.badge}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0F2942] tracking-tight font-heading">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {stat.label}
                </div>
                <p className="text-xs text-slate-500 font-medium pt-1">
                  {stat.detail}
                </p>
              </div>

              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-slate-50 rounded-full opacity-60 group-hover:bg-orange-50 group-hover:scale-150 transition-all duration-500 pointer-events-none -z-0"></div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
