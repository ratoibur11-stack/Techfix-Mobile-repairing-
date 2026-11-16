import React, { useState } from 'react';
import {
  FileText,
  Wrench,
  Smartphone,
  Clock,
  Menu,
  X,
  ShoppingBag,
  Bot,
  ShieldCheck,
  Camera,
  MessageSquare,
  Phone,
  MessageCircle,
  User,
  Sparkles,
  ChevronRight,
  Receipt
} from 'lucide-react';
import { CustomerUser } from './CustomerAuthModal';
import { OWNER_EMAIL } from '../lib/authUtils';
import { BUSINESS_DETAILS } from '../data/initialData';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  proposalCount: number;
  customerUser: CustomerUser | null;
  onOpenCustomerLogin: () => void;
  onCustomerLogout?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  proposalCount,
  customerUser,
  onOpenCustomerLogin,
  onCustomerLogout
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isOwnerLoggedIn = customerUser && (
    customerUser.email?.toLowerCase().trim() === OWNER_EMAIL.toLowerCase()
  );

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setIsDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* NATIVE BOTTOM NAVIGATION BAR (FIXED FOR PHONES - SQUARE TYPE) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 md:hidden shadow-[0_-8px_25px_rgba(0,0,0,0.6)]">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {/* 1. HOME / ESTIMATES */}
          <button
            type="button"
            onClick={() => handleSelectTab('proposals')}
            className={`flex flex-col items-center justify-center h-full relative transition-all active:scale-95 cursor-pointer ${
              activeTab === 'proposals' && !isDrawerOpen
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <FileText className="w-5 h-5" />
              {proposalCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[9px] font-black w-4 h-4 rounded-none flex items-center justify-center border border-slate-950">
                  {proposalCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-medium tracking-tight">Home</span>
            {activeTab === 'proposals' && !isDrawerOpen && (
              <span className="absolute top-0 w-8 h-1 bg-amber-400 rounded-none shadow-sm shadow-amber-400/50" />
            )}
          </button>

          {/* 2. BOOK REPAIR */}
          <button
            type="button"
            onClick={() => handleSelectTab('repairForm')}
            className={`flex flex-col items-center justify-center h-full relative transition-all active:scale-95 cursor-pointer ${
              activeTab === 'repairForm' && !isDrawerOpen
                ? 'text-purple-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <div className="p-1 rounded-none bg-purple-950/80 border border-purple-500/40">
                <Wrench className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <span className="text-[10px] mt-0.5 font-bold tracking-tight text-purple-300">Book</span>
            {activeTab === 'repairForm' && !isDrawerOpen && (
              <span className="absolute top-0 w-8 h-1 bg-purple-400 rounded-none shadow-sm shadow-purple-400/50" />
            )}
          </button>

          {/* 3. MOBILES STORE */}
          <button
            type="button"
            onClick={() => handleSelectTab('phones')}
            className={`flex flex-col items-center justify-center h-full relative transition-all active:scale-95 cursor-pointer ${
              (activeTab === 'phones' || activeTab === 'accessories' || activeTab === 'sellPhone') && !isDrawerOpen
                ? 'text-cyan-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium tracking-tight">Mobiles</span>
            {(activeTab === 'phones' || activeTab === 'accessories' || activeTab === 'sellPhone') && !isDrawerOpen && (
              <span className="absolute top-0 w-8 h-1 bg-cyan-400 rounded-none shadow-sm shadow-cyan-400/50" />
            )}
          </button>

          {/* 4. TRACK STATUS */}
          <button
            type="button"
            onClick={() => handleSelectTab('tracker')}
            className={`flex flex-col items-center justify-center h-full relative transition-all active:scale-95 cursor-pointer ${
              activeTab === 'tracker' && !isDrawerOpen
                ? 'text-emerald-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium tracking-tight">Track</span>
            {activeTab === 'tracker' && !isDrawerOpen && (
              <span className="absolute top-0 w-8 h-1 bg-emerald-400 rounded-none shadow-sm shadow-emerald-400/50" />
            )}
          </button>

          {/* 5. ALL MENU / DRAWER */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex flex-col items-center justify-center h-full relative transition-all active:scale-95 cursor-pointer ${
              isDrawerOpen
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              {isDrawerOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </div>
            <span className="text-[10px] mt-1 font-medium tracking-tight">
              {isDrawerOpen ? 'Close' : 'Menu'}
            </span>
            {isDrawerOpen && (
              <span className="absolute top-0 w-8 h-1 bg-amber-400 rounded-none shadow-sm shadow-amber-400/50" />
            )}
          </button>
        </div>
      </nav>

      {/* MOBILE SLIDE-UP DRAWER (NATIVE APP SHEET - SQUARE TYPE) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden flex flex-col justify-end animate-fade-in">
          {/* Backdrop Click to close */}
          <div className="flex-1" onClick={() => setIsDrawerOpen(false)} />

          <div className="bg-slate-900 border-t-2 border-slate-700 rounded-none max-h-[80vh] flex flex-col shadow-2xl pb-20 text-white animate-slide-up">
            {/* Drawer Handle */}
            <div className="w-12 h-1 bg-slate-700 rounded-none mx-auto my-3 shrink-0" />

            {/* Header */}
            <div className="px-5 pb-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  <span>TECHFIX All Features</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400">Select any shop function</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-none bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Content */}
            <div className="overflow-y-auto p-4 space-y-2">
              {/* User Login / Profile Card */}
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenCustomerLogin();
                }}
                className={`w-full p-3 rounded-none text-left border flex items-center justify-between transition cursor-pointer ${
                  customerUser
                    ? 'bg-blue-950/60 border-blue-500/40 text-blue-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {customerUser ? (
                    <img
                      src={customerUser.photoURL}
                      alt={customerUser.displayName}
                      className="w-8 h-8 rounded-none border border-cyan-400 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-none bg-slate-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-cyan-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-black text-white">
                      {customerUser ? customerUser.displayName : 'Sign In / Customer Dashboard'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {customerUser ? customerUser.email : 'Track your repair timeline & bookings'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Grid of All Core Features (Square Type Buttons) */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectTab('proposals')}
                  className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeTab === 'proposals'
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-slate-800/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold truncate">1. Proposals</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('repairForm')}
                  className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeTab === 'repairForm'
                      ? 'bg-purple-600 border-purple-400 text-white'
                      : 'bg-slate-800/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs font-bold truncate">2. Book Repair</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('phones')}
                  className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeTab === 'phones'
                      ? 'bg-purple-600 border-purple-400 text-white'
                      : 'bg-slate-800/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs font-bold truncate">3. Mobiles Store</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('sellPhone')}
                  className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeTab === 'sellPhone'
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-slate-800/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold truncate">4. Sell Old Phone</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('accessories')}
                  className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeTab === 'accessories'
                      ? 'bg-amber-600 border-amber-400 text-white'
                      : 'bg-slate-800/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold truncate">5. Accessories</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('tracker')}
                  className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeTab === 'tracker'
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-slate-800/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold truncate">6. Live Tracker</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('aistudio')}
                  className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeTab === 'aistudio'
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-slate-800/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-bold truncate">7. AI Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('services')}
                  className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeTab === 'services'
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-800/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-xs font-bold truncate">8. Services</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('photos')}
                  className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeTab === 'photos'
                      ? 'bg-cyan-600 border-cyan-400 text-white'
                      : 'bg-slate-800/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-bold truncate">9. Shop Photos</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('feedback')}
                  className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeTab === 'feedback'
                      ? 'bg-rose-600 border-rose-400 text-white'
                      : 'bg-slate-800/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-xs font-bold truncate">10. Reviews</span>
                </button>
              </div>

              {/* Owner Admin Panel (Only when owner logged in - Square Type) */}
              {isOwnerLoggedIn && (
                <button
                  type="button"
                  onClick={() => handleSelectTab('admin')}
                  className="w-full mt-2 p-3 rounded-none bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-between shadow-lg cursor-pointer border-2 border-cyan-200"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Open Shop Admin Settings</span>
                  </div>
                  <span className="bg-slate-950 text-cyan-300 px-2 py-0.5 rounded-none text-[10px]">
                    ADMIN
                  </span>
                </button>
              )}

              {/* Quick Call & WhatsApp Buttons */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                <a
                  href={`tel:${BUSINESS_DETAILS.phone}`}
                  className="py-2.5 px-3 rounded-none bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Call Shop</span>
                </a>
                <a
                  href={`https://wa.me/${BUSINESS_DETAILS.whatsapp}?text=Hello%20TECHFIX%20Goalpara,%20I%20have%20an%20enquiry.`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-none bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
