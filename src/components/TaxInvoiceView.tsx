import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  ShieldCheck,
  ExternalLink,
  Edit3,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles
} from 'lucide-react';
import { TaxInvoiceData, ShopBusinessDetails } from '../types';
import { InvoiceImageUploadModal } from './InvoiceImageUploadModal';
import {
  saveInvoiceBrandingToFirestore,
  subscribeToInvoiceBranding,
  logActivityToFirestore
} from '../lib/firebase';

interface TaxInvoiceViewProps {
  invoice: TaxInvoiceData;
  businessDetails?: ShopBusinessDetails;
  onUpdateInvoice?: (updated: TaxInvoiceData) => void;
  className?: string;
  hideActionButtons?: boolean;
}

export const TaxInvoiceView: React.FC<TaxInvoiceViewProps> = ({
  invoice,
  businessDetails,
  onUpdateInvoice,
  className = '',
  hideActionButtons = false
}) => {
  // Modal states for custom image uploads
  const [isHeaderImageModalOpen, setIsHeaderImageModalOpen] = useState(false);
  const [showDefaultHeaderFallback] = useState(false);
  const [cloudHeaderBanner, setCloudHeaderBanner] = useState<string | null>(null);
  const [cloudSignatureUrl, setCloudSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToInvoiceBranding((branding) => {
      if (branding.headerBannerImageUrl !== undefined) {
        setCloudHeaderBanner(branding.headerBannerImageUrl || null);
        try {
          if (branding.headerBannerImageUrl) {
            localStorage.setItem('techfix_invoice_header_banner', branding.headerBannerImageUrl);
          } else {
            localStorage.removeItem('techfix_invoice_header_banner');
          }
        } catch (e) {}
      }
      if (branding.digitalSignatureUrl !== undefined) {
        setCloudSignatureUrl(branding.digitalSignatureUrl || null);
      }
    });
    return () => unsub();
  }, []);

  // Resolved shop details
  const shopName = businessDetails?.name || 'TECHFIX MOBILE REPAIRING SHOP';
  const shopTagline = businessDetails?.tagline || 'ALL MOBILE SOLUTIONS UNDER ONE ROOF';
  const shopAddress = businessDetails?.address || 'Dubapara Lupta Char, Goalpara, Assam, India';
  const shopPhone = businessDetails?.phone || '+91 98642 45987';
  const shopEmail = businessDetails?.email || 'ratoibur11@gmail.com';
  const shopWebsite = businessDetails?.websiteDomain || 'sarate.wuaze.com';
  const shopGstin = invoice.gstin || businessDetails?.gstin || '';
  const shopLogoUrl = businessDetails?.logoUrl;

  const isNonGst = invoice.isNonGst !== false; // Default is Non-GST as requested

  // Format currency
  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Computed totals (supports subtotal + discount cleanly)
  const itemsSubtotal =
    invoice.subtotal !== undefined && invoice.subtotal > 0
      ? invoice.subtotal
      : invoice.items.reduce((sum, item) => sum + (item.total || item.rate * item.quantity), 0);
  const discountAmount = Math.max(0, invoice.discount || 0);
  const grandTotal =
    invoice.totalAmountAfterTax !== undefined
      ? invoice.totalAmountAfterTax
      : Math.max(0, itemsSubtotal - discountAmount);

  // Generate UPI QR Code URL
  const upiId = invoice.bankDetails?.upiId || businessDetails?.upiId || '9864245987@paytm';
  const upiAmount = grandTotal.toFixed(2);
  const upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&am=${encodeURIComponent(upiAmount)}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}`;
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiPayload)}`;

  // Verification QR Code URL (High-res 300x300 matching UPI QR code size)
  const verificationTargetUrl = invoice.verificationUrl
    ? (invoice.verificationUrl.startsWith('http') ? invoice.verificationUrl : `https://${invoice.verificationUrl}`)
    : `https://${shopWebsite}/verify?inv=${invoice.invoiceNumber}`;
  const verifyQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verificationTargetUrl)}`;

  // Website Visit QR Code URL (Added as requested: "qr add kar Website visit ke liye")
  const rawWebsite = shopWebsite || 'sarate.wuaze.com';
  const websiteVisitUrl = rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`;
  const websiteQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(websiteVisitUrl)}`;

  // Header image save handler
  const handleHeaderImageSaved = (url: string | null) => {
    if (onUpdateInvoice) {
      onUpdateInvoice({
        ...invoice,
        headerBannerImageUrl: url || ''
      });
    }
    setCloudHeaderBanner(url || null);
    try {
      if (url) localStorage.setItem('techfix_invoice_header_banner', url);
      else localStorage.removeItem('techfix_invoice_header_banner');
    } catch (e) {}
    saveInvoiceBrandingToFirestore({ headerBannerImageUrl: url || '' }).catch(() => {});
    logActivityToFirestore(
      url ? 'Invoice Header Banner Updated' : 'Invoice Header Banner Removed',
      'INVOICE',
      url ? `Updated header banner image on Invoice #${invoice.invoiceNumber}` : `Removed header banner on Invoice #${invoice.invoiceNumber}`
    ).catch(() => {});
  };

  const activeHeaderBanner =
    invoice.headerBannerImageUrl !== undefined && invoice.headerBannerImageUrl !== ''
      ? invoice.headerBannerImageUrl
      : (cloudHeaderBanner || (typeof window !== 'undefined' ? localStorage.getItem('techfix_invoice_header_banner') : null));
  const activeSignatureUrl = invoice.digitalSignatureUrl || cloudSignatureUrl || undefined;

  return (
    <div
      id="printable-tax-invoice-sheet"
      className={`bg-white text-slate-900 mx-auto font-sans text-xs flex flex-col justify-between print:p-0 print:m-0 print:w-full print:max-w-none print:shadow-none ${className}`}
      style={{
        width: '100%',
        maxWidth: '820px',
        minHeight: '1115px',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        padding: '18px 22px',
        boxSizing: 'border-box'
      }}
    >
      {/* ============================================================== */}
      {/* 1. TOP HEADER SECTION - SINGLE CLEAN BLUE BORDER (NO DOUBLE BORDER) */}
      {/* ============================================================== */}
      <div className="mb-2 relative group bg-white overflow-hidden">
        {activeHeaderBanner && !showDefaultHeaderFallback ? (
          /* User's Uploaded Custom Header Banner with Single Clean Blue Border */
          <div
            className="relative rounded-none overflow-hidden bg-white w-full"
            style={{
              border: '2px solid #1d4ed8',
              borderColor: '#1d4ed8'
            }}
          >
            <img
              src={activeHeaderBanner}
              alt="Custom Invoice Header Banner"
              className="w-full h-auto max-h-[140px] sm:max-h-[160px] object-contain object-center mx-auto block"
            />
            {/* Hover toolbar for editing header image */}
            {!hideActionButtons && (
              <div className="no-print absolute top-1 right-1 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition z-10">
                <button
                  type="button"
                  onClick={() => setIsHeaderImageModalOpen(true)}
                  className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black flex items-center gap-1 shadow-md border border-white"
                  title="Change Header Image"
                >
                  <Upload className="w-3 h-3" />
                  <span>Change Header Banner</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleHeaderImageSaved(null)}
                  className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white shadow-md border border-white"
                  title="Remove Header Image"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Upload prompt or default generated header inside Blue Border */
          <div className="space-y-2">
            {/* Custom Header Banner Upload Trigger Button (Visible on screen, hidden on print) */}
            {!hideActionButtons && (
              <div className="no-print p-2.5 border-2 border-dashed border-blue-400 hover:border-blue-600 bg-blue-50/70 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-blue-950">
                      Upload Custom Header Banner / Letterhead Image
                    </p>
                    <p className="text-[11px] text-blue-700">
                      Upload your shop letterhead or logo banner image to display in this top blue bordered area.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHeaderImageModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Header Image</span>
                </button>
              </div>
            )}

            {/* Generated Header (Single Clean Blue Border) */}
            {(!activeHeaderBanner || showDefaultHeaderFallback) && (
              <div
                className="p-2 sm:p-2.5 bg-white"
                style={{
                  border: '2px solid #1d4ed8',
                  borderColor: '#1d4ed8'
                }}
              >
                <div className="flex flex-row items-center justify-between gap-4">
                  {/* Left: Logo & Shop Title */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {shopLogoUrl ? (
                        <img
                          src={shopLogoUrl}
                          alt="Shop Logo"
                          className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded"
                        />
                      ) : (
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full text-blue-600">
                            <rect x="24" y="10" width="52" height="80" rx="8" fill="none" stroke="#0284c7" strokeWidth="5" />
                            <circle cx="50" cy="82" r="3" fill="#0284c7" />
                            <line x1="40" y1="16" x2="60" y2="16" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                            <g transform="translate(50, 48) scale(0.65)">
                              <circle cx="0" cy="0" r="18" fill="none" stroke="#0f172a" strokeWidth="6" />
                              <circle cx="0" cy="0" r="8" fill="#0f172a" />
                              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                                <rect
                                  key={deg}
                                  x="-4"
                                  y="-26"
                                  width="8"
                                  height="8"
                                  rx="1.5"
                                  fill="#0f172a"
                                  transform={`rotate(${deg})`}
                                />
                              ))}
                            </g>
                            <path d="M62 30 L40 68" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0f2854] font-sans">
                        TECHFIX
                      </h1>
                      <p className="text-[10px] sm:text-[11px] font-bold text-[#0284c7] tracking-wider uppercase">
                        MOBILE REPAIRING SHOP
                      </p>
                      <div className="mt-0.5 inline-block bg-[#0284c7] text-white text-[8px] sm:text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                        {shopTagline}
                      </div>
                    </div>
                  </div>

                  {/* Center: Contact & Web Details */}
                  <div className="flex flex-col gap-0.5 text-[10px] sm:text-[11px] text-slate-800 font-medium border-l border-r border-slate-200 px-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#0284c7] shrink-0" />
                      <span className="font-semibold text-slate-900">{shopAddress}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#0284c7] shrink-0" />
                      <span><strong>{shopPhone}</strong> <span className="text-slate-500 text-[9px]">(WhatsApp / Call)</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-[#0284c7] shrink-0" />
                      <span className="text-slate-700">{shopEmail}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-[#0284c7] shrink-0" />
                      <span className="text-blue-700 font-semibold">{shopWebsite}</span>
                    </div>
                  </div>

                  {/* Right: 3x3 Brand Pill Grid */}
                  <div className="grid grid-cols-3 gap-1 shrink-0 items-center justify-items-center">
                    <div className="bg-[#0c4da2] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full w-12 text-center tracking-tight">SAMSUNG</div>
                    <div className="bg-black text-white p-0.5 rounded w-6 h-5 flex items-center justify-center">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 170 170"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.85-11.71-14.43-5.74-9.25-10.27-19.8-13.6-31.65-3.33-11.85-5-22.95-5-33.31 0-14.28 3.57-26.15 10.7-35.61 7.14-9.46 16.29-14.34 27.46-14.65 4.8 0 10.15 1.25 16.05 3.75 5.91 2.5 9.77 3.86 11.6 4.09 1.43-.23 5.41-1.65 11.95-4.27 6.54-2.62 12.18-3.8 16.92-3.55 12.74.88 22.84 5.37 30.3 13.48-11.06 6.74-16.48 16.14-16.26 28.2.22 9.5 3.82 17.38 10.8 23.63 7.02 6.25 15.34 9.8 24.96 10.65-2.22 6.53-4.8 13.06-7.75 19.6zM119.22 31.84c0-7.07 2.56-13.78 7.68-20.12 5.12-6.34 11.58-10.45 19.38-12.33.22 1.3.33 2.45.33 3.44 0 7.07-2.67 13.75-8.02 20.04-5.35 6.29-11.8 10.28-19.37 11.97z" /></svg>
                    </div>
                    <div className="bg-[#ff6700] text-white font-black text-[9px] px-1 py-0.5 rounded-xs w-6 h-5 flex items-center justify-center">mi</div>
                    <div className="bg-[#0082f0] text-white text-[8px] font-black px-1.5 py-0.5 rounded-xs w-12 text-center">vivo</div>
                    <div className="bg-[#008b47] text-white text-[8px] font-black px-1.5 py-0.5 rounded-xs w-12 text-center">oppo</div>
                    <div className="bg-[#ffc800] text-black text-[8px] font-black px-1.5 py-0.5 rounded-xs w-12 text-center">realme</div>
                    <div className="bg-[#eb0028] text-white text-[7.5px] font-black px-1 py-0.5 rounded-xs w-12 text-center flex items-center justify-center gap-0.5">
                      <span className="border border-white px-0.5 text-[6.5px]">1+</span><span>ONEPLUS</span>
                    </div>
                    <div className="bg-black text-white p-0.5 rounded-full w-5 h-5 flex items-center justify-center">
                      <span className="font-sans font-black text-[10px] leading-none">M</span>
                    </div>
                    <div className="bg-white border border-red-200 text-[#eb0028] text-[8.5px] font-black italic px-1.5 py-0.5 rounded-xs w-12 text-center">itel</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slogan Banner Bar */}
      <div className="my-1.5 border-t-2 border-b-2 border-[#1d4ed8] py-0.5 text-center">
        <p className="text-[9.5px] sm:text-[10.5px] font-extrabold text-[#1d4ed8] tracking-[0.25em] uppercase">
          GENUINE PARTS &nbsp;&nbsp;|&nbsp;&nbsp; EXPERT TECHNICIANS &nbsp;&nbsp;|&nbsp;&nbsp; BEST SERVICE
        </p>
      </div>

      {/* ============================================================== */}
      {/* 2. TITLE RIBBON (NON-GST CASH MEMO / INVOICE)                 */}
      {/* ============================================================== */}
      <div className="border-2 border-[#1d4ed8] rounded-none my-1.5 overflow-hidden flex flex-row items-center justify-between bg-white">
        {/* Left: Non-GST Note or GSTIN */}
        <div className="px-3 py-1 font-bold text-slate-900 text-[10.5px] sm:text-[11.5px]">
          {isNonGst ? (
            <span className="font-mono text-slate-800 tracking-wide font-black uppercase text-[10px]">
              RETAIL CASH MEMO / BILL
            </span>
          ) : (
            <>
              <span>GSTIN : </span>
              <strong className="font-mono text-slate-950 font-black tracking-wide">{shopGstin}</strong>
            </>
          )}
        </div>

        {/* Center: Slanted Royal Blue Ribbon "INVOICE" */}
        <div className="relative">
          <div
            className="bg-[#1d4ed8] text-white font-black text-sm sm:text-base px-8 sm:px-12 py-1 uppercase tracking-widest text-center shadow-inner"
            style={{
              clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)'
            }}
          >
            {invoice.invoiceTitle || (isNonGst ? 'INVOICE' : 'TAX INVOICE')}
          </div>
        </div>

        {/* Right: Original for Recipient */}
        <div className="px-3 py-1 font-bold text-slate-800 text-[9px] sm:text-[10px] uppercase tracking-wider text-right">
          ORIGINAL FOR RECIPIENT
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. CUSTOMER DETAILS & INVOICE META GRID                       */}
      {/* ============================================================== */}
      <div className="border-2 border-[#1d4ed8] grid grid-cols-12 divide-x-2 divide-[#1d4ed8] my-1.5 bg-white">
        {/* Left 7 cols: Customer Details */}
        <div className="col-span-7 p-2.5 space-y-0.5">
          <h3 className="text-[11px] font-black text-[#1d4ed8] uppercase tracking-wide pb-0.5">
            Customer Detail
          </h3>
          <div className="grid grid-cols-12 gap-y-0.5 text-[10.5px] sm:text-[11.5px] leading-tight text-slate-800">
            <div className="col-span-3 text-slate-700 font-semibold">Name</div>
            <div className="col-span-1 text-center font-bold">:</div>
            <div className="col-span-8 font-bold text-slate-950 uppercase">{invoice.customerName}</div>

            <div className="col-span-3 text-slate-700 font-semibold">Address</div>
            <div className="col-span-1 text-center font-bold">:</div>
            <div className="col-span-8 text-slate-900">{invoice.customerAddress}</div>

            <div className="col-span-3 text-slate-700 font-semibold uppercase">Phone</div>
            <div className="col-span-1 text-center font-bold">:</div>
            <div className="col-span-8 font-bold font-mono text-slate-950">{invoice.customerPhone}</div>

            {!isNonGst && (
              <>
                <div className="col-span-3 text-slate-700 font-semibold">GSTIN</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-8 font-mono">{invoice.customerGstin || '-'}</div>
              </>
            )}

            <div className="col-span-3 text-[#0284c7] font-bold">Location</div>
            <div className="col-span-1 text-center font-bold text-[#0284c7]">:</div>
            <div className="col-span-8 font-bold text-[#0284c7]">{invoice.placeOfSupply || 'Goalpara (Assam)'}</div>
          </div>
        </div>

        {/* Right 5 cols: Invoice No. & Date */}
        <div className="col-span-5 p-2.5 flex flex-col justify-between">
          <div className="grid grid-cols-12 items-center text-xs sm:text-sm">
            <div className="col-span-6 font-semibold text-slate-700">Invoice No.</div>
            <div className="col-span-6 text-right font-black font-mono text-base sm:text-lg text-slate-950">
              {invoice.invoiceNumber}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-1.5 grid grid-cols-12 items-center text-xs sm:text-sm">
            <div className="col-span-6 font-semibold text-slate-700">Invoice Date</div>
            <div className="col-span-6 text-right font-bold font-mono text-xs sm:text-sm text-slate-950">
              {invoice.invoiceDate}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. PRODUCTS & SERVICES ITEM TABLE (SPACIOUS 2-3+ PRODUCTS)     */}
      {/* ============================================================== */}
      <div className="border-2 border-[#1d4ed8] my-1.5 overflow-hidden bg-white flex-1 flex flex-col">
        <table className="w-full h-full text-left text-[10px] sm:text-[11px] border-collapse">
          <thead>
            <tr className="bg-[#e0f2fe] text-[#0f2854] font-black border-b-2 border-[#1d4ed8] text-[9.5px] sm:text-[10.5px]">
              <th className="py-2 px-2 text-center border-r-2 border-[#1d4ed8] w-10">
                Sr.<br />No.
              </th>
              <th className="py-2 px-3 text-center border-r-2 border-[#1d4ed8]">
                Name of Product / Service
              </th>
              <th className="py-2 px-2 text-center border-r-2 border-[#1d4ed8] w-20">
                Item Code / HSN
              </th>
              <th className="py-2 px-2 text-center border-r-2 border-[#1d4ed8] w-16">
                Qty
              </th>
              <th className="py-2 px-3 text-center border-r-2 border-[#1d4ed8] w-28">
                Rate
              </th>
              <th className="py-2 px-3 text-center w-32">
                Total Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => {
              const itemTotal = item.total || (item.rate * item.quantity);
              return (
                <tr key={item.id || idx} style={{ height: '1px' }} className="hover:bg-slate-50/60 transition-colors">
                  {/* Sr No */}
                  <td className="py-2.5 px-2 text-center font-bold text-slate-700 border-r-2 border-[#1d4ed8] align-top">
                    {idx + 1}
                  </td>

                  {/* Name & Subtext */}
                  <td className="py-2.5 px-3 border-r-2 border-[#1d4ed8] align-top">
                    <div className="font-black text-slate-950 text-[10.5px] sm:text-[11.5px]">
                      {item.name}
                    </div>
                    {item.subText && (
                      <div className="text-[9px] sm:text-[10px] text-slate-600 font-mono mt-0.5 font-medium">
                        {item.subText}
                      </div>
                    )}
                  </td>

                  {/* Item Code / HSN */}
                  <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-700 border-r-2 border-[#1d4ed8] align-top">
                    {item.hsnSac || '-'}
                  </td>

                  {/* Qty */}
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900 border-r-2 border-[#1d4ed8] align-top whitespace-nowrap">
                    {item.quantity} {item.unit || 'PCS'}
                  </td>

                  {/* Rate */}
                  <td className="py-2.5 px-3 text-right font-mono text-slate-800 border-r-2 border-[#1d4ed8] align-top whitespace-nowrap">
                    {formatInr(item.rate)}
                  </td>

                  {/* Total Amount */}
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 align-top whitespace-nowrap">
                    {formatInr(itemTotal)}
                  </td>
                </tr>
              );
            })}

            {/* Minimum 3-product height filler rows with continuous vertical column dividers */}
            {Array.from({ length: Math.max(0, 3 - invoice.items.length) }).map((_, emptyIdx) => (
              <tr key={`empty-slot-${emptyIdx}`} style={{ height: '48px' }}>
                <td className="border-r-2 border-[#1d4ed8]">&nbsp;</td>
                <td className="border-r-2 border-[#1d4ed8]">&nbsp;</td>
                <td className="border-r-2 border-[#1d4ed8]">&nbsp;</td>
                <td className="border-r-2 border-[#1d4ed8]">&nbsp;</td>
                <td className="border-r-2 border-[#1d4ed8]">&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}

            {/* Dynamic Flex Spacer Row so the table fills remaining A4 page height cleanly */}
            <tr style={{ height: '100%' }}>
              <td className="border-r-2 border-[#1d4ed8]"></td>
              <td className="border-r-2 border-[#1d4ed8]"></td>
              <td className="border-r-2 border-[#1d4ed8]"></td>
              <td className="border-r-2 border-[#1d4ed8]"></td>
              <td className="border-r-2 border-[#1d4ed8]"></td>
              <td></td>
            </tr>

            {/* Total Summary Row */}
            <tr style={{ height: '1px' }} className="bg-white border-t-2 border-[#1d4ed8] font-black text-[10.5px] sm:text-[11.5px]">
              <td colSpan={2} className="py-2 px-3 text-right font-black border-r-2 border-[#1d4ed8]">
                Total
              </td>
              <td className="border-r-2 border-[#1d4ed8]"></td>
              <td className="py-2 px-2 text-center font-black font-mono border-r-2 border-[#1d4ed8]">
                {invoice.totalQty}
              </td>
              <td className="border-r-2 border-[#1d4ed8]"></td>
              <td className="py-2 px-3 text-right font-black font-mono text-slate-950 whitespace-nowrap">
                {formatInr(itemsSubtotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ============================================================== */}
      {/* 5. TOTAL IN WORDS, BANK DETAILS, DISCOUNT SUMMARY & DUAL QR    */}
      {/* ============================================================== */}
      <div className="grid grid-cols-12 gap-2 my-1.5 items-stretch">
        {/* Left Column (7 cols): Total in Words + Bank Details (Clean, Bottom Banner Removed) */}
        <div className="col-span-7 flex flex-col justify-between space-y-2">
          {/* Total in words box */}
          <div className="border-2 border-[#1d4ed8] overflow-hidden bg-white">
            <div className="bg-[#e0f2fe] text-[#0f2854] font-black text-[10px] sm:text-[10.5px] px-2.5 py-1 border-b border-[#1d4ed8] text-center uppercase tracking-wide">
              Total in words
            </div>
            <div className="p-2 text-[10px] sm:text-[11px] font-black uppercase text-slate-950 leading-relaxed text-center break-words">
              {invoice.totalInWords}
            </div>
          </div>

          {/* Bank Details & UPI QR Box */}
          <div className="border-2 border-[#1d4ed8] overflow-hidden bg-white flex-1 flex flex-col justify-between">
            <div className="bg-[#e0f2fe] text-[#0f2854] font-black text-[10px] sm:text-[10.5px] px-2.5 py-1 border-b border-[#1d4ed8] text-center uppercase tracking-wide">
              Bank Details
            </div>
            <div className="p-2.5 grid grid-cols-12 gap-2 items-center flex-1">
              {/* Account info */}
              <div className="col-span-7 text-[10px] sm:text-[10.5px] space-y-0.5 leading-snug">
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-slate-600 font-semibold">Name</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold text-slate-950 uppercase">
                    {invoice.bankDetails?.name || shopName}
                  </span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-slate-600 font-semibold">Branch</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-semibold text-slate-900">
                    {invoice.bankDetails?.branch || 'Goalpara'}
                  </span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-slate-600 font-semibold">A/c No.</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-black font-mono text-slate-950">
                    {invoice.bankDetails?.accountNumber || '50200012345678'}
                  </span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-slate-600 font-semibold">IFSC</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-black font-mono text-slate-950">
                    {invoice.bankDetails?.ifsc || 'HDFC0001234'}
                  </span>
                </div>
                <div className="grid grid-cols-12 pt-1 border-t border-slate-200">
                  <span className="col-span-4 text-[#0284c7] font-bold">UPI ID</span>
                  <span className="col-span-1 text-center font-bold text-[#0284c7]">:</span>
                  <span className="col-span-7 font-black font-mono text-[#0284c7]">
                    {invoice.bankDetails?.upiId || upiId}
                  </span>
                </div>
              </div>

              {/* UPI QR Code Container */}
              <div className="col-span-5 flex flex-col items-center justify-center p-1.5 border border-slate-200 rounded bg-slate-50">
                <div className="relative bg-white p-1 rounded border border-slate-300 shadow-xs">
                  <img
                    src={upiQrUrl}
                    alt="UPI Payment QR"
                    className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-white border border-slate-400 text-[#0284c7] font-black text-[7px] px-1 py-0.2 rounded shadow-xs uppercase">
                      UPI
                    </span>
                  </div>
                </div>
                <span className="mt-1 text-[8.5px] font-black uppercase text-slate-800 tracking-wider">
                  Scan & Pay via UPI
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Summary with Discount + Clean Dual QR Box */}
        <div className="col-span-5 flex flex-col justify-between space-y-2">
          {/* Financial Breakdown Box (Subtotal, Discount, Total Amount) */}
          <div className="border-2 border-[#1d4ed8] overflow-hidden bg-white">
            <div className="divide-y divide-slate-200 text-[10.5px] sm:text-[11.5px]">
              <div className="flex items-center justify-between p-1.5 px-3">
                <span className="font-semibold text-slate-700">Subtotal Amount</span>
                <span className="font-mono font-bold text-slate-900">{formatInr(itemsSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between p-1.5 px-3 text-emerald-700 bg-emerald-50/40">
                  <span className="font-bold">Discount</span>
                  <span className="font-mono font-black">- {formatInr(discountAmount)}</span>
                </div>
              )}
              {/* Solid Royal Blue Banner: Total Amount Payable */}
              <div className="bg-[#1d4ed8] text-white p-2 px-3 flex items-center justify-between font-black">
                <span className="text-xs sm:text-sm tracking-wide">Total Amount</span>
                <span className="font-mono text-sm sm:text-base">{formatInr(grandTotal)}</span>
              </div>
              <div className="text-right p-1 px-3 bg-white font-mono font-bold text-slate-800 text-[10.5px]">
                ({formatInr(grandTotal)})
              </div>
            </div>
          </div>

          {/* Verification & Website QR Box (Clean — Payment Mode & Header Strip Removed as Requested) */}
          <div
            className="border-2 border-[#1d4ed8] p-2 bg-white flex flex-col justify-between flex-1"
            style={{
              border: '2px solid #1d4ed8',
              borderColor: '#1d4ed8'
            }}
          >
            <div className="py-1 flex-1 flex flex-row items-center justify-around gap-2">
              {/* QR 1: INVOICE VERIFICATION QR */}
              <div
                className="flex flex-col items-center justify-center p-1 border border-slate-200 rounded bg-slate-50 shrink-0"
                style={{ border: '1px solid #cbd5e1' }}
              >
                <div
                  className="relative bg-white p-1 rounded border border-slate-300 shadow-xs flex items-center justify-center"
                  style={{ width: '78px', height: '78px' }}
                >
                  <img
                    src={verifyQrUrl}
                    alt="Invoice Verification QR"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-white border border-emerald-500 text-emerald-700 font-black text-[6px] px-0.5 py-0.2 rounded shadow-xs uppercase">
                      VERIFY
                    </span>
                  </div>
                </div>
                <span className="mt-1 text-[7.5px] font-black uppercase text-slate-800 tracking-tight text-center">
                  Scan to Verify
                </span>
              </div>

              {/* QR 2: WEBSITE VISIT QR */}
              <div
                className="flex flex-col items-center justify-center p-1 border border-blue-200 rounded bg-blue-50/50 shrink-0"
                style={{ border: '1px solid #93c5fd' }}
              >
                <div
                  className="relative bg-white p-1 rounded border border-slate-300 shadow-xs flex items-center justify-center"
                  style={{ width: '78px', height: '78px' }}
                >
                  <img
                    src={websiteQrUrl}
                    alt="Website Visit QR"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-white border border-blue-600 text-blue-700 font-black text-[6px] px-0.5 py-0.2 rounded shadow-xs uppercase">
                      WEBSITE
                    </span>
                  </div>
                </div>
                <span className="mt-1 text-[7.5px] font-black uppercase text-blue-900 tracking-tight text-center">
                  Visit Website
                </span>
              </div>
            </div>

            <div className="pt-1 px-1 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-600 font-medium">
              <span className="truncate text-blue-700 font-bold font-mono">
                🌐 {shopWebsite}
              </span>
              <span className="font-mono text-slate-700 font-bold shrink-0">
                Bill #{invoice.invoiceNumber}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. BOTTOM ROW: TERMS & CONDITIONS + MOVED DOWN SIGNATURE BOX   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-12 gap-2 my-1.5 items-stretch">
        {/* Left (7 cols): Terms and Conditions */}
        <div
          className="col-span-7 border-2 border-[#1d4ed8] p-2.5 bg-white flex flex-col justify-between min-h-[160px] sm:min-h-[175px]"
          style={{
            border: '2px solid #1d4ed8',
            borderColor: '#1d4ed8'
          }}
        >
          <div>
            <div className="flex items-center gap-1.5 pb-1 text-[#1d4ed8] font-black text-[10.5px] uppercase">
              <FileText className="w-3.5 h-3.5" />
              <span>Terms and Conditions</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[9px] sm:text-[9.5px] text-slate-700 font-medium leading-relaxed">
              {((invoice.terms && invoice.terms.length > 0)
                ? invoice.terms.filter((t) => t && t.trim().length > 0)
                : [
                    'Please keep this invoice for warranty/service reference.',
                    'Warranty is valid only for the specified period as per company policy.',
                    'Physical damage, water damage and misuse are not covered under warranty.',
                    'Goods once sold will not be taken back.',
                    'Delivery by: 3–7 working days (for non-stock items).'
                  ]
              ).map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>

          {/* Customer Signature & Jurisdiction (Placed Nicely Down at Bottom) */}
          <div className="mt-auto pt-3 border-t border-slate-200 flex items-end justify-between">
            <p className="text-[8px] text-slate-400 italic">
              *Subject to Goalpara Jurisdiction
            </p>
            <div className="text-center w-36">
              <div className="border-t-2 border-slate-800 mb-1 w-32 mx-auto"></div>
              <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight">
                Customer's Signature
              </span>
            </div>
          </div>
        </div>

        {/* Right (5 cols): AUTHORIZED SIGNATURE BOX MOVED DOWN (As Requested) */}
        <div
          className="col-span-5 border-2 border-[#1d4ed8] rounded-none p-3 bg-white text-center flex flex-col justify-between min-h-[160px] sm:min-h-[175px]"
          style={{
            border: '2px solid #1d4ed8',
            borderColor: '#1d4ed8'
          }}
        >
          {/* Large Space for physical signature / rubber stamp */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[85px] sm:min-h-[95px] relative">
            {activeSignatureUrl ? (
              <img
                src={activeSignatureUrl}
                alt="Authorized Signature"
                className="max-h-16 w-auto object-contain mx-auto"
              />
            ) : (
              <span className="text-[9px] text-slate-300 uppercase tracking-widest font-semibold select-none border border-dashed border-slate-200 px-3 py-2 rounded">
                [ Official Stamp / Signature Space ]
              </span>
            )}
          </div>

          {/* Signature Line & Text PUSHED ALL THE WAY DOWN TO THE BOTTOM (Thoda Niche) */}
          <div className="mt-auto pt-4">
            <div className="w-48 border-t-2 border-slate-900 mx-auto mb-1.5" />
            <p className="text-[11px] font-black text-slate-950 uppercase tracking-wide">
              Authorized Signature
            </p>
            <p className="text-[8.5px] font-bold text-slate-600 uppercase tracking-wider">
              {invoice.authorizedSignatoryName || `For ${shopName}`}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 7. BOTTOM DECORATIVE BAR                                      */}
      {/* ============================================================== */}
      <div className="mt-2 flex items-center justify-between overflow-hidden">
        {/* Left diagonal hazard stripes */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <div
              key={k}
              className="w-3 h-4 bg-[#1d4ed8]"
              style={{ transform: 'skewX(-25deg)' }}
            />
          ))}
        </div>

        {/* Center Banner */}
        <div className="flex-1 bg-[#1d4ed8] text-white text-center py-1 mx-2 font-black tracking-widest text-[10.5px] sm:text-[11.5px] uppercase shadow-xs">
          THANK YOU FOR CHOOSING TECHFIX!
        </div>

        {/* Right diagonal hazard stripes */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <div
              key={k}
              className="w-3 h-4 bg-[#1d4ed8]"
              style={{ transform: 'skewX(-25deg)' }}
            />
          ))}
        </div>
      </div>

      {/* Header Banner Upload Modal */}
      <InvoiceImageUploadModal
        isOpen={isHeaderImageModalOpen}
        onClose={() => setIsHeaderImageModalOpen(false)}
        title="Upload Header Banner Image"
        description="This image will display inside the top blue bordered header banner"
        currentImageUrl={activeHeaderBanner || undefined}
        onImageSaved={handleHeaderImageSaved}
        aspectRatioHint="Recommended: 1200x260px or wide letterhead banner"
      />
    </div>
  );
};
