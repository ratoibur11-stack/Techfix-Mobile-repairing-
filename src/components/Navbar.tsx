import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, 
  FileText, 
  Clock, 
  ShoppingBag, 
  Smartphone, 
  MessageSquare, 
  Plus, 
  Phone, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  Camera, 
  Bot, 
  MoreVertical, 
  MoreHorizontal, 
  MessageCircle, 
  ExternalLink, 
  User as UserIcon,
  LogOut,
  Receipt
} from 'lucide-react';
import { BUSINESS_DETAILS } from '../data/initialData';
import { CustomerUser } from './CustomerAuthModal';
import { OWNER_EMAIL } from '../lib/authUtils';
import { TechfixLogo } from './TechfixLogo';
import { ShopBusinessDetails } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewProposal: () => void;
  proposalCount: number;
  customerUser: CustomerUser | null;
  onOpenCustomerLogin: () => void;
  onCustomerLogout?: () => void;
  businessDetails?: ShopBusinessDetails;
  onUpdateBusinessDetails?: (details: ShopBusinessDetails) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewProposal,
  proposalCount,
  customerUser,
  onOpenCustomerLogin,
  onCustomerLogout,
  businessDetails,
  onUpdateBusinessDetails
}) => {
  const [isThreeDotsMenuOpen, setIsThreeDotsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Owner admin check - Strictly restricted to shop owner email & admin role
  const isOwnerLoggedIn = customerUser && (
    customerUser.email?.toLowerCase().trim() === OWNER_EMAIL.toLowerCase() ||
    customerUser.role === 'ADMIN' ||
    (typeof window !== 'undefined' && localStorage.getItem('techfix_is_admin') === 'true')
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsThreeDotsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTabFromMenu = (tab: string) => {
    setActiveTab(tab);
    setIsThreeDotsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Top Emergency & Location Bar */}
      <div className="hidden sm:block bg-slate-950 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {BUSINESS_DETAILS.tagline}
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              {BUSINESS_DETAILS.address}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a 
              href={`tel:${BUSINESS_DETAILS.phone}`} 
              className="flex items-center gap-1 text-slate-200 hover:text-blue-400 transition"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">{BUSINESS_DETAILS.phone}</span>
            </a>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline text-slate-400">
              {BUSINESS_DETAILS.hours}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Brand Info */}
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
            onClick={() => setActiveTab('proposals')}
          >
            {/* Desktop & Tablet: Full Official Same-to-Same Transparent Logo */}
            <div className="hidden sm:block">
              <TechfixLogo 
                variant="full" 
                theme="dark"
                className="h-12 sm:h-14 md:h-16 max-h-16 w-auto drop-shadow-md group-hover:scale-105 transition-transform" 
                customLogoUrl={businessDetails?.logoUrl}
              />
            </div>

            {/* Mobile View: Official Same-to-Same Transparent Logo */}
            <div className="flex sm:hidden items-center">
              <TechfixLogo 
                variant="full" 
                theme="dark"
                className="h-9 sm:h-10 max-w-[240px] w-auto drop-shadow-md group-hover:scale-105 transition-transform shrink-0 object-contain" 
                customLogoUrl={businessDetails?.logoUrl}
              />
            </div>
          </div>

          {/* Header Action Buttons (Menu Button) */}
          <div className="flex items-center gap-2 sm:gap-2.5" ref={dropdownRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThreeDotsMenuOpen(!isThreeDotsMenuOpen)}
                className={`p-2.5 sm:px-4 sm:py-2.5 rounded-none transition-all border flex items-center gap-2 font-extrabold text-xs shadow-lg ${
                  isThreeDotsMenuOpen
                    ? 'bg-blue-600 text-white border-blue-400 shadow-blue-500/30'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 border-blue-500/50'
                }`}
                title="Open All Shop Functions, Admin Panel & User Dashboard"
                aria-label="All Functions Menu"
              >
                <MoreVertical className="w-4.5 h-4.5 text-cyan-200" />
                <span className="inline font-black text-sm">Menu</span>
                <span className="text-[10px] bg-cyan-400 text-slate-950 font-black px-1.5 py-0.5 rounded-none font-mono uppercase">...</span>
              </button>

              {/* FLOATING 3-DOTS DROPDOWN MENU (SQUARE TYPE DESIGN) */}
              {isThreeDotsMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border-2 border-slate-700 rounded-none shadow-2xl z-50 p-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400 flex items-center gap-1">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                      TECHFIX Menu
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Quick Access</span>
                  </div>

                  <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                    {/* USER DASHBOARD / CUSTOMER LOGIN (AT TOP) */}
                    <button
                      onClick={() => {
                        setIsThreeDotsMenuOpen(false);
                        onOpenCustomerLogin();
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-black flex items-center justify-between transition-all ${
                        customerUser
                          ? 'bg-blue-900/80 text-blue-200 border border-blue-500/50 hover:bg-blue-900 shadow-md ring-1 ring-blue-400/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 shadow-sm'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {customerUser ? (
                          <img
                            src={customerUser.photoURL}
                            alt={customerUser.displayName}
                            className="w-4.5 h-4.5 rounded-none border border-cyan-400 object-cover"
                          />
                        ) : (
                          <UserIcon className="w-4 h-4 text-cyan-400" />
                        )}
                        <span className="truncate max-w-[170px]">
                          {customerUser ? `My Profile (${customerUser.displayName.split(' ')[0]})` : 'User Dashboard / Login'}
                        </span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-none bg-emerald-400 text-slate-950 font-black uppercase">
                        {isOwnerLoggedIn ? 'ADMIN' : (customerUser ? 'ACCOUNT' : 'SIGN IN')}
                      </span>
                    </button>

                    {/* 1. PROPOSALS & ESTIMATES / CREATE PROPOSAL */}
                    <button
                      onClick={() => handleSelectTabFromMenu('proposals')}
                      className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold flex items-center justify-between transition-all ${
                        activeTab === 'proposals' ? 'bg-blue-600 text-white shadow font-extrabold' : 'bg-blue-950/40 text-blue-300 hover:bg-slate-800 border border-blue-500/20'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span>1. Proposals & Estimates</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-none bg-blue-900/60 text-blue-300 font-mono">{proposalCount}</span>
                    </button>

                    {/* 2. BOOK REPAIR (FORM) */}
                    <button
                      onClick={() => handleSelectTabFromMenu('repairForm')}
                      className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold flex items-center justify-between transition-all ${
                        activeTab === 'repairForm' ? 'bg-purple-600 text-white shadow font-extrabold' : 'bg-purple-950/40 text-purple-300 hover:bg-slate-800 border border-purple-500/20'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Wrench className="w-4 h-4 text-purple-400" />
                        <span>2. Book Mobile Repair</span>
                      </span>
                    </button>

                    {/* 3. SECOND-HAND MOBILES */}
                    <button
                      onClick={() => handleSelectTabFromMenu('phones')}
                      className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold flex items-center gap-2.5 transition-all ${
                        activeTab === 'phones' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-purple-400" />
                      <span>3. Second-Hand Mobiles</span>
                    </button>

                    {/* 4. SELL OLD PHONE */}
                    <button
                      onClick={() => handleSelectTabFromMenu('sellPhone')}
                      className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold flex items-center justify-between transition-all ${
                        activeTab === 'sellPhone' ? 'bg-emerald-600 text-white shadow font-extrabold' : 'bg-emerald-950/40 text-emerald-300 hover:bg-slate-800 border border-emerald-500/20'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span>4. Sell Old Phone</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-none bg-emerald-400 text-slate-950 font-black">CASH</span>
                    </button>

                    {/* 5. ACCESSORIES */}
                    <button
                      onClick={() => handleSelectTabFromMenu('accessories')}
                      className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold flex items-center gap-2.5 transition-all ${
                        activeTab === 'accessories' ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30' : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                      <span>5. Accessories</span>
                    </button>

                    {/* 6. LIVE TRACKER */}
                    <button
                      onClick={() => handleSelectTabFromMenu('tracker')}
                      className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold flex items-center gap-2.5 transition-all ${
                        activeTab === 'tracker' ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span>6. Live Tracker</span>
                    </button>

                    {/* 7. AI REPAIR STUDIO */}
                    <button
                      onClick={() => handleSelectTabFromMenu('aistudio')}
                      className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold flex items-center justify-between transition-all ${
                        activeTab === 'aistudio' ? 'bg-blue-600 text-white shadow' : 'text-cyan-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Bot className="w-4 h-4 text-cyan-400" />
                        <span>7. AI Repair Studio</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-none bg-amber-400 text-slate-950 font-black">AI</span>
                    </button>

                    {/* 8. SERVICES */}
                    <button
                      onClick={() => handleSelectTabFromMenu('services')}
                      className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold flex items-center gap-2.5 transition-all ${
                        activeTab === 'services' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>8. Services</span>
                    </button>

                    {/* 9. SHOP PHOTOS */}
                    <button
                      onClick={() => handleSelectTabFromMenu('photos')}
                      className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold flex items-center gap-2.5 transition-all ${
                        activeTab === 'photos' ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Camera className="w-4 h-4 text-cyan-400" />
                      <span>9. Shop Photos</span>
                    </button>

                    {/* 10. REVIEWS */}
                    <button
                      onClick={() => handleSelectTabFromMenu('feedback')}
                      className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold flex items-center gap-2.5 transition-all ${
                        activeTab === 'feedback' ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30' : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-rose-400" />
                      <span>10. Reviews</span>
                    </button>

                    {/* ADMIN CONTROL PANEL (ONLY VISIBLE WHEN OWNER LOGGED IN) */}
                    {isOwnerLoggedIn && (
                      <>
                        <div className="my-1.5 border-t border-slate-800" />
                        <button
                          onClick={() => handleSelectTabFromMenu('admin')}
                          className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-black flex items-center justify-between transition-all ${
                            activeTab === 'admin' 
                              ? 'bg-cyan-400 text-slate-950 shadow-md font-extrabold ring-2 ring-cyan-300' 
                              : 'bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900/90 border border-cyan-500/40'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-cyan-400 animate-pulse" />
                            <span>Shop Admin Panel</span>
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-none bg-cyan-400 text-slate-950 font-black uppercase">ADMIN</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Direct Contact Quick Action Section */}
                  <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${BUSINESS_DETAILS.phone}`}
                      className="py-2 px-2.5 rounded-none bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call Shop</span>
                    </a>
                    <a
                      href={`https://wa.me/${BUSINESS_DETAILS.whatsapp}?text=Hello%20TECHFIX%20Goalpara,%20I%20have%20an%20enquiry.`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-2.5 rounded-none bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-bold text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {/* Log Out button for logged in user */}
                  {customerUser && onCustomerLogout && (
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsThreeDotsMenuOpen(false);
                          onCustomerLogout();
                        }}
                        className="w-full py-2 px-3 rounded-none bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        <span>Log Out ({customerUser.displayName.split(' ')[0]})</span>
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>
        </div>

        {/* Tab Navigation Menu (Desktop & Tablet - Square Type Tabs) */}
        <nav className="hidden md:flex items-center gap-1 mt-3 pt-2 border-t border-slate-800/80 overflow-x-auto no-scrollbar scroll-smooth">
          {/* 1. PROPOSALS */}
          <button
            onClick={() => setActiveTab('proposals')}
            className={`flex items-center gap-2 px-3 py-2 rounded-none text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'proposals'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Proposals</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-none text-[10px] bg-blue-900/80 text-blue-300 border border-blue-700/50">
              {proposalCount}
            </span>
          </button>

          {/* 2. BOOK REPAIR (FORM) */}
          <button
            onClick={() => setActiveTab('repairForm')}
            className={`flex items-center gap-2 px-3 py-2 rounded-none text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'repairForm'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-purple-950/60 text-purple-300 hover:bg-purple-900/80 border border-purple-500/30'
            }`}
          >
            <Wrench className="w-4 h-4 text-purple-400" />
            <span>Book Repair</span>
          </button>

          {/* 3. SECOND-HAND MOBILES */}
          <button
            onClick={() => setActiveTab('phones')}
            className={`flex items-center gap-2 px-3 py-2 rounded-none text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'phones'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>Second-Hand Mobiles</span>
          </button>

          {/* 4. SELL OLD PHONE */}
          <button
            onClick={() => setActiveTab('sellPhone')}
            className={`flex items-center gap-2 px-3 py-2 rounded-none text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'sellPhone'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/80 border border-emerald-500/30'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Sell Old Phone</span>
          </button>

          {/* 5. ACCESSORIES */}
          <button
            onClick={() => setActiveTab('accessories')}
            className={`flex items-center gap-2 px-3 py-2 rounded-none text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'accessories'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Accessories</span>
          </button>

          {/* 6. LIVE TRACKER */}
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-2 px-3 py-2 rounded-none text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'tracker'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Live Tracker</span>
          </button>

          {/* 7. AI REPAIR STUDIO */}
          <button
            onClick={() => setActiveTab('aistudio')}
            className={`flex items-center gap-2 px-3 py-2 rounded-none text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'aistudio'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-indigo-950/60 text-cyan-300 hover:bg-indigo-900/80 border border-cyan-500/30'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>AI Repair Studio</span>
            <span className="px-1.5 py-0.5 rounded-none text-[9px] bg-amber-400 text-slate-950 font-black">AI</span>
          </button>

          {/* 8. SERVICES */}
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-3 py-2 rounded-none text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'services'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Services</span>
          </button>

          {/* 9. SHOP PHOTOS */}
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-3 py-2 rounded-none text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'photos'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Shop Photos</span>
          </button>

          {/* 10. REVIEWS */}
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-3 py-2 rounded-none text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'feedback'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-rose-400" />
            <span>Reviews</span>
          </button>

          {/* Admin Panel Nav Tab (ONLY VISIBLE WHEN OWNER LOGGED IN - SQUARE TYPE) */}
          {isOwnerLoggedIn && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3 py-2 rounded-none text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'admin'
                  ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20 font-black'
                  : 'bg-cyan-950/40 text-cyan-300 hover:bg-slate-800 border border-cyan-500/30'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Shop Admin Panel</span>
              <span className="px-1.5 py-0.5 rounded-none text-[9px] bg-cyan-400 text-slate-950 font-black">ADMIN</span>
            </button>
          )}

          {/* Quick 3-Dots Tab Button */}
          <button
            onClick={() => setIsThreeDotsMenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-none text-xs font-bold text-cyan-300 hover:bg-slate-800/80 transition-all ml-auto shrink-0 border border-slate-700/80"
            title="Open all functions menu"
          >
            <MoreHorizontal className="w-4 h-4 text-cyan-400" />
            <span>More (...)</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

