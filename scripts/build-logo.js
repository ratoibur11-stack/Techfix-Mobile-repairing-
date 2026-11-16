import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Exact SVG recreation of the user's uploaded banner logo
const fullLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 360" width="1440" height="360" fill="none">
  <defs>
    <!-- Radiant Metallic Gold Linear Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="85%">
      <stop offset="0%" stop-color="#FFFDF0" />
      <stop offset="15%" stop-color="#FDE047" />
      <stop offset="45%" stop-color="#EAB308" />
      <stop offset="75%" stop-color="#D97706" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>

    <!-- Vertical Gold Gradient for Ribbon & Details -->
    <linearGradient id="goldGradV" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="50%" stop-color="#EAB308" />
      <stop offset="100%" stop-color="#CA8A04" />
    </linearGradient>

    <!-- Subtle Premium Drop Shadow -->
    <filter id="logoShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- ==================== LEFT ICON EMBLEM ==================== -->
  <g transform="translate(40, 25)" filter="url(#logoShadow)">
    <!-- Back Orbit Swoosh (Behind Phone) -->
    <path
      d="M 60 70 C 130 20, 240 25, 270 90 C 285 125, 280 160, 250 185 C 242 192, 230 197, 218 190 C 235 165, 245 135, 230 105 C 210 65, 120 55, 60 85 Z"
      fill="url(#goldGrad)"
      opacity="0.95"
    />

    <!-- Smartphone Body Frame -->
    <rect
      x="80"
      y="15"
      width="160"
      height="280"
      rx="28"
      ry="28"
      fill="none"
      stroke="url(#goldGrad)"
      stroke-width="12"
      stroke-linejoin="round"
    />

    <!-- Phone Top Speaker Earpiece -->
    <rect x="135" y="27" width="50" height="5.5" rx="2.75" fill="url(#goldGrad)" />

    <!-- Phone Bottom Home Pill -->
    <rect x="135" y="278" width="50" height="7" rx="3.5" fill="url(#goldGrad)" />

    <!-- Center Mechanical Gear (8-Teeth) -->
    <g transform="translate(160, 155)">
      <path
        d="M -12 -54 L 12 -54 L 14 -42 L 28 -36 L 38 -45 L 55 -28 L 46 -18 L 52 -4 L 64 -2 L 64 22 L 52 24 L 46 38 L 55 48 L 38 65 L 28 56 L 14 62 L 12 74 L -12 74 L -14 62 L -28 56 L -38 65 L -55 48 L -46 38 L -52 24 L -64 22 L -64 -2 L -52 -4 L -46 -18 L -55 -28 L -38 -45 L -28 -36 L -14 -42 Z"
        fill="url(#goldGrad)"
      />
      <!-- Gear Center Cutout (Outer) -->
      <circle cx="0" cy="10" r="28" fill="#0f172a" />
      <circle cx="0" cy="10" r="28" fill="none" stroke="url(#goldGrad)" stroke-width="6" />

      <!-- Center Repair Wrench / Spanner (Slanted) -->
      <g transform="rotate(-42)">
        <!-- Wrench Shaft -->
        <rect x="-8" y="-12" width="16" height="60" rx="3" fill="url(#goldGrad)" />
        <!-- Wrench Head -->
        <circle cx="0" cy="-14" r="19" fill="url(#goldGrad)" />
        <!-- Wrench Jaw Cutout -->
        <polygon points="-8,-34 8,-34 6,-14 -6,-14" fill="#0f172a" />
      </g>
    </g>

    <!-- Front Orbit Swoosh (Loops dynamically in front of the phone) -->
    <path
      d="M 5 210 C 15 250, 70 305, 170 300 C 240 295, 290 255, 305 215 C 312 195, 300 190, 290 195 C 275 235, 225 270, 160 275 C 85 280, 35 240, 22 205 C 15 185, 0 190, 5 210 Z"
      fill="url(#goldGrad)"
    />
  </g>

  <!-- ==================== RIGHT BRAND TYPOGRAPHY ==================== -->
  <g transform="translate(390, 35)" filter="url(#logoShadow)">
    <!-- 1. "TECHFIX" Main Bold Brand Heading -->
    <g>
      <text
        x="0"
        y="125"
        font-family="'Montserrat', 'Arial Black', -apple-system, sans-serif"
        font-weight="900"
        font-size="142"
        letter-spacing="2"
        fill="url(#goldGrad)"
      >TECHFI</text>

      <!-- Stylized Custom 'X' with Extended Dynamic Wings -->
      <g transform="translate(565, 0)">
        <path
          d="M 12 18 L 48 18 L 84 72 L 122 18 L 168 18 L 108 92 L 175 182 L 128 182 L 82 114 L 38 182 L -6 182 L 58 92 Z"
          fill="url(#goldGrad)"
        />
        <!-- Top-Right Dynamic Wing Extension -->
        <polygon points="145,18 190,4 175,32" fill="url(#goldGrad)" />
        <!-- Bottom-Right Wing Accent -->
        <polygon points="160,165 192,185 145,182" fill="url(#goldGrad)" />
      </g>
    </g>

    <!-- 2. "MOBILE REPAIRING CENTER" Sub-Heading -->
    <g transform="translate(2, 185)">
      <text
        x="0"
        y="0"
        font-family="'Montserrat', 'Arial Black', system-ui, sans-serif"
        font-weight="900"
        font-size="42"
        letter-spacing="5"
        fill="url(#goldGrad)"
      >MOBILE REPAIRING CENTER</text>
    </g>

    <!-- 3. Golden Ribbon Banner Bar with Slogan -->
    <g transform="translate(0, 212)">
      <!-- Angled Trapezoid Golden Ribbon Background -->
      <polygon
        points="0,38 24,0 960,0 936,38"
        fill="url(#goldGradV)"
      />

      <!-- Crisp White Slogan Text Inside Banner -->
      <text
        x="480"
        y="26"
        font-family="'Montserrat', 'Arial Black', system-ui, sans-serif"
        font-weight="900"
        font-size="23"
        letter-spacing="3"
        text-anchor="middle"
        fill="#FFFFFF"
      >ALL MOBILE SOLUTIONS UNDER ONE ROOF</text>
    </g>
  </g>
</svg>`;

// Square Emblem SVG for App Icon, Favicons & PWA
const squareIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="sqGold" x1="0%" y1="0%" x2="100%" y2="85%">
      <stop offset="0%" stop-color="#FFFDF0" />
      <stop offset="15%" stop-color="#FDE047" />
      <stop offset="45%" stop-color="#EAB308" />
      <stop offset="75%" stop-color="#D97706" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>
    <linearGradient id="sqBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#020617" />
      <stop offset="100%" stop-color="#050B14" />
    </linearGradient>
    <filter id="sqShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Dark Premium Container (for standalone icons) -->
  <rect width="512" height="512" rx="100" fill="url(#sqBg)" />
  <rect width="504" height="504" x="4" y="4" rx="96" fill="none" stroke="url(#sqGold)" stroke-width="6" opacity="0.6" />

  <!-- Center Emblem -->
  <g transform="translate(100, 75)" filter="url(#sqShadow)">
    <!-- Back Orbit Swoosh -->
    <path
      d="M 60 70 C 130 20, 240 25, 270 90 C 285 125, 280 160, 250 185 C 242 192, 230 197, 218 190 C 235 165, 245 135, 230 105 C 210 65, 120 55, 60 85 Z"
      fill="url(#sqGold)"
      opacity="0.95"
    />

    <!-- Smartphone Body -->
    <rect
      x="80"
      y="15"
      width="160"
      height="280"
      rx="28"
      ry="28"
      fill="#0B132B"
      stroke="url(#sqGold)"
      stroke-width="12"
      stroke-linejoin="round"
    />

    <!-- Top Speaker Earpiece -->
    <rect x="135" y="27" width="50" height="5.5" rx="2.75" fill="url(#sqGold)" />

    <!-- Bottom Home Pill -->
    <rect x="135" y="278" width="50" height="7" rx="3.5" fill="url(#sqGold)" />

    <!-- Gear + Wrench -->
    <g transform="translate(160, 155)">
      <path
        d="M -12 -54 L 12 -54 L 14 -42 L 28 -36 L 38 -45 L 55 -28 L 46 -18 L 52 -4 L 64 -2 L 64 22 L 52 24 L 46 38 L 55 48 L 38 65 L 28 56 L 14 62 L 12 74 L -12 74 L -14 62 L -28 56 L -38 65 L -55 48 L -46 38 L -52 24 L -64 22 L -64 -2 L -52 -4 L -46 -18 L -55 -28 L -38 -45 L -28 -36 L -14 -42 Z"
        fill="url(#sqGold)"
      />
      <circle cx="0" cy="10" r="28" fill="#0B132B" />
      <circle cx="0" cy="10" r="28" fill="none" stroke="url(#sqGold)" stroke-width="6" />

      <g transform="rotate(-42)">
        <rect x="-8" y="-12" width="16" height="60" rx="3" fill="url(#sqGold)" />
        <circle cx="0" cy="-14" r="19" fill="url(#sqGold)" />
        <polygon points="-8,-34 8,-34 6,-14 -6,-14" fill="#0B132B" />
      </g>
    </g>

    <!-- Front Orbit Swoosh -->
    <path
      d="M 5 210 C 15 250, 70 305, 170 300 C 240 295, 290 255, 305 215 C 312 195, 300 190, 290 195 C 275 235, 225 270, 160 275 C 85 280, 35 240, 22 205 C 15 185, 0 190, 5 210 Z"
      fill="url(#sqGold)"
    />
  </g>

  <!-- Micro Brand Mark under Phone -->
  <text
    x="256"
    y="440"
    font-family="'Montserrat', 'Arial Black', sans-serif"
    font-weight="900"
    font-size="40"
    letter-spacing="5"
    text-anchor="middle"
    fill="url(#sqGold)"
  >TECHFIX</text>
</svg>`;

async function main() {
  const publicDir = path.resolve('public');
  const uploadsDir = path.resolve('public', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // 1. Write SVGs
  fs.writeFileSync(path.join(publicDir, 'techfix_official_logo.svg'), fullLogoSvg);
  fs.writeFileSync(path.join(publicDir, 'techfix-logo.svg'), fullLogoSvg);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), squareIconSvg);

  // 2. Render Full Banner Logo with transparent background (PNG)
  const fullLogoBuffer = await sharp(Buffer.from(fullLogoSvg))
    .png({ quality: 100 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'techfix_official_logo.png'), fullLogoBuffer);
  fs.writeFileSync(path.join(publicDir, 'techfix_shop_logo.png'), fullLogoBuffer);
  fs.writeFileSync(path.join(uploadsDir, 'techfix_shop_logo.png'), fullLogoBuffer);

  // 3. Render Square Icons for Favicon, PWA & Store App Icons
  const pwa512Buffer = await sharp(Buffer.from(squareIconSvg))
    .resize(512, 512)
    .png()
    .toBuffer();

  const pwa192Buffer = await sharp(Buffer.from(squareIconSvg))
    .resize(192, 192)
    .png()
    .toBuffer();

  const favicon32Buffer = await sharp(Buffer.from(squareIconSvg))
    .resize(32, 32)
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512Buffer);
  fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwa512Buffer);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pwa512Buffer);
  fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192Buffer);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), favicon32Buffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), favicon32Buffer);

  console.log('✅ ALL official logo and icon files generated and synced with 100% precision!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
