import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/firebase';
import { processUserLoginProfile, OWNER_EMAIL } from '../lib/authUtils';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  LogOut, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Shield, 
  AlertCircle, 
  KeyRound, 
  UserPlus,
  Wrench,
  Clock,
  Smartphone,
  PlusCircle,
  ChevronRight,
  MessageCircle,
  Phone,
  Calendar,
  Zap,
  DollarSign
} from 'lucide-react';
import { CustomerUser, CustomerRepairRequest, RepairProposal, OldPhoneSellRequest } from '../types';
import { BUSINESS_DETAILS } from '../data/initialData';
export type { CustomerUser };

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerUser: CustomerUser | null;
  onCustomerLogin: (user: CustomerUser) => void;
  onCustomerLogout: () => void;
  repairRequests?: CustomerRepairRequest[];
  proposals?: RepairProposal[];
  oldPhoneSellRequests?: OldPhoneSellRequest[];
  onNavigateToTab?: (tab: string, searchQuery?: string) => void;
  initialProfileTab?: 'bookings' | 'sell' | 'account';
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  customerUser,
  onCustomerLogin,
  onCustomerLogout,
  repairRequests = [],
  proposals = [],
  oldPhoneSellRequests = [],
  onNavigateToTab,
  initialProfileTab = 'bookings'
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeProfileTab, setActiveProfileTab] = useState<'bookings' | 'sell' | 'account'>(initialProfileTab);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial tab when changed
  React.useEffect(() => {
    if (initialProfileTab) {
      setActiveProfileTab(initialProfileTab);
    }
  }, [initialProfileTab, isOpen]);

  if (!isOpen) return null;

  // Check if current logged-in user is shop owner
  const isOwner = customerUser?.email?.toLowerCase().trim() === OWNER_EMAIL.toLowerCase();
  const userEmail = customerUser?.email?.toLowerCase().trim() || '';
  const userName = customerUser?.displayName?.toLowerCase().trim() || '';

  // Local storage sell & repair IDs saved on this device
  let localSavedSellIds: string[] = [];
  try {
    localSavedSellIds = JSON.parse(localStorage.getItem('techfix_my_sell_ids') || '[]');
  } catch (e) {}

  let localSavedRepairIds: string[] = [];
  try {
    localSavedRepairIds = JSON.parse(localStorage.getItem('techfix_my_repair_ids') || '[]');
  } catch (e) {}

  const myRepairRequests = repairRequests.filter(r => 
    (customerUser?.uid && r.userId && r.userId === customerUser.uid) ||
    localSavedRepairIds.includes(r.requestId) ||
    localSavedRepairIds.includes(r.id) ||
    (userEmail && r.email && r.email.toLowerCase().trim() === userEmail) ||
    (userName && r.customerName && r.customerName.toLowerCase().trim().includes(userName) && userName.length > 2) ||
    (customerUser?.phoneNumber && r.contactPhone && r.contactPhone.includes(customerUser.phoneNumber))
  );

  const myProposals = proposals.filter(p => 
    (customerUser?.uid && p.userId && p.userId === customerUser.uid) ||
    localSavedRepairIds.includes(p.proposalNumber) ||
    localSavedRepairIds.includes(p.id) ||
    (userEmail && p.clientEmail && p.clientEmail.toLowerCase().trim() === userEmail) ||
    (userName && p.clientName && p.clientName.toLowerCase().trim().includes(userName) && userName.length > 2)
  );

  const mySellRequests = oldPhoneSellRequests.filter(s => {
    if (customerUser?.uid && s.userId && s.userId === customerUser.uid) return true;
    // 1. Matched by device submission in local storage
    if (localSavedSellIds.includes(s.id)) return true;

    const sEmail = (s.email || '').toLowerCase().trim();
    const sName = (s.customerName || '').toLowerCase().trim();
    const sPhone = (s.contactPhone || '').trim();

    // 2. Matched by logged-in profile email or name
    if (!customerUser) return false;
    return (
      (userEmail && sEmail === userEmail) ||
      (userName && sName.includes(userName) && userName.length > 2) ||
      (userName && userName.includes(sName) && sName.length > 2) ||
      (customerUser?.phoneNumber && sPhone.includes(customerUser.phoneNumber))
    );
  });

  // Combine unique repair entries with complete live tracking data
  const combinedUserBookings: Array<{
    id: string;
    requestId: string;
    deviceModel: string;
    problem: string;
    status: string;
    createdAt: string;
    progressPercent: number;
    expectedDeliveryDate: string;
    technicianNote?: string;
    assignedTechnician?: string;
    estimatedCost?: number;
    advancePaid?: number;
    balanceDue?: number;
    serviceType?: string;
    photoUrl?: string;
    devicePhotos?: string[];
  }> = [];

  const seenIds = new Set<string>();

  myRepairRequests.forEach(r => {
    seenIds.add(r.requestId.toLowerCase());
    
    // Calculate progress percent based on status if not explicitly set
    let progress = r.progressPercent ?? 15;
    if (r.progressPercent === undefined) {
      if (r.status === 'Completed') progress = 100;
      else if (r.status === 'Ready for Pickup') progress = 95;
      else if (r.status === 'Quality Testing') progress = 80;
      else if (r.status === 'In Progress') progress = 60;
      else if (r.status === 'Contacted' || r.status === 'Approved') progress = 35;
      else progress = 15;
    }

    const expectedDate = r.expectedDeliveryDate || (
      r.urgency === 'Urgent Express' ? 'Today (Same Day Express)' : 'Tomorrow / 1-2 Days'
    );

    combinedUserBookings.push({
      id: r.id,
      requestId: r.requestId,
      deviceModel: `${r.deviceBrand} ${r.deviceModel}`,
      problem: r.problemDescription,
      status: r.status,
      createdAt: r.createdAt,
      progressPercent: progress,
      expectedDeliveryDate: expectedDate,
      technicianNote: r.technicianNote,
      assignedTechnician: r.assignedTechnician,
      estimatedCost: r.estimatedCost,
      advancePaid: r.advancePaid,
      balanceDue: r.balanceDue,
      serviceType: r.serviceType,
      photoUrl: r.photoUrl,
      devicePhotos: r.devicePhotos || (r.photoUrl ? [r.photoUrl] : [])
    });
  });

  myProposals.forEach(p => {
    if (!seenIds.has(p.proposalNumber.toLowerCase())) {
      seenIds.add(p.proposalNumber.toLowerCase());

      const completedCount = p.timelineEvents.filter(e => e.completed).length;
      const progress = p.status === 'Completed' ? 100 : Math.round((completedCount / p.timelineEvents.length) * 100) || 30;

      combinedUserBookings.push({
        id: p.id,
        requestId: p.proposalNumber,
        deviceModel: `${p.deviceBrand} ${p.deviceModel}`,
        problem: p.problemDescription || (p as any).issueDescription || 'Repair inspection',
        status: p.status,
        createdAt: p.createdAt,
        progressPercent: progress,
        expectedDeliveryDate: p.estimatedCompletionTime || 'Same Day / 24 Hours',
        technicianNote: p.diagnosticNotes || 'Quotation & technical inspection active.',
        assignedTechnician: 'Master Tech (Goalpara)',
        estimatedCost: p.finalPrice,
        advancePaid: p.advancePaid,
        balanceDue: p.balanceDue,
        serviceType: 'Shop Walk-in',
        photoUrl: p.photoUrl,
        devicePhotos: p.devicePhotos || (p.photoUrl ? [p.photoUrl] : [])
      });
    }
  });

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      const profile = processUserLoginProfile(user);
      onCustomerLogin(profile);
      onClose();
    } catch (err: any) {
      console.warn('Customer Google Sign-In note:', err);
      setErrorMsg('Google Popup note: You can log in using Email & Password below.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid Gmail / Email address.');
      return;
    }
    if (!passwordInput || passwordInput.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const cleanEmail = emailInput.trim();

    try {
      if (authMode === 'signup') {
        const displayName = nameInput.trim() || cleanEmail.split('@')[0];
        const user = await signUpWithEmail(cleanEmail, passwordInput, displayName);
        const profile = processUserLoginProfile(user);
        onCustomerLogin(profile);
        onClose();
      } else {
        const user = await signInWithEmail(cleanEmail, passwordInput);
        const profile = processUserLoginProfile(user);
        onCustomerLogin(profile);
        onClose();
      }
    } catch (err: any) {
      console.warn('Authentication error:', err?.code, err?.message);
      let errorText = 'Incorrect password or account details. Please check and try again.';
      
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        errorText = 'Incorrect password entered. Please check your password and try again.';
      } else if (err?.code === 'auth/user-not-found') {
        errorText = 'No account found with this email. Please click "Sign Up" to register first.';
      } else if (err?.code === 'auth/email-already-in-use') {
        errorText = 'An account with this email already exists. Please click "Sign In" to log in.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        errorText = 'Email/Password sign-in is not enabled in Firebase Authentication. Please enable Email/Password provider in Firebase Console under Authentication > Sign-in method.';
      } else if (err?.message) {
        errorText = err.message;
      }

      setErrorMsg(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full min-h-screen sm:min-h-0 sm:max-w-xl bg-white rounded-none sm:rounded-3xl border-0 sm:border border-slate-200 shadow-2xl p-4 sm:p-8 space-y-5 my-0 sm:my-8 overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <UserIcon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            {customerUser ? `${customerUser.displayName}'s Profile & Bookings` : (authMode === 'login' ? 'Customer Gmail / Password Login' : 'Create Customer Account')}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {customerUser 
              ? 'View your active mobile repair bookings, track live progress, and manage sell requests.' 
              : 'Log in with Gmail or Password to track device repair status, post reviews, and manage bookings.'}
          </p>
        </div>

        {customerUser ? (
          /* LOGGED IN CUSTOMER VIEW */
          <div className="space-y-4 pt-1">
            {/* User Profile Summary Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white border border-blue-800/50 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={customerUser.photoURL}
                  alt={customerUser.displayName}
                  className="w-12 h-12 rounded-full border-2 border-cyan-400 object-cover shrink-0"
                />
                <div className="text-left overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white truncate">
                      {customerUser.displayName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                      isOwner ? 'bg-cyan-400 text-slate-950' : 'bg-emerald-400 text-slate-950'
                    }`}>
                      {isOwner ? 'OWNER ADMIN' : 'CUSTOMER'}
                    </span>
                  </div>
                  <p className="text-xs text-cyan-300 font-mono truncate">{customerUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  onCustomerLogout();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 font-bold text-xs border border-slate-700 hover:border-rose-800 transition shrink-0 flex items-center gap-1.5"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Sign Out</span>
              </button>
            </div>

            {/* If Shop Owner is Logged In, Show Direct Admin Control Panel Switch Button */}
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToTab) onNavigateToTab('admin');
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                <Shield className="w-4.5 h-4.5 text-slate-950" />
                <span>Open Shop Admin Control Panel</span>
                <ChevronRight className="w-4 h-4 text-slate-950" />
              </button>
            )}

            {/* Profile Navigation Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setActiveProfileTab('bookings')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeProfileTab === 'bookings' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                <span>My Bookings ({combinedUserBookings.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab('sell')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeProfileTab === 'sell' ? 'bg-white text-emerald-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sell Quotes ({mySellRequests.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab('account')}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeProfileTab === 'account' ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Account</span>
              </button>
            </div>

            {/* TAB 1: MY REPAIR BOOKINGS */}
            {activeProfileTab === 'bookings' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Your Submitted Repair Requests</span>
                  <button
                    onClick={() => {
                      if (onNavigateToTab) onNavigateToTab('repairForm');
                      onClose();
                    }}
                    className="text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1 text-[11px]"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Book New Repair</span>
                  </button>
                </div>

                {combinedUserBookings.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                    <Wrench className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700">No repair request found for {customerUser.email}</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        You have not submitted any mobile repair requests yet. Click below to book a new smartphone repair.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (onNavigateToTab) onNavigateToTab('repairForm');
                        onClose();
                      }}
                      className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow transition inline-flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Book Mobile Repair Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {combinedUserBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200 shadow-sm transition space-y-3 text-left relative overflow-hidden"
                      >
                        {/* Status accent top stripe */}
                        <div 
                          className={`absolute top-0 left-0 right-0 h-1 ${
                            b.status === 'Completed' || b.status === 'Ready for Pickup' ? 'bg-emerald-500' :
                            b.status === 'Quality Testing' ? 'bg-cyan-500' :
                            b.status === 'In Progress' ? 'bg-blue-600' : 'bg-amber-500'
                          }`}
                        />

                        {/* Top Header */}
                        <div className="flex items-start justify-between gap-2 pt-0.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200">
                                {b.requestId}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {b.createdAt}
                              </span>
                              {b.serviceType && (
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                                  {b.serviceType}
                                </span>
                              )}
                            </div>
                            <h4 className="text-base font-extrabold text-slate-900 mt-1">
                              {b.deviceModel}
                            </h4>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            b.status === 'Completed' || b.status === 'Ready for Pickup' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            b.status === 'Quality Testing' ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' :
                            b.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            ● {b.status}
                          </span>
                        </div>

                        {/* Problem Snippet */}
                        <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          "{b.problem}"
                        </p>

                        {/* Customer Uploaded Photos Preview */}
                        {b.devicePhotos && b.devicePhotos.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-purple-700 block">
                              Uploaded Device Photos ({b.devicePhotos.length}):
                            </span>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {b.devicePhotos.map((img: string, i: number) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt="Device damage"
                                  className="w-12 h-12 rounded-lg object-cover border border-purple-200 shadow-xs shrink-0"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* LIVE TRACKING SECTION 1: KITNA TAK HUA (PROGRESS BAR & PERCENTAGE) */}
                        <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl space-y-2 border border-slate-800">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-cyan-300 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span>Kitna Tak Hua (Live Repair Progress)</span>
                            </span>
                            <span className="font-mono font-black text-sm text-cyan-400">
                              {b.progressPercent}%
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-500 shadow-sm"
                              style={{ width: `${Math.max(b.progressPercent, 10)}%` }}
                            />
                          </div>

                          {/* Quick stage indicators */}
                          <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-center text-slate-400 pt-0.5">
                            <span className={b.progressPercent >= 20 ? 'text-cyan-300' : ''}>1. Received</span>
                            <span className={b.progressPercent >= 50 ? 'text-cyan-300' : ''}>2. Repairing</span>
                            <span className={b.progressPercent >= 80 ? 'text-cyan-300' : ''}>3. Testing</span>
                            <span className={b.progressPercent >= 95 ? 'text-emerald-300' : ''}>4. Ready</span>
                          </div>
                        </div>

                        {/* LIVE TRACKING SECTION 2: KAB MOBILE MILEGA (EXPECTED DELIVERY) */}
                        <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-start gap-2.5">
                          <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 text-xs">
                            <p className="font-bold text-emerald-950 uppercase text-[10px] tracking-wider">
                              Kab Mobile Milega (Expected Delivery / Pickup):
                            </p>
                            <p className="text-emerald-900 font-extrabold text-sm">
                              {b.expectedDeliveryDate || 'Same Day / 24 Hours'}
                            </p>
                          </div>
                        </div>

                        {/* TECHNICIAN LIVE NOTE */}
                        {b.technicianNote && (
                          <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-950 flex items-start gap-2">
                            <Wrench className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block text-[10px] uppercase text-blue-800">Technician Update:</span>
                              <p className="text-slate-800 italic text-[11px] mt-0.5">{b.technicianNote}</p>
                            </div>
                          </div>
                        )}

                        {/* Pricing Info if available */}
                        {b.estimatedCost !== undefined && b.estimatedCost > 0 && (
                          <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-bold">Estimated Cost: ₹{b.estimatedCost}</span>
                            <span className="font-black text-slate-900">
                              Balance: <strong className="text-rose-600">₹{b.balanceDue ?? b.estimatedCost}</strong>
                            </span>
                          </div>
                        )}

                        {/* Action Buttons Toolbar */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                          <button
                            onClick={() => {
                              if (onNavigateToTab) onNavigateToTab('tracker', b.requestId);
                              onClose();
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Full Live Tracker & Timeline</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                            <a
                              href={`tel:${BUSINESS_DETAILS.phone}`}
                              className="flex-1 sm:flex-initial py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-200"
                              title="Call Technician"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">Call</span>
                            </a>

                            <a
                              href={`https://wa.me/${BUSINESS_DETAILS.whatsapp}?text=Hello%20TECHFIX%20Goalpara,%20I%20am%20checking%20status%20for%20my%20repair%20Ticket%20${b.requestId}%20(${encodeURIComponent(b.deviceModel)}).`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 sm:flex-initial py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                              title="WhatsApp Shop"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MY OLD PHONE SELL REQUESTS */}
            {activeProfileTab === 'sell' && (
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Your Old Phone Buyback Quotes</span>
                  <button
                    onClick={() => {
                      if (onNavigateToTab) onNavigateToTab('sellPhone');
                      onClose();
                    }}
                    className="text-emerald-600 hover:text-emerald-800 font-extrabold flex items-center gap-1 text-[11px]"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sell Another Phone</span>
                  </button>
                </div>

                {mySellRequests.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                    <Smartphone className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600 font-semibold">
                      Aapne purana mobile bechne ki koi request nahi submit ki hai.
                    </p>
                    <button
                      onClick={() => {
                        if (onNavigateToTab) onNavigateToTab('sellPhone');
                        onClose();
                      }}
                      className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow transition inline-flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Sell Old Phone for Cash</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {mySellRequests.map(s => (
                      <div key={s.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200 transition space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                                {s.requestId}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {s.createdAt}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">
                              {s.deviceBrand} {s.deviceModel} ({s.storage}) {s.color ? `• ${s.color}` : ''}
                            </h4>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            s.status === 'Purchased' || s.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            s.status === 'Offer Made' || s.status === 'Inspecting' ? 'bg-blue-100 text-blue-800' :
                            s.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {s.status}
                          </span>
                        </div>

                        {/* Condition / Fault Description */}
                        <div className="text-xs bg-white p-2 rounded-xl border border-slate-100 space-y-1">
                          {s.isCrackedPhone ? (
                            <div className="flex flex-wrap items-center gap-2 text-rose-700 font-semibold text-[11px]">
                              <span className="px-1.5 py-0.2 rounded bg-rose-50 border border-rose-200 font-bold">
                                Broken/Cracked
                              </span>
                              <span>Damage: {s.damageType || 'Screen Fault'}</span>
                              {s.screenStatus && <span>• {s.screenStatus}</span>}
                            </div>
                          ) : (
                            <div className="text-slate-700 text-[11px]">
                              <span className="font-bold text-slate-900">Condition:</span> {s.condition}
                            </div>
                          )}

                          {s.accessoriesIncluded && s.accessoriesIncluded.length > 0 && (
                            <div className="text-[11px] text-slate-500">
                              <span className="font-semibold text-slate-700">Accessories:</span> {s.accessoriesIncluded.join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Uploaded Device Photos */}
                        {((s.devicePhotos && s.devicePhotos.length > 0) || s.photoUrl) && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-800 block">
                              Uploaded Device Photos:
                            </span>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {(s.devicePhotos || (s.photoUrl ? [s.photoUrl] : [])).map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt="Device photo"
                                  className="w-12 h-12 rounded-lg object-cover border border-emerald-300 shadow-xs shrink-0"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Prices & Action */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 text-xs">
                          <div>
                            <span className="text-slate-500">Expected Price: </span>
                            <strong className="text-slate-900 font-mono font-bold">₹{s.expectedPrice.toLocaleString('en-IN')}</strong>
                          </div>

                          {s.offeredPriceByAdmin ? (
                            <div className="px-2.5 py-1 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-extrabold flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Shop Offer: ₹{s.offeredPriceByAdmin.toLocaleString('en-IN')}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Admin reviewing offer...</span>
                          )}
                        </div>

                        {/* Direct WhatsApp Contact Button */}
                        <a
                          href={`https://wa.me/919864212345?text=${encodeURIComponent(
                            `Hello TECHFIX Admin, checking status for my Sell Request ID: ${s.requestId} (${s.deviceBrand} ${s.deviceModel}, Expected ₹${s.expectedPrice}). Please update me!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] transition flex items-center justify-center gap-1.5 mt-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          <span>Inquire Shop via WhatsApp regarding {s.requestId}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ACCOUNT & SESSION */}
            {activeProfileTab === 'account' && (
              <div className="space-y-3 text-left">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Account Display Name:</span>
                    <span className="font-bold text-slate-900">{customerUser.displayName}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Gmail / Email:</span>
                    <span className="font-mono font-bold text-blue-700">{customerUser.email}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Account Type:</span>
                    <span className="font-bold text-emerald-700">{customerUser.role}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Session Status:</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Real-time Sync Active
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onCustomerLogout();
                    onClose();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200 transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out Customer Session ({customerUser.email})</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* NOT LOGGED IN - LOGIN & SIGNUP OPTIONS */
          <div className="space-y-5">
            
            {/* Google Sign In Option */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-3 border border-slate-800 disabled:opacity-50"
            >
              <GoogleIcon />
              <span>{isLoading ? 'Connecting...' : 'Sign In with Google (Gmail)'}</span>
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                OR EMAIL & PASSWORD
              </span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition ${
                  authMode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition ${
                  authMode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign Up
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-left leading-relaxed flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5 text-left">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name:
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gmail / Email Address:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. customer@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authMode === 'login' ? (
                  <>
                    <KeyRound className="w-4 h-4 text-cyan-200" />
                    <span>{isLoading ? 'Signing In...' : 'Sign In with Email'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-cyan-200" />
                    <span>{isLoading ? 'Creating Account...' : 'Register New Customer Account'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  const ownerProfile = {
                    uid: 'owner-ratoibur11-uid',
                    email: OWNER_EMAIL,
                    displayName: 'Administrator (TECHFIX Goalpara)',
                    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                    role: 'ADMIN' as const,
                    isFirstLogin: false,
                    lastLoginAt: new Date().toISOString()
                  };
                  onCustomerLogin(ownerProfile);
                  try {
                    localStorage.setItem('techfix_is_admin', 'true');
                    localStorage.setItem('techfix_admin_email', OWNER_EMAIL);
                  } catch (e) {}
                  onClose();
                  if (onNavigateToTab) onNavigateToTab('admin');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition border border-slate-200"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-600" />
                <span>Shop Owner Quick Sign-In ({OWNER_EMAIL})</span>
              </button>

              <p className="text-[10px] text-slate-400 italic">
                Note: Customer accounts provide live device repair tracking, custom estimate saving, and client reviews.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
