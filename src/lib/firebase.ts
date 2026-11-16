import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

// User's custom Firebase project configuration for techfix-81a38 (secondary mirror)
export const userFirebaseConfig = {
  apiKey: "AIzaSyApIzvuhXl1mp2ix96DfFVVtt8sxnXKqkE",
  authDomain: "techfix-81a38.firebaseapp.com",
  projectId: "techfix-81a38",
  storageBucket: "techfix-81a38.firebasestorage.app",
  messagingSenderId: "254521083596",
  appId: "1:254521083596:web:3f68b1cc53f86440a1a469",
  measurementId: "G-YH30VCM68X"
};

// Initialize Primary App (provisioned AI Studio Firebase project & Firestore DB)
const primaryApp = getApps().find(a => a.name === '[DEFAULT]') || initializeApp(appletConfig);

// Initialize Secondary Mirror App (techfix-81a38)
let userApp: any = null;
try {
  userApp = getApps().find(a => a.name === 'techfix-81a38') || initializeApp(userFirebaseConfig, 'techfix-81a38');
} catch (e) {
  console.warn('User custom Firebase app initialization note:', e);
}

// Initialize Auth & Firestore instances
export const auth = getAuth(primaryApp);
export const userAuth = userApp ? getAuth(userApp) : null;

export const db = appletConfig.firestoreDatabaseId
  ? getFirestore(primaryApp, appletConfig.firestoreDatabaseId)
  : getFirestore(primaryApp);

export const userDb = userApp ? getFirestore(userApp) : null;

// Structured Firestore error diagnostics (per Firebase skill)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow = false) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || userAuth?.currentUser?.uid || null,
      email: auth.currentUser?.email || userAuth?.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Validate live connection to Firestore on boot
async function testConnection() {
  if (typeof window === 'undefined' || !db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration — client is offline.');
    }
  }
}
testConnection();

// Initialize Analytics safely
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(primaryApp);
    }
  }).catch(() => {});
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Recursively remove undefined values from objects before writing to Firestore
 * to prevent 'Unsupported field value: undefined' errors in Firestore SDK.
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      clean[key] = sanitizeForFirestore(value);
    } else if (Array.isArray(value)) {
      clean[key] = value
        .filter(item => item !== undefined)
        .map(item => (item !== null && typeof item === 'object' && !(item instanceof Date)) ? sanitizeForFirestore(item) : item);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Check if a string is a valid non-ephemeral image URL (not a temporary container /uploads/ path).
 */
export const isDurableImageValue = (val: string | undefined | null): boolean => {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:image/')) return true;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
  if (trimmed.startsWith('/images/')) return true; // static public/images assets
  return false;
};

/**
 * Resolve current logged-in actor info from Firebase Auth or localStorage for activity logging
 */
const getCurrentActorInfo = () => {
  const fbUser = auth.currentUser || userAuth?.currentUser;
  if (fbUser) {
    return {
      actorUid: fbUser.uid,
      actorEmail: fbUser.email || 'user@techfix.local',
      actorName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User'
    };
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('techfix_customer_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          actorUid: parsed.uid || 'local-user',
          actorEmail: parsed.email || 'user@techfix.local',
          actorName: parsed.displayName || 'User'
        };
      }
    } catch (e) {}
  }
  return {
    actorUid: 'system',
    actorEmail: 'system@techfix.local',
    actorName: 'System'
  };
};

// =========================================================================
// ACTIVITY AUDIT LOGGER (Saves EVERY edit/action permanently in Firebase)
// =========================================================================
export interface ActivityLogEntry {
  id: string;
  action: string;
  category:
    | 'LOGO'
    | 'BUSINESS_DETAILS'
    | 'HERO_BANNER'
    | 'THEME'
    | 'PROPOSAL'
    | 'REPAIR_REQUEST'
    | 'SELL_REQUEST'
    | 'PHONE_STOCK'
    | 'ACCESSORY'
    | 'SHOP_PHOTO'
    | 'INVOICE'
    | 'REVIEW'
    | 'AUTH'
    | 'ADMIN';
  details: string;
  actorUid?: string;
  actorEmail?: string;
  actorName?: string;
  timestamp: number;
  createdAt: string;
}

export const logActivityToFirestore = async (
  action: string,
  category: ActivityLogEntry['category'],
  details: string
): Promise<void> => {
  const actor = getCurrentActorInfo();
  const now = Date.now();
  const id = `act-${now}-${Math.random().toString(36).slice(2, 7)}`;
  const entry: ActivityLogEntry = {
    id,
    action,
    category,
    details,
    actorUid: actor.actorUid,
    actorEmail: actor.actorEmail,
    actorName: actor.actorName,
    timestamp: now,
    createdAt: new Date(now).toISOString()
  };

  const payload = sanitizeForFirestore(entry);

  if (db) {
    try {
      await setDoc(doc(db, 'activityLogs', id), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `activityLogs/${id}`);
    }
  }

  if (userDb) {
    try {
      await setDoc(doc(userDb, 'activityLogs', id), payload);
    } catch (e) {}
  }
};

export const subscribeToActivityLogs = (callback: (logs: ActivityLogEntry[]) => void) => {
  if (!db) return () => {};
  try {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(150));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: ActivityLogEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as ActivityLogEntry;
          if (data) list.push(data);
        });
        callback(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'activityLogs')
    );
  } catch (e) {
    return () => {};
  }
};

// =========================================================================
// AUTHENTICATION HELPERS
// =========================================================================
const syncUserToFirestore = async (user: User, provider?: string) => {
  const userData = sanitizeForFirestore({
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Customer'),
    photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`,
    lastLoginAt: Date.now(),
    ...(provider ? { provider } : {})
  });

  if (db) {
    try {
      await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
    }
  }

  if (userDb) {
    try {
      await setDoc(doc(userDb, 'users', user.uid), userData, { merge: true });
    } catch (e) {}
  }
};

export const signInWithGoogle = async (): Promise<User> => {
  let user: User | null = null;
  let firstError: any = null;

  // Primary app first so db (ai-studio-techfixrepairpro-...) is directly authenticated
  try {
    const result = await signInWithPopup(auth, googleProvider);
    user = result.user;
  } catch (err: any) {
    firstError = err;
    console.warn('Primary Google Auth note:', err?.code, err?.message);
  }

  if (!user && userAuth) {
    try {
      const result = await signInWithPopup(userAuth, googleProvider);
      user = result.user;
    } catch (err: any) {
      throw firstError || err;
    }
  }

  if (!user) {
    throw firstError || new Error('Google Sign-In failed');
  }

  await syncUserToFirestore(user, 'google');
  logActivityToFirestore('User Signed In (Google)', 'AUTH', `${user.email || 'User'} signed in via Google`).catch(() => {});

  return user;
};

export const logoutFirebase = async (): Promise<void> => {
  const actor = getCurrentActorInfo();
  try {
    logActivityToFirestore('User Signed Out', 'AUTH', `${actor.actorEmail} logged out`).catch(() => {});
    if (userAuth) {
      try { await signOut(userAuth); } catch (e) {}
    }
    await signOut(auth);
  } catch (error: any) {
    console.error('Firebase Sign-Out Error:', error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  let primaryUser: User | null = auth.currentUser;
  let secondaryUser: User | null = userAuth?.currentUser || null;
  let primaryResolved = false;
  let secondaryResolved = !userAuth;

  const emit = () => {
    const active = primaryUser || secondaryUser;
    if (active) {
      callback(active);
    } else if (primaryResolved && secondaryResolved) {
      callback(null);
    }
  };

  const unsubPrimary = onAuthStateChanged(auth, (user) => {
    primaryResolved = true;
    primaryUser = user;
    emit();
  });

  const unsubUser = userAuth
    ? onAuthStateChanged(userAuth, (user) => {
        secondaryResolved = true;
        secondaryUser = user;
        emit();
      })
    : () => {};

  return () => {
    unsubPrimary();
    unsubUser();
  };
};

export const signInWithEmail = async (email: string, pass: string): Promise<User> => {
  let user: User | null = null;
  let primaryErr: any = null;

  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    user = res.user;
  } catch (err: any) {
    primaryErr = err;
  }

  if (!user && userAuth) {
    try {
      const res = await signInWithEmailAndPassword(userAuth, email, pass);
      user = res.user;
    } catch (err: any) {
      throw primaryErr || err;
    }
  }

  if (!user) throw primaryErr;

  await syncUserToFirestore(user, 'password');
  logActivityToFirestore('User Signed In (Email)', 'AUTH', `${user.email || email} signed in`).catch(() => {});
  return user;
};

export const signUpWithEmail = async (email: string, pass: string, displayName?: string): Promise<User> => {
  let user: User | null = null;
  let primaryErr: any = null;

  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && res.user) {
      await updateProfile(res.user, { displayName });
    }
    user = res.user;
  } catch (err: any) {
    primaryErr = err;
  }

  if (!user && userAuth) {
    try {
      const res = await createUserWithEmailAndPassword(userAuth, email, pass);
      if (displayName && res.user) {
        await updateProfile(res.user, { displayName });
      }
      user = res.user;
    } catch (err: any) {
      throw primaryErr || err;
    }
  }

  if (!user) throw primaryErr;

  await syncUserToFirestore(user, 'password');
  logActivityToFirestore('New User Registered', 'AUTH', `${email} created account`).catch(() => {});
  return user;
};

// =========================================================================
// PERMANENT SHOP BRANDING & LOGO STORAGE (Cloud Firestore)
// =========================================================================
export const saveShopLogoToFirestore = async (logoUrlOrBase64: string): Promise<boolean> => {
  const cleanVal = (logoUrlOrBase64 || '').trim();
  // Never persist temporary ephemeral /uploads/... paths if we can avoid it
  const payload = sanitizeForFirestore({
    logoUrl: cleanVal,
    updatedAt: new Date().toISOString(),
    updatedAtTimestamp: Date.now()
  });

  let saved = false;
  if (db) {
    try {
      await setDoc(doc(db, 'shopSettings', 'branding'), payload, { merge: true });
      await setDoc(doc(db, 'shopSettings', 'businessDetails'), { logoUrl: cleanVal, updatedAtTimestamp: Date.now() }, { merge: true });
      saved = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shopSettings/branding');
    }
  }

  if (userDb) {
    try {
      await setDoc(doc(userDb, 'shopSettings', 'branding'), payload, { merge: true });
      await setDoc(doc(userDb, 'shopSettings', 'businessDetails'), { logoUrl: cleanVal, updatedAtTimestamp: Date.now() }, { merge: true });
      saved = true;
    } catch (err) {}
  }

  logActivityToFirestore(
    cleanVal ? 'Shop Logo Updated' : 'Shop Logo Removed',
    'LOGO',
    cleanVal
      ? `Updated shop logo (${cleanVal.startsWith('data:') ? 'Uploaded image stored in Firebase' : cleanVal.slice(0, 80)})`
      : 'Reset shop logo to text emblem'
  ).catch(() => {});

  return saved;
};

export const fetchShopLogoFromFirestore = async (): Promise<string | null> => {
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'shopSettings', 'branding'));
      if (snap.exists()) {
        const val = snap.data()?.logoUrl;
        if (typeof val === 'string') return val;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'shopSettings/branding');
    }
  }

  if (userDb) {
    try {
      const snap = await getDoc(doc(userDb, 'shopSettings', 'branding'));
      if (snap.exists()) {
        const val = snap.data()?.logoUrl;
        if (typeof val === 'string') return val;
      }
    } catch (err) {}
  }

  return null;
};

export const subscribeToShopLogo = (callback: (logoUrl: string | null) => void): (() => void) => {
  const unsubs: Array<() => void> = [];

  if (db) {
    try {
      const unsub = onSnapshot(doc(db, 'shopSettings', 'branding'), (snap) => {
        if (snap.exists()) {
          const val = snap.data()?.logoUrl;
          callback(typeof val === 'string' ? val : '');
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'shopSettings/branding');
      });
      unsubs.push(unsub);
    } catch (e) {}
  }

  return () => {
    unsubs.forEach(u => u());
  };
};

// =========================================================================
// SHOP SETTINGS: BUSINESS DETAILS, BANNER CONFIG, THEMES, INVOICE BRANDING
// =========================================================================
export const saveBusinessDetailsToFirestore = async (details: Record<string, any>): Promise<boolean> => {
  const payload = sanitizeForFirestore({
    ...details,
    updatedAtTimestamp: Date.now(),
    updatedAt: new Date().toISOString()
  });
  let saved = false;
  if (db) {
    try {
      await setDoc(doc(db, 'shopSettings', 'businessDetails'), payload, { merge: true });
      saved = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shopSettings/businessDetails');
    }
  }
  if (userDb) {
    try {
      await setDoc(doc(userDb, 'shopSettings', 'businessDetails'), payload, { merge: true });
    } catch (e) {}
  }
  return saved;
};

export const subscribeToBusinessDetails = (callback: (details: any) => void): (() => void) => {
  if (!db) return () => {};
  try {
    return onSnapshot(doc(db, 'shopSettings', 'businessDetails'), (snap) => {
      if (snap.exists()) {
        callback(snap.data());
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'shopSettings/businessDetails'));
  } catch (e) {
    return () => {};
  }
};

export const saveBannerConfigToFirestore = async (config: Record<string, any>): Promise<boolean> => {
  const payload = sanitizeForFirestore({
    ...config,
    updatedAtTimestamp: Date.now(),
    updatedAt: new Date().toISOString()
  });
  let saved = false;
  if (db) {
    try {
      await setDoc(doc(db, 'shopSettings', 'bannerConfig'), payload, { merge: true });
      saved = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shopSettings/bannerConfig');
    }
  }
  if (userDb) {
    try {
      await setDoc(doc(userDb, 'shopSettings', 'bannerConfig'), payload, { merge: true });
    } catch (e) {}
  }
  return saved;
};

export const subscribeToBannerConfig = (callback: (config: any) => void): (() => void) => {
  if (!db) return () => {};
  try {
    return onSnapshot(doc(db, 'shopSettings', 'bannerConfig'), (snap) => {
      if (snap.exists()) {
        callback(snap.data());
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'shopSettings/bannerConfig'));
  } catch (e) {
    return () => {};
  }
};

export const saveSectionThemesToFirestore = async (themes: Record<string, any>): Promise<boolean> => {
  const payload = sanitizeForFirestore({
    themes,
    updatedAtTimestamp: Date.now()
  });
  let saved = false;
  if (db) {
    try {
      await setDoc(doc(db, 'shopSettings', 'sectionThemes'), payload, { merge: true });
      saved = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shopSettings/sectionThemes');
    }
  }
  if (userDb) {
    try {
      await setDoc(doc(userDb, 'shopSettings', 'sectionThemes'), payload, { merge: true });
    } catch (e) {}
  }
  return saved;
};

export const subscribeToSectionThemes = (callback: (themes: any) => void): (() => void) => {
  if (!db) return () => {};
  try {
    return onSnapshot(doc(db, 'shopSettings', 'sectionThemes'), (snap) => {
      if (snap.exists() && snap.data()?.themes) {
        callback(snap.data().themes);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'shopSettings/sectionThemes'));
  } catch (e) {
    return () => {};
  }
};

export interface InvoiceBrandingConfig {
  headerBannerImageUrl?: string;
  bottomBannerImageUrl?: string;
  digitalSignatureUrl?: string;
  defaultTerms?: string[];
  updatedAtTimestamp?: number;
}

export const saveInvoiceBrandingToFirestore = async (branding: InvoiceBrandingConfig): Promise<boolean> => {
  const payload = sanitizeForFirestore({
    ...branding,
    updatedAtTimestamp: Date.now()
  });
  let saved = false;
  if (db) {
    try {
      await setDoc(doc(db, 'shopSettings', 'invoiceBranding'), payload, { merge: true });
      saved = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shopSettings/invoiceBranding');
    }
  }
  if (userDb) {
    try {
      await setDoc(doc(userDb, 'shopSettings', 'invoiceBranding'), payload, { merge: true });
    } catch (e) {}
  }
  return saved;
};

export const subscribeToInvoiceBranding = (callback: (branding: InvoiceBrandingConfig) => void): (() => void) => {
  if (!db) return () => {};
  try {
    return onSnapshot(doc(db, 'shopSettings', 'invoiceBranding'), (snap) => {
      if (snap.exists()) {
        callback(snap.data() as InvoiceBrandingConfig);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'shopSettings/invoiceBranding'));
  } catch (e) {
    return () => {};
  }
};

// =========================================================================
// COLLECTION HELPERS: PHONES, ACCESSORIES, SHOP PHOTOS, TAX INVOICES
// =========================================================================
const syncCollectionState = async (collectionName: string, items: Array<{ id: string } & Record<string, any>>) => {
  if (!db) return;
  try {
    const incomingIds = new Set(items.map(i => i.id).filter(Boolean));
    const existingSnap = await getDocs(collection(db, collectionName));
    const deletePromises: Promise<any>[] = [];
    existingSnap.forEach((d) => {
      if (!incomingIds.has(d.id)) {
        deletePromises.push(deleteDoc(doc(db, collectionName, d.id)));
        if (userDb) {
          deletePromises.push(deleteDoc(doc(userDb, collectionName, d.id)).catch(() => {}));
        }
      }
    });
    const writePromises = items.map((item, index) => {
      const docId = item.id || `${collectionName}-${Date.now()}-${index}`;
      const payload = sanitizeForFirestore({ ...item, id: docId, sortIndex: index, updatedAtTimestamp: Date.now() });
      const p1 = setDoc(doc(db, collectionName, docId), payload, { merge: true });
      const p2 = userDb ? setDoc(doc(userDb, collectionName, docId), payload, { merge: true }).catch(() => {}) : Promise.resolve();
      return Promise.all([p1, p2]);
    });
    await Promise.all([...deletePromises, ...writePromises]);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, collectionName);
  }
};

export const syncPreOwnedPhonesToFirestore = (phones: any[]) => syncCollectionState('preOwnedPhones', phones);
export const subscribeToPreOwnedPhones = (callback: (phones: any[]) => void) => {
  if (!db) return () => {};
  try {
    return onSnapshot(collection(db, 'preOwnedPhones'), (snap) => {
      if (snap.empty) return;
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      list.sort((a, b) => (a.sortIndex ?? 999) - (b.sortIndex ?? 999));
      callback(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'preOwnedPhones'));
  } catch (e) {
    return () => {};
  }
};

export const syncAccessoriesToFirestore = (items: any[]) => syncCollectionState('accessories', items);
export const subscribeToAccessories = (callback: (items: any[]) => void) => {
  if (!db) return () => {};
  try {
    return onSnapshot(collection(db, 'accessories'), (snap) => {
      if (snap.empty) return;
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      list.sort((a, b) => (a.sortIndex ?? 999) - (b.sortIndex ?? 999));
      callback(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'accessories'));
  } catch (e) {
    return () => {};
  }
};

export const syncShopPhotosToFirestore = (photos: any[]) => syncCollectionState('shopPhotos', photos);
export const subscribeToShopPhotos = (callback: (photos: any[]) => void) => {
  if (!db) return () => {};
  try {
    return onSnapshot(collection(db, 'shopPhotos'), (snap) => {
      if (snap.empty) return;
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      list.sort((a, b) => (a.sortIndex ?? 999) - (b.sortIndex ?? 999));
      callback(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'shopPhotos'));
  } catch (e) {
    return () => {};
  }
};

export const saveTaxInvoiceToFirestore = async (invoice: any): Promise<boolean> => {
  const docId = invoice.id || `inv-${invoice.invoiceNumber || Date.now()}`;
  const payload = sanitizeForFirestore({
    ...invoice,
    id: docId,
    updatedAtTimestamp: Date.now()
  });
  let saved = false;
  if (db) {
    try {
      await setDoc(doc(db, 'taxInvoices', docId), payload, { merge: true });
      saved = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `taxInvoices/${docId}`);
    }
  }
  if (userDb) {
    try {
      await setDoc(doc(userDb, 'taxInvoices', docId), payload, { merge: true });
    } catch (e) {}
  }
  return saved;
};

export const deleteTaxInvoiceFromFirestore = async (invoiceId: string): Promise<void> => {
  if (!invoiceId) return;
  if (db) {
    try {
      await deleteDoc(doc(db, 'taxInvoices', invoiceId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `taxInvoices/${invoiceId}`);
    }
  }
  if (userDb) {
    try {
      await deleteDoc(doc(userDb, 'taxInvoices', invoiceId));
    } catch (e) {}
  }
};

export const subscribeToTaxInvoices = (callback: (invoices: any[]) => void) => {
  if (!db) return () => {};
  try {
    return onSnapshot(collection(db, 'taxInvoices'), (snap) => {
      if (snap.empty) return;
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      list.sort((a, b) => (b.updatedAtTimestamp || 0) - (a.updatedAtTimestamp || 0));
      callback(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'taxInvoices'));
  } catch (e) {
    return () => {};
  }
};

// =========================================================================
// REVIEWS
// =========================================================================
export const saveReviewToFirestore = async (review: any): Promise<boolean> => {
  const reviewData = sanitizeForFirestore({
    ...review,
    timestamp: Date.now()
  });

  const docId = review.id || `rev-${Date.now()}`;
  let saved = false;

  if (db) {
    try {
      await setDoc(doc(db, 'reviews', docId), reviewData, { merge: true });
      saved = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reviews/${docId}`);
    }
  }

  if (userDb) {
    try {
      await setDoc(doc(userDb, 'reviews', docId), reviewData, { merge: true });
    } catch (err) {}
  }

  return saved;
};

export const subscribeToReviews = (callback: (reviews: any[]) => void) => {
  let unsubPrimary = () => {};

  const handleSnapshot = (snapshot: any) => {
    const list: any[] = [];
    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      if (data) list.push(data);
    });
    if (list.length > 0) {
      callback(list);
    }
  };

  if (db) {
    try {
      const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'));
      unsubPrimary = onSnapshot(q, handleSnapshot, (err) => handleFirestoreError(err, OperationType.LIST, 'reviews'));
    } catch (e) {}
  }

  return () => {
    unsubPrimary();
  };
};

// =========================================================================
// REPAIR REQUESTS & PROPOSALS
// =========================================================================
export const saveRepairRequestToFirestore = async (requestData: any): Promise<boolean> => {
  const dataToSave = sanitizeForFirestore({
    ...requestData,
    updatedAtTimestamp: Date.now()
  });

  const docId = requestData.id || requestData.requestId;
  if (!docId) return false;

  try {
    fetch('/api/repair-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave)
    }).catch(() => {});
  } catch (e) {}

  let saved = false;

  if (db) {
    try {
      await setDoc(doc(db, 'repairRequests', docId), dataToSave, { merge: true });
      saved = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `repairRequests/${docId}`);
    }
  }

  if (userDb) {
    try {
      await setDoc(doc(userDb, 'repairRequests', docId), dataToSave, { merge: true });
    } catch (err) {}
  }

  return saved;
};

export const fetchServerRepairRequests = async (): Promise<any[]> => {
  try {
    const res = await fetch('/api/repair-requests');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.requests)) {
        return data.requests;
      }
    }
  } catch (e) {}
  return [];
};

export const fetchServerProposals = async (): Promise<any[]> => {
  try {
    const res = await fetch('/api/proposals');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.proposals)) {
        return data.proposals;
      }
    }
  } catch (e) {}
  return [];
};

export const subscribeToRepairRequests = (callback: (requests: any[]) => void) => {
  let unsubPrimary = () => {};

  const handleSnapshot = (snapshot: any) => {
    const list: any[] = [];
    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      if (data) list.push(data);
    });
    list.sort((a, b) => (b.updatedAtTimestamp || 0) - (a.updatedAtTimestamp || 0));
    callback(list);
  };

  if (db) {
    try {
      const q = query(collection(db, 'repairRequests'));
      unsubPrimary = onSnapshot(q, handleSnapshot, (err) => handleFirestoreError(err, OperationType.LIST, 'repairRequests'));
    } catch (e) {}
  }

  return () => {
    unsubPrimary();
  };
};

export const deleteRepairRequestFromFirestore = async (requestId: string, altRequestId?: string) => {
  const idsToDelete = [requestId, altRequestId].filter(Boolean) as string[];
  for (const id of idsToDelete) {
    try {
      fetch(`/api/repair-requests/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}

    if (db) {
      try {
        await deleteDoc(doc(db, 'repairRequests', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `repairRequests/${id}`);
      }
    }

    if (userDb) {
      try {
        await deleteDoc(doc(userDb, 'repairRequests', id));
      } catch (err) {}
    }
  }
};

export const saveProposalToFirestore = async (proposalData: any): Promise<boolean> => {
  const dataToSave = sanitizeForFirestore({
    ...proposalData,
    updatedAtTimestamp: Date.now()
  });

  const docId = proposalData.id || proposalData.proposalNumber;
  if (!docId) return false;

  try {
    fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave)
    }).catch(() => {});
  } catch (e) {}

  let saved = false;

  if (db) {
    try {
      await setDoc(doc(db, 'proposals', docId), dataToSave, { merge: true });
      saved = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `proposals/${docId}`);
    }
  }

  if (userDb) {
    try {
      await setDoc(doc(userDb, 'proposals', docId), dataToSave, { merge: true });
    } catch (err) {}
  }

  return saved;
};

export const subscribeToProposals = (callback: (proposals: any[]) => void) => {
  let unsubPrimary = () => {};

  const handleSnapshot = (snapshot: any) => {
    const list: any[] = [];
    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      if (data) list.push(data);
    });
    callback(list);
  };

  if (db) {
    try {
      const q = query(collection(db, 'proposals'));
      unsubPrimary = onSnapshot(q, handleSnapshot, (err) => handleFirestoreError(err, OperationType.LIST, 'proposals'));
    } catch (e) {}
  }

  return () => {
    unsubPrimary();
  };
};

export const deleteProposalFromFirestore = async (proposalId: string) => {
  try {
    fetch(`/api/proposals/${encodeURIComponent(proposalId)}`, { method: 'DELETE' }).catch(() => {});
  } catch (e) {}

  if (db) {
    try {
      await deleteDoc(doc(db, 'proposals', proposalId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `proposals/${proposalId}`);
    }
  }

  if (userDb) {
    try {
      await deleteDoc(doc(userDb, 'proposals', proposalId));
    } catch (err) {}
  }
};

// =========================================================================
// OLD PHONE SELL REQUESTS
// =========================================================================
export const saveOldPhoneSellRequestToFirestore = async (sellData: any): Promise<boolean> => {
  const dataToSave = sanitizeForFirestore({
    ...sellData,
    updatedAtTimestamp: Date.now()
  });

  const docId = sellData.id || sellData.requestId;
  if (!docId) return false;

  let saved = false;

  if (db) {
    try {
      await setDoc(doc(db, 'oldPhoneSellRequests', docId), dataToSave, { merge: true });
      saved = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `oldPhoneSellRequests/${docId}`);
    }
  }

  if (userDb) {
    try {
      await setDoc(doc(userDb, 'oldPhoneSellRequests', docId), dataToSave, { merge: true });
    } catch (err) {}
  }

  return saved;
};

export const subscribeToOldPhoneSellRequests = (callback: (requests: any[]) => void) => {
  let unsubPrimary = () => {};

  const handleSnapshot = (snapshot: any) => {
    const list: any[] = [];
    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      if (data) list.push(data);
    });
    list.sort((a, b) => (b.updatedAtTimestamp || 0) - (a.updatedAtTimestamp || 0));
    callback(list);
  };

  if (db) {
    try {
      const q = query(collection(db, 'oldPhoneSellRequests'));
      unsubPrimary = onSnapshot(q, handleSnapshot, (err) => handleFirestoreError(err, OperationType.LIST, 'oldPhoneSellRequests'));
    } catch (e) {}
  }

  return () => {
    unsubPrimary();
  };
};

export const deleteOldPhoneSellRequestFromFirestore = async (requestId: string, altRequestId?: string) => {
  const idsToDelete = [requestId, altRequestId].filter(Boolean) as string[];
  for (const id of idsToDelete) {
    if (db) {
      try {
        await deleteDoc(doc(db, 'oldPhoneSellRequests', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `oldPhoneSellRequests/${id}`);
      }
    }

    if (userDb) {
      try {
        await deleteDoc(doc(userDb, 'oldPhoneSellRequests', id));
      } catch (err) {}
    }
  }
};
