import React from 'react';
import { 
  Smartphone, 
  Cpu, 
  CircuitBoard, 
  ShoppingBag, 
  ShieldCheck, 
  CheckCircle2, 
  Wrench, 
  PhoneCall, 
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { REPAIR_SERVICES, BUSINESS_DETAILS } from '../data/initialData';

interface ServicesCatalogProps {
  onNewProposal: () => void;
}

export const ServicesCatalog: React.FC<ServicesCatalogProps> = ({ onNewProposal }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
          Complete Mobile Solutions
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Our Repair Services & IC Capabilities
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          From simple screen & battery replacements to advanced microscopic IC reballing and official software flashing, TECHFIX delivers reliable solutions for all Android smartphones.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {REPAIR_SERVICES.map((srv, idx) => (
          <div 
            key={idx}
            className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-900 text-blue-400">
                  {idx === 0 && <Smartphone className="w-6 h-6" />}
                  {idx === 1 && <Cpu className="w-6 h-6" />}
                  {idx === 2 && <CircuitBoard className="w-6 h-6" />}
                  {idx === 3 && <ShoppingBag className="w-6 h-6" />}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                    {srv.badge}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">{srv.title}</h2>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {srv.description}
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Key Repair Capabilities:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {srv.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pre-Repair Diagnosis Section */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
              Diagnostic Quality Assurance
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              🔍 Professional Pre-Repair Diagnosis
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Before starting any hardware or IC repair, our technician conducts a thorough multi-meter and microscopic inspection. We diagnose the exact cause and present an itemized proposal estimate before you commit.
            </p>

            <div className="flex flex-wrap gap-4 text-xs text-slate-300 pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                No Hidden Charges
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Authentic Component Testing
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                90-Day Shop Warranty
              </span>
            </div>
          </div>

          <div className="lg:col-span-4 text-center lg:text-right space-y-3">
            <button
              onClick={onNewProposal}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all"
            >
              Get Free Repair Quote
            </button>
            <p className="text-[11px] text-slate-400">
              Or visit TECHFIX shop at Dubapara Lupta Char, Goalpara
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
