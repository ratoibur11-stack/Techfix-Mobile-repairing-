import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Smartphone, 
  Clock, 
  Sparkles, 
  PhoneCall, 
  MessageCircle, 
  CheckCircle2, 
  MapPin, 
  FileCheck, 
  Camera, 
  Megaphone 
} from 'lucide-react';
import { BUSINESS_DETAILS, INITIAL_BANNER_CONFIG } from '../data/initialData';
import { BannerConfig, ShopBusinessDetails } from '../types';
import { TechfixLogo } from './TechfixLogo';

interface HeroSectionProps {
  onNewProposal: () => void;
  onTrackRepair: () => void;
  onViewServices: () => void;
  onViewPhotos?: () => void;
  onOpenRepairForm?: () => void;
  onOpenSellPhone?: () => void;
  bannerConfig?: BannerConfig;
  businessDetails?: ShopBusinessDetails;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNewProposal,
  onTrackRepair,
  onViewServices,
  onViewPhotos,
  onOpenRepairForm,
  onOpenSellPhone,
  bannerConfig = INITIAL_BANNER_CONFIG,
  businessDetails = BUSINESS_DETAILS
}) => {
  return (
    <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 text-white">
      {/* Background Subtle Tech Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Promotional Announcement if available */}
      {bannerConfig.promoAnnouncement && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white py-2 px-4 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md">
          <Megaphone className="w-4 h-4 text-amber-300 animate-bounce shrink-0" />
          <span>{bannerConfig.promoAnnouncement}</span>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Location & Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-emerald-400">
                {bannerConfig.locationBadge || "Goalpara, Assam • Android A to Z Hardware, Software & IC Repairing"}
              </span>
            </div>

            {/* Official Golden Brand Logo Emblem & Header */}
            <div className="flex justify-center lg:justify-start pt-1">
              <TechfixLogo 
                variant="full" 
                showSlogan={true} 
                className="h-20 sm:h-24 md:h-28 w-auto filter drop-shadow-2xl" 
                customLogoUrl={businessDetails.logoUrl}
              />
            </div>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Goalpara's dedicated repair laboratory providing instant technical proposals, transparent itemized cost estimates, live timeline updates, IC board-level repairs, spare parts, accessories, and tested pre-owned smartphones.
            </p>

            {/* Slogan Banner */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 max-w-xl mx-auto lg:mx-0 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium">
                Our Service Promise: <span className="text-blue-300 italic font-semibold">"{bannerConfig.servicePromise || businessDetails.tagline}"</span>
              </p>
            </div>

            {/* Action Buttons (Native Mobile Cards on Phone, Row on Desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-2 w-full">
              {onOpenRepairForm && (
                <button
                  onClick={onOpenRepairForm}
                  className="w-full lg:w-auto flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.02] transition-all ring-2 ring-purple-400/40 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-purple-300" />
                  <span>Book Mobile Repair (Online Form)</span>
                </button>
              )}

              <button
                onClick={onNewProposal}
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>{bannerConfig.primaryCtaText || "Create Repair Proposal"}</span>
              </button>

              <button
                onClick={onTrackRepair}
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{bannerConfig.secondaryCtaText || "Track Repair Status"}</span>
              </button>

              {onViewPhotos && (
                <button
                  onClick={onViewPhotos}
                  className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Shop Photos</span>
                </button>
              )}

              <a
                href={`https://wa.me/${businessDetails.whatsapp}?text=Hello%20Techfix,%20I%20have%20an%20enquiry%20regarding%20mobile%20repairing.`}
                target="_blank"
                rel="noreferrer"
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Quick Contact & Address Links */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <a href={`tel:${businessDetails.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-1.5 hover:text-blue-400 transition">
                <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                <span>Helpline: {businessDetails.phone}</span>
              </a>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{businessDetails.address}</span>
              </span>
            </div>
          </div>

          {/* Right Column: Workshop Hero Visual & Service Highlights */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Workshop Hero Card */}
            <div className="group relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
              <div className="aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden relative">
                <img
                  src={bannerConfig.heroImage || '/images/technician_mobile_repair.jpg'}
                  alt="TECHFIX Mobile Repair Lab"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/technician_mobile_repair.jpg';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                {/* Live Lab Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs text-cyan-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Workshop • Goalpara Lab</span>
                </div>

                {/* Caption Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-xs">
                  <div>
                    <p className="font-bold text-white text-sm sm:text-base drop-shadow-md">
                      IC-Level Micro-Soldering & Android Lab
                    </p>
                    <p className="text-[11px] text-slate-300 font-medium drop-shadow">
                      Specialized in Water Damage, Display & Charging Solutions
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] uppercase shadow">
                    Genuine Parts
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Trust Highlights / 4 Feature Pills */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">IC Level Repair</p>
                  <p className="text-[10px] text-slate-400">Micro-soldering under 40x microscope</p>
                </div>
              </div>
              
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Tested Spare Parts</p>
                  <p className="text-[10px] text-slate-400">Original displays & batteries</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Digital Estimates</p>
                  <p className="text-[10px] text-slate-400">Transparent bills with warranty</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Express Delivery</p>
                  <p className="text-[10px] text-slate-400">Same-day turnaround for common repairs</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
