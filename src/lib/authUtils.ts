import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';

export const OWNER_EMAIL = 'ratoibur11@gmail.com';

export function processUserLoginProfile(user: {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}): UserProfile {
  const cleanEmail = (user.email || 'user@gmail.com').toLowerCase().trim();
  const displayName = user.displayName || cleanEmail.split('@')[0];
  const photoURL = user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`;

  // 1. Check if user is logging in for the first time on this device
  const seenKey = `techfix_user_seen_${cleanEmail}`;
  const isFirstTime = !localStorage.getItem(seenKey);

  // 2. Check if email matches owner email 'ratoibur11@gmail.com'
  const isOwner = cleanEmail === OWNER_EMAIL.toLowerCase();

  // 3. Promote account to 'ADMIN' ONLY if email matches owner email 'ratoibur11@gmail.com'
  let role: 'ADMIN' | 'CUSTOMER' = isOwner ? 'ADMIN' : 'CUSTOMER';

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || cleanEmail,
    displayName,
    photoURL,
    role,
    isFirstLogin: isFirstTime,
    lastLoginAt: new Date().toISOString()
  };

  // 4. Mark user email as seen in LocalStorage
  localStorage.setItem(seenKey, 'true');

  // 5. Persist profile state in LocalStorage
  localStorage.setItem('techfix_customer_user', JSON.stringify(profile));
  localStorage.setItem('techfix_user_profile', JSON.stringify(profile));

  if (isOwner) {
    localStorage.setItem('techfix_admin_email', profile.email);
    localStorage.setItem('techfix_is_admin', 'true');
  } else {
    localStorage.removeItem('techfix_is_admin');
  }

  // 6. Asynchronously sync user role & profile to Firestore database
  try {
    setDoc(doc(db, 'users', user.uid), {
      email: profile.email,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      role: profile.role.toLowerCase(), // 'admin' or 'customer'
      isAdmin: profile.role === 'ADMIN',
      isFirstLogin: profile.isFirstLogin,
      lastLoginAt: profile.lastLoginAt
    }, { merge: true }).catch((err) => console.warn('Firestore user profile sync warning:', err));
  } catch (err) {
    console.warn('Firestore sync error:', err);
  }

  return profile;
}
