import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProposalBuilder } from './components/ProposalBuilder';
import { ProposalDetailView } from './components/ProposalDetailView';
import { TimelineTracker } from './components/TimelineTracker';
import { ServicesCatalog } from './components/ServicesCatalog';
import { AccessoriesCatalog } from './components/AccessoriesCatalog';
import { PreOwnedPhones } from './components/PreOwnedPhones';
import { ShopPhotos } from './components/ShopPhotos';
import { AiRepairStudio } from './components/AiRepairStudio';
import { FeedbackHub } from './components/FeedbackHub';
import { ShopInfoFooter } from './components/ShopInfoFooter';
import { AdminControlPanel } from './components/AdminControlPanel';
import { RepairRequestForm } from './components/RepairRequestForm';
import { SellOldPhoneForm } from './components/SellOldPhoneForm';
import { CustomerAuthModal, CustomerUser } from './components/CustomerAuthModal';
import { MandatoryLoginGate } from './components/MandatoryLoginGate';
import { 
  subscribeToAuthChanges, 
  logoutFirebase, 
  saveReviewToFirestore, 
  subscribeToReviews, 
  subscribeToRepairRequests, 
  subscribeToOldPhoneSellRequests,
  subscribeToProposals,
  saveProposalToFirestore,
  saveRepairRequestToFirestore,
  saveOldPhoneSellRequestToFirestore,
  fetchServerRepairRequests,
  fetchServerProposals,
  fetchShopLogoFromFirestore,
  subscribeToShopLogo,
  saveShopLogoToFirestore,
  saveBusinessDetailsToFirestore,
  subscribeToBusinessDetails,
  saveBannerConfigToFirestore,
  subscribeToBannerConfig,
  saveSectionThemesToFirestore,
  subscribeToSectionThemes,
  syncPreOwnedPhonesToFirestore,
  subscribeToPreOwnedPhones,
  syncAccessoriesToFirestore,
  subscribeToAccessories,
  syncShopPhotosToFirestore,
  subscribeToShopPhotos,
  logActivityToFirestore,
  isDurableImageValue
} from './lib/firebase';
import { processUserLoginProfile, OWNER_EMAIL } from './lib/authUtils';
import { getLogoFromDb, saveLogoToDb } from './utils/logoStorage';
import { MobileBottomNav } from './components/MobileBottomNav';

import { INITIAL_PROPOSALS, BUSINESS_DETAILS, PRE_OWNED_PHONES, ACCESSORIES_CATALOG, INITIAL_BANNER_CONFIG, INITIAL_SHOP_PHOTOS, INITIAL_REPAIR_REQUESTS, INITIAL_SELL_REQUESTS, INITIAL_SECTION_THEMES } from './data/initialData';
import { RepairProposal, ClientFeedback, ShopBusinessDetails, PreOwnedPhone, AccessoryItem, BannerConfig, ShopPhotoItem, CustomerRepairRequest, OldPhoneSellRequest, SectionThemesMap } from './types';

import { 
  FileText, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  MoreVertical,
  Phone,
  MessageCircle,
  Printer,
  Share2,
  Sparkles,
  X
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('proposals');
  const [proposals, setProposals] = useState<RepairProposal[]>(() => {
    const saved = localStorage.getItem('techfix_proposals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_PROPOSALS;
  });
  const [selectedProposal, setSelectedProposal] = useState<RepairProposal | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Customer Account Session State
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(() => {
    const saved = localStorage.getItem('techfix_customer_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalTab, setCustomerModalTab] = useState<'bookings' | 'sell' | 'account'>('bookings');

  const handleOpenCustomerModal = (tab: 'bookings' | 'sell' | 'account' = 'bookings') => {
    setCustomerModalTab(tab);
    setIsCustomerModalOpen(true);
  };

  // Auto-redirect away from admin tab if user is not logged in as owner
  useEffect(() => {
    const isOwner = customerUser && (
      customerUser.email?.toLowerCase().trim() === OWNER_EMAIL.toLowerCase() ||
      customerUser.role === 'ADMIN'
    );
    if (activeTab === 'admin' && !isOwner) {
      setActiveTab('proposals');
    }
  }, [activeTab, customerUser]);

  const handleCustomerLogin = (user: CustomerUser) => {
    setCustomerUser(user);
    localStorage.setItem('techfix_customer_user', JSON.stringify(user));
  };

  const handleQuickOwnerLogin = () => {
    const ownerProfile: CustomerUser = {
      uid: 'owner-ratoibur11-uid',
      email: OWNER_EMAIL,
      displayName: 'Administrator (TECHFIX Goalpara)',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      role: 'ADMIN',
      isFirstLogin: false,
      lastLoginAt: new Date().toISOString()
    };
    handleCustomerLogin(ownerProfile);
    localStorage.setItem('techfix_is_admin', 'true');
    localStorage.setItem('techfix_admin_email', OWNER_EMAIL);
    logActivityToFirestore('Owner Admin Access Unlocked', 'AUTH', `Unlocked admin control panel (${OWNER_EMAIL})`).catch(() => {});
    setActiveTab('admin');
  };

  const handleCustomerLogout = async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      console.warn('Firebase logout note:', e);
    }
    setCustomerUser(null);
    localStorage.removeItem('techfix_customer_user');
    localStorage.removeItem('techfix_user_profile');
    localStorage.removeItem('techfix_is_admin');
    localStorage.removeItem('techfix_admin_email');
    if (activeTab === 'admin') {
      setActiveTab('proposals');
    }
  };

  // Sync Firebase Auth user automatically (while preserving local quick-owner / PIN admin sessions)
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (user) {
        const profile = processUserLoginProfile(user);
        setCustomerUser(profile);
      } else {
        try {
          const savedRaw = localStorage.getItem('techfix_customer_user');
          const savedUser = savedRaw ? JSON.parse(savedRaw) : null;
          const isLocalSession =
            savedUser &&
            (savedUser.uid === 'owner-ratoibur11-uid' ||
              String(savedUser.uid || '').startsWith('owner_admin_') ||
              localStorage.getItem('techfix_is_admin') === 'true');
          if (isLocalSession) {
            return;
          }
        } catch (e) {}
        setCustomerUser(null);
        localStorage.removeItem('techfix_customer_user');
        localStorage.removeItem('techfix_user_profile');
        localStorage.removeItem('techfix_is_admin');
        localStorage.removeItem('techfix_admin_email');
      }
    });
    return () => unsubscribe();
  }, []);

  // Business details, Second-hand phones & Accessories state with LocalStorage persistence
  const [businessDetails, setBusinessDetails] = useState<ShopBusinessDetails>(() => {
    const saved = localStorage.getItem('techfix_business_details');
    const customLogo = typeof window !== 'undefined' ? (localStorage.getItem('techfix_custom_logo') || sessionStorage.getItem('techfix_custom_logo')) : null;
    let base: ShopBusinessDetails = saved ? JSON.parse(saved) : BUSINESS_DETAILS;
    if (customLogo !== null && isDurableImageValue(customLogo)) {
      base = { ...base, logoUrl: customLogo };
    } else if (base.logoUrl && base.logoUrl.startsWith('/uploads/')) {
      base = { ...base, logoUrl: '' };
    }
    return base;
  });

  useEffect(() => {
    // 1. Initial check: Fetch persistent logo from Cloud Firestore, IndexedDB & durable server fallback
    const checkServerAndDbLogo = async () => {
      // Priority 1: Cloud Firestore (permanent, survives container/server resets & cross-device)
      try {
        const firestoreLogo = await fetchShopLogoFromFirestore();
        if (firestoreLogo !== null) {
          if (firestoreLogo.trim() !== '' && isDurableImageValue(firestoreLogo)) {
            setBusinessDetails(prev => ({ ...prev, logoUrl: firestoreLogo }));
            try {
              localStorage.setItem('techfix_custom_logo', firestoreLogo);
              sessionStorage.setItem('techfix_custom_logo', firestoreLogo);
            } catch (e) {}
            await saveLogoToDb(firestoreLogo);
            return;
          } else if (firestoreLogo === '') {
            // Explicitly cleared in Firestore
            setBusinessDetails(prev => ({ ...prev, logoUrl: '' }));
            try {
              localStorage.removeItem('techfix_custom_logo');
              sessionStorage.removeItem('techfix_custom_logo');
            } catch (e) {}
            return;
          }
        }
      } catch (e) {}

      // Priority 2: Local IndexedDB (durable browser storage)
      const dbLogo = await getLogoFromDb();
      if (dbLogo && isDurableImageValue(dbLogo)) {
        setBusinessDetails(prev => ({ ...prev, logoUrl: dbLogo }));
        try {
          localStorage.setItem('techfix_custom_logo', dbLogo);
          sessionStorage.setItem('techfix_custom_logo', dbLogo);
        } catch (e) {}
        saveShopLogoToFirestore(dbLogo);
        return;
      }

      // Priority 3: Server API (only if durable / non-ephemeral)
      try {
        const res = await fetch('/api/logo');
        if (res.ok) {
          const data = await res.json();
          if (data?.logoUrl && isDurableImageValue(data.logoUrl)) {
            setBusinessDetails(prev => ({ ...prev, logoUrl: data.logoUrl }));
            try {
              localStorage.setItem('techfix_custom_logo', data.logoUrl);
              sessionStorage.setItem('techfix_custom_logo', data.logoUrl);
            } catch (e) {}
            await saveLogoToDb(data.logoUrl);
            saveShopLogoToFirestore(data.logoUrl);
          }
        }
      } catch (e) {}
    };
    checkServerAndDbLogo();

    // 2. Real-time Cloud Firestore synchronization (survives tab/device switches)
    const unsubFirestore = subscribeToShopLogo((remoteLogo) => {
      if (remoteLogo === '') {
        setBusinessDetails(prev => ({ ...prev, logoUrl: '' }));
        try {
          localStorage.removeItem('techfix_custom_logo');
          sessionStorage.removeItem('techfix_custom_logo');
        } catch (e) {}
      } else if (remoteLogo && isDurableImageValue(remoteLogo)) {
        setBusinessDetails(prev => ({
          ...prev,
          logoUrl: remoteLogo
        }));
        try {
          localStorage.setItem('techfix_custom_logo', remoteLogo);
          sessionStorage.setItem('techfix_custom_logo', remoteLogo);
        } catch (e) {}
        saveLogoToDb(remoteLogo);
      }
    });

    // 3. Synchronize logo across components and local tabs
    const handleSyncLogo = async () => {
      const customLogo = typeof window !== 'undefined' ? (localStorage.getItem('techfix_custom_logo') || sessionStorage.getItem('techfix_custom_logo') || '') : '';
      if (customLogo && isDurableImageValue(customLogo)) {
        setBusinessDetails(prev => ({
          ...prev,
          logoUrl: customLogo
        }));
      } else if (!customLogo) {
        setBusinessDetails(prev => ({ ...prev, logoUrl: '' }));
      }
    };
    window.addEventListener('techfix_logo_updated', handleSyncLogo);
    window.addEventListener('storage', handleSyncLogo);

    return () => {
      unsubFirestore();
      window.removeEventListener('techfix_logo_updated', handleSyncLogo);
      window.removeEventListener('storage', handleSyncLogo);
    };
  }, []);

  const [preOwnedPhones, setPreOwnedPhones] = useState<PreOwnedPhone[]>(() => {
    const saved = localStorage.getItem('techfix_preowned_phones');
    return saved ? JSON.parse(saved) : PRE_OWNED_PHONES;
  });

  const [accessories, setAccessories] = useState<AccessoryItem[]>(() => {
    const saved = localStorage.getItem('techfix_accessories');
    return saved ? JSON.parse(saved) : ACCESSORIES_CATALOG;
  });

  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('techfix_technician_photo');
      localStorage.removeItem('techfix_owner_photo');
    }
    const saved = localStorage.getItem('techfix_banner_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.heroImage || parsed.heroImage.includes('technician_with_phone') || parsed.heroImage.includes('photo-1581092160607')) {
          parsed.heroImage = '/images/technician_mobile_repair.jpg';
        }
        delete parsed.technicianPhoto;
        return parsed;
      } catch (e) {}
    }
    return INITIAL_BANNER_CONFIG;
  });

  const [sectionThemes, setSectionThemes] = useState<SectionThemesMap>(() => {
    const saved = localStorage.getItem('techfix_section_themes');
    return saved ? JSON.parse(saved) : INITIAL_SECTION_THEMES;
  });

  const handleUpdateSectionThemes = (updated: SectionThemesMap) => {
    setSectionThemes(updated);
    localStorage.setItem('techfix_section_themes', JSON.stringify(updated));
    saveSectionThemesToFirestore(updated);
    logActivityToFirestore('Section Themes Updated', 'THEME', 'Updated shop section color themes and saved to Firebase').catch(() => {});
  };

  const [shopPhotos, setShopPhotos] = useState<ShopPhotoItem[]>(() => {
    const saved = localStorage.getItem('techfix_shop_photos');
    return saved ? JSON.parse(saved) : INITIAL_SHOP_PHOTOS;
  });

  // Real-time Firestore synchronization for Business Details, Banner Config, Themes, Catalogs & Shop Photos
  useEffect(() => {
    const unsubBiz = subscribeToBusinessDetails((remoteBiz) => {
      if (remoteBiz && typeof remoteBiz === 'object') {
        const cleanRemote = { ...remoteBiz };
        delete cleanRemote.updatedAt;
        delete cleanRemote.updatedAtTimestamp;
        setBusinessDetails(prev => {
          const nextLogo =
            typeof cleanRemote.logoUrl === 'string' && (cleanRemote.logoUrl === '' || isDurableImageValue(cleanRemote.logoUrl))
              ? cleanRemote.logoUrl
              : prev.logoUrl;
          const merged = { ...prev, ...cleanRemote, logoUrl: nextLogo };
          try {
            localStorage.setItem('techfix_business_details', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    });

    const unsubBanner = subscribeToBannerConfig((remoteBanner) => {
      if (remoteBanner && typeof remoteBanner === 'object') {
        const cleanBanner = { ...remoteBanner };
        delete cleanBanner.updatedAt;
        delete cleanBanner.updatedAtTimestamp;
        delete cleanBanner.technicianPhoto;
        if (!cleanBanner.heroImage || cleanBanner.heroImage.includes('technician_with_phone')) {
          cleanBanner.heroImage = '/images/technician_mobile_repair.jpg';
        }
        setBannerConfig(prev => {
          const merged = { ...prev, ...cleanBanner };
          try {
            localStorage.setItem('techfix_banner_config', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    });

    const unsubThemes = subscribeToSectionThemes((remoteThemes) => {
      if (remoteThemes && typeof remoteThemes === 'object') {
        setSectionThemes(remoteThemes);
        try {
          localStorage.setItem('techfix_section_themes', JSON.stringify(remoteThemes));
        } catch (e) {}
      }
    });

    const unsubPhones = subscribeToPreOwnedPhones((remotePhones) => {
      if (Array.isArray(remotePhones) && remotePhones.length > 0) {
        setPreOwnedPhones(remotePhones);
        try {
          localStorage.setItem('techfix_preowned_phones', JSON.stringify(remotePhones));
        } catch (e) {}
      }
    });

    const unsubAcc = subscribeToAccessories((remoteAcc) => {
      if (Array.isArray(remoteAcc) && remoteAcc.length > 0) {
        setAccessories(remoteAcc);
        try {
          localStorage.setItem('techfix_accessories', JSON.stringify(remoteAcc));
        } catch (e) {}
      }
    });

    const unsubPhotos = subscribeToShopPhotos((remotePhotos) => {
      if (Array.isArray(remotePhotos) && remotePhotos.length > 0) {
        setShopPhotos(remotePhotos);
        try {
          localStorage.setItem('techfix_shop_photos', JSON.stringify(remotePhotos));
        } catch (e) {}
      }
    });

    return () => {
      unsubBiz();
      unsubBanner();
      unsubThemes();
      unsubPhones();
      unsubAcc();
      unsubPhotos();
    };
  }, []);


  const [repairRequests, setRepairRequests] = useState<CustomerRepairRequest[]>(() => {
    const saved = localStorage.getItem('techfix_repair_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_REPAIR_REQUESTS;
  });

  // Helper to construct a RepairProposal from CustomerRepairRequest
  const buildProposalFromRepairRequest = (req: CustomerRepairRequest, existing?: RepairProposal): RepairProposal => {
    const progress = req.progressPercent !== undefined ? req.progressPercent : (
      req.status === 'Completed' ? 100 :
      req.status === 'Ready for Pickup' ? 95 :
      req.status === 'Quality Testing' ? 80 :
      req.status === 'In Progress' ? 60 :
      req.status === 'Contacted' || req.status === 'Approved' ? 35 : 15
    );

    return {
      id: existing?.id || `prop-req-${req.id || req.requestId}`,
      proposalNumber: req.requestId,
      userId: req.userId || existing?.userId || undefined,
      clientName: req.customerName,
      clientPhone: req.contactPhone,
      clientEmail: req.email || existing?.clientEmail || '',
      deviceBrand: req.deviceBrand,
      deviceModel: req.deviceModel,
      problemDescription: req.problemDescription,
      diagnosticNotes: req.technicianNote || existing?.diagnosticNotes || `Submitted online by ${req.customerName}. Urgency: ${req.urgency}. Service: ${req.serviceType || 'Shop Walk-in'}`,
      technicianNote: req.technicianNote || existing?.technicianNote,
      photoUrl: req.photoUrl || existing?.photoUrl,
      devicePhotos: req.devicePhotos || existing?.devicePhotos,
      progressPercent: progress,
      expectedDeliveryDate: req.expectedDeliveryDate || existing?.expectedDeliveryDate || (req.urgency === 'Urgent Express' ? 'Today (Same Day Express)' : 'Tomorrow / 1-2 Days'),
      repairItems: existing?.repairItems && existing.repairItems.length > 0 ? existing.repairItems : [
        {
          id: `item-${req.id || Date.now()}`,
          description: `${req.deviceBrand} ${req.deviceModel} Diagnostic & Repair (${req.problemDescription})`,
          category: 'Hardware',
          cost: req.estimatedCost || 0,
          timeEstimate: req.urgency === 'Urgent Express' ? '1-2 Hours' : 'Same Day',
          warrantyPeriod: req.warrantyPeriod || '90 Days Guarantee'
        }
      ],
      subtotal: req.estimatedCost || existing?.subtotal || 0,
      discount: existing?.discount || 0,
      tax: 0,
      finalPrice: req.estimatedCost || existing?.finalPrice || 0,
      advancePaid: req.advancePaid || existing?.advancePaid || 0,
      balanceDue: req.balanceDue !== undefined ? req.balanceDue : (
        Math.max(0, (req.estimatedCost || existing?.finalPrice || 0) - (req.advancePaid || existing?.advancePaid || 0))
      ),
      estimatedCompletionTime: req.expectedDeliveryDate || (req.urgency === 'Urgent Express' ? 'Express 2 Hours' : '1 Day'),
      warrantyDays: 90,
      status: req.status === 'Completed' ? 'Completed' : (
        req.status === 'Ready for Pickup' ? 'Ready for Pickup' :
        req.status === 'In Progress' || req.status === 'Quality Testing' ? 'In Progress' : 'Sent'
      ),
      timelineEvents: existing?.timelineEvents && existing.timelineEvents.length > 0 ? existing.timelineEvents : [
        { id: '1', stage: 'Submitted', title: 'Online Request Received', description: `Booked by ${req.customerName} (${req.requestId})`, timestamp: req.createdAt, completed: true, isCurrent: progress < 30 },
        { id: '2', stage: 'Inspection', title: 'Technician Diagnosis', description: 'Inspecting hardware defect and component testing', timestamp: progress >= 30 ? req.createdAt : 'Pending', completed: progress >= 30, isCurrent: progress >= 30 && progress < 60 },
        { id: '3', stage: 'Approval', title: 'Client Quote Approval', description: 'Price estimate approved by customer', timestamp: progress >= 50 ? req.createdAt : 'Pending', completed: progress >= 50 },
        { id: '4', stage: 'Repair', title: 'IC / Component Repair', description: 'Motherboard IC soldering / display replacement', timestamp: progress >= 60 ? req.createdAt : 'Pending', completed: progress >= 60, isCurrent: progress >= 60 && progress < 90 },
        { id: '5', stage: 'Completed', title: 'QC Testing & Pickup Ready', description: 'Final quality check and shop delivery', timestamp: progress >= 95 ? 'Ready' : 'Pending', completed: progress >= 95, isCurrent: progress >= 95 }
      ],
      createdAt: req.createdAt,
      updatedAt: req.createdAt
    };
  };

  // Synchronize proposals map with repair requests
  const syncProposalsWithRequests = (currentProps: RepairProposal[], requestsList: CustomerRepairRequest[]): RepairProposal[] => {
    const propMap = new Map<string, RepairProposal>();
    currentProps.forEach(p => {
      const key = (p.proposalNumber || p.id).toLowerCase();
      propMap.set(key, p);
    });

    requestsList.forEach(req => {
      const key = req.requestId.toLowerCase();
      const existing = propMap.get(key);
      const built = buildProposalFromRepairRequest(req, existing);
      propMap.set(key, built);
    });

    return Array.from(propMap.values());
  };

  const handleUpdateRepairRequests = (updated: CustomerRepairRequest[]) => {
    setRepairRequests(updated);
    try { localStorage.setItem('techfix_repair_requests', JSON.stringify(updated)); } catch (e) {}

    // Mirror to server API
    try {
      fetch('/api/repair-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
    } catch (e) {}

    // Persist updated repair requests to Cloud Firestore
    updated.forEach((req) => {
      saveRepairRequestToFirestore(req).catch(() => {});
    });

    // Also sync and save corresponding proposals to Cloud Firestore
    setProposals(prevProps => {
      const synced = syncProposalsWithRequests(prevProps, updated);
      try { localStorage.setItem('techfix_proposals', JSON.stringify(synced)); } catch (e) {}
      synced.forEach((prop) => {
        saveProposalToFirestore(prop).catch(() => {});
      });
      return synced;
    });
  };

  const handleAddNewRepairRequest = (newReq: CustomerRepairRequest) => {
    const updated = [newReq, ...repairRequests.filter(r => (r.requestId || r.id).toLowerCase() !== (newReq.requestId || newReq.id).toLowerCase())];
    setRepairRequests(updated);
    try { localStorage.setItem('techfix_repair_requests', JSON.stringify(updated)); } catch (e) {}

    // Build matching proposal
    const autoProposal = buildProposalFromRepairRequest(newReq);
    const updatedProposals = [autoProposal, ...proposals.filter(p => (p.proposalNumber || p.id).toLowerCase() !== (autoProposal.proposalNumber || autoProposal.id).toLowerCase())];
    setProposals(updatedProposals);
    try { localStorage.setItem('techfix_proposals', JSON.stringify(updatedProposals)); } catch (e) {}

    // Save repair request & proposal to Firestore and server REST API
    saveRepairRequestToFirestore(newReq);
    saveProposalToFirestore(autoProposal);
    logActivityToFirestore(
      'New Repair Booking Submitted',
      'REPAIR_REQUEST',
      `${newReq.requestId} — ${newReq.customerName} (${newReq.deviceBrand} ${newReq.deviceModel})`
    ).catch(() => {});

    // Save ID to user's local session so they always see it
    try {
      const myIds: string[] = JSON.parse(localStorage.getItem('techfix_my_repair_ids') || '[]');
      if (!myIds.includes(newReq.requestId)) {
        myIds.unshift(newReq.requestId);
        localStorage.setItem('techfix_my_repair_ids', JSON.stringify(myIds));
      }
    } catch (e) {}

    setSearchQuery(newReq.requestId);
  };

  // Initial server REST sync to guarantee all bookings, proposals, and bills are loaded immediately
  useEffect(() => {
    const fetchServerData = async () => {
      try {
        const [serverRequests, serverProposals] = await Promise.all([
          fetchServerRepairRequests(),
          fetchServerProposals()
        ]);

        if (Array.isArray(serverRequests) && serverRequests.length > 0) {
          setRepairRequests(prev => {
            const map = new Map<string, CustomerRepairRequest>();
            prev.forEach(r => map.set((r.requestId || r.id).toLowerCase(), r));
            serverRequests.forEach(r => map.set((r.requestId || r.id).toLowerCase(), { ...(map.get((r.requestId || r.id).toLowerCase()) || {}), ...r }));
            const merged = Array.from(map.values());
            try { localStorage.setItem('techfix_repair_requests', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }

        if (Array.isArray(serverProposals) && serverProposals.length > 0) {
          setProposals(prev => {
            const map = new Map<string, RepairProposal>();
            prev.forEach(p => map.set((p.proposalNumber || p.id).toLowerCase(), p));
            serverProposals.forEach(p => map.set((p.proposalNumber || p.id).toLowerCase(), { ...(map.get((p.proposalNumber || p.id).toLowerCase()) || {}), ...p }));
            const merged = Array.from(map.values());
            try { localStorage.setItem('techfix_proposals', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }

      } catch (err) {
        console.warn('Initial server sync note:', err);
      }
    };
    fetchServerData();

    // Listen for custom requests update event
    const handleRequestsUpdated = (e: any) => {
      const newReq = e.detail;
      if (newReq) {
        setRepairRequests(prev => {
          const map = new Map<string, CustomerRepairRequest>();
          prev.forEach(r => map.set((r.requestId || r.id).toLowerCase(), r));
          map.set((newReq.requestId || newReq.id).toLowerCase(), newReq);
          return Array.from(map.values());
        });
      }
    };
    window.addEventListener('techfix_requests_updated', handleRequestsUpdated);
    return () => {
      window.removeEventListener('techfix_requests_updated', handleRequestsUpdated);
    };
  }, []);

  // Subscribe to real-time repair requests from Firestore with smart merging
  useEffect(() => {
    const unsub = subscribeToRepairRequests((remoteRequests) => {
      if (Array.isArray(remoteRequests) && remoteRequests.length > 0) {
        setRepairRequests(prev => {
          const map = new Map<string, CustomerRepairRequest>();
          prev.forEach(r => map.set((r.requestId || r.id).toLowerCase(), r));
          remoteRequests.forEach(r => map.set((r.requestId || r.id).toLowerCase(), { ...(map.get((r.requestId || r.id).toLowerCase()) || {}), ...r }));
          const merged = Array.from(map.values());
          try { localStorage.setItem('techfix_repair_requests', JSON.stringify(merged)); } catch (e) {}

          // Also ensure all proposals are synced
          setProposals(currentProps => {
            const synced = syncProposalsWithRequests(currentProps, merged);
            try { localStorage.setItem('techfix_proposals', JSON.stringify(synced)); } catch (e) {}
            return synced;
          });

          return merged;
        });
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to real-time repair proposals from Firestore with smart merging
  useEffect(() => {
    const unsub = subscribeToProposals((remoteProposals) => {
      if (Array.isArray(remoteProposals) && remoteProposals.length > 0) {
        setProposals(prev => {
          const map = new Map<string, RepairProposal>();
          prev.forEach(p => map.set((p.proposalNumber || p.id).toLowerCase(), p));
          remoteProposals.forEach(p => map.set((p.proposalNumber || p.id).toLowerCase(), { ...(map.get((p.proposalNumber || p.id).toLowerCase()) || {}), ...p }));
          const merged = Array.from(map.values());
          try { localStorage.setItem('techfix_proposals', JSON.stringify(merged)); } catch (e) {}
          return merged;
        });
      }
    });
    return () => unsub();
  }, []);

  // Customer Old Phone Buyback Sell Requests State
  const [oldPhoneSellRequests, setOldPhoneSellRequests] = useState<OldPhoneSellRequest[]>(() => {
    const saved = localStorage.getItem('techfix_sell_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_SELL_REQUESTS;
  });

  const handleUpdateOldPhoneSellRequests = (updated: OldPhoneSellRequest[]) => {
    setOldPhoneSellRequests(updated);
    localStorage.setItem('techfix_sell_requests', JSON.stringify(updated));
  };

  const handleAddNewOldPhoneSellRequest = (newReq: OldPhoneSellRequest) => {
    const updated = [newReq, ...oldPhoneSellRequests];
    setOldPhoneSellRequests(updated);
    localStorage.setItem('techfix_sell_requests', JSON.stringify(updated));
    saveOldPhoneSellRequestToFirestore(newReq);
    logActivityToFirestore(
      'New Old Phone Sell Request',
      'SELL_REQUEST',
      `${newReq.requestId} — ${newReq.customerName} (${newReq.deviceBrand} ${newReq.deviceModel})`
    ).catch(() => {});
  };

  // Subscribe to real-time old phone sell requests from Firestore
  useEffect(() => {
    const unsub = subscribeToOldPhoneSellRequests((remoteSellReqs) => {
      if (Array.isArray(remoteSellReqs) && remoteSellReqs.length > 0) {
        setOldPhoneSellRequests(remoteSellReqs);
        localStorage.setItem('techfix_sell_requests', JSON.stringify(remoteSellReqs));
      }
    });
    return () => unsub();
  }, []);

  // LocalStorage + Cloud Firestore Sync Effects
  const handleUpdateBusinessDetails = (updated: ShopBusinessDetails) => {
    setBusinessDetails(updated);
    try {
      localStorage.setItem('techfix_business_details', JSON.stringify(updated));
      saveBusinessDetailsToFirestore(updated);

      const nextLogo = (updated.logoUrl || '').trim();
      const prevLogo = (businessDetails.logoUrl || '').trim();

      if (nextLogo !== prevLogo) {
        if (nextLogo && isDurableImageValue(nextLogo)) {
          localStorage.setItem('techfix_custom_logo', nextLogo);
          sessionStorage.setItem('techfix_custom_logo', nextLogo);
          saveLogoToDb(nextLogo);
          saveShopLogoToFirestore(nextLogo);
        } else if (!nextLogo) {
          localStorage.removeItem('techfix_custom_logo');
          sessionStorage.removeItem('techfix_custom_logo');
          saveLogoToDb('');
          saveShopLogoToFirestore('');
        }
        window.dispatchEvent(new Event('techfix_logo_updated'));
      }

      logActivityToFirestore(
        'Business & UPI Details Updated',
        'BUSINESS_DETAILS',
        `Updated shop details for ${updated.name || 'TECHFIX'} (${updated.upiId || 'No UPI'})`
      ).catch(() => {});
    } catch (e) {
      console.warn('Failed to save business_details to localStorage:', e);
    }
  };

  const handleUpdatePreOwnedPhones = (updated: PreOwnedPhone[]) => {
    setPreOwnedPhones(updated);
    try { localStorage.setItem('techfix_preowned_phones', JSON.stringify(updated)); } catch (e) {}
    syncPreOwnedPhonesToFirestore(updated);
    logActivityToFirestore(
      'Second-Hand Phone Catalog Updated',
      'PHONE_STOCK',
      `Synced ${updated.length} second-hand phone(s) in Firebase`
    ).catch(() => {});
  };

  const handleUpdateAccessories = (updated: AccessoryItem[]) => {
    setAccessories(updated);
    try { localStorage.setItem('techfix_accessories', JSON.stringify(updated)); } catch (e) {}
    syncAccessoriesToFirestore(updated);
    logActivityToFirestore(
      'Accessories Catalog Updated',
      'ACCESSORY',
      `Synced ${updated.length} accessory item(s) in Firebase`
    ).catch(() => {});
  };

  const handleUpdateBannerConfig = (updated: BannerConfig) => {
    setBannerConfig(updated);
    try { localStorage.setItem('techfix_banner_config', JSON.stringify(updated)); } catch (e) {}
    saveBannerConfigToFirestore(updated);
    logActivityToFirestore(
      'Hero Banner & Technician Updated',
      'HERO_BANNER',
      `Updated hero banner ("${updated.mainTitle || 'Banner'}") & saved to Firebase`
    ).catch(() => {});
  };

  const handleUpdateShopPhotos = (updated: ShopPhotoItem[]) => {
    setShopPhotos(updated);
    try { localStorage.setItem('techfix_shop_photos', JSON.stringify(updated)); } catch (e) {}
    syncShopPhotosToFirestore(updated);
    logActivityToFirestore(
      'Shop Photos Gallery Updated',
      'SHOP_PHOTO',
      `Synced ${updated.length} shop photo(s) in Firebase`
    ).catch(() => {});
  };


  // Collect and persist feedbacks (Reviews)
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>(() => {
    const saved = localStorage.getItem('techfix_reviews');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const proposalFbs = INITIAL_PROPOSALS.filter(p => p.clientFeedback).map(p => p.clientFeedback!);
    return [
      ...proposalFbs,
      {
        id: "fb-sample-1",
        clientName: "Joydeb Sarkar",
        rating: 5,
        comment: "TECHFIX Goalpara team fixed my Redmi Note 10 Pro bootloop software crash within 1 hour! Highly recommended shop.",
        submittedAt: "01 Aug",
        approved: true,
        serviceType: "Software Flashing",
        deviceModel: "Redmi Note 10 Pro"
      },
      {
        id: "fb-sample-2",
        clientName: "Bishal Das",
        rating: 5,
        comment: "Replaced my Samsung M31 AMOLED display here. Quality touch response and genuine display quality.",
        submittedAt: "28 Jul",
        approved: true,
        serviceType: "Display Replacement",
        deviceModel: "Samsung M31"
      }
    ];
  });

  // Real-time Firestore sync for Reviews
  useEffect(() => {
    const unsub = subscribeToReviews((remoteReviews) => {
      if (remoteReviews && remoteReviews.length > 0) {
        setFeedbacks((prev) => {
          // Merge local and remote avoiding duplicates
          const map = new Map<string, ClientFeedback>();
          prev.forEach(item => map.set(item.id, item));
          remoteReviews.forEach(item => map.set(item.id, item));
          const merged = Array.from(map.values());
          localStorage.setItem('techfix_reviews', JSON.stringify(merged));
          return merged;
        });
      }
    });
    return () => unsub();
  }, []);

  // Handlers
  const handleSaveNewProposal = (newProp: RepairProposal) => {
    const updatedList = [newProp, ...proposals];
    setProposals(updatedList);
    try { localStorage.setItem('techfix_proposals', JSON.stringify(updatedList)); } catch (e) {}
    saveProposalToFirestore(newProp);
    logActivityToFirestore(
      'New Proposal Created',
      'PROPOSAL',
      `Created proposal ${newProp.proposalNumber} for ${newProp.clientName} (${newProp.deviceBrand} ${newProp.deviceModel}) — ₹${newProp.finalPrice}`
    ).catch(() => {});
    setSelectedProposal(newProp);
    setActiveTab('detail');
  };

  const handleUpdateProposal = (updated: RepairProposal) => {
    const updatedList = proposals.map(p => p.id === updated.id ? updated : p);
    setProposals(updatedList);
    try { localStorage.setItem('techfix_proposals', JSON.stringify(updatedList)); } catch (e) {}
    saveProposalToFirestore(updated);
    logActivityToFirestore(
      'Proposal Updated',
      'PROPOSAL',
      `Updated proposal ${updated.proposalNumber} (${updated.clientName}) -> ${updated.status}`
    ).catch(() => {});
    setSelectedProposal(updated);

    if (updated.clientFeedback) {
      // update feedback list
      const existingIdx = feedbacks.findIndex(f => f.id === updated.clientFeedback?.id);
      let updatedFbs: ClientFeedback[];
      if (existingIdx >= 0) {
        updatedFbs = [...feedbacks];
        updatedFbs[existingIdx] = updated.clientFeedback;
      } else {
        updatedFbs = [updated.clientFeedback, ...feedbacks];
      }
      setFeedbacks(updatedFbs);
      localStorage.setItem('techfix_reviews', JSON.stringify(updatedFbs));
      saveReviewToFirestore(updated.clientFeedback);
    }
  };

  const handleAddStandaloneFeedback = (newFb: ClientFeedback) => {
    const updated = [newFb, ...feedbacks];
    setFeedbacks(updated);
    localStorage.setItem('techfix_reviews', JSON.stringify(updated));
    saveReviewToFirestore(newFb);
    logActivityToFirestore(
      'Customer Review Submitted',
      'REVIEW',
      `${newFb.clientName} rated ${newFb.rating}/5 stars (${newFb.deviceModel || 'Service'})`
    ).catch(() => {});
  };

  const handleCreateProposalFromAi = (deviceBrand: string, deviceModel: string, diagnosisText: string) => {
    // Switch to proposal builder
    setActiveTab('builder');
  };

  // Check if logged-in user is shop owner
  const isOwner = Boolean(
    customerUser && (
      customerUser.email?.toLowerCase().trim() === OWNER_EMAIL.toLowerCase() ||
      customerUser.role === 'ADMIN'
    )
  );

  // Read local device saved repair IDs for this customer session
  let localSavedRepairIds: string[] = [];
  try {
    localSavedRepairIds = JSON.parse(localStorage.getItem('techfix_my_repair_ids') || '[]');
  } catch (e) {}

  const userEmail = customerUser?.email?.toLowerCase().trim() || '';
  const userPhone = (customerUser?.phoneNumber || '').replace(/\D/g, '');
  const userUid = customerUser?.uid || '';
  const userName = customerUser?.displayName?.toLowerCase().trim() || '';

  // User Privacy Isolation: Non-admin users can ONLY see their own repair proposals!
  const authorizedProposals = isOwner ? proposals : proposals.filter(p => {
    // 1. Matched by authenticated User ID
    if (userUid && p.userId && p.userId === userUid) return true;
    // 2. Matched by account email
    const pEmail = (p.clientEmail || '').toLowerCase().trim();
    if (userEmail && pEmail === userEmail) return true;
    // 3. Matched by phone
    const pPhone = (p.clientPhone || '').replace(/\D/g, '');
    if (userPhone && userPhone.length >= 7 && pPhone.includes(userPhone)) return true;
    // 4. Matched by client name
    const pName = (p.clientName || '').toLowerCase().trim();
    if (userName && userName.length > 3 && (pName === userName || pName.includes(userName) || userName.includes(pName))) return true;
    // 5. Matched by local repair IDs
    if (localSavedRepairIds.some(id => id.toLowerCase() === (p.proposalNumber || '').toLowerCase() || id.toLowerCase() === (p.id || '').toLowerCase())) return true;
    return false;
  });

  // Filtered proposals list
  const filteredProposals = authorizedProposals.filter(p => {
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesQuery = p.proposalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.clientPhone.includes(searchQuery);
    return matchesStatus && matchesQuery;
  });

  // MANDATORY AUTHENTICATION GATE:
  // "koibhi user apna id login Kiya bagaira yeh website me koibhi activaty NAHI karpai"
  if (!customerUser) {
    return (
      <MandatoryLoginGate
        onCustomerLogin={handleCustomerLogin}
      />
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Global Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'detail') setSelectedProposal(null);
        }}
        onNewProposal={() => setActiveTab('builder')}
        proposalCount={authorizedProposals.length}
        customerUser={customerUser}
        onOpenCustomerLogin={() => handleOpenCustomerModal('bookings')}
        onCustomerLogout={handleCustomerLogout}
        businessDetails={businessDetails}
        onUpdateBusinessDetails={handleUpdateBusinessDetails}
      />

      {/* Main Content View Switcher with Distinct Section Themes */}
      <main className="flex-1 pb-24 md:pb-10 transition-all duration-300 overflow-x-hidden">
        
        {/* TAB 1: Proposals & Estimates Dashboard (Royal Sapphire Theme) */}
        {activeTab === 'proposals' && (
          <div className="bg-gradient-to-b from-blue-950/20 via-slate-900/5 to-transparent min-h-screen">
            {/* Section Theme Bar */}
            <div className="bg-slate-950/90 border-b border-blue-900/40 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-blue-400 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Royal Sapphire Theme • Repair Proposals & Financial Analytics
              </span>
            </div>

            <HeroSection
              onNewProposal={() => setActiveTab('builder')}
              onTrackRepair={() => setActiveTab('tracker')}
              onViewServices={() => setActiveTab('services')}
              onViewPhotos={() => setActiveTab('photos')}
              onOpenRepairForm={() => setActiveTab('repairForm')}
              onOpenSellPhone={() => setActiveTab('sellPhone')}
              bannerConfig={bannerConfig}
              businessDetails={businessDetails}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
              
              {/* Proposals Management Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {isOwner ? 'Repair Proposals & Client Estimates' : 'My Mobile Repair Bookings & Estimates'}
                    </h2>
                    {!isOwner && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Private to You
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {isOwner 
                      ? 'Administrator Master View: Manage active quotations, review client approvals, and monitor all repair statuses.' 
                      : `Logged in as ${customerUser.email}. Viewing only the repairs and quotations you submitted.`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('repairForm')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Book Mobile Repair</span>
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => setActiveTab('builder')}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-none bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition border border-slate-700"
                    >
                      <Plus className="w-4 h-4 text-cyan-400" />
                      <span>Custom Quote Builder</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filters & Search (Square Type Controls) */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-none border-2 border-slate-300 shadow-sm">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
                  {['All', 'Sent', 'Approved', 'In Progress', 'IC Level Repair', 'Ready for Pickup'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-none text-xs font-bold whitespace-nowrap transition-all border ${
                        statusFilter === status
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ID, Client, or Model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-none border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Proposals Grid or Empty State */}
              {filteredProposals.length === 0 ? (
                <div className="bg-white rounded-none p-10 border-2 border-slate-300 text-center space-y-4 shadow-sm max-w-xl mx-auto my-8">
                  <div className="w-16 h-16 rounded-none bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                    <ShieldCheck className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {isOwner ? 'No matching proposals found' : 'No Active Repair Bookings Found'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      {isOwner 
                        ? 'No proposals matched your search query or filter.' 
                        : `No smartphone repairs have been submitted under this account (${customerUser.email}) yet. Click below to submit your mobile for diagnostic and repair.`}
                    </p>
                  </div>
                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('repairForm')}
                      className="px-5 py-2.5 rounded-none bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Book Mobile Repair</span>
                    </button>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="px-4 py-2.5 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition border border-slate-300"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProposals.map((proposal) => {
                    const completedCount = proposal.timelineEvents.filter(e => e.completed).length;
                    const progressPct = Math.round((completedCount / proposal.timelineEvents.length) * 100);

                    return (
                      <div 
                        key={proposal.id}
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setActiveTab('detail');
                        }}
                        className="bg-white rounded-none p-6 border-2 border-slate-300 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-none border border-blue-200">
                                {proposal.proposalNumber}
                              </span>
                              <h3 className="text-base font-extrabold text-slate-900 mt-2 group-hover:text-blue-600 transition">
                                {proposal.deviceBrand} {proposal.deviceModel}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className={`px-2.5 py-1 rounded-none text-[10px] font-bold border ${
                                proposal.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                proposal.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                proposal.status === 'Ready for Pickup' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {proposal.status}
                              </span>

                              {/* Card 3-Dots Menu */}
                              <div className="relative group/menu" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  type="button"
                                  className="p-1.5 rounded-none text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
                                  title="Quick Actions (...)"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                <div className="absolute right-0 mt-1 w-48 bg-slate-900 text-white rounded-none shadow-xl border border-slate-800 p-2 text-xs space-y-1 opacity-0 group-hover/menu:opacity-100 pointer-events-none group-hover/menu:pointer-events-auto transition-all z-20">
                                  <button
                                    onClick={() => {
                                      setSelectedProposal(proposal);
                                      setActiveTab('detail');
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                                    <span>View Proposal</span>
                                  </button>
                                  <a
                                    href={`tel:${proposal.clientPhone}`}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Call Client</span>
                                  </a>
                                  <a
                                    href={`https://wa.me/${proposal.clientPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(proposal.clientName)},%20update%20on%20your%20TECHFIX%20proposal%20${proposal.proposalNumber}.`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>WhatsApp</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Client Info */}
                          <div className="text-xs text-slate-600">
                            <p className="font-medium text-slate-800">Client: {proposal.clientName}</p>
                            <p className="text-slate-400">{proposal.clientPhone}</p>
                          </div>

                          {/* Problem Snippet */}
                          <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                            "{proposal.problemDescription}"
                          </p>

                          {/* Line Items Count */}
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-medium text-blue-700">{proposal.repairItems.length} Repair Item(s)</span>
                            <span>•</span>
                            <span>{proposal.warrantyDays}-Day Warranty</span>
                          </div>
                        </div>

                        {/* Pricing & Footer */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Total Estimate</p>
                            <p className="text-lg font-black text-slate-900">₹{proposal.finalPrice}</p>
                          </div>

                          <span className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                            <span>View Details</span>
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 2: Proposal Builder */}
        {activeTab === 'builder' && (
          <div className="bg-gradient-to-b from-indigo-950/20 via-slate-900/5 to-transparent min-h-screen">
            <div className="bg-slate-950/90 border-b border-indigo-900/40 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-indigo-400 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Deep Cobalt Theme • Quotation & Proposal Builder
              </span>
            </div>
            <ProposalBuilder
              onSaveProposal={handleSaveNewProposal}
              onCancel={() => setActiveTab('proposals')}
            />
          </div>
        )}

        {/* TAB 3: Proposal Detail View */}
        {activeTab === 'detail' && selectedProposal && (
          <div className="bg-gradient-to-b from-blue-950/20 via-slate-900/5 to-transparent min-h-screen">
            <div className="bg-slate-950/90 border-b border-blue-900/40 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-blue-400 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Royal Precision Theme • Proposal Estimate #{selectedProposal.proposalNumber}
              </span>
            </div>
            <ProposalDetailView
              proposal={selectedProposal}
              onUpdateProposal={handleUpdateProposal}
              onBack={() => setActiveTab('proposals')}
              businessDetails={businessDetails}
              isAdmin={false}
            />
          </div>
        )}

        {/* TAB 4: AI Repair Studio */}
        {activeTab === 'aistudio' && (
          <div className="bg-gradient-to-b from-fuchsia-950/30 via-indigo-950/20 to-transparent min-h-screen">
            <div className="bg-slate-950/90 border-b border-fuchsia-900/40 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-fuchsia-400 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
                Gemini Nebula Theme • AI Repair Studio (Gemini 3.7 Thinking Engine)
              </span>
            </div>
            <AiRepairStudio
              proposals={proposals}
              onCreateProposalFromAi={handleCreateProposalFromAi}
            />
          </div>
        )}

        {/* TAB 4.5: Customer Repair Request Form */}
        {activeTab === 'repairForm' && (
          <div className="bg-gradient-to-b from-purple-950/20 via-indigo-950/10 to-transparent min-h-screen">
            <div className="bg-slate-950/90 border-b border-purple-900/40 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-purple-400 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                Vibrant Violet Theme • Mobile Repair Booking Form
              </span>
            </div>
            <RepairRequestForm
              onSubmitRequest={handleAddNewRepairRequest}
              businessDetails={businessDetails}
              customerUser={customerUser}
              onOpenAuthModal={() => setIsCustomerModalOpen(true)}
              onViewTracker={(reqId) => {
                if (reqId) setSearchQuery(reqId);
                setActiveTab('tracker');
              }}
            />
          </div>
        )}

        {/* TAB 5: Live Repair Tracker */}
        {activeTab === 'tracker' && (
          <div className="bg-gradient-to-b from-cyan-950/30 via-slate-900/10 to-transparent min-h-screen">
            <div className="bg-slate-950/90 border-b border-cyan-900/40 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-cyan-400 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Cyber Cyan Theme • Live Mobile Repair Progress Tracker
              </span>
            </div>
            <TimelineTracker
              proposals={proposals}
              repairRequests={repairRequests}
              initialSearchQuery={searchQuery}
              customerUser={customerUser}
              isOwner={isOwner}
              onSelectProposal={(p) => {
                setSelectedProposal(p);
                setActiveTab('detail');
              }}
            />
          </div>
        )}

        {/* TAB 5: Services & IC Repair */}
        {activeTab === 'services' && (
          <div className="bg-gradient-to-b from-indigo-950/20 via-slate-900/5 to-transparent min-h-screen">
            <div className="bg-slate-950/90 border-b border-indigo-900/40 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-indigo-400 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Tech Steel Theme • Hardware & Microscopic IC Repair Services
              </span>
            </div>
            <ServicesCatalog onNewProposal={() => setActiveTab('builder')} />
          </div>
        )}

        {/* TAB 6: Parts & Accessories Catalog */}
        {activeTab === 'accessories' && (
          <div className="bg-gradient-to-b from-amber-950/20 via-slate-900/5 to-transparent min-h-screen">
            <div className="bg-slate-950/90 border-b border-amber-900/40 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-amber-400 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Electric Amber Theme • Genuine Parts & Smartphone Accessories
              </span>
            </div>
            <AccessoriesCatalog 
              items={accessories} 
              businessDetails={businessDetails} 
            />
          </div>
        )}

        {/* TAB 7: Second-Hand Mobiles */}
        {activeTab === 'phones' && (
          <div className="bg-gradient-to-b from-emerald-950/20 via-teal-950/10 to-transparent min-h-screen">
            <div className="bg-slate-950/90 border-b border-emerald-900/40 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-emerald-400 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Luxury Emerald Theme • Certified Pre-Owned Second-Hand Mobiles
              </span>
            </div>
            <PreOwnedPhones 
              phones={preOwnedPhones} 
              businessDetails={businessDetails} 
              onOpenSellPhoneForm={() => setActiveTab('sellPhone')}
            />
          </div>
        )}

        {/* TAB 7.5: Sell Old Phone Form (Customer Buyback Submission) */}
        {activeTab === 'sellPhone' && (
          <div className="bg-gradient-to-b from-amber-950/25 via-rose-950/10 to-transparent min-h-screen">
            <div className="bg-slate-950/90 border-b border-amber-900/40 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-amber-300 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Golden Sunset Theme • Instant Cash Phone Buyback Program
              </span>
            </div>
            <SellOldPhoneForm
              onSubmitSuccess={handleAddNewOldPhoneSellRequest}
              businessDetails={businessDetails}
              customerUser={customerUser}
              onOpenCustomerLogin={(tab) => handleOpenCustomerModal(tab || 'sell')}
            />
          </div>
        )}

        {/* TAB 8: Shop Photos Gallery */}
        {activeTab === 'photos' && (
          <div className="bg-gradient-to-b from-teal-950/20 via-slate-900/5 to-transparent min-h-screen">
            <div className="bg-slate-950/90 border-b border-teal-900/40 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-teal-300 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                Ocean Turquoise Theme • TECHFIX Shop Photos & Lab Gallery
              </span>
            </div>
            <ShopPhotos photos={shopPhotos} businessDetails={businessDetails} />
          </div>
        )}

        {/* TAB 9: Client Feedback */}
        {activeTab === 'feedback' && (
          <div className="bg-gradient-to-b from-rose-950/20 via-amber-950/10 to-transparent min-h-screen">
            <div className="bg-slate-950/90 border-b border-rose-900/40 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-rose-300 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                Warm Coral Theme • Verified Client Ratings & Reviews
              </span>
            </div>
            <FeedbackHub
              feedbacks={feedbacks}
              onAddFeedback={handleAddStandaloneFeedback}
              customerUser={customerUser}
            />
          </div>
        )}

        {/* TAB 10: Admin Control Panel (Owner Protected) */}
        {activeTab === 'admin' && (
          <div className="bg-slate-950 min-h-screen">
            <div className="bg-cyan-950/90 border-b border-cyan-500/30 py-2 px-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-black text-cyan-300 tracking-wider uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Obsidian Shield Theme • Shop Owner Admin Control Panel
              </span>
            </div>
            {customerUser && (
              customerUser.email?.toLowerCase().trim() === OWNER_EMAIL.toLowerCase() ||
              customerUser.role === 'ADMIN' ||
              (typeof window !== 'undefined' && localStorage.getItem('techfix_is_admin') === 'true')
            ) ? (
              <AdminControlPanel
                businessDetails={businessDetails}
                onUpdateBusinessDetails={handleUpdateBusinessDetails}
                preOwnedPhones={preOwnedPhones}
                onUpdatePreOwnedPhones={handleUpdatePreOwnedPhones}
                accessories={accessories}
                onUpdateAccessories={handleUpdateAccessories}
                proposals={proposals}
                onUpdateProposal={handleUpdateProposal}
                customerUser={customerUser}
                bannerConfig={bannerConfig}
                onUpdateBannerConfig={handleUpdateBannerConfig}
                shopPhotos={shopPhotos}
                onUpdateShopPhotos={handleUpdateShopPhotos}
                repairRequests={repairRequests}
                onUpdateRepairRequests={handleUpdateRepairRequests}
                oldPhoneSellRequests={oldPhoneSellRequests}
                onUpdateOldPhoneSellRequests={handleUpdateOldPhoneSellRequests}
                sectionThemes={sectionThemes}
                onUpdateSectionThemes={handleUpdateSectionThemes}
              />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 text-white rounded-3xl border border-slate-800 text-center space-y-4 shadow-2xl">
                <ShieldCheck className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
                <h3 className="text-xl font-extrabold text-cyan-300">Admin Access Required</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The Admin Control Panel is strictly protected and only accessible to authorized administrator <strong className="text-cyan-300">{OWNER_EMAIL}</strong>.
                </p>
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={handleQuickOwnerLogin}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Unlock Admin Panel ({OWNER_EMAIL})</span>
                  </button>

                  <button
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
                  >
                    Sign In with Another Account
                  </button>

                  <button
                    onClick={() => setActiveTab('proposals')}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs transition"
                  >
                    Back to Proposals & Services
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Customer Auth Modal */}
      <CustomerAuthModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customerUser={customerUser}
        onCustomerLogin={handleCustomerLogin}
        onCustomerLogout={handleCustomerLogout}
        repairRequests={repairRequests}
        proposals={proposals}
        oldPhoneSellRequests={oldPhoneSellRequests}
        initialProfileTab={customerModalTab}
        onNavigateToTab={(tab, query) => {
          setActiveTab(tab);
          if (query) setSearchQuery(query);
          setIsCustomerModalOpen(false);
        }}
      />

      {/* Global Shop Footer */}
      <ShopInfoFooter businessDetails={businessDetails} />

      {/* Mobile App Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'detail') setSelectedProposal(null);
        }}
        proposalCount={authorizedProposals.length}
        customerUser={customerUser}
        onOpenCustomerLogin={() => handleOpenCustomerModal('bookings')}
        onCustomerLogout={handleCustomerLogout}
      />
    </div>
  );
}
