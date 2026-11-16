import React, { useState, useEffect } from 'react';
import { getLogoFromDb } from '../utils/logoStorage';
import { fetchShopLogoFromFirestore, subscribeToShopLogo, isDurableImageValue } from '../lib/firebase';

export const normalizeImageUrl = (raw: string | null | undefined): string => {
  if (!raw) return '';
  const clean = raw.trim();
  if (!clean || clean === 'undefined' || clean === 'null' || clean.length < 5) return '';

  // Google Drive sharing link conversion
  const gDriveMatch = clean.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gDriveMatch[1]}`;
  }

  // Dropbox link conversion
  if (clean.includes('dropbox.com')) {
    return clean.replace(/\?dl=0$/, '').replace(/\?dl=1$/, '') + '?raw=1';
  }

  // Imgur page URL conversion
  const imgurMatch = clean.match(/^https?:\/\/imgur\.com\/([a-zA-Z0-9]+)$/);
  if (imgurMatch && imgurMatch[1]) {
    return `https://i.imgur.com/${imgurMatch[1]}.png`;
  }

  return clean;
};

interface TechfixLogoProps {
  variant?: 'full' | 'horizontal' | 'mark';
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
  showSlogan?: boolean;
  customLogoUrl?: string;
}

export const TechfixLogo: React.FC<TechfixLogoProps> = ({
  variant = 'full',
  theme = 'auto',
  className = 'h-14 sm:h-16 w-auto',
  showSlogan = true,
  customLogoUrl
}) => {
  const isLight = theme === 'light';
  const [imageError, setImageError] = useState(false);
  const [activeCustomLogo, setActiveCustomLogo] = useState<string | null>(() => {
    if (customLogoUrl && customLogoUrl.trim() !== '') return customLogoUrl;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('techfix_custom_logo') || sessionStorage.getItem('techfix_custom_logo');
      if (stored && !stored.startsWith('/uploads/')) return stored;
    }
    return null;
  });

  useEffect(() => {
    let isMounted = true;
    if (customLogoUrl !== undefined) {
      if (customLogoUrl.trim() !== '') {
        setActiveCustomLogo(customLogoUrl);
        setImageError(false);
        return () => { isMounted = false; };
      }
      // Check if an explicit clear happened vs initial empty prop
      const stored = typeof window !== 'undefined' ? (localStorage.getItem('techfix_custom_logo') || sessionStorage.getItem('techfix_custom_logo')) : null;
      if (!stored) {
        setActiveCustomLogo(null);
      }
    }

    const stored = typeof window !== 'undefined' ? (localStorage.getItem('techfix_custom_logo') || sessionStorage.getItem('techfix_custom_logo')) : null;
    if (stored && isDurableImageValue(stored)) {
      setActiveCustomLogo(stored);
      setImageError(false);
    } else {
      // Priority 1: Check Cloud Firestore
      fetchShopLogoFromFirestore().then((fsLogo) => {
        if (!isMounted) return;
        if (fsLogo && fsLogo.trim() !== '' && isDurableImageValue(fsLogo)) {
          setActiveCustomLogo(fsLogo);
          setImageError(false);
          try {
            localStorage.setItem('techfix_custom_logo', fsLogo);
            sessionStorage.setItem('techfix_custom_logo', fsLogo);
          } catch (e) {}
          return;
        }
        // Priority 2: IndexedDB fallback
        getLogoFromDb().then((dbLogo) => {
          if (isMounted && dbLogo && isDurableImageValue(dbLogo)) {
            setActiveCustomLogo(dbLogo);
            setImageError(false);
            return;
          }
          // Priority 3: Local server API fallback
          fetch('/api/logo')
            .then(res => res.json())
            .then(data => {
              if (isMounted && data?.logoUrl) {
                setActiveCustomLogo(data.logoUrl);
                setImageError(false);
              }
            })
            .catch(() => {});
        });
      }).catch(() => {});
    }

    return () => { isMounted = false; };
  }, [customLogoUrl]);

  useEffect(() => {
    let isMounted = true;

    // Real-time Cloud Firestore sync (handles both updates and removals)
    const unsubFs = subscribeToShopLogo((remoteLogo) => {
      if (!isMounted) return;
      if (remoteLogo === '') {
        if (!customLogoUrl) {
          setActiveCustomLogo(null);
          setImageError(false);
        }
        return;
      }
      if (remoteLogo && remoteLogo.trim() !== '') {
        setActiveCustomLogo(remoteLogo);
        setImageError(false);
        try {
          localStorage.setItem('techfix_custom_logo', remoteLogo);
          sessionStorage.setItem('techfix_custom_logo', remoteLogo);
        } catch (e) {}
      }
    });

    const handleLogoSync = () => {
      if (customLogoUrl && customLogoUrl.trim() !== '') {
        setActiveCustomLogo(customLogoUrl);
        setImageError(false);
        return;
      }
      const stored = typeof window !== 'undefined' ? (localStorage.getItem('techfix_custom_logo') || sessionStorage.getItem('techfix_custom_logo')) : null;
      if (stored && stored.trim() !== '') {
        setActiveCustomLogo(stored);
        setImageError(false);
      } else {
        getLogoFromDb().then(dbLogo => {
          if (isMounted) {
            setActiveCustomLogo(dbLogo || null);
            setImageError(false);
          }
        });
      }
    };

    window.addEventListener('storage', handleLogoSync);
    window.addEventListener('techfix_logo_updated', handleLogoSync);
    return () => {
      isMounted = false;
      unsubFs();
      window.removeEventListener('storage', handleLogoSync);
      window.removeEventListener('techfix_logo_updated', handleLogoSync);
    };
  }, [customLogoUrl]);

  const normalizedSrc = normalizeImageUrl(activeCustomLogo);

  // If a manual custom logo was uploaded and hasn't errored, display it directly
  if (normalizedSrc && !imageError) {
    return (
      <img
        src={normalizedSrc}
        alt="TECHFIX Official Brand Logo"
        className={`${className} object-contain transition-transform bg-transparent select-none drop-shadow-md`}
        onError={() => {
          // If an ephemeral /uploads/ URL failed after restart, try IndexedDB or fall back cleanly
          if (normalizedSrc.startsWith('/uploads/')) {
            try { localStorage.removeItem('techfix_custom_logo'); } catch (e) {}
            getLogoFromDb().then(dbLogo => {
              if (dbLogo && !dbLogo.startsWith('/uploads/')) {
                setActiveCustomLogo(dbLogo);
                setImageError(false);
              } else {
                setImageError(true);
              }
            }).catch(() => setImageError(true));
          } else {
            setImageError(true);
          }
        }}
      />
    );
  }

  // 1. STANDALONE EMBLEM MARK (Hex Shield + Cyber Phone + Lightning Bolt & Precision Gear)
  if (variant === 'mark') {
    return (
      <svg
        viewBox="0 0 200 200"
        width="48"
        height="48"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="TECHFIX Modern Tech Emblem"
        style={{ display: 'inline-block', maxWidth: '100%', height: 'auto' }}
      >
        <defs>
          {/* Cyber Gold Gradient */}
          <linearGradient id="tfNewMarkGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="25%" stopColor="#FDE047" />
            <stop offset="55%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Electric Cyan Gradient */}
          <linearGradient id="tfNewMarkCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Shield Base Fill */}
          <linearGradient id="tfNewMarkShield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isLight ? '#F1F5F9' : '#0F172A'} />
            <stop offset="50%" stopColor={isLight ? '#E2E8F0' : '#090E17'} />
            <stop offset="100%" stopColor={isLight ? '#CBD5E1' : '#030712'} />
          </linearGradient>
        </defs>

        <g>
          {/* Hex Shield Outer Contour */}
          <polygon
            points="100,10 178,48 178,142 100,188 22,142 22,48"
            fill="url(#tfNewMarkShield)"
            stroke="url(#tfNewMarkGold)"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* Inner Accent Cyber Border */}
          <polygon
            points="100,22 166,54 166,134 100,174 34,134 34,54"
            fill="none"
            stroke="url(#tfNewMarkCyan)"
            strokeWidth="1.8"
            strokeDasharray="18 6"
            opacity="0.85"
          />

          {/* Smartphone Frame in Center */}
          <rect
            x="64"
            y="42"
            width="72"
            height="116"
            rx="14"
            ry="14"
            fill={isLight ? '#FFFFFF' : '#050B14'}
            stroke="url(#tfNewMarkGold)"
            strokeWidth="3.5"
          />

          {/* Phone Top Speaker / Camera Notch */}
          <rect x="88" y="49" width="24" height="3.5" rx="1.75" fill="url(#tfNewMarkCyan)" />

          {/* Phone Home Bar */}
          <rect x="88" y="148" width="24" height="3" rx="1.5" fill="url(#tfNewMarkGold)" opacity="0.8" />

          {/* Center Tech Heart: Precision Gear + Speed Lightning Bolt */}
          <g transform="translate(100, 98)">
            {/* Gear Body */}
            <path
              d="M -6 -24 L 6 -24 L 8 -19 L 16 -16 L 21 -21 L 30 -12 L 25 -7 L 28 1 L 34 3 L 34 15 L 28 17 L 25 25 L 30 30 L 21 39 L 16 34 L 8 37 L 6 42 L -6 42 L -8 37 L -16 34 L -21 39 L -30 30 L -25 25 L -28 17 L -34 15 L -34 3 L -28 1 L -25 -7 L -30 -12 L -21 -21 L -16 -16 L -8 -19 Z"
              fill={isLight ? '#E2E8F0' : '#0E1726'}
              stroke="url(#tfNewMarkCyan)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Inner Gear Circle */}
            <circle cx="0" cy="9" r="13" fill={isLight ? '#F8FAFC' : '#050B14'} stroke="url(#tfNewMarkGold)" strokeWidth="2" />

            {/* Dynamic Electric Lightning Bolt Over Gear */}
            <path
              d="M 4 -15 L -10 9 L -2 9 L -6 28 L 12 4 L 3 4 Z"
              fill="url(#tfNewMarkGold)"
              stroke={isLight ? '#B45309' : '#FFFBEB'}
              strokeWidth="1.2"
              strokeLinejoin="miter"
            />
          </g>

          {/* Corner Circuit Pins */}
          <circle cx="34" cy="54" r="3.5" fill="#38BDF8" />
          <circle cx="166" cy="54" r="3.5" fill="#F59E0B" />
          <circle cx="34" cy="134" r="3.5" fill="#F59E0B" />
          <circle cx="166" cy="134" r="3.5" fill="#38BDF8" />
        </g>
      </svg>
    );
  }

  // 2. COMPLETE BRAND LOGO (Left Emblem + Modern TECHFIX Typography + Subtitle + Badge)
  return (
    <svg
      viewBox="0 0 880 180"
      width="240"
      height="50"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TECHFIX Modern Mobile Repairing Center Logo"
      style={{ display: 'inline-block', maxWidth: '100%', height: 'auto' }}
    >
      <defs>
        {/* Luminous Gold Gradient */}
        <linearGradient id={`tfFullGold_${theme}`} x1="0%" y1="0%" x2="100%" y2="85%">
          <stop offset="0%" stopColor="#FFFDF0" />
          <stop offset="25%" stopColor="#FDE047" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="85%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Cyber Cyan Gradient */}
        <linearGradient id={`tfFullCyan_${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="40%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Shield Fill Gradient */}
        <linearGradient id={`tfFullShield_${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isLight ? '#F8FAFC' : '#0F172A'} />
          <stop offset="50%" stopColor={isLight ? '#E2E8F0' : '#0A101D'} />
          <stop offset="100%" stopColor={isLight ? '#CBD5E1' : '#020617'} />
        </linearGradient>
      </defs>

      {/* LEFT ICON EMBLEM */}
      <g transform="translate(10, 5)">
        {/* Hex Shield Contour */}
        <polygon
          points="80,10 144,42 144,124 80,164 16,124 16,42"
          fill={isLight ? '#F8FAFC' : '#0F172A'}
          stroke={isLight ? '#D97706' : '#F59E0B'}
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Inner Cyan Accent Trim */}
        <polygon
          points="80,20 134,48 134,116 80,152 26,116 26,48"
          fill="none"
          stroke={isLight ? '#0284C7' : '#38BDF8'}
          strokeWidth="1.5"
          strokeDasharray="14 5"
          opacity="0.85"
        />

        {/* Modern Smartphone */}
        <rect
          x="50"
          y="36"
          width="60"
          height="100"
          rx="12"
          ry="12"
          fill={isLight ? '#FFFFFF' : '#050B14'}
          stroke={isLight ? '#D97706' : '#F59E0B'}
          strokeWidth="3"
        />

        {/* Speaker notch */}
        <rect x="70" y="42" width="20" height="3" rx="1.5" fill={isLight ? '#0284C7' : '#38BDF8'} />

        {/* Home bar */}
        <rect x="70" y="127" width="20" height="2.5" rx="1.25" fill={isLight ? '#D97706' : '#F59E0B'} />

        {/* Precision Gear + Lightning Center */}
        <g transform="translate(80, 85)">
          <path
            d="M -5 -20 L 5 -20 L 7 -16 L 13 -13 L 17 -17 L 25 -10 L 21 -6 L 23 1 L 28 3 L 28 13 L 23 15 L 21 21 L 25 25 L 17 33 L 13 29 L 7 31 L 5 35 L -5 35 L -7 31 L -13 29 L -17 33 L -25 25 L -21 21 L -23 15 L -28 13 L -28 3 L -23 1 L -21 -6 L -25 -10 L -17 -17 L -13 -13 L -7 -16 Z"
            fill={isLight ? '#E2E8F0' : '#0E1726'}
            stroke={isLight ? '#0284C7' : '#38BDF8'}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="0" cy="7.5" r="10.5" fill={isLight ? '#F8FAFC' : '#050B14'} stroke={isLight ? '#D97706' : '#F59E0B'} strokeWidth="1.8" />

          {/* Electric Lightning Bolt */}
          <path
            d="M 3.5 -12 L -8 7 L -1 7 L -4 23 L 10 3 L 2.5 3 Z"
            fill={isLight ? '#D97706' : '#F59E0B'}
            stroke={isLight ? '#B45309' : '#FFFBEB'}
            strokeWidth="1"
            strokeLinejoin="miter"
          />
        </g>

        {/* Corner Nodes */}
        <circle cx="26" cy="48" r="3" fill="#38BDF8" />
        <circle cx="134" cy="48" r="3" fill="#F59E0B" />
        <circle cx="26" cy="116" r="3" fill="#F59E0B" />
        <circle cx="134" cy="116" r="3" fill="#38BDF8" />
      </g>

      {/* RIGHT TYPOGRAPHY & BRANDING LOCKUP */}
      <g transform="translate(185, 20)">
        {/* ROW 1: "TECH" + "FIX" */}
        <g>
          {/* "TECH" */}
          <text
            x="0"
            y="66"
            fontFamily="'Montserrat', 'Arial Black', Arial, sans-serif"
            fontWeight="900"
            fontSize="68"
            letterSpacing="1.5"
            fill={isLight ? '#0F172A' : '#F8FAFC'}
          >
            TECH
          </text>

          {/* "FIX" in Radiant Metallic Gold */}
          <text
            x="208"
            y="66"
            fontFamily="'Montserrat', 'Arial Black', Arial, sans-serif"
            fontWeight="900"
            fontSize="68"
            letterSpacing="2"
            fill={isLight ? '#D97706' : '#F59E0B'}
          >
            FIX
          </text>

          {/* Dynamic Stylized Apex Accent on the X */}
          <path
            d="M 326 12 L 344 12 L 358 32 L 340 32 Z"
            fill={isLight ? '#0284C7' : '#38BDF8'}
            opacity="0.95"
          />
        </g>

        {/* ROW 2: "MOBILE REPAIRING CENTER" */}
        <g transform="translate(2, 94)">
          <text
            x="0"
            y="0"
            fontFamily="'Montserrat', 'Arial Black', Arial, sans-serif"
            fontWeight="800"
            fontSize="21"
            letterSpacing="4.5"
            fill={isLight ? '#B45309' : '#FCD34D'}
          >
            MOBILE REPAIRING CENTER
          </text>
        </g>

        {/* ROW 3: REFINED SLOGAN BAR */}
        {showSlogan && (
          <g transform="translate(0, 108)">
            {/* Pill Background */}
            <rect
              x="0"
              y="0"
              width="510"
              height="26"
              rx="6"
              fill={isLight ? '#F1F5F9' : '#0B132B'}
              stroke={isLight ? '#D97706' : `url(#tfFullGold_${theme})`}
              strokeWidth="1.2"
            />

            {/* Indicator Dots */}
            <circle cx="16" cy="13" r="3.5" fill="#38BDF8" />
            <circle cx="494" cy="13" r="3.5" fill="#F59E0B" />

            {/* Slogan Text */}
            <text
              x="255"
              y="17"
              fontFamily="'Montserrat', Arial, sans-serif"
              fontWeight="800"
              fontSize="12.5"
              letterSpacing="2"
              textAnchor="middle"
              fill={isLight ? '#1E293B' : '#E2E8F0'}
            >
              ALL MOBILE SOLUTIONS UNDER ONE ROOF
            </text>
          </g>
        )}
      </g>
    </svg>
  );
};
