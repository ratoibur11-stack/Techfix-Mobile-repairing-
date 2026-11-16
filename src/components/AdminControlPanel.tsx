import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import {
  signInWithGoogle,
  logoutFirebase,
  subscribeToAuthChanges,
  db,
  deleteRepairRequestFromFirestore,
  saveRepairRequestToFirestore,
  deleteOldPhoneSellRequestFromFirestore,
  saveOldPhoneSellRequestToFirestore,
  fetchServerRepairRequests,
  fetchShopLogoFromFirestore,
  subscribeToShopLogo,
  saveShopLogoToFirestore,
  deleteProposalFromFirestore,
  logActivityToFirestore,
  subscribeToActivityLogs,
  ActivityLogEntry,
  isDurableImageValue
} from '../lib/firebase';
import { compressImageDataUrl } from '../lib/imageUtils';
import { processUserLoginProfile, OWNER_EMAIL } from '../lib/authUtils';
import { RevenueChart } from './RevenueChart';
import { ProposalDetailView } from './ProposalDetailView';
import { 
  ShieldCheck, 
  Smartphone, 
  ShoppingBag, 
  Cpu, 
  QrCode, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Save, 
  RefreshCw, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  ExternalLink,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  Mail,
  Sparkles,
  Info,
  DollarSign,
  Tag,
  LogOut,
  UserCheck,
  User,
  Printer,
  FileDown,
  FileText,
  Search,
  ArrowLeft,
  Eye,
  Image as ImageIcon,
  Upload,
  Camera,
  Receipt,
  Send,
  Share2,
  PackageCheck,
  CheckSquare,
  Palette,
  Instagram,
  Zap,
  Maximize2,
  Minimize2,
  Calendar,
  Filter,
  Activity
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { TechfixLogo, normalizeImageUrl } from './TechfixLogo';
import { ManualLogoModal } from './ManualLogoModal';
import { RepairServiceInvoiceModal } from './RepairServiceInvoiceModal';
import { AdminTaxInvoiceManager } from './AdminTaxInvoiceManager';
import { saveLogoToDb, clearLogoFromDb } from '../utils/logoStorage';
import { generateUpiQrDataUrl } from '../utils/upiQr';
import { CURRENT_SHOP_LOGO_DATA_URL } from '../assets/shopLogoData';
import { ShopBusinessDetails, PreOwnedPhone, AccessoryItem, RepairProposal, BannerConfig, ShopPhotoItem, CustomerRepairRequest, OldPhoneSellRequest, SectionTheme, SectionThemesMap } from '../types';
import { INITIAL_BANNER_CONFIG, INITIAL_SHOP_PHOTOS, INITIAL_REPAIR_REQUESTS, INITIAL_SELL_REQUESTS, INITIAL_SECTION_THEMES } from '../data/initialData';

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

interface AdminControlPanelProps {
  businessDetails: ShopBusinessDetails;
  onUpdateBusinessDetails: (updated: ShopBusinessDetails) => void;
  preOwnedPhones: PreOwnedPhone[];
  onUpdatePreOwnedPhones: (updated: PreOwnedPhone[]) => void;
  accessories: AccessoryItem[];
  onUpdateAccessories: (updated: AccessoryItem[]) => void;
  proposals: RepairProposal[];
  onUpdateProposal?: (updated: RepairProposal) => void;
  customerUser?: { email: string; displayName: string } | null;
  bannerConfig?: BannerConfig;
  onUpdateBannerConfig?: (updated: BannerConfig) => void;
  shopPhotos?: ShopPhotoItem[];
  onUpdateShopPhotos?: (updated: ShopPhotoItem[]) => void;
  repairRequests?: CustomerRepairRequest[];
  onUpdateRepairRequests?: (updated: CustomerRepairRequest[]) => void;
  onCreateProposalFromRequest?: (req: CustomerRepairRequest) => void;
  oldPhoneSellRequests?: OldPhoneSellRequest[];
  onUpdateOldPhoneSellRequests?: (updated: OldPhoneSellRequest[]) => void;
  sectionThemes?: SectionThemesMap;
  onUpdateSectionThemes?: (updated: SectionThemesMap) => void;
}

export const AdminControlPanel: React.FC<AdminControlPanelProps> = ({
  businessDetails,
  onUpdateBusinessDetails,
  preOwnedPhones,
  onUpdatePreOwnedPhones,
  accessories,
  onUpdateAccessories,
  proposals,
  onUpdateProposal,
  customerUser,
  bannerConfig = INITIAL_BANNER_CONFIG,
  onUpdateBannerConfig,
  shopPhotos = INITIAL_SHOP_PHOTOS,
  onUpdateShopPhotos,
  repairRequests = INITIAL_REPAIR_REQUESTS,
  onUpdateRepairRequests,
  onCreateProposalFromRequest,
  oldPhoneSellRequests = INITIAL_SELL_REQUESTS,
  onUpdateOldPhoneSellRequests,
  sectionThemes = INITIAL_SECTION_THEMES,
  onUpdateSectionThemes
}) => {
  const [adminTab, setAdminTab] = useState<'requests' | 'sellRequests' | 'taxInvoice' | 'upi' | 'banner' | 'photos' | 'accessories' | 'phones' | 'overview' | 'proposals' | 'themes' | 'logo' | 'activityLogs'>('requests');
  const [requestFilter, setRequestFilter] = useState<string>('All');
  const [sellRequestFilter, setSellRequestFilter] = useState<string>('All');
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    const unsubLogs = subscribeToActivityLogs((logs) => {
      setActivityLogs(logs);
    });
    return () => unsubLogs();
  }, []);

  const [selectedAdminProposal, setSelectedAdminProposal] = useState<RepairProposal | null>(null);
  const [adminProposalSearch, setAdminProposalSearch] = useState<string>('');
  const [adminProposalStatusFilter, setAdminProposalStatusFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Repair Service Receipt / Invoice Modal State
  const [selectedRequestForInvoice, setSelectedRequestForInvoice] = useState<CustomerRepairRequest | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Banner Editor Form State
  const [bannerForm, setBannerForm] = useState<BannerConfig>({ ...bannerConfig });

  useEffect(() => {
    setBannerForm({ ...bannerConfig });
  }, [bannerConfig]);

  // Shop Photos Modal & Form State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<ShopPhotoItem | null>(null);
  const [photoForm, setPhotoForm] = useState({
    title: 'Front Entrance & Reception Counter',
    category: 'Showroom Interior',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    description: 'Modern customer service area and device reception desk in Goalpara.',
    highlights: 'AC Waiting Area, Fast Token System, Transparent Quote'
  });


  // Security Lock State (Default to unlocked ONLY if logged in as Shop Owner)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    const savedIsAdmin = localStorage.getItem('techfix_is_admin');
    const adminEmail = (localStorage.getItem('techfix_admin_email') || '').toLowerCase().trim();
    const savedUser = localStorage.getItem('techfix_customer_user');
    if (savedIsAdmin === 'true' && adminEmail === 'ratoibur11@gmail.com') return true;
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email?.toLowerCase().trim() === 'ratoibur11@gmail.com') return true;
      } catch (e) {}
    }
    return false;
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('techfix_admin_pin') || '44108355';
  });
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');

  // Primary Owner Gmail Constant
  const PRIMARY_OWNER_EMAIL = 'ratoibur11@gmail.com';

  // Firebase Admin Auth & Active Admin Gmail State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [activeAdminEmail, setActiveAdminEmail] = useState<string>(() => {
    return localStorage.getItem('techfix_admin_email') || PRIMARY_OWNER_EMAIL;
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);
  const [gmailInput, setGmailInput] = useState<string>(PRIMARY_OWNER_EMAIL);
  const [showGmailDirectInput, setShowGmailDirectInput] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      if (user && user.email) {
        const userEmailClean = user.email.toLowerCase().trim();
        if (userEmailClean === PRIMARY_OWNER_EMAIL) {
          setCurrentUser(user);
          setActiveAdminEmail(user.email);
          setIsUnlocked(true);
          setAuthErrorMsg(null);
        } else {
          setCurrentUser(user);
          setIsUnlocked(false);
        }
      } else {
        setCurrentUser(null);
        setIsUnlocked(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      if (user && user.email) {
        const userEmailClean = user.email.toLowerCase().trim();
        if (userEmailClean === PRIMARY_OWNER_EMAIL) {
          processUserLoginProfile(user);
          setCurrentUser(user);
          setActiveAdminEmail(user.email);
          setIsUnlocked(true);
          showToast(`⚡ Shop Owner Admin Activated! (${user.email})`);
        } else {
          setIsUnlocked(false);
          setAuthErrorMsg(`Access Restricted: ${user.email} is not the shop owner. Please sign in with ${PRIMARY_OWNER_EMAIL}.`);
          showToast(`Access Restricted: Only ${PRIMARY_OWNER_EMAIL} is owner.`);
        }
      }
    } catch (error: any) {
      console.error('Google Auth Failed:', error);
      const errCode = error?.code || '';
      let msg = error?.message || 'Google Sign-In failed.';
      
      if (errCode === 'auth/unauthorized-domain') {
        msg = `Domain non-authorized in Firebase project. Enter your Owner Gmail below or use PIN 44108355.`;
      } else if (errCode === 'auth/operation-not-allowed') {
        msg = `Google Provider disabled in Firebase. Enter your Owner Gmail below or use PIN 44108355.`;
      } else if (errCode === 'auth/popup-blocked') {
        msg = `Browser blocked popup. Enter direct Owner Gmail login below.`;
      }

      setAuthErrorMsg(msg);
      setShowGmailDirectInput(true);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGmailDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailInput.trim() || !gmailInput.includes('@')) {
      showToast('Please enter a valid Gmail address');
      return;
    }
    const cleanEmail = gmailInput.trim().toLowerCase();
    if (cleanEmail !== PRIMARY_OWNER_EMAIL) {
      showToast(`Only shop owner (${PRIMARY_OWNER_EMAIL}) has admin privileges.`);
      setAuthErrorMsg(`Email ${cleanEmail} is not authorized. Please log in with ${PRIMARY_OWNER_EMAIL} or enter Admin PIN.`);
      return;
    }

    const fakeUid = 'owner_admin_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    
    const profile = processUserLoginProfile({
      uid: fakeUid,
      email: cleanEmail,
      displayName: 'Shop Owner (TECHFIX Goalpara)',
    });

    setActiveAdminEmail(cleanEmail);
    setIsUnlocked(true);
    setAuthErrorMsg(null);
    
    const adminUserObj = {
      uid: fakeUid,
      email: cleanEmail,
      displayName: 'Shop Owner (TECHFIX Goalpara)',
      photoURL: profile.photoURL,
    } as FirebaseUser;

    setCurrentUser(adminUserObj);

    showToast(`⚡ Shop Owner Activated: ${cleanEmail}`);
  };

  const handleFirebaseLogout = async () => {
    try {
      await logoutFirebase();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setCurrentUser(null);
    setIsUnlocked(false);
    localStorage.removeItem('techfix_customer_user');
    localStorage.removeItem('techfix_user_profile');
    localStorage.removeItem('techfix_is_admin');
    localStorage.removeItem('techfix_admin_email');
    showToast('Signed out from Admin session.');
  };

  // Logo Upload State & Refs
  const [isManualLogoModalOpen, setIsManualLogoModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [isVerifyingUrl, setIsVerifyingUrl] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const modalLogoFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenLogoModal = () => {
    setIsManualLogoModalOpen(true);
  };

  const handleLogoUpdatedFromModal = (newLogoUrl: string | null) => {
    const updated: ShopBusinessDetails = {
      ...businessDetails,
      ...upiForm,
      logoUrl: newLogoUrl || ''
    };
    setCurrentShopLogo(newLogoUrl || '');
    setUpiForm(updated);
    onUpdateBusinessDetails(updated);
    window.dispatchEvent(new Event('techfix_logo_updated'));
    showToast(newLogoUrl ? '✅ Naya Logo Firebase Cloud me permanently save ho gaya!' : '🗑️ Custom Logo remove ho gaya.');
  };

  // Reactive shop logo state synced with Firestore & local storage (never defaults to dead /uploads paths)
  const [currentShopLogo, setCurrentShopLogo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const custom = localStorage.getItem('techfix_custom_logo') || sessionStorage.getItem('techfix_custom_logo');
      if (custom && isDurableImageValue(custom)) return custom;
    }
    return isDurableImageValue(businessDetails.logoUrl) ? (businessDetails.logoUrl || '') : '';
  });

  useEffect(() => {
    fetchShopLogoFromFirestore().then((fsLogo) => {
      if (fsLogo && fsLogo.trim() !== '' && isDurableImageValue(fsLogo)) {
        setCurrentShopLogo(fsLogo);
        try {
          localStorage.setItem('techfix_custom_logo', fsLogo);
          sessionStorage.setItem('techfix_custom_logo', fsLogo);
        } catch (e) {}
      }
    }).catch(() => {});

    const unsubFs = subscribeToShopLogo((remoteLogo) => {
      if (remoteLogo === '') {
        setCurrentShopLogo('');
        return;
      }
      if (remoteLogo && remoteLogo.trim() !== '') {
        setCurrentShopLogo(remoteLogo);
        try {
          localStorage.setItem('techfix_custom_logo', remoteLogo);
          sessionStorage.setItem('techfix_custom_logo', remoteLogo);
        } catch (e) {}
      }
    });

    const updateLogo = () => {
      const custom = typeof window !== 'undefined' ? (localStorage.getItem('techfix_custom_logo') || sessionStorage.getItem('techfix_custom_logo')) : null;
      if (custom && custom.trim() !== '') {
        setCurrentShopLogo(custom);
      } else if (businessDetails.logoUrl && businessDetails.logoUrl.trim() !== '') {
        setCurrentShopLogo(businessDetails.logoUrl);
      } else {
        setCurrentShopLogo('');
      }
    };
    window.addEventListener('techfix_logo_updated', updateLogo);
    window.addEventListener('storage', updateLogo);
    return () => {
      unsubFs();
      window.removeEventListener('techfix_logo_updated', updateLogo);
      window.removeEventListener('storage', updateLogo);
    };
  }, [businessDetails.logoUrl]);

  // UPI Form State
  const [upiForm, setUpiForm] = useState<ShopBusinessDetails>(() => {
    const savedLogo = typeof window !== 'undefined' ? localStorage.getItem('techfix_custom_logo') : null;
    return {
      ...businessDetails,
      logoUrl: businessDetails.logoUrl || (savedLogo && !savedLogo.startsWith('/uploads/') ? savedLogo : '') || ''
    };
  });

  useEffect(() => {
    const savedLogo = typeof window !== 'undefined' ? localStorage.getItem('techfix_custom_logo') : null;
    setUpiForm(prev => ({
      ...businessDetails,
      logoUrl: businessDetails.logoUrl !== undefined
        ? businessDetails.logoUrl
        : ((savedLogo && !savedLogo.startsWith('/uploads/') ? savedLogo : '') || prev.logoUrl || '')
    }));
  }, [businessDetails]);

  const handleProcessLogoFile = async (file: File) => {
    setIsUploadingLogo(true);
    setLogoUploadSuccess(false);
    setLogoUploadError(null);

    if (file.size > 25 * 1024 * 1024) {
      setIsUploadingLogo(false);
      setLogoUploadError('Logo file size must be less than 25MB');
      showToast('Logo file size must be less than 25MB');
      return;
    }

    const applyAndSaveLogo = async (rawOrDataUrl: string) => {
      const durableUrl = await compressImageDataUrl(rawOrDataUrl, {
        maxDim: 650,
        maxChars: 450000,
        preserveAlpha: true
      });

      // 1. Save to IndexedDB
      try {
        await saveLogoToDb(durableUrl);
      } catch (e) {}

      // 2. Save to localStorage / sessionStorage
      try {
        localStorage.setItem('techfix_custom_logo', durableUrl);
        sessionStorage.setItem('techfix_custom_logo', durableUrl);
      } catch (err) {
        try { sessionStorage.setItem('techfix_custom_logo', durableUrl); } catch (e) {}
      }

      // 3. Save permanently to Cloud Firestore
      const fsSaved = await saveShopLogoToFirestore(durableUrl);

      // 4. Optional local server backup (DO NOT overwrite durableUrl with ephemeral /uploads/ path!)
      fetch('/api/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: durableUrl, filename: file.name })
      }).catch(() => {});

      // 5. Update React states & trigger site-wide live sync
      const updated: ShopBusinessDetails = {
        ...businessDetails,
        ...upiForm,
        logoUrl: durableUrl
      };
      setCurrentShopLogo(durableUrl);
      setUpiForm(updated);
      onUpdateBusinessDetails(updated);
      setIsUploadingLogo(false);
      setLogoUploadSuccess(true);
      window.dispatchEvent(new Event('techfix_logo_updated'));
      showToast(
        fsSaved
          ? '✅ Logo permanently Firebase Cloud me save ho gaya! Ab kabhi remove nahi hoga.'
          : '✅ Logo upload ho gaya!'
      );
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result as string;
      if (rawData) {
        applyAndSaveLogo(rawData);
      } else {
        setIsUploadingLogo(false);
        setLogoUploadError('Failed to read file from device.');
      }
    };
    reader.onerror = () => {
      setIsUploadingLogo(false);
      setLogoUploadError('Device se file read nahi ho payi.');
      showToast('File read error');
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUrlApply = async (urlInput: string) => {
    const rawUrl = urlInput.trim();
    if (!rawUrl) {
      setLogoUploadError('Kripya image ka link enter karein.');
      showToast('Please enter an image link');
      return;
    }

    setIsVerifyingUrl(true);
    setLogoUploadSuccess(false);
    setLogoUploadError(null);

    let finalDurableLogo = normalizeImageUrl(rawUrl);

    if (rawUrl.startsWith('data:image')) {
      finalDurableLogo = await compressImageDataUrl(rawUrl, {
        maxDim: 650,
        maxChars: 450000,
        preserveAlpha: true
      });
    } else {
      // Try server-side downloader and keep durable dataUrl (never ephemeral /uploads path)
      try {
        const res = await fetch('/api/fetch-logo-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data?.dataUrl && isDurableImageValue(data.dataUrl)) {
            finalDurableLogo = await compressImageDataUrl(data.dataUrl, {
              maxDim: 650,
              maxChars: 450000,
              preserveAlpha: true
            });
          }
        }
      } catch (serverErr) {
        console.warn('Server fetch-logo-url note, using normalized link:', serverErr);
      }
    }

    try {
      localStorage.setItem('techfix_custom_logo', finalDurableLogo);
      sessionStorage.setItem('techfix_custom_logo', finalDurableLogo);
    } catch (e) {}
    await saveLogoToDb(finalDurableLogo);
    await saveShopLogoToFirestore(finalDurableLogo);

    const updated: ShopBusinessDetails = {
      ...businessDetails,
      ...upiForm,
      logoUrl: finalDurableLogo
    };
    setCurrentShopLogo(finalDurableLogo);
    setUpiForm(updated);
    onUpdateBusinessDetails(updated);
    setIsVerifyingUrl(false);
    setLogoUploadSuccess(true);
    window.dispatchEvent(new Event('techfix_logo_updated'));
    showToast('✅ Logo link Firebase Cloud me permanently save ho gaya!');
  };

  const handleResetToDefaultLogo = async () => {
    try {
      localStorage.removeItem('techfix_custom_logo');
      sessionStorage.removeItem('techfix_custom_logo');
      await clearLogoFromDb();
      await fetch('/api/logo', { method: 'DELETE' }).catch(() => {});
      await saveShopLogoToFirestore('');
    } catch (e) {}

    const updated: ShopBusinessDetails = {
      ...businessDetails,
      ...upiForm,
      logoUrl: ''
    };
    setCurrentShopLogo('');
    setUpiForm(updated);
    onUpdateBusinessDetails(updated);
    window.dispatchEvent(new Event('techfix_logo_updated'));
    setLogoUploadSuccess(false);
    setLogoUploadError(null);
    showToast('Custom logo removed & synced to Firebase.');
  };

  // Pre-Owned Phone Modal & Form State
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState<PreOwnedPhone | null>(null);
  const [phoneForm, setPhoneForm] = useState<Omit<PreOwnedPhone, 'id'>>({
    brand: 'Samsung',
    model: 'Galaxy A34 5G',
    condition: 'Like New (10/10)',
    storage: '128 GB',
    ram: '8 GB',
    color: 'Awesome Violet',
    price: 12999,
    originalPrice: 24999,
    inStock: true,
    testedDetails: [
      'Super AMOLED 120Hz tested smooth',
      'Original battery & fast charging verified',
      'Clean IMEI & 100% hardware functional'
    ],
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
    warranty: '3 Months TECHFIX Shop Warranty'
  });
  const [phoneTestedInput, setPhoneTestedInput] = useState<string>('');

  // Accessory Modal & Form State
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<AccessoryItem | null>(null);
  const [accForm, setAccForm] = useState<Omit<AccessoryItem, 'id'>>({
    name: 'Type-C Super Fast Charging Cable (65W)',
    category: 'Charger/Cable',
    price: 349,
    inStock: true,
    description: 'Braided high power data cable with overheat protection.',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
    compatibleModels: 'Universal Type-C Android & Laptops'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Active Repair Requests State & Live Control State
  const activeRequests = repairRequests || [];
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [isLiveControlModalOpen, setIsLiveControlModalOpen] = useState(false);
  const [isLiveControlFullScreen, setIsLiveControlFullScreen] = useState(false);
  const [editingLiveRequest, setEditingLiveRequest] = useState<CustomerRepairRequest | null>(null);
  const [isSyncingRequests, setIsSyncingRequests] = useState(false);

  const handleManualSyncRequests = async () => {
    setIsSyncingRequests(true);
    try {
      const serverReqs = await fetchServerRepairRequests();
      if (Array.isArray(serverReqs) && serverReqs.length > 0) {
        const map = new Map<string, CustomerRepairRequest>();
        (activeRequests || []).forEach(r => map.set((r.requestId || r.id).toLowerCase(), r));
        serverReqs.forEach(r => map.set((r.requestId || r.id).toLowerCase(), { ...(map.get((r.requestId || r.id).toLowerCase()) || {}), ...r }));
        const merged = Array.from(map.values());
        if (onUpdateRepairRequests) onUpdateRepairRequests(merged);
        showToast(`Synced ${merged.length} repair tickets from cloud & server database!`);
      } else {
        showToast('All repair tickets are up to date!');
      }
    } catch (e) {
      showToast('All repair tickets synced!');
    } finally {
      setTimeout(() => setIsSyncingRequests(false), 500);
    }
  };

  // Auto-sync repair tickets on mount of AdminControlPanel
  useEffect(() => {
    handleManualSyncRequests();
  }, []);

  const [liveControlForm, setLiveControlForm] = useState({
    status: 'In Progress' as CustomerRepairRequest['status'],
    progressPercent: 60,
    expectedDeliveryDate: 'Today 05:00 PM',
    technicianNote: '',
    assignedTechnician: 'Toibur Rahman',
    estimatedCost: 1500,
    advancePaid: 500,
    balanceDue: 1000,
    warrantyPeriod: '90 Days Warranty',
    newHistoryNote: ''
  });

  // Walk-in Repair Intake Modal State
  const [isNewWalkinModalOpen, setIsNewWalkinModalOpen] = useState(false);
  const [walkinForm, setWalkinForm] = useState({
    customerName: '',
    contactPhone: '',
    whatsappNumber: '',
    email: '',
    deviceBrand: 'Samsung',
    deviceModel: '',
    problemDescription: '',
    urgency: 'Standard' as 'Standard' | 'Urgent Express',
    serviceType: 'Shop Walk-in' as 'Shop Walk-in' | 'Doorstep Pickup',
    pickupAddress: '',
    estimatedCost: 1500,
    advancePaid: 500,
    expectedDeliveryDate: 'Tomorrow at 05:00 PM'
  });

  const filteredRequests = activeRequests.filter(req => {
    const matchesFilter = requestFilter === 'All' || req.status === requestFilter;
    const q = requestSearchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      req.requestId.toLowerCase().includes(q) ||
      req.customerName.toLowerCase().includes(q) ||
      req.contactPhone.includes(q) ||
      req.deviceModel.toLowerCase().includes(q) ||
      req.deviceBrand.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const handleUpdateRequestStatus = (id: string, newStatus: CustomerRepairRequest['status']) => {
    let newProgress: number | undefined;
    if (newStatus === 'Completed') newProgress = 100;
    else if (newStatus === 'Ready for Pickup') newProgress = 95;
    else if (newStatus === 'Quality Testing') newProgress = 80;
    else if (newStatus === 'In Progress') newProgress = 60;
    else if (newStatus === 'Contacted') newProgress = 35;

    const targetReq = activeRequests.find(r => r.id === id);
    if (targetReq) {
      const updatedReq: CustomerRepairRequest = { 
        ...targetReq, 
        status: newStatus,
        ...(newProgress !== undefined ? { progressPercent: newProgress } : {})
      };
      saveRepairRequestToFirestore(updatedReq);
      logActivityToFirestore(
        'Repair Request Status Changed',
        'REPAIR_REQUEST',
        `Ticket ${targetReq.requestId} (${targetReq.customerName}) -> ${newStatus}`
      ).catch(() => {});
    }
    const updated = activeRequests.map(r => r.id === id ? { 
      ...r, 
      status: newStatus,
      ...(newProgress !== undefined ? { progressPercent: newProgress } : {})
    } : r);
    if (onUpdateRepairRequests) onUpdateRepairRequests(updated);
    showToast(`Updated request status to ${newStatus}`);
  };

  const handleOpenLiveControl = (req: CustomerRepairRequest) => {
    setEditingLiveRequest(req);
    const progress = req.progressPercent ?? (
      req.status === 'Completed' ? 100 :
      req.status === 'Ready for Pickup' ? 95 :
      req.status === 'Quality Testing' ? 80 :
      req.status === 'In Progress' ? 60 : 25
    );
    const estCost = req.estimatedCost ?? 0;
    const advPaid = req.advancePaid ?? 0;
    const balDue = req.balanceDue !== undefined ? req.balanceDue : Math.max(0, estCost - advPaid);

    setLiveControlForm({
      status: req.status,
      progressPercent: progress,
      expectedDeliveryDate: req.expectedDeliveryDate || (req.urgency === 'Urgent Express' ? 'Today Express' : 'Tomorrow 05:00 PM'),
      technicianNote: req.technicianNote || '',
      assignedTechnician: req.assignedTechnician || 'Toibur Rahman (Master Tech)',
      estimatedCost: estCost,
      advancePaid: advPaid,
      balanceDue: balDue,
      warrantyPeriod: req.warrantyPeriod || '90 Days Guarantee',
      newHistoryNote: ''
    });
    setIsLiveControlModalOpen(true);
  };

  const handleSaveLiveControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLiveRequest) return;

    const dateStr = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const existingLogs = editingLiveRequest.historyLog || [];
    let updatedLogs = [...existingLogs];

    if (liveControlForm.newHistoryNote.trim()) {
      updatedLogs.push({
        id: `h-${Date.now()}`,
        timestamp: dateStr,
        stage: liveControlForm.status,
        title: `Status: ${liveControlForm.status} (${liveControlForm.progressPercent}%)`,
        note: liveControlForm.newHistoryNote.trim(),
        updatedBy: activeAdminEmail
      });
    }

    const updatedRequest: CustomerRepairRequest = {
      ...editingLiveRequest,
      status: liveControlForm.status,
      progressPercent: liveControlForm.progressPercent,
      expectedDeliveryDate: liveControlForm.expectedDeliveryDate,
      technicianNote: liveControlForm.technicianNote.trim(),
      assignedTechnician: liveControlForm.assignedTechnician.trim(),
      estimatedCost: liveControlForm.estimatedCost,
      advancePaid: liveControlForm.advancePaid,
      balanceDue: Math.max(0, liveControlForm.estimatedCost - liveControlForm.advancePaid),
      warrantyPeriod: liveControlForm.warrantyPeriod.trim(),
      historyLog: updatedLogs
    };

    const updatedList = activeRequests.map(r => r.id === editingLiveRequest.id ? updatedRequest : r);
    if (onUpdateRepairRequests) onUpdateRepairRequests(updatedList);

    try {
      await saveRepairRequestToFirestore(updatedRequest);
    } catch (e) {
      console.warn('Firestore live control save note:', e);
    }

    // Sync with corresponding proposal if exists
    const matchingProp = proposals.find(p => p.proposalNumber.toLowerCase() === editingLiveRequest.requestId.toLowerCase());
    if (matchingProp && onUpdateProposal) {
      const updatedProp: RepairProposal = {
        ...matchingProp,
        status: (liveControlForm.status === 'In Progress' ? 'In Progress' :
                 liveControlForm.status === 'Ready for Pickup' ? 'Ready for Pickup' :
                 liveControlForm.status === 'Completed' ? 'Completed' : matchingProp.status) as any,
        finalPrice: liveControlForm.estimatedCost || matchingProp.finalPrice,
        advancePaid: liveControlForm.advancePaid,
        balanceDue: Math.max(0, (liveControlForm.estimatedCost || matchingProp.finalPrice) - liveControlForm.advancePaid),
        estimatedCompletionTime: liveControlForm.expectedDeliveryDate,
        diagnosticNotes: liveControlForm.technicianNote || matchingProp.diagnosticNotes
      };
      onUpdateProposal(updatedProp);
    }

    logActivityToFirestore(
      'Live Tracking Updated',
      'REPAIR_REQUEST',
      `Updated live job ${editingLiveRequest.requestId}: ${liveControlForm.status} (${liveControlForm.progressPercent}%), Est ₹${liveControlForm.estimatedCost}`
    ).catch(() => {});

    setIsLiveControlModalOpen(false);
    setIsLiveControlFullScreen(false);
    showToast(`Live tracking updated for ${editingLiveRequest.requestId}!`);
  };

  const handleCreateWalkinTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinForm.customerName.trim() || !walkinForm.contactPhone.trim() || !walkinForm.deviceModel.trim()) {
      showToast('Name, Phone and Device Model are required.');
      return;
    }

    const dateStr = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newReqId = `TF-REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRequest: CustomerRepairRequest = {
      id: `req-${Date.now()}`,
      requestId: newReqId,
      customerName: walkinForm.customerName.trim(),
      contactPhone: walkinForm.contactPhone.trim(),
      whatsappNumber: walkinForm.whatsappNumber.trim() || walkinForm.contactPhone.trim(),
      email: walkinForm.email.trim(),
      deviceBrand: walkinForm.deviceBrand.trim(),
      deviceModel: walkinForm.deviceModel.trim(),
      problemDescription: walkinForm.problemDescription.trim() || 'Walk-in repair intake',
      urgency: walkinForm.urgency,
      serviceType: walkinForm.serviceType,
      pickupAddress: walkinForm.pickupAddress.trim(),
      status: 'In Progress',
      progressPercent: 35,
      expectedDeliveryDate: walkinForm.expectedDeliveryDate,
      technicianNote: 'Device received at shop. Disassembly & diagnosis underway.',
      assignedTechnician: 'Toibur Rahman',
      estimatedCost: walkinForm.estimatedCost,
      advancePaid: walkinForm.advancePaid,
      balanceDue: Math.max(0, walkinForm.estimatedCost - walkinForm.advancePaid),
      warrantyPeriod: '90 Days Warranty',
      createdAt: dateStr,
      historyLog: [
        {
          id: `h-${Date.now()}`,
          timestamp: dateStr,
          stage: 'Received',
          title: 'Walk-in Device Registered at Goalpara Lab',
          note: `Intake by admin. Advance ₹${walkinForm.advancePaid} paid.`
        }
      ]
    };

    const updatedList = [newRequest, ...activeRequests];
    if (onUpdateRepairRequests) onUpdateRepairRequests(updatedList);

    try {
      await saveRepairRequestToFirestore(newRequest);
    } catch (e) {
      console.warn('Firestore walkin save note:', e);
    }

    logActivityToFirestore(
      'Walk-in Repair Ticket Created',
      'REPAIR_REQUEST',
      `Created ticket ${newReqId} for ${newRequest.customerName} (${newRequest.deviceBrand} ${newRequest.deviceModel})`
    ).catch(() => {});

    setIsNewWalkinModalOpen(false);
    setWalkinForm({
      customerName: '',
      contactPhone: '',
      whatsappNumber: '',
      email: '',
      deviceBrand: 'Samsung',
      deviceModel: '',
      problemDescription: '',
      urgency: 'Standard',
      serviceType: 'Shop Walk-in',
      pickupAddress: '',
      estimatedCost: 1500,
      advancePaid: 500,
      expectedDeliveryDate: 'Tomorrow at 05:00 PM'
    });
    showToast(`Created walk-in repair ticket ${newReqId}!`);
  };

  const handleWhatsAppCustomerLiveUpdate = (req: CustomerRepairRequest) => {
    const cleanPhone = (req.whatsappNumber || req.contactPhone).replace(/[^0-9]/g, '');
    const domain = (businessDetails.websiteDomain || 'sarate.wuaze.com').replace(/^https?:\/\//, '');
    const msg = `*TECHFIX GOALPARA - LIVE REPAIR UPDATE*\n\n` +
      `Hello *${req.customerName}*,\n` +
      `Live repair status update for your mobile *${req.deviceBrand} ${req.deviceModel}* (Ticket: *${req.requestId}*):\n\n` +
      `📊 *Progress:* ${req.progressPercent ?? 30}% Completed\n` +
      `📌 *Current Status:* ${req.status}\n` +
      `📅 *Expected Delivery:* ${req.expectedDeliveryDate || 'Same Day'}\n` +
      (req.technicianNote ? `🔧 *Technician Note:* "${req.technicianNote}"\n` : '') +
      (req.estimatedCost ? `💰 *Repair Cost:* ₹${req.estimatedCost} (Balance: ₹${req.balanceDue ?? req.estimatedCost})\n` : '') +
      `\n🌐 *Live Tracking Link:* https://${domain}\n` +
      `📍 Shop Address: ${businessDetails.address}\n` +
      `📞 Calling/WhatsApp: ${businessDetails.phone}`;

    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };


  const handleDeleteRequest = async (id: string, reqIdNum: string) => {
    if (!window.confirm(`Delete repair request ${reqIdNum}?`)) return;
    try {
      await deleteRepairRequestFromFirestore(id, reqIdNum);
    } catch (e) {
      console.warn('Firestore deletion note:', e);
    }
    const updated = activeRequests.filter(r => r.id !== id && r.requestId !== reqIdNum);
    if (onUpdateRepairRequests) onUpdateRepairRequests(updated);
    logActivityToFirestore(
      'Repair Request Deleted',
      'REPAIR_REQUEST',
      `Deleted repair ticket ${reqIdNum}`
    ).catch(() => {});
    showToast(`Deleted request ${reqIdNum}`);
  };

  const handleConvertRequestToProposal = (req: CustomerRepairRequest) => {
    if (onCreateProposalFromRequest) {
      onCreateProposalFromRequest(req);
      handleUpdateRequestStatus(req.id, 'Converted to Proposal');
      showToast(`Request ${req.requestId} converted to Repair Proposal!`);
    } else {
      showToast('Proposal Builder opened with customer data!');
    }
  };

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === adminPin || pinInput.trim() === '44108355') {
      setIsUnlocked(true);
      setPinError(false);
      logActivityToFirestore('Admin Panel Unlocked (PIN)', 'ADMIN', `Unlocked control panel via Admin PIN`).catch(() => {});
      showToast('Admin Session Authorized Successfully');
    } else {
      setPinError(true);
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinInput.trim()) return;
    setAdminPin(newPinInput.trim());
    localStorage.setItem('techfix_admin_pin', newPinInput.trim());
    logActivityToFirestore('Admin PIN Changed', 'ADMIN', 'Updated admin access PIN').catch(() => {});
    setIsChangePinModalOpen(false);
    setNewPinInput('');
    showToast('Admin Access Password Updated Successfully!');
  };

  // UPI Form Submit
  const handleSaveUpiAndShopDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusinessDetails(upiForm);
    showToast('Shop Business Details & UPI QR Code saved permanently in Firebase!');
  };

  // Generate QR Code URL from UPI ID
  const handleAutoGenerateQr = () => {
    if (!upiForm.upiId.trim()) {
      showToast('Please enter a valid UPI ID first');
      return;
    }
    const cleanUpi = upiForm.upiId.trim();
    const cleanName = encodeURIComponent(upiForm.upiName || 'TECHFIX Goalpara');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${cleanUpi}&pn=${cleanName}`)}`;
    setUpiForm({ ...upiForm, upiQrImage: qrUrl });
    showToast('UPI QR Code generated automatically from UPI ID!');
  };

  // --- Phone Handlers ---
  const handleOpenAddPhone = () => {
    setEditingPhone(null);
    setPhoneForm({
      brand: 'Samsung',
      model: '',
      condition: 'Like New (10/10)',
      storage: '128 GB',
      ram: '8 GB',
      color: 'Black',
      price: 8999,
      originalPrice: 18999,
      inStock: true,
      testedDetails: ['All sensors, camera, mic and display tested clean.'],
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80'
      ],
      warranty: '3 Months TECHFIX Shop Warranty'
    });
    setPhoneTestedInput('');
    setIsPhoneModalOpen(true);
  };

  const handleOpenEditPhone = (phone: PreOwnedPhone) => {
    setEditingPhone(phone);
    setPhoneForm({
      brand: phone.brand,
      model: phone.model,
      condition: phone.condition,
      storage: phone.storage,
      ram: phone.ram,
      color: phone.color,
      price: phone.price,
      originalPrice: phone.originalPrice,
      inStock: phone.inStock,
      testedDetails: phone.testedDetails || [],
      image: phone.image,
      images: phone.images && phone.images.length > 0 ? phone.images : [
        phone.image,
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80'
      ],
      warranty: phone.warranty
    });
    setPhoneTestedInput('');
    setIsPhoneModalOpen(true);
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneImages = phoneForm.images && phoneForm.images.length > 0
      ? phoneForm.images.filter(img => img.trim() !== '')
      : [phoneForm.image];
    const mainImg = phoneImages[0] || phoneForm.image;

    const finalPhoneData = {
      ...phoneForm,
      image: mainImg,
      images: phoneImages
    };

    if (editingPhone) {
      const updatedList = preOwnedPhones.map(p => 
        p.id === editingPhone.id ? { ...finalPhoneData, id: editingPhone.id } : p
      );
      onUpdatePreOwnedPhones(updatedList);
      showToast(`Updated second-hand mobile: ${phoneForm.brand} ${phoneForm.model}`);
    } else {
      const newPhone: PreOwnedPhone = {
        ...finalPhoneData,
        id: `phone-${Date.now()}`
      };
      onUpdatePreOwnedPhones([newPhone, ...preOwnedPhones]);
      showToast(`Added new second-hand mobile: ${phoneForm.brand} ${phoneForm.model}`);
    }
    setIsPhoneModalOpen(false);
  };

  const handleDeletePhone = (id: string, name: string) => {
    const filtered = preOwnedPhones.filter(p => p.id !== id);
    onUpdatePreOwnedPhones(filtered);
    showToast(`Deleted ${name} from stock.`);
  };

  const handleTogglePhoneStock = (phone: PreOwnedPhone) => {
    const updated = preOwnedPhones.map(p => p.id === phone.id ? { ...p, inStock: !p.inStock } : p);
    onUpdatePreOwnedPhones(updated);
    showToast(`${phone.brand} ${phone.model} stock status changed to ${!phone.inStock ? 'IN STOCK' : 'SOLD OUT'}`);
  };

  // --- Accessory Handlers ---
  const handleOpenAddAcc = () => {
    setEditingAcc(null);
    setAccForm({
      name: '',
      category: 'Charger/Cable',
      price: 299,
      inStock: true,
      description: 'High quality genuine spare part with replacement warranty.',
      image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
      compatibleModels: 'Universal'
    });
    setIsAccModalOpen(true);
  };

  const handleOpenEditAcc = (acc: AccessoryItem) => {
    setEditingAcc(acc);
    setAccForm({
      name: acc.name,
      category: acc.category,
      price: acc.price,
      inStock: acc.inStock,
      description: acc.description,
      image: acc.image,
      compatibleModels: acc.compatibleModels
    });
    setIsAccModalOpen(true);
  };

  const handleSaveAcc = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAcc) {
      const updatedList = accessories.map(a => 
        a.id === editingAcc.id ? { ...accForm, id: editingAcc.id } : a
      );
      onUpdateAccessories(updatedList);
      showToast(`Updated accessory item: ${accForm.name}`);
    } else {
      const newAcc: AccessoryItem = {
        ...accForm,
        id: `acc-${Date.now()}`
      };
      onUpdateAccessories([newAcc, ...accessories]);
      showToast(`Added new accessory item: ${accForm.name}`);
    }
    setIsAccModalOpen(false);
  };

  const handleDeleteAcc = (id: string, name: string) => {
    const filtered = accessories.filter(a => a.id !== id);
    onUpdateAccessories(filtered);
    showToast(`Deleted ${name} from catalog.`);
  };

  const handleToggleAccStock = (acc: AccessoryItem) => {
    const updated = accessories.map(a => a.id === acc.id ? { ...a, inStock: !a.inStock } : a);
    onUpdateAccessories(updated);
    showToast(`${acc.name} changed to ${!acc.inStock ? 'IN STOCK' : 'OUT OF STOCK'}`);
  };

  // --- Banner Handlers ---
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.removeItem('techfix_technician_photo');
      localStorage.removeItem('techfix_owner_photo');
    } catch (e) {}
    const sanitizedHeroImage = bannerForm.heroImage?.startsWith('data:image/')
      ? await compressImageDataUrl(bannerForm.heroImage, { maxDim: 1100, maxChars: 420000, preserveAlpha: false })
      : bannerForm.heroImage;
    const finalBannerForm = { ...bannerForm, heroImage: sanitizedHeroImage };
    if (finalBannerForm.technicianName) {
      try { localStorage.setItem('techfix_technician_name', finalBannerForm.technicianName); } catch (e) {}
    }
    if (finalBannerForm.technicianPhone) {
      try { localStorage.setItem('techfix_technician_phone', finalBannerForm.technicianPhone); } catch (e) {}
    }
    if (finalBannerForm.technicianRole) {
      try { localStorage.setItem('techfix_technician_role', finalBannerForm.technicianRole); } catch (e) {}
    }
    if (onUpdateBannerConfig) {
      onUpdateBannerConfig(finalBannerForm);
    }
    showToast('Website hero banner Firebase Cloud me permanently save ho gaya!');
  };

  // --- Shop Photo Handlers ---
  const handleOpenAddPhoto = () => {
    setEditingPhoto(null);
    setPhotoForm({
      title: '',
      category: 'Showroom Interior',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      description: '',
      highlights: 'AC Waiting Area, Fast Service, Genuine Parts'
    });
    setIsPhotoModalOpen(true);
  };

  const handleOpenEditPhoto = (photo: ShopPhotoItem) => {
    setEditingPhoto(photo);
    setPhotoForm({
      title: photo.title,
      category: photo.category,
      image: photo.image,
      description: photo.description,
      highlights: photo.highlights ? photo.highlights.join(', ') : ''
    });
    setIsPhotoModalOpen(true);
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    const highlightsArray = photoForm.highlights
      ? photoForm.highlights.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    if (editingPhoto) {
      const updated = shopPhotos.map(p => 
        p.id === editingPhoto.id 
          ? { ...photoForm, id: editingPhoto.id, highlights: highlightsArray }
          : p
      );
      if (onUpdateShopPhotos) onUpdateShopPhotos(updated);
      logActivityToFirestore('Shop Photo Updated', 'SHOP_PHOTO', `Updated shop photo "${photoForm.title}"`).catch(() => {});
      showToast(`Updated photo: ${photoForm.title}`);
    } else {
      const newPhoto: ShopPhotoItem = {
        id: `photo-${Date.now()}`,
        ...photoForm,
        highlights: highlightsArray
      };
      if (onUpdateShopPhotos) onUpdateShopPhotos([newPhoto, ...shopPhotos]);
      logActivityToFirestore('Shop Photo Added', 'SHOP_PHOTO', `Added new shop photo "${photoForm.title}"`).catch(() => {});
      showToast(`Added new photo: ${photoForm.title}`);
    }
    setIsPhotoModalOpen(false);
  };

  const handleDeletePhoto = (id: string, title: string) => {
    const filtered = shopPhotos.filter(p => p.id !== id);
    if (onUpdateShopPhotos) onUpdateShopPhotos(filtered);
    logActivityToFirestore('Shop Photo Deleted', 'SHOP_PHOTO', `Removed shop photo "${title}"`).catch(() => {});
    showToast(`Removed photo "${title}".`);
  };

  // --- Old Phone Sell Request Handlers ---
  const handleUpdateSellRequestStatus = async (id: string, newStatus: OldPhoneSellRequest['status']) => {
    const updated = oldPhoneSellRequests.map(s => s.id === id ? { ...s, status: newStatus } : s);
    if (onUpdateOldPhoneSellRequests) onUpdateOldPhoneSellRequests(updated);

    const itemToSync = updated.find(s => s.id === id);
    if (itemToSync) {
      try {
        await saveOldPhoneSellRequestToFirestore(itemToSync);
      } catch (err) {
        console.warn('Firestore sell request status update note:', err);
      }
      logActivityToFirestore(
        'Sell Request Status Changed',
        'SELL_REQUEST',
        `Sell request ${itemToSync.requestId} (${itemToSync.deviceBrand} ${itemToSync.deviceModel}) -> ${newStatus}`
      ).catch(() => {});
    }
    showToast(`Updated sell request status to: ${newStatus}`);
  };

  const handleUpdateSellRequestOfferPrice = async (id: string, offeredPrice: number) => {
    const updated = oldPhoneSellRequests.map(s => s.id === id ? { ...s, offeredPriceByAdmin: offeredPrice, status: 'Price Quoted' as const } : s);
    if (onUpdateOldPhoneSellRequests) onUpdateOldPhoneSellRequests(updated);

    const itemToSync = updated.find(s => s.id === id);
    if (itemToSync) {
      try {
        await saveOldPhoneSellRequestToFirestore(itemToSync);
      } catch (err) {
        console.warn('Firestore sell request offer price update note:', err);
      }
      logActivityToFirestore(
        'Buyback Offer Quoted',
        'SELL_REQUEST',
        `Quoted ₹${offeredPrice.toLocaleString('en-IN')} for ${itemToSync.requestId} (${itemToSync.deviceBrand} ${itemToSync.deviceModel})`
      ).catch(() => {});
    }
    showToast(`Quoted ₹${offeredPrice.toLocaleString('en-IN')} offer price to customer.`);
  };

  const handleDeleteSellRequest = async (id: string, requestId: string) => {
    if (!window.confirm(`Delete sell request ${requestId}?`)) return;
    const filtered = oldPhoneSellRequests.filter(s => s.id !== id && s.requestId !== requestId);
    if (onUpdateOldPhoneSellRequests) onUpdateOldPhoneSellRequests(filtered);

    try {
      await deleteOldPhoneSellRequestFromFirestore(id, requestId);
    } catch (err) {
      console.warn('Firestore delete sell request note:', err);
    }
    logActivityToFirestore('Sell Request Deleted', 'SELL_REQUEST', `Deleted sell request ${requestId}`).catch(() => {});
    showToast(`Deleted sell request ${requestId}.`);
  };

  const handleConvertSellRequestToStock = (sellReq: OldPhoneSellRequest) => {
    const newPhone: PreOwnedPhone = {
      id: `phone-${Date.now()}`,
      brand: sellReq.deviceBrand,
      model: sellReq.deviceModel,
      price: sellReq.offeredPriceByAdmin || sellReq.expectedPrice,
      originalPrice: Math.round((sellReq.offeredPriceByAdmin || sellReq.expectedPrice) * 1.3),
      condition: sellReq.condition.startsWith('Like New') ? 'Like New (10/10)' :
                 sellReq.condition.startsWith('Good') ? 'Excellent (9/10)' : 'Very Good (8/10)',
      storage: sellReq.storage,
      ram: '6 GB / 8 GB',
      color: sellReq.color || 'Standard Variant',
      inStock: true,
      testedDetails: [
        `Verified buyback from customer (${sellReq.customerName}).`,
        `Accessories: ${sellReq.accessoriesIncluded?.join(', ') || 'Phone only'}.`,
        sellReq.notes || 'Fully tested in TECHFIX Goalpara shop.'
      ],
      image: sellReq.photoUrl || 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80',
      images: [
        sellReq.photoUrl || 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80'
      ],
      warranty: '1 Month Shop Replacement Guarantee'
    };

    onUpdatePreOwnedPhones([newPhone, ...preOwnedPhones]);
    handleUpdateSellRequestStatus(sellReq.id, 'Purchased');
    logActivityToFirestore(
      'Buyback Converted to Stock',
      'PHONE_STOCK',
      `Purchased ${sellReq.deviceBrand} ${sellReq.deviceModel} from ${sellReq.customerName} and added to shop stock`
    ).catch(() => {});
    showToast(`Added ${sellReq.deviceBrand} ${sellReq.deviceModel} to Shop Pre-Owned Stock!`);
  };


  // If locked, show Firebase Google Auth & PIN entry overlay
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 text-cyan-400 flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-extrabold mb-2">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>⚡ AUTOMATIC FIRST-TIME GMAIL ADMIN</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Shop Admin Access</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Log in with any Gmail ID for the first time — it will be <span className="font-bold text-emerald-700">automatically promoted to Shop Admin</span> with full control over second-hand mobiles, UPI QR payments, hero banners, and store settings.
          </p>
        </div>

        {/* PRIMARY: GOOGLE SIGN-IN VIA FIREBASE */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isAuthLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-3 border border-slate-700 disabled:opacity-50 active:scale-[0.98]"
          >
            <GoogleIcon />
            <span>{isAuthLoading ? 'Connecting Firebase Auth...' : 'Sign In with Google (Firebase Admin)'}</span>
          </button>
          
          {authErrorMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left space-y-1.5 text-xs text-amber-900">
              <p className="font-extrabold flex items-center gap-1.5 text-amber-800">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Google Sign-In Popup Note:</span>
              </p>
              <p className="leading-relaxed text-[11px] text-amber-800">{authErrorMsg}</p>
            </div>
          )}

          {/* GMAIL DIRECT ADMIN LOGIN OPTION */}
          <form onSubmit={handleGmailDirectSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-left">
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
              Instant Gmail Admin Sign-In:
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={gmailInput}
                onChange={(e) => setGmailInput(e.target.value)}
                placeholder="e.g. ratoibur11@gmail.com"
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl shadow transition shrink-0"
              >
                Log In Gmail
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Instant authority for <span className="font-mono text-cyan-700 font-bold">{gmailInput || 'your Gmail'}</span>
            </p>
          </form>

          <div className="flex items-center gap-3 my-3">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">OR UNLOCK WITH PASSWORD</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
        </div>

        <form onSubmit={handleUnlockAdmin} className="space-y-3">
          <div>
            <input
              type="password"
              placeholder="Enter Admin Password (e.g. 44108355)"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              className="w-full text-center px-4 py-3 rounded-xl border border-slate-300 text-base font-mono focus:ring-2 focus:ring-blue-500 tracking-widest shadow-inner"
            />
            {pinError && (
              <p className="text-xs text-rose-600 mt-2 font-semibold">
                Incorrect password! Please enter: <span className="font-mono font-bold">44108355</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2 border border-slate-300"
          >
            <Unlock className="w-4 h-4 text-slate-700" />
            <span>Unlock with Password</span>
          </button>
        </form>

        <p className="text-[11px] text-slate-400 italic">
          Password: <span className="font-mono text-slate-700 font-bold select-all">44108355</span>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Admin Panel Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Shop Admin Control Hub</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-extrabold">
              ● ADMIN: {activeAdminEmail}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Website Content & Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Control second-hand mobile listings, update UPI payment QR code, manage accessories stock, and update shop details in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || activeAdminEmail}
                className="w-10 h-10 rounded-full border border-cyan-500 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-cyan-600 text-slate-950 font-black flex items-center justify-center text-sm">
                {(currentUser?.displayName || activeAdminEmail || 'A')[0].toUpperCase()}
              </div>
            )}
            <div className="text-left text-xs">
              <p className="font-extrabold text-white leading-tight">
                {currentUser?.displayName || (activeAdminEmail.split('@')[0])}
              </p>
              <p className="text-[10px] text-cyan-400 font-mono truncate max-w-[170px]">
                {activeAdminEmail}
              </p>
            </div>
            <button
              onClick={handleFirebaseLogout}
              className="ml-2 p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-300 transition"
              title="Sign Out from Admin Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsManualLogoModalOpen(true)}
            className="px-3.5 py-2.5 rounded-none bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black transition text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            title="Manual Logo Update / Upload Studio Kholein"
          >
            <Upload className="w-3.5 h-3.5 text-slate-950" />
            <span>🖼️ Manual Logo Update</span>
            {upiForm.logoUrl && (
              <span className="w-2 h-2 rounded-none bg-emerald-700"></span>
            )}
          </button>

          <button
            onClick={() => setIsChangePinModalOpen(true)}
            className="px-3 py-2.5 rounded-none bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition text-xs font-semibold flex items-center gap-1.5"
            title="Change Admin Password"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Change Password</span>
          </button>

          <button
            onClick={() => {
              if (currentUser) {
                handleFirebaseLogout();
              } else {
                setIsUnlocked(false);
              }
            }}
            className="p-2.5 rounded-none bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Lock Control Panel"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation Bar (Square Type Tabs as requested) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-200">
        <button
          onClick={() => setAdminTab('requests')}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 relative ${
            adminTab === 'requests'
              ? 'bg-purple-700 text-white shadow-md ring-2 ring-purple-400'
              : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <Smartphone className="w-4 h-4 text-purple-400" />
          <span>📱 Repair Requests</span>
          <span className="px-1.5 py-0.5 rounded-none bg-rose-500 text-white text-[10px] font-black animate-pulse">
            {activeRequests.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('sellRequests')}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 relative ${
            adminTab === 'sellRequests'
              ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-400'
              : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>💵 Old Phone Sell Requests</span>
          <span className="px-1.5 py-0.5 rounded-none bg-emerald-600 text-white text-[10px] font-black">
            {oldPhoneSellRequests.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('taxInvoice')}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            adminTab === 'taxInvoice'
              ? 'bg-blue-700 text-white shadow-md ring-2 ring-blue-400'
              : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-500" />
          <span>🧾 Tax Invoice Creator</span>
          <span className="px-1.5 py-0.5 rounded-none bg-blue-600 text-white text-[10px] font-black">
            GST
          </span>
        </button>

        <button
          onClick={() => setAdminTab('upi')}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            adminTab === 'upi'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>1. Shop Contact & UPI</span>
        </button>

        <button
          onClick={() => setAdminTab('banner')}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            adminTab === 'banner'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>2. Hero Banner & Announcement</span>
        </button>

        <button
          onClick={() => setAdminTab('photos')}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            adminTab === 'photos'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>3. Shop Photos ({shopPhotos.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('accessories')}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            adminTab === 'accessories'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>4. Accessories & Parts ({accessories.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('phones')}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            adminTab === 'phones'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>5. Second-Hand Mobiles ({preOwnedPhones.length})</span>
        </button>


        <button
          onClick={() => setAdminTab('logo')}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            adminTab === 'logo'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md ring-2 ring-amber-300'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
          }`}
        >
          <Upload className="w-4 h-4 text-amber-600" />
          <span>🖼️ Shop Logo (Manual Upload)</span>
          {upiForm.logoUrl && (
            <span className="w-2 h-2 rounded-none bg-emerald-600"></span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('overview')}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            adminTab === 'overview'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-cyan-400" />
          <span>7. Revenue Stats</span>
        </button>

        <button
          onClick={() => {
            setAdminTab('proposals');
            setSelectedAdminProposal(null);
          }}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            adminTab === 'proposals'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>8. Quotes ({proposals.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('themes')}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            adminTab === 'themes'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Palette className="w-4 h-4 text-rose-500" />
          <span>9. Section Themes</span>
        </button>

        <button
          onClick={() => setAdminTab('activityLogs')}
          className={`px-3.5 py-2.5 rounded-none text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            adminTab === 'activityLogs'
              ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-400'
              : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border border-emerald-300'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>🔥 Firebase Activity Logs ({activityLogs.length})</span>
        </button>
      </div>

      {/* TAB: TAX INVOICE CREATOR & MANAGER (IMAGE TEMPLATE FORMAT) */}
      {adminTab === 'taxInvoice' && (
        <AdminTaxInvoiceManager
          businessDetails={businessDetails}
          onUpdateBusinessDetails={onUpdateBusinessDetails}
          repairRequests={repairRequests}
        />
      )}

      {/* TAB 0: REPAIR ORDERS & LIVE TRACKING CONTROL CENTER */}
      {adminTab === 'requests' && (
        <div className="space-y-6">
          
          {/* Top Analytics & Overview Statistics Bar (Square Type Design) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-none border-2 border-slate-300 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Repair Jobs</span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{activeRequests.length}</p>
              <span className="text-[10px] text-purple-600 font-bold">All Time Intake</span>
            </div>

            <div className="bg-white p-4 rounded-none border-2 border-blue-300 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-blue-500">In Repair / Lab</span>
              <p className="text-2xl font-black text-blue-700 mt-0.5">
                {activeRequests.filter(r => r.status === 'In Progress' || r.status === 'Quality Testing' || r.status === 'Contacted').length}
              </p>
              <span className="text-[10px] text-blue-600 font-bold animate-pulse">● Active on Workbench</span>
            </div>

            <div className="bg-white p-4 rounded-none border-2 border-emerald-300 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600">Ready for Pickup</span>
              <p className="text-2xl font-black text-emerald-700 mt-0.5">
                {activeRequests.filter(r => r.status === 'Ready for Pickup').length}
              </p>
              <span className="text-[10px] text-emerald-700 font-bold">Testing Passed</span>
            </div>

            <div className="bg-white p-4 rounded-none border-2 border-slate-300 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Delivered / Closed</span>
              <p className="text-2xl font-black text-slate-700 mt-0.5">
                {activeRequests.filter(r => r.status === 'Completed').length}
              </p>
              <span className="text-[10px] text-slate-500 font-bold">Handed to Client</span>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-4 rounded-none text-white shadow-xs border-2 border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-extrabold uppercase text-cyan-300">Total Repair Value</span>
              <p className="text-2xl font-black text-cyan-400 mt-0.5">
                ₹{activeRequests.reduce((sum, r) => sum + (r.estimatedCost || 0), 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">Booked Volume</span>
            </div>
          </div>

          {/* Action Toolbar & Search Bar (Square Type Controls) */}
          <div className="bg-white p-5 sm:p-6 rounded-none border-2 border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-purple-100 text-purple-800 text-xs font-bold mb-1 border border-purple-200">
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span>Live Repair Tracking Control Center</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Repair Orders & Live Tracking Manager ({filteredRequests.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage live repair progress, expected delivery time, technician diagnostic notes, and complete job history.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Ticket, Name, Phone..."
                  value={requestSearchQuery}
                  onChange={(e) => setRequestSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-none text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-600 w-44 sm:w-56"
                />
              </div>

              {/* Status filter */}
              <select
                value={requestFilter}
                onChange={(e) => setRequestFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-none text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-600"
              >
                <option value="All">All Statuses ({activeRequests.length})</option>
                <option value="Pending">Pending Application</option>
                <option value="In Progress">In Progress (Repairing)</option>
                <option value="Quality Testing">Quality Testing</option>
                <option value="Ready for Pickup">Ready for Pickup</option>
                <option value="Completed">Completed / Handed Over</option>
              </select>

              {/* Sync / Refresh Button */}
              <button
                type="button"
                onClick={handleManualSyncRequests}
                disabled={isSyncingRequests}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-none transition flex items-center gap-1.5 border border-slate-300"
                title="Sync / Refresh Repair Orders from Server Database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRequests ? 'animate-spin text-purple-600' : 'text-slate-600'}`} />
                <span>{isSyncingRequests ? 'Syncing...' : 'Sync Live'}</span>
              </button>

              {/* + Register Walk-in Repair Button */}
              <button
                type="button"
                onClick={() => setIsNewWalkinModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-none shadow-md transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Walk-In Job</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-lg border border-slate-200 space-y-3">
              <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No Repair Orders Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No tickets match your search or filter. You can click "+ Walk-In Job" to register a new repair ticket.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((req) => {
                const cleanPhone = req.contactPhone.replace(/[^0-9]/g, '');
                const cleanWa = req.whatsappNumber ? req.whatsappNumber.replace(/[^0-9]/g, '') : cleanPhone;
                const progressPct = req.progressPercent !== undefined ? req.progressPercent : (
                  req.status === 'Completed' ? 100 :
                  req.status === 'Ready for Pickup' ? 95 :
                  req.status === 'Quality Testing' ? 80 :
                  req.status === 'In Progress' ? 60 : 25
                );

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-none p-6 border-2 border-slate-300 shadow-sm hover:shadow-xl transition flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    {/* Status Top Strip */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                      req.status === 'Completed' || req.status === 'Ready for Pickup' ? 'bg-emerald-500' :
                      req.status === 'Quality Testing' ? 'bg-cyan-500' :
                      req.status === 'In Progress' ? 'bg-blue-600' : 'bg-amber-500'
                    }`} />

                    <div className="space-y-3 pt-1">
                      
                      {/* Ticket Header & Status Selector */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-none border border-purple-200">
                              {req.requestId}
                            </span>
                            {req.serviceType && (
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-none font-bold">
                                {req.serviceType === 'Doorstep Pickup' ? '🛵 Pickup' : '🏪 Shop'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{req.createdAt}</p>
                        </div>

                        {/* Quick Status Dropdown */}
                        <select
                          value={req.status}
                          onChange={(e) => handleUpdateRequestStatus(req.id, e.target.value as any)}
                          className={`px-2.5 py-1 rounded-none text-[10px] font-black uppercase tracking-wider border cursor-pointer ${
                            req.status === 'Completed' || req.status === 'Ready for Pickup' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            req.status === 'Quality Testing' ? 'bg-cyan-100 text-cyan-800 border-cyan-300' :
                            req.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="Pending">● Pending</option>
                          <option value="Contacted">● Contacted</option>
                          <option value="In Progress">● In Progress</option>
                          <option value="Quality Testing">● Quality Testing</option>
                          <option value="Ready for Pickup">● Ready for Pickup</option>
                          <option value="Completed">● Completed</option>
                        </select>
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-extrabold text-slate-900">{req.customerName}</h3>
                          {req.urgency === 'Urgent Express' && (
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-black flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-rose-600" /> URGENT
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 space-y-1 font-mono pt-1">
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <a href={`tel:${req.contactPhone}`} className="hover:underline font-bold">{req.contactPhone}</a>
                          </div>
                          
                          {req.whatsappNumber && (
                            <div className="flex items-center gap-1.5 text-emerald-700">
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>WhatsApp: {req.whatsappNumber}</span>
                            </div>
                          )}

                          {req.pickupAddress && (
                            <div className="text-[11px] font-sans text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                              📍 <strong>Pickup:</strong> {req.pickupAddress}
                            </div>
                          )}

                          {req.devicePasscode && (
                            <div className="text-[11px] font-mono text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 font-bold">
                              🔐 Lock/PIN: {req.devicePasscode}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Device & Issue Box */}
                      <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-purple-950">
                          <span>{req.deviceBrand} {req.deviceModel}</span>
                          <span className="text-[10px] text-purple-700 bg-purple-200/60 px-1.5 py-0.5 rounded">
                            {req.preferredDate || 'Standard Visit'}
                          </span>
                        </div>
                        <p className="text-slate-700 italic leading-relaxed text-[11px]">
                          "{req.problemDescription}"
                        </p>
                      </div>

                      {/* LIVE TRACKING SNAPSHOT: KITNA TAK HUA & KAB MILEGA */}
                      <div className="space-y-2 p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800">
                        {/* Progress */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-cyan-300 font-bold flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Kitna Hua:</span>
                          </span>
                          <span className="font-mono font-black text-cyan-400">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all"
                            style={{ width: `${Math.max(progressPct, 10)}%` }}
                          />
                        </div>

                        {/* Kab Milega */}
                        <div className="pt-1 border-t border-slate-800 text-[11px] flex items-center justify-between">
                          <span className="text-slate-400">Kab Milega:</span>
                          <span className="text-emerald-400 font-bold truncate max-w-[170px]">
                            {req.expectedDeliveryDate || 'Same Day / 24 Hours'}
                          </span>
                        </div>
                      </div>

                      {/* Technician Live Note if present */}
                      {req.technicianNote && (
                        <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-950">
                          <span className="font-bold text-[10px] uppercase text-blue-800 block">Technician Note (Visible to User):</span>
                          <p className="text-slate-700 italic text-[11px] mt-0.5">{req.technicianNote}</p>
                        </div>
                      )}

                      {/* Financials & Balance */}
                      {req.estimatedCost !== undefined && req.estimatedCost > 0 && (
                        <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-500">Total: <strong>₹{req.estimatedCost}</strong></span>
                          <span className="text-emerald-700">Advance: <strong>₹{req.advancePaid || 0}</strong></span>
                          <span className="font-black text-rose-600">Balance: ₹{req.balanceDue ?? (req.estimatedCost - (req.advancePaid || 0))}</span>
                        </div>
                      )}

                    </div>

                    {/* Instant Action Toolbar */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      
                      {/* Master Live Control Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenLiveControl(req)}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Control Live Tracking & Edit Job</span>
                      </button>

                      {/* Official Print Receipt / Bill Action */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRequestForInvoice(req);
                          setIsInvoiceModalOpen(true);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                        title="Print Official Repair Service Receipt / Bill"
                      >
                        <Receipt className="w-3.5 h-3.5 text-teal-700" />
                        <span>Print Bill / Receipt ({req.requestId})</span>
                      </button>

                      {/* Calling & WhatsApp Quick Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${cleanPhone}`}
                          className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Call Client</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleWhatsAppCustomerLiveUpdate(req)}
                          className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
                          title="Send Realtime Tracking WhatsApp Update"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Send Update</span>
                        </button>
                      </div>

                      {/* Quote & Delete Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleConvertRequestToProposal(req)}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition border border-purple-200"
                          title="Create Proposal Estimate"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-700" />
                          <span>Create Proposal Quote</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(req.id, req.requestId)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200"
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* MODAL: MASTER LIVE TRACKING & REPAIR ORDER CONTROL PANEL */}
      {isLiveControlModalOpen && editingLiveRequest && (
        <div className={`fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md ${
          isLiveControlFullScreen 
            ? 'p-0 w-screen h-screen flex flex-col overflow-hidden' 
            : 'overflow-y-auto flex items-center justify-center p-2 sm:p-4 md:p-6'
        }`}>
          <div className={`bg-white text-slate-900 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200 ${
            isLiveControlFullScreen 
              ? 'w-full h-full rounded-none flex flex-col max-w-none m-0 overflow-hidden' 
              : 'rounded-2xl sm:rounded-3xl max-w-3xl w-full p-5 sm:p-8 space-y-6 my-4 sm:my-6 max-h-[92vh] overflow-y-auto'
          }`}>
            
            {/* Top Right Action Buttons (Fullscreen Mode + Close) */}
            <div className={`flex items-center gap-2 ${
              isLiveControlFullScreen 
                ? 'absolute top-3.5 right-4 sm:right-6 z-20' 
                : 'absolute top-4 sm:top-5 right-4 sm:right-5 z-10'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequestForInvoice(editingLiveRequest);
                  setIsInvoiceModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 transition flex items-center gap-1.5 text-xs font-bold shadow-xs"
                title="Print Receipt / Bill"
              >
                <Receipt className="w-4 h-4 text-teal-600" />
                <span className="font-extrabold hidden sm:inline">Print Bill</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLiveControlFullScreen(!isLiveControlFullScreen)}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold border shadow-xs ${
                  isLiveControlFullScreen 
                    ? 'bg-purple-700 text-white border-purple-800 hover:bg-purple-800' 
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                }`}
                title={isLiveControlFullScreen ? "Exit Fullscreen (Normal View)" : "Expand to Full Screen View"}
              >
                {isLiveControlFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-purple-700" />}
                <span className="font-extrabold">{isLiveControlFullScreen ? 'Exit Full Screen' : 'Full Screen'}</span>
              </button>

              <button
                onClick={() => {
                  setIsLiveControlModalOpen(false);
                  setIsLiveControlFullScreen(false);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Header */}
            <div className={`border-b border-slate-100 ${
              isLiveControlFullScreen ? 'p-4 sm:px-8 bg-slate-50/80 shrink-0 pr-40 sm:pr-48' : 'pb-4 space-y-1'
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                  {editingLiveRequest.requestId}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {editingLiveRequest.serviceType || 'Goalpara Lab'}
                </span>
                {isLiveControlFullScreen && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                    Full Screen Mode Active
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Live Repair Tracking & Job Controller
              </h2>
              <p className="text-xs text-slate-500">
                Customer: <strong className="text-slate-800">{editingLiveRequest.customerName}</strong> ({editingLiveRequest.contactPhone}) • Device: <strong className="text-purple-700">{editingLiveRequest.deviceBrand} {editingLiveRequest.deviceModel}</strong>
              </p>
            </div>

            <form onSubmit={handleSaveLiveControl} className={isLiveControlFullScreen ? 'flex flex-col flex-1 overflow-hidden' : 'space-y-5'}>
              <div className={isLiveControlFullScreen ? 'flex-1 overflow-y-auto p-4 sm:p-8 space-y-5' : 'space-y-5'}>
              
              {/* CONTROL 1: Live Status & Progress Percentage */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  1. Live Status & Progress ("Kitna Tak Hua"):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Current Live Status *</label>
                    <select
                      value={liveControlForm.status}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        let autoPct = liveControlForm.progressPercent;
                        if (val === 'Pending') autoPct = 15;
                        else if (val === 'Contacted') autoPct = 30;
                        else if (val === 'In Progress') autoPct = 60;
                        else if (val === 'Quality Testing') autoPct = 80;
                        else if (val === 'Ready for Pickup') autoPct = 95;
                        else if (val === 'Completed') autoPct = 100;
                        setLiveControlForm({ ...liveControlForm, status: val, progressPercent: autoPct });
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    >
                      <option value="Pending">● Pending Application</option>
                      <option value="Contacted">● Contacted / Quoted</option>
                      <option value="In Progress">● In Repair Progress (Hardware / IC)</option>
                      <option value="Quality Testing">● Quality & Stress Testing</option>
                      <option value="Ready for Pickup">● Ready for Shop Pickup</option>
                      <option value="Completed">● Completed / Delivered</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Progress Percentage:</label>
                      <span className="font-mono font-black text-sm text-purple-700">{liveControlForm.progressPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={liveControlForm.progressPercent}
                      onChange={(e) => setLiveControlForm({ ...liveControlForm, progressPercent: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {/* Quick Progress Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold">Presets:</span>
                  {[
                    { label: '15% Received', val: 15 },
                    { label: '35% Diagnosis', val: 35 },
                    { label: '65% Soldering', val: 65 },
                    { label: '85% Testing', val: 85 },
                    { label: '95% Ready', val: 95 },
                    { label: '100% Handover', val: 100 }
                  ].map(p => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setLiveControlForm({ ...liveControlForm, progressPercent: p.val })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                        liveControlForm.progressPercent === p.val
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CONTROL 2: Kab Mobile Milega (Expected Delivery Date & Time) */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <span className="text-[11px] font-black uppercase text-emerald-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  2. Kab Mobile Milega (Expected Delivery Date & Time for Customer):
                </span>

                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={liveControlForm.expectedDeliveryDate}
                    onChange={(e) => setLiveControlForm({ ...liveControlForm, expectedDeliveryDate: e.target.value })}
                    placeholder="e.g. 27 Sep 2026, 05:30 PM ya Ready for Pickup Today"
                    className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-emerald-700 font-bold">Quick Dates:</span>
                    {[
                      'Today at 05:00 PM',
                      'Tomorrow at 12:00 PM',
                      'Tomorrow at 05:30 PM',
                      'Ready for Pickup Today at Shop!',
                      '2 Days (Waiting for Parts)'
                    ].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setLiveControlForm({ ...liveControlForm, expectedDeliveryDate: d })}
                        className="px-2 py-1 rounded bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100 text-[10px] font-bold transition"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CONTROL 3: Technician Live Update Note */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  3. Technician Live Update Note (Directly Visible to Customer on Tracking Screen):
                </label>
                <textarea
                  rows={2}
                  value={liveControlForm.technicianNote}
                  onChange={(e) => setLiveControlForm({ ...liveControlForm, technicianNote: e.target.value })}
                  placeholder="e.g. Screen replaced, UV glue curing for 2 hours before touch test. Pickup ready at 5 PM."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-purple-600"
                />

                {/* Quick note suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-bold">Add Note:</span>
                  {[
                    'Original Display installed, glue curing under UV lamp.',
                    'Motherboard Power IC reballed & tested successfully.',
                    'Battery replaced with genuine cell. 100% capacity tested.',
                    'Final QC testing completed. Ready for collection at Dubapara.'
                  ].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setLiveControlForm({ ...liveControlForm, technicianNote: n })}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium border border-slate-200"
                    >
                      + {n.slice(0, 28)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* CONTROL 4: Financials & Assigned Technician */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={liveControlForm.estimatedCost}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      setLiveControlForm({ ...liveControlForm, estimatedCost: cost, balanceDue: Math.max(0, cost - liveControlForm.advancePaid) });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Advance Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={liveControlForm.advancePaid}
                    onChange={(e) => {
                      const adv = parseFloat(e.target.value) || 0;
                      setLiveControlForm({ ...liveControlForm, advancePaid: adv, balanceDue: Math.max(0, liveControlForm.estimatedCost - adv) });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Balance Due (₹)</label>
                  <input
                    type="number"
                    readOnly
                    value={Math.max(0, liveControlForm.estimatedCost - liveControlForm.advancePaid)}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-mono font-black text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Assigned Tech</label>
                  <input
                    type="text"
                    value={liveControlForm.assignedTechnician}
                    onChange={(e) => setLiveControlForm({ ...liveControlForm, assignedTechnician: e.target.value })}
                    placeholder="e.g. Toibur Rahman"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* CONTROL 5: Add Chronological History Milestone */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Add New Milestone to Job History Log (Optional):
                </span>
                <input
                  type="text"
                  value={liveControlForm.newHistoryNote}
                  onChange={(e) => setLiveControlForm({ ...liveControlForm, newHistoryNote: e.target.value })}
                  placeholder="e.g. Guwahati se replacement screen arrive hua, fitting shuru."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />

                {/* Show existing history log count */}
                {editingLiveRequest.historyLog && editingLiveRequest.historyLog.length > 0 && (
                  <div className="pt-1 text-[10px] text-slate-500">
                    <span>Current History Entries ({editingLiveRequest.historyLog.length}): </span>
                    <span className="font-semibold text-slate-700">
                      Last logged: {editingLiveRequest.historyLog[editingLiveRequest.historyLog.length - 1]?.title}
                    </span>
                  </div>
                )}
              </div>
              </div>

              {/* Submit Buttons */}
              <div className={`${
                isLiveControlFullScreen 
                  ? 'shrink-0 p-4 sm:px-8 bg-slate-50 border-t border-slate-200 shadow-lg' 
                  : 'pt-3 border-t border-slate-200'
              } flex flex-wrap items-center justify-between gap-3`}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLiveControlFullScreen(!isLiveControlFullScreen)}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition flex items-center gap-1.5 text-xs font-bold border border-purple-200 shadow-xs"
                    title={isLiveControlFullScreen ? "Exit Fullscreen (Normal View)" : "Expand to Full Screen View"}
                  >
                    {isLiveControlFullScreen ? <Minimize2 className="w-4 h-4 text-purple-700" /> : <Maximize2 className="w-4 h-4 text-purple-700" />}
                    <span>{isLiveControlFullScreen ? 'Normal View' : 'Full Screen Mode'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLiveControlModalOpen(false);
                      setIsLiveControlFullScreen(false);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white text-xs font-black shadow-lg transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Live Updates & Sync Database</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW WALK-IN REPAIR JOB */}
      {isNewWalkinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 my-8 relative animate-in fade-in zoom-in duration-200">
            
            <button
              onClick={() => setIsNewWalkinModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <span>Register Walk-In Repair Ticket</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate tracking ticket for in-store walk-in customer with live progress.
              </p>
            </div>

            <form onSubmit={handleCreateWalkinTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bikash Das"
                    value={walkinForm.customerName}
                    onChange={(e) => setWalkinForm({ ...walkinForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Calling Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98640 12345"
                    value={walkinForm.contactPhone}
                    onChange={(e) => setWalkinForm({ ...walkinForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Device Brand</label>
                  <select
                    value={walkinForm.deviceBrand}
                    onChange={(e) => setWalkinForm({ ...walkinForm, deviceBrand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="Samsung">Samsung</option>
                    <option value="Apple iPhone">Apple iPhone</option>
                    <option value="Xiaomi / Redmi">Xiaomi / Redmi</option>
                    <option value="Realme">Realme</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Oppo">Oppo</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Motorola">Motorola</option>
                    <option value="Other">Other Brand</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Device Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Galaxy M31s"
                    value={walkinForm.deviceModel}
                    onChange={(e) => setWalkinForm({ ...walkinForm, deviceModel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-purple-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Problem Description</label>
                <input
                  type="text"
                  placeholder="e.g. Screen broken, touch not working"
                  value={walkinForm.problemDescription}
                  onChange={(e) => setWalkinForm({ ...walkinForm, problemDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={walkinForm.estimatedCost}
                    onChange={(e) => setWalkinForm({ ...walkinForm, estimatedCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Advance Received (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={walkinForm.advancePaid}
                    onChange={(e) => setWalkinForm({ ...walkinForm, advancePaid: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kab Milega (Expected Delivery)</label>
                <input
                  type="text"
                  value={walkinForm.expectedDeliveryDate}
                  onChange={(e) => setWalkinForm({ ...walkinForm, expectedDeliveryDate: e.target.value })}
                  placeholder="e.g. Tomorrow at 05:00 PM"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-emerald-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewWalkinModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-black text-xs shadow transition"
                >
                  Create Ticket & Start Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: OLD PHONE SELL REQUESTS MANAGEMENT */}
      {adminTab === 'sellRequests' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  Customer Old Phone Buyback Submissions
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Customers submit their old phones on the website. Quote prices, contact them over call/WhatsApp, and add purchased devices directly to shop pre-owned inventory!
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-bold text-slate-600">Filter Status:</label>
              <select
                value={sellRequestFilter}
                onChange={(e) => setSellRequestFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600"
              >
                <option value="All">All Sell Requests ({oldPhoneSellRequests.length})</option>
                <option value="Pending">Pending Review</option>
                <option value="Contacted">Contacted</option>
                <option value="Price Quoted">Price Quoted</option>
                <option value="Purchased">Purchased & Stocked</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {(() => {
            const filteredSellReqs = oldPhoneSellRequests.filter(s => {
              if (sellRequestFilter === 'All') return true;
              return s.status === sellRequestFilter;
            });

            if (filteredSellReqs.length === 0) {
              return (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                  <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-800">No Old Phone Sell Requests Found</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    When customers submit their old phones for sale on your website, they will appear here instantly.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSellReqs.map((s) => {
                  const cleanPhone = s.contactPhone.replace(/[^0-9]/g, '');
                  const cleanWa = s.whatsappNumber ? s.whatsappNumber.replace(/[^0-9]/g, '') : cleanPhone;

                  const offerText = s.offeredPriceByAdmin ? `Our offer price is ₹${s.offeredPriceByAdmin.toLocaleString('en-IN')}.` : '';
                  const waMessage = `Hello ${s.customerName}, TECHFIX Goalpara received your old phone sell request (${s.requestId}) for your ${s.deviceBrand} ${s.deviceModel} (${s.storage}).\n\nCondition: ${s.condition}.\nExpected Price: ₹${s.expectedPrice}.\n${offerText}\n\nPlease bring the phone to our shop at Dubapara Lupta Char, Goalpara for physical inspection and cash payout!`;

                  return (
                    <div
                      key={s.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition flex flex-col justify-between space-y-4 relative"
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <span className="font-mono text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                              {s.requestId}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">{s.createdAt}</p>
                          </div>

                          {/* Status Switcher */}
                          <select
                            value={s.status}
                            onChange={(e) => handleUpdateSellRequestStatus(s.id, e.target.value as any)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer ${
                              s.status === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                              s.status === 'Contacted' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              s.status === 'Price Quoted' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                              s.status === 'Purchased' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="Pending">● Pending</option>
                            <option value="Contacted">● Contacted</option>
                            <option value="Price Quoted">● Quoted</option>
                            <option value="Purchased">● Purchased</option>
                            <option value="Rejected">● Rejected</option>
                          </select>
                        </div>

                        {/* Customer Details */}
                        <div className="space-y-1">
                          <h3 className="text-base font-extrabold text-slate-900">{s.customerName}</h3>
                          <div className="text-xs text-slate-600 space-y-1 font-mono pt-1">
                            <div className="flex items-center gap-1.5 text-slate-800">
                              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <a href={`tel:${s.contactPhone}`} className="hover:underline font-bold">{s.contactPhone}</a>
                            </div>
                            {s.whatsappNumber && (
                              <div className="flex items-center gap-1.5 text-emerald-700">
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>WA: {s.whatsappNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Device Details Box */}
                        <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                          s.isCrackedPhone || s.damageType ? 'bg-rose-50/70 border-rose-200' : 'bg-emerald-50/60 border-emerald-100'
                        }`}>
                          <div className="flex items-center justify-between font-extrabold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{s.deviceBrand} {s.deviceModel}</span>
                              {(s.isCrackedPhone || s.damageType) && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase">
                                  CRACKED
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-950">
                              {s.storage}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-700 space-y-1">
                            <p><strong className="text-slate-900">Condition:</strong> {s.condition}</p>
                            {s.damageType && (
                              <p className="text-rose-700 font-bold">
                                <strong>Damage Fault:</strong> {s.damageType}
                              </p>
                            )}
                            {s.screenStatus && (
                              <p className="text-amber-800 font-bold">
                                <strong>Screen/Touch Status:</strong> {s.screenStatus}
                              </p>
                            )}
                            <p><strong className="text-slate-900">Customer Expected Price:</strong> <span className="text-emerald-700 font-extrabold font-mono">₹{s.expectedPrice.toLocaleString('en-IN')}</span></p>
                            {s.color && <p><strong className="text-slate-900">Color:</strong> {s.color}</p>}
                            {s.accessoriesIncluded && s.accessoriesIncluded.length > 0 && (
                              <p className="text-[10px] text-slate-600">
                                <strong>Accessories:</strong> {s.accessoriesIncluded.join(', ')}
                              </p>
                            )}
                            {s.notes && (
                              <p className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-200">
                                "{s.notes}"
                              </p>
                            )}

                            {/* Uploaded Customer Photos */}
                            {((s.devicePhotos && s.devicePhotos.length > 0) || s.photoUrl) && (
                              <div className="pt-2 border-t border-slate-200/60 space-y-1">
                                <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                                  <Camera className="w-3 h-3 text-cyan-600" />
                                  <span>Customer Uploaded Photos ({s.devicePhotos?.length || 1}):</span>
                                </span>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                  {(s.devicePhotos || (s.photoUrl ? [s.photoUrl] : [])).map((img, i) => (
                                    <a
                                      key={i}
                                      href={img}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="relative group block w-14 h-14 rounded-xl overflow-hidden border border-slate-300 shadow-xs shrink-0"
                                      title="Click to open full photo"
                                    >
                                      <img
                                        src={img}
                                        alt={`Device photo ${i + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition"
                                      />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Offer Price Input Box */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            Set Shop Buyback Quote Offer (₹):
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="e.g. 15000"
                              defaultValue={s.offeredPriceByAdmin || ''}
                              onBlur={(e) => {
                                const val = Number(e.target.value);
                                if (val > 0) handleUpdateSellRequestOfferPrice(s.id, val);
                              }}
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-[10px] text-slate-500 self-center">Auto-saved on blur</span>
                          </div>
                        </div>

                      </div>

                      {/* Toolbar Actions */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={`tel:${cleanPhone}`}
                            className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Call</span>
                          </a>

                          <a
                            href={`https://wa.me/91${cleanWa}?text=${encodeURIComponent(waMessage)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            onClick={() => handleConvertSellRequestToStock(s)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 text-xs font-black flex items-center justify-center gap-1.5 transition border border-emerald-300"
                            title="Buy this phone and add directly to pre-owned shop stock"
                          >
                            <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Buy & Add to Stock</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSellRequest(s.id, s.requestId)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200"
                            title="Delete Sell Request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 1: UPI QR CODE, BRAND LOGO & SHOP DETAILS MANAGEMENT */}
      {adminTab === 'upi' && (
        <div className="space-y-8">
          {/* DEDICATED SECTION: MANUAL SHOP LOGO UPLOAD & BRANDING */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-indigo-900/50 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-900/60 pb-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/30">
                  Shop Brand Identity • Manual Logo Upload
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 mt-2">
                  <Upload className="w-6 h-6 text-amber-400" />
                  <span>Shop Official Logo (Manual Upload)</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Apne device se apna custom logo upload karein. Yeh logo poori website (Header, Hero, Footer) aur poori website par turant automatic lag jayega.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <label 
                  htmlFor="upi-logo-file-input"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 transition cursor-pointer select-none active:scale-95"
                >
                  <input
                    id="upi-logo-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessLogoFile(file);
                      e.target.value = '';
                    }}
                    className="sr-only"
                  />
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingLogo ? 'Processing Logo...' : 'Choose Logo File (PNG/JPG/SVG)'}</span>
                </label>

                {upiForm.logoUrl && (
                  <button
                    type="button"
                    onClick={handleResetToDefaultLogo}
                    className="px-4 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition flex items-center gap-1.5"
                    title="Custom logo remove karke default vector logo restore karein"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset to Default Logo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Dual Preview Grid: Light Background vs Website Dark Background */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* 1. Light Card / Paper Preview */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 text-slate-900 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black uppercase text-emerald-700 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> Light Background Preview (White Cards & Documents)
                  </span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Light Mode
                  </span>
                </div>

                <div className="min-h-[120px] flex items-center justify-center p-3 bg-slate-50/80 rounded-xl border border-dashed border-slate-300">
                  <TechfixLogo 
                    variant="full" 
                    theme="light" 
                    className="h-20 sm:h-24 max-w-full w-auto object-contain" 
                    showSlogan={true}
                    customLogoUrl={upiForm.logoUrl}
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Website aur profile cards par yahi logo show hoga.
                </p>
              </div>

              {/* 2. Website Theme Preview (Dark Background) */}
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Website Navigation & Hero Preview (Dark Theme)
                  </span>
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                    Live Header
                  </span>
                </div>

                <div className="min-h-[120px] flex items-center justify-center p-3 bg-slate-900/80 rounded-xl border border-dashed border-slate-700">
                  <TechfixLogo 
                    variant="full" 
                    theme="dark" 
                    className="h-16 sm:h-20 max-w-full w-auto object-contain" 
                    showSlogan={true}
                    customLogoUrl={upiForm.logoUrl}
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  Top navigation header, hero banner aur website footer par yahi logo dikhega.
                </p>
              </div>
            </div>

            {/* Option to also paste an external Image URL */}
            <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-900/60 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="shrink-0 text-xs font-bold text-indigo-300">
                Or Paste Image Direct Web URL:
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="url"
                  placeholder="https://... (direct image link, Google Drive, Dropbox)"
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLogoUrlApply(logoUrlInput);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 bg-slate-900 border border-indigo-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  disabled={isVerifyingUrl}
                  onClick={() => handleLogoUrlApply(logoUrlInput)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isVerifyingUrl ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <span>Apply URL</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Column */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                Update UPI QR & Payment Facility
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure shop UPI ID, Payee Name, and QR Code URL displayed to customers during repair proposal checkout.
              </p>
            </div>

            <form onSubmit={handleSaveUpiAndShopDetails} className="space-y-5">
              
              {/* UPI ID Field */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-900">
                  Shop UPI Virtual Payment Address (UPI ID)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9864245987@paytm, techfix@ybl, etc."
                    value={upiForm.upiId}
                    onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-white border border-blue-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAutoGenerateQr}
                    className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Auto QR</span>
                  </button>
                </div>
                <p className="text-[11px] text-blue-700">
                  Customers can pay via Google Pay, PhonePe, Paytm, BHIM, or any UPI app using this ID.
                </p>
              </div>

              {/* Payee Name Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payee Account Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TECHFIX Goalpara"
                  value={upiForm.upiName}
                  onChange={(e) => setUpiForm({ ...upiForm, upiName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* QR Image URL Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  UPI QR Image URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={upiForm.upiQrImage}
                  onChange={(e) => setUpiForm({ ...upiForm, upiQrImage: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Click 'Auto QR' above to generate an instant dynamic UPI QR code, or paste your custom Google Pay / Paytm QR image URL here.
                </p>
              </div>

              <hr className="border-slate-100" />

              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Shop Business & Contact Info
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Name</label>
                  <input
                    type="text"
                    value={upiForm.name}
                    onChange={(e) => setUpiForm({ ...upiForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Tagline</label>
                  <input
                    type="text"
                    value={upiForm.tagline}
                    onChange={(e) => setUpiForm({ ...upiForm, tagline: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={upiForm.phone}
                    onChange={(e) => setUpiForm({ ...upiForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={upiForm.whatsapp}
                    onChange={(e) => setUpiForm({ ...upiForm, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Address</label>
                <input
                  type="text"
                  value={upiForm.address}
                  onChange={(e) => setUpiForm({ ...upiForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Hours</label>
                  <input
                    type="text"
                    value={upiForm.hours}
                    onChange={(e) => setUpiForm({ ...upiForm, hours: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Website Domain</label>
                  <input
                    type="text"
                    placeholder="sarate.wuaze.com"
                    value={upiForm.websiteDomain || 'sarate.wuaze.com'}
                    onChange={(e) => setUpiForm({ ...upiForm, websiteDomain: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-extrabold text-sky-800 mb-1 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-500" />
                    <span>Telegram Channel / Username</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. techfix_goalpara or https://t.me/techfix_goalpara"
                    value={upiForm.telegram || ''}
                    onChange={(e) => setUpiForm({ ...upiForm, telegram: e.target.value })}
                    className="w-full px-3.5 py-2 bg-sky-50/50 border border-sky-200 rounded-xl text-xs font-mono font-semibold text-sky-900 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-pink-800 mb-1 flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                    <span>Instagram Profile / Handle</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. techfix_goalpara or https://instagram.com/techfix_goalpara"
                    value={upiForm.instagram || ''}
                    onChange={(e) => setUpiForm({ ...upiForm, instagram: e.target.value })}
                    className="w-full px-3.5 py-2 bg-pink-50/50 border border-pink-200 rounded-xl text-xs font-mono font-semibold text-pink-900 focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save All Business & UPI Details</span>
              </button>
            </form>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" /> Live Customer QR Preview
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  ACTIVE
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl text-slate-900 text-center space-y-4 shadow-inner">
                <p className="text-xs font-black uppercase text-slate-500">
                  Scan to Pay / Advance Booking
                </p>

                {/* QR Code Graphic Container */}
                <div className="w-48 h-48 mx-auto p-2 bg-white rounded-xl border-2 border-slate-900 shadow-md flex items-center justify-center overflow-hidden">
                  <img
                    src={upiForm.upiQrImage}
                    alt="Shop UPI QR Code"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${encodeURIComponent(upiForm.upiId)}&pn=${encodeURIComponent(upiForm.upiName)}`;
                    }}
                  />
                </div>

                <div className="bg-slate-100 p-3 rounded-xl space-y-1">
                  <p className="text-[11px] text-slate-500 font-medium">UPI ID / VPA</p>
                  <p className="text-sm font-extrabold font-mono text-blue-700 tracking-wide select-all">
                    {upiForm.upiId || '9864245987@paytm'}
                  </p>
                  <p className="text-[11px] font-bold text-slate-800">
                    Payee: {upiForm.upiName || 'TECHFIX Goalpara'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-1 text-[11px] font-semibold text-slate-600">
                  <span className="px-2 py-1 bg-slate-100 rounded border">Google Pay</span>
                  <span className="px-2 py-1 bg-slate-100 rounded border">PhonePe</span>
                  <span className="px-2 py-1 bg-slate-100 rounded border">Paytm</span>
                </div>
              </div>

              {/* Social Channels Preview Card */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-2.5">
                <p className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" /> Active Shop Social Links
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <div className="p-2.5 rounded-xl bg-sky-950/60 border border-sky-800/80 text-sky-300 flex items-center gap-2">
                    <Send className="w-4 h-4 text-sky-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-[10px] text-sky-400 uppercase font-bold">Telegram</p>
                      <p className="font-mono text-white truncate">{upiForm.telegram || '@techfix_goalpara'}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-pink-950/60 border border-pink-800/80 text-pink-300 flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-[10px] text-pink-400 uppercase font-bold">Instagram</p>
                      <p className="font-mono text-white truncate">{upiForm.instagram || '@techfix_goalpara'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed text-center">
                This QR code and social handles automatically appear across all customer invoices, proposal receipts, and shop website footer.
              </p>
            </div>
          </div>

        </div>
        </div>
      )}

      {/* TAB 2: HERO BANNER & SPECIAL ANNOUNCEMENT EDITOR */}
      {adminTab === 'banner' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              Website Hero Banner & Special Offer Announcement Editor
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit the main hero banner text, announcement notice, and hero image displayed at the top of your shop website.
            </p>
          </div>

          <form onSubmit={handleSaveBanner} className="space-y-6">
            <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-900">
                Top Announcement & Special Offer Banner Text
              </label>
              <input
                type="text"
                required
                value={bannerForm.promoAnnouncement}
                onChange={(e) => setBannerForm({ ...bannerForm, promoAnnouncement: e.target.value })}
                placeholder="e.g. ⚡ SPECIAL OFFER: FREE Tempered Glass & Cover with Every Screen Replacement!"
                className="w-full px-4 py-2.5 bg-white border border-cyan-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-[11px] text-cyan-800">
                This notice flashes prominently at the top of the homepage for all visiting customers in Goalpara.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Location & Trust Badge Label
                </label>
                <input
                  type="text"
                  required
                  value={bannerForm.locationBadge}
                  onChange={(e) => setBannerForm({ ...bannerForm, locationBadge: e.target.value })}
                  placeholder="Goalpara's Most Trusted Care"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Main Headline Title
                </label>
                <input
                  type="text"
                  required
                  value={bannerForm.mainTitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, mainTitle: e.target.value })}
                  placeholder="Expert Smartphone & Laptop Repair"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            {/* Dedicated Proposal Section Technician Image Editor */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-slate-700 shadow-xl space-y-4 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-cyan-300 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>Proposal Section Photo Editor (Technician Mobile Repairing)</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Proposal aur homepage ke top section me technician repairing mobile photo yahan se direct edit aur change karsakte hain.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider self-start sm:self-auto">
                  Live on Proposal Page
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Image Live Preview */}
                <div className="md:col-span-5 space-y-2">
                  <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-cyan-400/40 shadow-lg bg-slate-950 group">
                    <img
                      src={bannerForm.heroImage || '/images/technician_mobile_repair.jpg'}
                      alt="Proposal Section Preview"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/technician_mobile_repair.jpg';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                      Live Preview
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>Aspect Ratio: 16:9 HD</span>
                    <button
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, heroImage: '/images/technician_mobile_repair.jpg' })}
                      className="text-cyan-300 hover:text-cyan-200 underline font-semibold"
                    >
                      Reset to Default Technician
                    </button>
                  </div>
                </div>

                {/* Upload & URL Controls */}
                <div className="md:col-span-7 space-y-3">
                  {/* File Upload Option */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Upload New Image from Device (Mobile / Computer):</span>
                      </span>
                      <span className="text-[10px] text-cyan-300">Direct Upload</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            if (event.target?.result) {
                              const compressed = await compressImageDataUrl(event.target.result as string, {
                                maxDim: 1100,
                                maxChars: 420000,
                                preserveAlpha: false
                              });
                              setBannerForm(prev => ({
                                ...prev,
                                heroImage: compressed
                              }));
                              showToast('✓ Technician photo ready! Click "Save" below to store in Firebase.');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 file:cursor-pointer bg-slate-950/60 p-1.5 rounded-xl border border-slate-700 cursor-pointer"
                    />
                  </div>

                  {/* Image URL Input Option */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      Or Paste Image URL:
                    </label>
                    <input
                      type="text"
                      required
                      value={bannerForm.heroImage}
                      onChange={(e) => setBannerForm({ ...bannerForm, heroImage: e.target.value })}
                      placeholder="/images/technician_mobile_repair.jpg or https://..."
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-cyan-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div>
                    <span className="block text-[11px] font-bold text-slate-300 mb-1.5">
                      Or Choose a Quick Preset:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBannerForm({ ...bannerForm, heroImage: '/images/technician_mobile_repair.jpg' });
                          showToast('Selected: Technician Repairing Mobile Photo');
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                          bannerForm.heroImage === '/images/technician_mobile_repair.jpg'
                            ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-extrabold'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>Microscope Repair Lab</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBannerForm({ ...bannerForm, heroImage: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80' });
                          showToast('Selected: Microscope IC Workbench Photo');
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                          bannerForm.heroImage?.includes('1581092335397')
                            ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-extrabold'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        <Cpu className="w-3 h-3 text-indigo-400" />
                        <span>IC Soldering Workbench</span>
                      </button>
                    </div>
                  </div>

                  {/* Technician Contact Details (Mera Naam & Technician Ka Phone) */}
                  <div className="pt-3 border-t border-slate-700/80 space-y-3">
                    <p className="text-xs font-black uppercase text-cyan-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Technician Profile & Direct Phone Number:</span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Technician Name (Mera Naam):
                        </label>
                        <input
                          type="text"
                          value={bannerForm.technicianName || 'Toibur Rahman'}
                          onChange={(e) => setBannerForm({ ...bannerForm, technicianName: e.target.value })}
                          placeholder="Toibur Rahman"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-emerald-400 mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>Technician Ka Phone Number:</span>
                        </label>
                        <input
                          type="text"
                          value={bannerForm.technicianPhone || '+91 98642 45987'}
                          onChange={(e) => setBannerForm({ ...bannerForm, technicianPhone: e.target.value })}
                          placeholder="+91 98642 45987"
                          className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Technician Specialization / Role:
                      </label>
                      <input
                        type="text"
                        value={bannerForm.technicianRole || 'Master Mobile Technician & Founder'}
                        onChange={(e) => setBannerForm({ ...bannerForm, technicianRole: e.target.value })}
                        placeholder="Master Mobile Technician & Founder"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Service Promise Sub-Heading Description
              </label>
              <textarea
                rows={3}
                required
                value={bannerForm.servicePromise}
                onChange={(e) => setBannerForm({ ...bannerForm, servicePromise: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Action Button Label
                </label>
                <input
                  type="text"
                  required
                  value={bannerForm.primaryButtonText}
                  onChange={(e) => setBannerForm({ ...bannerForm, primaryButtonText: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Secondary Action Button Label
                </label>
                <input
                  type="text"
                  required
                  value={bannerForm.secondaryButtonText}
                  onChange={(e) => setBannerForm({ ...bannerForm, secondaryButtonText: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Website Banner & Announcement Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SHOP PHOTOS GALLERY MANAGER */}
      {adminTab === 'photos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                Shop Photos & Showroom Gallery Manager
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload and edit photo gallery items showing your shop front, reception, work bench, and customer lounge in Goalpara.
              </p>
            </div>

            <button
              onClick={handleOpenAddPhoto}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Shop Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shopPhotos.map((photo) => (
              <div key={photo.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img src={photo.image} alt={photo.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                      {photo.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="text-sm font-extrabold text-slate-900">{photo.title}</h3>
                    <p className="text-xs text-slate-600">{photo.description}</p>
                    {photo.highlights && photo.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {photo.highlights.map((h, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold border border-indigo-100">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditPhoto(photo)}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-blue-600 transition"
                    title="Edit Photo Details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePhoto(photo.id, photo.title)}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 transition"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SHOP LOGO (MANUAL UPLOAD & LIVE PREVIEWS) */}
      {adminTab === 'logo' && (
        <div className="space-y-8">
          {/* Main Logo Upload Banner Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-indigo-900/50 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-900/60 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/30">
                    Brand Identity Studio
                  </span>
                  {upiForm.logoUrl ? (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Custom Logo Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                      Default Vector Logo
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 mt-2">
                  <Upload className="w-6 h-6 text-amber-400" />
                  <span>Shop Official Logo (Manual Upload Studio)</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Apne phone ya computer se direct apna shop logo upload karein (PNG / JPG / WEBP / SVG). Transparent background wala PNG logo sabse accha dikhta hai. Yeh logo poori Website par turant set ho jata hai.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <label 
                  htmlFor="studio-logo-file-input"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 transition cursor-pointer select-none active:scale-95"
                >
                  <input
                    id="studio-logo-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessLogoFile(file);
                      e.target.value = '';
                    }}
                    className="sr-only"
                  />
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingLogo ? 'Processing Logo...' : 'Choose Logo File from Device'}</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsManualLogoModalOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 font-extrabold text-xs shadow-lg flex items-center gap-2 transition cursor-pointer select-none active:scale-95"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Open Manual Logo Modal (Live Studio)</span>
                </button>

                {upiForm.logoUrl && (
                  <button
                    type="button"
                    onClick={handleResetToDefaultLogo}
                    className="px-4 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition flex items-center gap-1.5"
                    title="Custom logo delete karke default vector logo restore karein"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset to Default Logo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Direct URL Input Option */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-indigo-900/40 space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Or Paste Image Direct Link (URL):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://... (direct image link, Google Drive, Dropbox)"
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLogoUrlApply(logoUrlInput);
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-indigo-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  disabled={isVerifyingUrl}
                  onClick={() => handleLogoUrlApply(logoUrlInput)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isVerifyingUrl ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <span>Apply URL</span>
                  )}
                </button>
              </div>
            </div>

            {/* Live Dual Preview Grid: Light Background vs Dark Background */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* 1. Light Theme Brand Card Preview */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 text-slate-900 space-y-3 shadow-md flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> Official Store Header & Brand Preview (Light Mode)
                    </span>
                    <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                      High Resolution
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <TechfixLogo 
                            variant="full" 
                            theme="light" 
                            className="h-10 sm:h-12 md:h-14 max-h-14 max-w-[190px] sm:max-w-[220px] w-auto object-contain shrink-0" 
                            showSlogan={true} 
                            customLogoUrl={upiForm.logoUrl}
                          />
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                          <p className="font-semibold text-slate-700">{businessDetails.address}</p>
                          <p className="text-blue-700 font-mono font-bold">
                            Website: {businessDetails.websiteDomain || 'sarate.wuaze.com'}
                          </p>
                          <p>Ph/WhatsApp: {businessDetails.phone} / {businessDetails.whatsapp}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>Yeh logo website header, mobile drawer aur cards par clean dikhega.</span>
                </div>
              </div>

              {/* 2. Website Navigation & Hero Preview (Dark Theme) */}
              <div className="lg:col-span-4 bg-slate-950 rounded-2xl p-5 border border-slate-800 text-white space-y-4 shadow-md flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" /> Website Theme (Dark)
                    </span>
                    <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                      Live
                    </span>
                  </div>

                  <div className="min-h-[140px] flex items-center justify-center p-3 bg-slate-900/80 rounded-xl border border-dashed border-slate-700">
                    <TechfixLogo 
                      variant="full" 
                      theme="dark" 
                      className="h-16 sm:h-20 max-w-full w-auto object-contain" 
                      showSlogan={true}
                      customLogoUrl={upiForm.logoUrl}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    Top navigation header, hero banner aur website footer par yahi logo dikhega.
                  </p>
                </div>

                {/* 3. Thermal Receipt Preview */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-amber-400" /> 3-Inch Thermal POS Slip View:
                  </span>
                  <div className="p-3 bg-white text-slate-900 rounded-xl border border-slate-300 text-center">
                    <TechfixLogo 
                      variant={upiForm.logoUrl ? "full" : "mark"} 
                      theme="light" 
                      className="max-h-12 max-w-[140px] w-auto mx-auto object-contain pb-1" 
                      customLogoUrl={upiForm.logoUrl} 
                    />
                    <p className="text-[10px] font-black uppercase tracking-tight">{businessDetails.shopName}</p>
                    <p className="text-[9px] text-slate-500">Ph: {businessDetails.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {adminTab === 'phones' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-600" />
                Pre-Owned & Second-Hand Smartphone Inventory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add, edit, or remove pre-owned smartphones listed for sale at your Goalpara shop.
              </p>
            </div>

            <button
              onClick={handleOpenAddPhone}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Second-Hand Mobile</span>
            </button>
          </div>

          {/* Phone Stock Table / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {preOwnedPhones.map((phone) => (
              <div 
                key={phone.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img 
                      src={phone.image} 
                      alt={`${phone.brand} ${phone.model}`}
                      className="w-full h-full object-cover"
                    />
                    <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${
                      phone.inStock ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {phone.inStock ? 'IN STOCK' : 'SOLD OUT'}
                    </span>

                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                      {phone.condition}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">
                          {phone.brand}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {phone.model}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {phone.storage} RAM {phone.ram} • {phone.color}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900 font-mono">
                          ₹{phone.price.toLocaleString('en-IN')}
                        </p>
                        {phone.originalPrice && (
                          <p className="text-[10px] text-slate-400 line-through font-mono">
                            ₹{phone.originalPrice.toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      🛡️ {phone.warranty}
                    </p>
                  </div>
                </div>

                {/* Card Control Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTogglePhoneStock(phone)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      phone.inStock 
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {phone.inStock ? 'Mark Sold Out' : 'Mark In Stock'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditPhone(phone)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-blue-600 transition"
                      title="Edit Mobile Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePhone(phone.id, `${phone.brand} ${phone.model}`)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 transition"
                      title="Delete Mobile from Inventory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 3: ACCESSORIES & SPARE PARTS CONTROL */}
      {adminTab === 'accessories' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                Mobile Accessories & Spare Parts Catalog
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage AMOLED screens, batteries, fast chargers, earphones, and protection accessories.
              </p>
            </div>

            <button
              onClick={handleOpenAddAcc}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Accessory / Part</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessories.map((acc) => (
              <div 
                key={acc.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img 
                      src={acc.image} 
                      alt={acc.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                      {acc.category}
                    </span>

                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${
                      acc.inStock ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {acc.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">
                        {acc.name}
                      </h3>
                      <p className="text-base font-black text-emerald-700 font-mono shrink-0">
                        ₹{acc.price}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {acc.description}
                    </p>

                    <p className="text-[11px] text-slate-500 font-medium">
                      Compatible: <span className="text-slate-800 font-bold">{acc.compatibleModels}</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleAccStock(acc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      acc.inStock 
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {acc.inStock ? 'Set Out of Stock' : 'Set In Stock'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditAcc(acc)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-blue-600 transition"
                      title="Edit Accessory"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAcc(acc.id, acc.name)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 transition"
                      title="Delete Accessory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 4: SHOP OVERVIEW STATS & MONTHLY REVENUE GROWTH TREND */}
      {adminTab === 'overview' && (
        <div className="space-y-8">
          {/* Overview Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-2">
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Active Repair Proposals</p>
              <p className="text-3xl font-black font-mono">{proposals.length}</p>
              <p className="text-xs text-slate-400">Total client quotes generated in system</p>
            </div>

            <div className="p-6 rounded-3xl bg-purple-950 text-white border border-purple-900 shadow-md space-y-2">
              <p className="text-xs font-bold text-purple-300 uppercase tracking-widest">Second-Hand Mobiles</p>
              <p className="text-3xl font-black font-mono">{preOwnedPhones.length}</p>
              <p className="text-xs text-purple-300">
                {preOwnedPhones.filter(p => p.inStock).length} Available for purchase in Goalpara shop
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-amber-950 text-white border border-amber-900 shadow-md space-y-2">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-widest">Accessories Catalog</p>
              <p className="text-3xl font-black font-mono">{accessories.length}</p>
              <p className="text-xs text-amber-300">
                {accessories.filter(a => a.inStock).length} In-stock repair parts & accessories
              </p>
            </div>
          </div>

          {/* Exclusive Admin Monthly Shop Revenue & Growth Trend Analytics */}
          <div className="pt-2">
            <RevenueChart proposals={proposals} />
          </div>
        </div>
      )}

      {/* TAB 5: REPAIR PROPOSALS & PRINTABLE INVOICES */}
      {adminTab === 'proposals' && (
        <div className="space-y-6">
          {selectedAdminProposal ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedAdminProposal(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Admin Proposals List</span>
              </button>

              <ProposalDetailView
                proposal={selectedAdminProposal}
                onUpdateProposal={(updated) => {
                  setSelectedAdminProposal(updated);
                  if (onUpdateProposal) {
                    onUpdateProposal(updated);
                  }
                  showToast(`Proposal ${updated.proposalNumber} updated.`);
                }}
                onBack={() => setSelectedAdminProposal(null)}
                businessDetails={businessDetails}
                isAdmin={true}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Printer className="w-5 h-5 text-emerald-600" />
                    Admin Repair Proposals & PDF Invoice Generator
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select any client proposal ticket to view, update status, and generate repair proposals.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Total Quotes: {proposals.length}
                  </span>
                </div>
              </div>

              {/* Search & Status Filters */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
                  {['All', 'Proposal Sent', 'Approved', 'In Progress', 'Ready for Pickup', 'Completed'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setAdminProposalStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        adminProposalStatusFilter === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Client Name, Ticket # or Model..."
                    value={adminProposalSearch}
                    onChange={(e) => setAdminProposalSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Proposals Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {proposals
                  .filter((p) => {
                    const matchesSearch =
                      p.clientName.toLowerCase().includes(adminProposalSearch.toLowerCase()) ||
                      p.proposalNumber.toLowerCase().includes(adminProposalSearch.toLowerCase()) ||
                      p.deviceBrand.toLowerCase().includes(adminProposalSearch.toLowerCase()) ||
                      p.deviceModel.toLowerCase().includes(adminProposalSearch.toLowerCase());
                    const matchesStatus =
                      adminProposalStatusFilter === 'All' || p.status === adminProposalStatusFilter;
                    return matchesSearch && matchesStatus;
                  })
                  .map((proposal) => (
                    <div
                      key={proposal.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                              {proposal.proposalNumber}
                            </span>
                            <p className="text-sm font-extrabold text-slate-900 mt-1.5">
                              {proposal.clientName}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">{proposal.clientPhone}</p>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                              proposal.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : proposal.status === 'In Progress'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : proposal.status === 'Ready for Pickup'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {proposal.status}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                          <p className="font-bold text-slate-800">
                            {proposal.deviceBrand} {proposal.deviceModel}
                          </p>
                          <p className="text-slate-500 line-clamp-1">{proposal.problemDescription}</p>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>Created: {proposal.createdAt}</span>
                            <span className="font-bold text-emerald-600 font-mono">₹{proposal.finalPrice}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                        {proposal.status === 'Completed' ? (
                          <span className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5 border border-emerald-200 shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              const updatedProposal: RepairProposal = {
                                ...proposal,
                                status: 'Completed',
                                timelineEvents: proposal.timelineEvents.map(evt => ({ ...evt, completed: true }))
                              };
                              onUpdateProposal(updatedProposal);
                              showToast(`Proposal ${proposal.proposalNumber} marked as COMPLETED!`);
                            }}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                            title="Mark repair as Completed"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                            <span>Mark Complete</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedAdminProposal(proposal)}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>View Invoice</span>
                        </button>

                        <button
                          onClick={() => setSelectedAdminProposal(proposal)}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center border border-slate-200"
                          title="Print Proposal Ticket"
                        >
                          <Printer className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 9: SECTION THEMES CONFIGURATOR */}
      {adminTab === 'themes' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black mb-2">
                <Palette className="w-4 h-4 text-rose-600" />
                <span>DYNAMIC COLOR THEME CONTROL PANEL</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Custom Color Themes for Every Section
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Customize gradients, badges, and accent styling for all 10 major shop sections. Changes update instantly for all visitors.
              </p>
            </div>

            <button
              onClick={() => {
                if (onUpdateSectionThemes) {
                  onUpdateSectionThemes(INITIAL_SECTION_THEMES);
                  showToast('Reset all section themes to default colors!');
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition shrink-0"
            >
              Reset Default Themes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'proposals', label: '1. Proposals & Estimates' },
              { key: 'repairForm', label: '2. Book Mobile Repair' },
              { key: 'phones', label: '3. Second-Hand Mobiles' },
              { key: 'sellPhone', label: '4. Sell Old Phone' },
              { key: 'accessories', label: '5. Accessories' },
              { key: 'tracker', label: '6. Live Tracker' },
              { key: 'aistudio', label: '7. AI Repair Studio' },
              { key: 'services', label: '8. Services Catalog' },
              { key: 'photos', label: '9. Shop Photos' },
              { key: 'feedback', label: '10. Customer Reviews' }
            ].map(({ key, label }) => {
              const theme = sectionThemes[key as keyof SectionThemesMap] || INITIAL_SECTION_THEMES[key as keyof SectionThemesMap];

              const presetOptions = [
                { name: 'Deep Blue Sapphire', bg: 'from-slate-950 via-blue-950 to-indigo-950', accent: 'blue', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', border: 'border-blue-900/40' },
                { name: 'Neon Purple Amethyst', bg: 'from-slate-950 via-purple-950 to-violet-950', accent: 'purple', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', border: 'border-purple-900/40' },
                { name: 'Emerald Mint', bg: 'from-slate-950 via-emerald-950 to-teal-950', accent: 'emerald', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', border: 'border-emerald-900/40' },
                { name: 'Gold Cash Green', bg: 'from-slate-950 via-green-950 to-emerald-950', accent: 'green', badge: 'bg-green-500/20 text-green-300 border-green-500/30', border: 'border-green-900/40' },
                { name: 'Warm Amber Topaz', bg: 'from-slate-950 via-amber-950 to-yellow-950', accent: 'amber', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', border: 'border-amber-900/40' },
                { name: 'Cyber Cyan Laser', bg: 'from-slate-950 via-cyan-950 to-blue-950', accent: 'cyan', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', border: 'border-cyan-900/40' },
                { name: 'Galactic Fuchsia AI', bg: 'from-slate-950 via-fuchsia-950 to-purple-950', accent: 'fuchsia', badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30', border: 'border-fuchsia-900/40' },
                { name: 'Royal Indigo Slate', bg: 'from-slate-950 via-indigo-950 to-slate-950', accent: 'indigo', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', border: 'border-indigo-900/40' },
                { name: 'Ocean Sky Blue', bg: 'from-slate-950 via-sky-950 to-cyan-950', accent: 'sky', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30', border: 'border-sky-900/40' },
                { name: 'Velvet Rose Ruby', bg: 'from-slate-950 via-rose-950 to-pink-950', accent: 'rose', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', border: 'border-rose-900/40' }
              ];

              return (
                <div key={key} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-black tracking-wider text-slate-400">Section Color Theme</span>
                      <h3 className="text-base font-extrabold text-slate-900">{label}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black border ${theme.headerBadgeBg}`}>
                      {theme.themeName}
                    </span>
                  </div>

                  {/* Theme Gradient Preview Box */}
                  <div className={`p-4 rounded-2xl bg-gradient-to-r ${theme.gradientBg} text-white border ${theme.cardBorderColor} space-y-2`}>
                    <p className="text-xs font-bold text-slate-300">Live Header Banner Preview:</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-extrabold uppercase tracking-wide">{theme.themeName} • Active Styling</span>
                    </div>
                  </div>

                  {/* Preset Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Select Theme Preset:</label>
                    <select
                      value={theme.themeName}
                      onChange={(e) => {
                        const selectedPreset = presetOptions.find(p => p.name === e.target.value);
                        if (selectedPreset && onUpdateSectionThemes) {
                          const updated = {
                            ...sectionThemes,
                            [key]: {
                              themeName: selectedPreset.name,
                              gradientBg: selectedPreset.bg,
                              accentColor: selectedPreset.accent,
                              headerBadgeBg: selectedPreset.badge,
                              cardBorderColor: selectedPreset.border
                            }
                          };
                          onUpdateSectionThemes(updated);
                          showToast(`Updated theme for ${label} to ${selectedPreset.name}!`);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {presetOptions.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 10: FIREBASE LIVE ACTIVITY LOGS (EVERY EDIT & ACTION TRACKED) */}
      {adminTab === 'activityLogs' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950/60 to-slate-900 p-6 sm:p-8 rounded-3xl border border-emerald-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black mb-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>REAL-TIME CLOUD FIRESTORE AUDIT TRAIL</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Firebase Live Activity Logs ({activityLogs.length})
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Har ek edit, logo update, invoice save/print, repair booking, sell quote, aur shop change permanently Firebase Firestore me save ho raha hai.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={activityCategoryFilter}
                onChange={(e) => setActivityCategoryFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs font-bold text-emerald-300 focus:outline-none"
              >
                <option value="ALL">All Categories ({activityLogs.length})</option>
                <option value="LOGO">Logo Updates</option>
                <option value="INVOICE">Invoices & Banners</option>
                <option value="BUSINESS_DETAILS">Shop & UPI Settings</option>
                <option value="HERO_BANNER">Hero Banner</option>
                <option value="REPAIR_REQUEST">Repair Bookings</option>
                <option value="PROPOSAL">Proposals & Quotes</option>
                <option value="SELL_REQUEST">Old Phone Sell Requests</option>
                <option value="PHONE_STOCK">Second-Hand Mobiles</option>
                <option value="ACCESSORY">Accessories</option>
                <option value="SHOP_PHOTO">Shop Photos</option>
                <option value="THEME">Themes</option>
                <option value="REVIEW">Reviews</option>
                <option value="AUTH">Auth & Logins</option>
                <option value="ADMIN">Admin Security</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {activityLogs.filter(l => activityCategoryFilter === 'ALL' || l.category === activityCategoryFilter).length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Activity className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Firebase activities recorded yet in this filter.</p>
                <p className="text-xs text-slate-500">Any edit, logo change, repair update, or invoice save will appear here live.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activityLogs
                  .filter(l => activityCategoryFilter === 'ALL' || l.category === activityCategoryFilter)
                  .map((log) => (
                    <div key={log.id} className="p-4 sm:px-6 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                            {log.category}
                          </span>
                          <span className="text-sm font-extrabold text-slate-900">{log.action}</span>
                        </div>
                        <p className="text-xs text-slate-600">{log.details}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          By: <span className="text-slate-700 font-bold">{log.actorName || 'Admin'}</span> ({log.actorEmail || 'system'})
                        </p>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 shrink-0 sm:text-right">
                        {new Date(log.timestamp || Date.now()).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT SECOND-HAND PHONE */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-600" />
                {editingPhone ? 'Edit Second-Hand Mobile' : 'Add Second-Hand Mobile'}
              </h3>
              <button
                onClick={() => setIsPhoneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="Samsung, Apple, Xiaomi, etc."
                    value={phoneForm.brand}
                    onChange={(e) => setPhoneForm({ ...phoneForm, brand: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Galaxy A52s, iPhone 12, etc."
                    value={phoneForm.model}
                    onChange={(e) => setPhoneForm({ ...phoneForm, model: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Condition</label>
                  <select
                    value={phoneForm.condition}
                    onChange={(e) => setPhoneForm({ ...phoneForm, condition: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="Like New (10/10)">Like New (10/10)</option>
                    <option value="Excellent (9/10)">Excellent (9/10)</option>
                    <option value="Very Good (8/10)">Very Good (8/10)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Color</label>
                  <input
                    type="text"
                    required
                    placeholder="Black, Mint, Blue"
                    value={phoneForm.color}
                    onChange={(e) => setPhoneForm({ ...phoneForm, color: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Storage</label>
                  <input
                    type="text"
                    required
                    placeholder="128 GB"
                    value={phoneForm.storage}
                    onChange={(e) => setPhoneForm({ ...phoneForm, storage: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RAM</label>
                  <input
                    type="text"
                    required
                    placeholder="6 GB / 8 GB"
                    value={phoneForm.ram}
                    onChange={(e) => setPhoneForm({ ...phoneForm, ram: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={phoneForm.price === 0 ? '' : phoneForm.price}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPhoneForm({ ...phoneForm, price: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MRP Original Price (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={phoneForm.originalPrice === 0 ? '' : (phoneForm.originalPrice || '')}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPhoneForm({ ...phoneForm, originalPrice: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Multi-Photo Side View URLs */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Phone Side Photos (Alag Alag Side View)</span>
                  <span className="text-[10px] text-purple-600 font-bold">Front, Back, Side & Camera Views</span>
                </label>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">1. Front View / Screen Image URL (Main)</label>
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/photo-..."
                      value={phoneForm.images?.[0] || phoneForm.image}
                      onChange={(e) => {
                        const val = e.target.value;
                        const currImages = phoneForm.images && phoneForm.images.length > 0 ? [...phoneForm.images] : [phoneForm.image];
                        currImages[0] = val;
                        setPhoneForm({ ...phoneForm, image: val, images: currImages });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">2. Back Body View Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={phoneForm.images?.[1] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const currImages = phoneForm.images && phoneForm.images.length > 0 ? [...phoneForm.images] : [phoneForm.image];
                        currImages[1] = val;
                        setPhoneForm({ ...phoneForm, images: currImages });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">3. Side Edge / Frame View Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={phoneForm.images?.[2] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const currImages = phoneForm.images && phoneForm.images.length > 0 ? [...phoneForm.images] : [phoneForm.image];
                        currImages[2] = val;
                        setPhoneForm({ ...phoneForm, images: currImages });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">4. Camera & Display Close-up Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={phoneForm.images?.[3] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const currImages = phoneForm.images && phoneForm.images.length > 0 ? [...phoneForm.images] : [phoneForm.image];
                        currImages[3] = val;
                        setPhoneForm({ ...phoneForm, images: currImages });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shop Warranty Text</label>
                <input
                  type="text"
                  required
                  value={phoneForm.warranty}
                  onChange={(e) => setPhoneForm({ ...phoneForm, warranty: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="phoneInStock"
                  checked={phoneForm.inStock}
                  onChange={(e) => setPhoneForm({ ...phoneForm, inStock: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300"
                />
                <label htmlFor="phoneInStock" className="text-xs font-bold text-slate-800">
                  Phone Available in Goalpara Shop Stock
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-md"
                >
                  Save Second-Hand Mobile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT ACCESSORY */}
      {isAccModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                {editingAcc ? 'Edit Accessory / Part' : 'Add New Accessory / Part'}
              </h3>
              <button
                onClick={() => setIsAccModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAcc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Original AMOLED Display (Samsung M31)"
                  value={accForm.name}
                  onChange={(e) => setAccForm({ ...accForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={accForm.category}
                    onChange={(e) => setAccForm({ ...accForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="Display">Display</option>
                    <option value="Battery">Battery</option>
                    <option value="Charger/Cable">Charger/Cable</option>
                    <option value="Audio">Audio</option>
                    <option value="Protection">Protection</option>
                    <option value="Component">Component</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={accForm.price === 0 ? '' : accForm.price}
                    onChange={(e) => setAccForm({ ...accForm, price: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Compatible Models</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samsung M31, F41 / Universal"
                  value={accForm.compatibleModels}
                  onChange={(e) => setAccForm({ ...accForm, compatibleModels: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={accForm.description}
                  onChange={(e) => setAccForm({ ...accForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={accForm.image}
                  onChange={(e) => setAccForm({ ...accForm, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="accInStock"
                  checked={accForm.inStock}
                  onChange={(e) => setAccForm({ ...accForm, inStock: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300"
                />
                <label htmlFor="accInStock" className="text-xs font-bold text-slate-800">
                  Item Currently In Stock at Shop
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAccModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shadow-md"
                >
                  Save Accessory Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SHOP PHOTO */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <span>{editingPhoto ? 'Edit Shop Gallery Photo' : 'Add New Shop Gallery Photo'}</span>
              </h3>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Photo Title / Area Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reception Desk & Customer Lounge"
                  value={photoForm.title}
                  onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={photoForm.category}
                    onChange={(e) => setPhotoForm({ ...photoForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="Showroom Interior">Showroom Interior</option>
                    <option value="Repair Bench">Repair Bench & Micro-soldering</option>
                    <option value="Storefront Exterior">Storefront Exterior</option>
                    <option value="Accessories Counter">Accessories Counter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    required
                    value={photoForm.image}
                    onChange={(e) => setPhotoForm({ ...photoForm, image: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  required
                  value={photoForm.description}
                  onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Highlights (comma-separated)</label>
                <input
                  type="text"
                  placeholder="AC Waiting Lounge, Fast Token System, Transparent Price"
                  value={photoForm.highlights}
                  onChange={(e) => setPhotoForm({ ...photoForm, highlights: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md"
                >
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CHANGE ADMIN PASSWORD */}
      {isChangePinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-600" />
                <span>Change Admin Password</span>
              </h3>
              <button
                onClick={() => setIsChangePinModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password / PIN
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 44108355"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono font-bold text-slate-900 text-lg focus:ring-2 focus:ring-blue-500 tracking-wider"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Current active password: <span className="font-mono font-bold text-slate-800">{adminPin}</span>
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePinModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL LOGO UPLOADER & CHANGER */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-auto text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  Shop Identity Manager
                </span>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-1">
                  <Upload className="w-5 h-5 text-amber-600" />
                  <span>Upload / Change Shop Logo</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Active Logo Preview with Drag and Drop Support */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Current Active Logo Preview:
                </label>
                {upiForm.logoUrl && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Custom Logo Set
                  </span>
                )}
              </div>

              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                onDragLeave={() => setIsDraggingLogo(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingLogo(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleProcessLogoFile(file);
                }}
                className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center min-h-[120px] transition-all ${
                  isDraggingLogo 
                    ? 'border-amber-500 bg-amber-50/80 scale-[1.01]' 
                    : 'border-slate-300 bg-slate-50'
                }`}
              >
                <TechfixLogo 
                  variant="full" 
                  theme="light" 
                  className="h-16 sm:h-20 max-w-full w-auto object-contain" 
                  showSlogan={true}
                  customLogoUrl={upiForm.logoUrl}
                />
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  {isDraggingLogo ? 'Drop your logo image here!' : 'Aap image drag-and-drop ya niche button se upload kar sakte hain.'}
                </p>
              </div>

              <p className="text-[11px] text-slate-500">
                Yeh logo website (Navbar, Hero, Footer) par automatic show hoga.
              </p>
            </div>

            {/* Native Accessible File Upload Button (Works reliably on Android, iOS & Desktop) */}
            <div className="space-y-3">
              <label 
                htmlFor="modal-logo-file-input"
                className={`w-full py-4 px-5 rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-2.5 transition cursor-pointer select-none active:scale-[0.98] ${
                  isUploadingLogo
                    ? 'bg-amber-300 text-slate-800 cursor-wait animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20'
                }`}
              >
                <input
                  id="modal-logo-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleProcessLogoFile(file);
                    }
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
                {isUploadingLogo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                    <span>Processing & Applying Logo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-slate-950" />
                    <span>Upload Logo File from Mobile / Computer</span>
                  </>
                )}
              </label>

              {/* Status Feedback */}
              {logoUploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Naya Logo set ho gaya hai! Website par lag gaya.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogoModalOpen(false);
                      setLogoUploadSuccess(false);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold uppercase shadow-sm shrink-0"
                  >
                    Done / Close
                  </button>
                </div>
              )}

              {logoUploadError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{logoUploadError}</span>
                </div>
              )}
            </div>

            {/* Or Paste Direct URL */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                Or Paste Image Direct Link (URL):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://... (Direct image link, Google Drive, Dropbox, etc.)"
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLogoUrlApply(logoUrlInput);
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  disabled={isVerifyingUrl}
                  onClick={() => handleLogoUrlApply(logoUrlInput)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isVerifyingUrl ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <span>Apply Link</span>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Tip: Google Drive, Dropbox ya web image link paste karke <strong>Apply Link</strong> dabayein.
              </p>
            </div>

            {/* Reset Button */}
            {upiForm.logoUrl && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleResetToDefaultLogo();
                    setIsLogoModalOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Custom Logo (Restore Default Design)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Logo Manager Modal (Under Admin Control Panel) */}
      <ManualLogoModal
        isOpen={isManualLogoModalOpen}
        onClose={() => setIsManualLogoModalOpen(false)}
        currentLogoUrl={upiForm.logoUrl}
        onLogoUpdated={handleLogoUpdatedFromModal}
      />

      {/* Official Repair Service Receipt / Invoice Modal */}
      <RepairServiceInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        request={selectedRequestForInvoice}
        businessDetails={businessDetails}
        onUpdateBusinessDetails={onUpdateBusinessDetails}
      />

    </div>
  );
};
