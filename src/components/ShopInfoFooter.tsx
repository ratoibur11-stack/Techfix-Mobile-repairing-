import React from 'react';
import { 
  Wrench, 
  MapPin, 
  PhoneCall, 
  Mail, 
  Clock, 
  ShieldCheck, 
  MessageCircle,
  QrCode,
  Globe,
  ExternalLink,
  Send,
  Instagram
} from 'lucide-react';
import { BUSINESS_DETAILS } from '../data/initialData';
import { ShopBusinessDetails } from '../types';
import { TechfixLogo } from './TechfixLogo';

interface ShopInfoFooterProps {
  businessDetails?: ShopBusinessDetails;
}

export const ShopInfoFooter: React.FC<ShopInfoFooterProps> = ({
  businessDetails = BUSINESS_DETAILS
}) => {
  const domain = businessDetails.websiteDomain || 'sarate.wuaze.com';

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Col 1: Shop Brand & Promise */}
        <div className="space-y-3">
          <div className="pt-1">
            <TechfixLogo 
              variant="full" 
              theme="dark" 
              className="h-14 sm:h-16 w-auto" 
              showSlogan={true} 
              customLogoUrl={businessDetails.logoUrl}
            />
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {businessDetails.type}
          </p>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-blue-300 italic font-semibold">
            "{businessDetails.tagline}"
          </div>
          <a
            href={`http://${domain}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-cyan-300 border border-blue-800/60 text-xs font-mono font-bold transition"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{domain}</span>
            <ExternalLink className="w-3 h-3 text-cyan-400 shrink-0" />
          </a>
        </div>

        {/* Col 2: Services Summary */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Core Repair Services
          </h2>
          <ul className="space-y-1 text-xs text-slate-300">
            <li>• Android Mobile A to Z Hardware Repairing</li>
            <li>• Display / LCD & Touch Glass Replacement</li>
            <li>• Charging IC & Power IC Micro-soldering</li>
            <li>• Official Firmware Flashing & Software Updates</li>
            <li>• Water-Damaged Mobile De-oxidation</li>
            <li>• Tested Pre-Owned Smartphone Sales</li>
          </ul>
        </div>

        {/* Col 3: Business Information & Address */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Goalpara Shop Location
          </h2>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{businessDetails.address}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{businessDetails.hours}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <a
                href={`http://${domain}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline font-mono font-semibold"
              >
                {domain}
              </a>
            </div>
          </div>
        </div>

        {/* Col 4: Contact & UPI QR Payment */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Contact & UPI QR Payment
          </h2>
          <div className="space-y-2 text-xs">
            <a 
              href={`tel:${businessDetails.phone}`} 
              className="flex items-center gap-2 text-blue-400 hover:underline font-semibold"
            >
              <PhoneCall className="w-4 h-4 text-blue-400" />
              <span>{businessDetails.phone}</span>
            </a>

            <a 
              href={`mailto:${businessDetails.email}`} 
              className="flex items-center gap-2 text-slate-300 hover:text-white"
            >
              <Mail className="w-4 h-4 text-amber-400" />
              <span>{businessDetails.email}</span>
            </a>

            {/* UPI ID Pill */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold uppercase">
                <span className="flex items-center gap-1">
                  <QrCode className="w-3 h-3" /> Shop UPI ID
                </span>
                <span className="text-emerald-400">INSTANT PAY</span>
              </div>
              <p className="text-xs font-mono font-extrabold text-white">{businessDetails.upiId}</p>
            </div>

            <a
              href={`https://wa.me/${businessDetails.whatsapp}?text=Hello%20TECHFIX,%20I%20have%20a%20repair%20enquiry.`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs mt-1 shadow w-full justify-center transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Direct Chat</span>
            </a>

            {/* Telegram & Instagram Quick Links */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {businessDetails.telegram && (
                <a
                  href={businessDetails.telegram.startsWith('http') ? businessDetails.telegram : `https://t.me/${businessDetails.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/80 text-[11px] font-semibold transition justify-center"
                >
                  <Send className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">Telegram</span>
                </a>
              )}

              {businessDetails.instagram && (
                <a
                  href={businessDetails.instagram.startsWith('http') ? businessDetails.instagram : `https://instagram.com/${businessDetails.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-950/80 hover:bg-pink-900 text-pink-300 border border-pink-800/80 text-[11px] font-semibold transition justify-center"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span className="truncate">Instagram</span>
                </a>
              )}
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© 2026 {businessDetails.name}, Goalpara, Assam. All Rights Reserved.</p>
        <div className="flex items-center gap-3">
          <a href={`http://${domain}`} className="text-cyan-400 hover:underline font-mono">{domain}</a>
          <span>•</span>
          <p>Quality Focused Repair • Pre-repair Diagnosis • Shop Warranty Guaranteed</p>
        </div>
      </div>
    </footer>
  );
};
