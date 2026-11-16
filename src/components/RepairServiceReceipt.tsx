import React from 'react';
import { TechfixLogo } from './TechfixLogo';
import { ShopBusinessDetails, CustomerRepairRequest, RepairProposal } from '../types';
import { BUSINESS_DETAILS } from '../data/initialData';
import { numberToWords } from '../utils/numberToWords';

export interface RepairReceiptItem {
  id: string;
  description: string;
  hsnSac?: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface RepairServiceReceiptProps {
  // Can take a request or a proposal or raw fields
  request?: CustomerRepairRequest | null;
  proposal?: RepairProposal | null;
  businessDetails?: ShopBusinessDetails | null;
  customData?: {
    invoiceNumber?: string;
    invoiceDate?: string;
    statusText?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    deviceBrand?: string;
    deviceModel?: string;
    warrantyText?: string;
    items?: RepairReceiptItem[];
    subtotal?: number;
    advancePaid?: number;
    balanceDue?: number;
    paymentMode?: string;
    technicianName?: string;
    notes?: string;
  };
  containerId?: string;
  className?: string;
}

export const RepairServiceReceipt: React.FC<RepairServiceReceiptProps> = ({
  request,
  proposal,
  businessDetails = BUSINESS_DETAILS,
  customData,
  containerId = 'repair-service-receipt',
  className = ''
}) => {
  // Resolve data
  const shop = businessDetails || BUSINESS_DETAILS;

  // Format invoice number e.g. "INV-2026-8788" or matching request/proposal
  const invoiceNumber = customData?.invoiceNumber || (
    proposal?.proposalNumber 
      ? (proposal.proposalNumber.startsWith('INV-') ? proposal.proposalNumber : `INV-${proposal.proposalNumber}`)
      : (request?.requestId 
          ? `INV-2026-${request.requestId.replace(/[^0-9]/g, '') || '8788'}`
          : 'INV-2026-8788')
  );

  // Date formatted like "04 Oct 2026"
  const rawDate = customData?.invoiceDate || proposal?.createdAt || request?.createdAt || new Date().toISOString();
  let formattedDate = rawDate;
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch (e) {}

  // Customer information
  const customerName = (customData?.customerName || proposal?.clientName || request?.customerName || 'Customer').trim();
  const customerPhone = (customData?.customerPhone || proposal?.clientPhone || request?.contactPhone || '9864245987').trim();
  const customerAddress = customData?.customerAddress || request?.pickupAddress || 'Goalpara, Assam';

  // Device & Warranty
  const deviceBrand = customData?.deviceBrand || proposal?.deviceBrand || request?.deviceBrand || 'Realme';
  const deviceModel = customData?.deviceModel || proposal?.deviceModel || request?.deviceModel || 'Note 7 pro';
  const fullDevice = `${deviceBrand} ${deviceModel}`.trim();
  const warrantyText = customData?.warrantyText || (
    proposal?.warrantyDays 
      ? `${proposal.warrantyDays} Days Guarantee` 
      : (request?.warrantyPeriod || '90 Days Guarantee')
  );

  // Status
  const statusRaw = customData?.statusText || proposal?.status || request?.status || 'Completed';
  const isPaidFull = statusRaw === 'Completed' || statusRaw === 'PAID FULL' || (request?.balanceDue !== undefined && request.balanceDue <= 0);
  const statusDisplay = customData?.statusText || (isPaidFull ? 'STATUS: PAID FULL' : `STATUS: ${statusRaw.toUpperCase()}`);

  // Items breakdown
  let items: RepairReceiptItem[] = [];
  if (customData?.items && customData.items.length > 0) {
    items = customData.items;
  } else if (proposal?.repairItems && proposal.repairItems.length > 0) {
    items = proposal.repairItems.map((ri, idx) => ({
      id: ri.id || `item-${idx + 1}`,
      description: ri.description || `${fullDevice} Repair Service`,
      hsnSac: '998713',
      qty: 1,
      rate: ri.cost || 0,
      amount: ri.cost || 0
    }));
  } else if (request) {
    const cost = request.estimatedCost || 200;
    const problemDesc = request.problemDescription ? `: ${request.problemDescription}` : '';
    items = [
      {
        id: 'item-1',
        description: `${fullDevice} Repair${problemDesc}`,
        hsnSac: '998713',
        qty: 1,
        rate: cost,
        amount: cost
      }
    ];
  } else {
    items = [
      {
        id: 'item-1',
        description: 'Realme Note 7 pro Repair: Software Bootloop / Hang on Logo / Dead',
        hsnSac: '998713',
        qty: 1,
        rate: 200,
        amount: 200
      }
    ];
  }

  // Financial calculations
  const subtotal = customData?.subtotal !== undefined 
    ? customData.subtotal 
    : items.reduce((sum, it) => sum + it.amount, 0);

  const advancePaid = customData?.advancePaid !== undefined 
    ? customData.advancePaid 
    : (proposal?.advancePaid !== undefined ? proposal.advancePaid : (request?.advancePaid || 0));

  const netTotal = subtotal;
  const balanceDue = customData?.balanceDue !== undefined 
    ? customData.balanceDue 
    : (proposal?.balanceDue !== undefined ? proposal.balanceDue : (request?.balanceDue !== undefined ? request.balanceDue : Math.max(0, netTotal - advancePaid)));

  const totalWords = numberToWords(netTotal);

  // Technician & Notes
  const paymentMode = customData?.paymentMode || 'UPI';
  const technicianName = customData?.technicianName || request?.assignedTechnician || 'Toibur Rahman (Master Tech)';
  const ticketRef = request?.requestId || proposal?.proposalNumber || 'TF-REQ-9914';
  const notesText = customData?.notes || `Generated from repair ticket ${ticketRef}. Thank you for choosing TECHFIX Goalpara!`;

  // UPI configuration
  const upiId = shop.upiId || '9864245987@paytm';
  const upiName = shop.upiName || 'TECHFIX Goalpara';
  const upiPayAmount = balanceDue > 0 ? balanceDue : netTotal;
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${upiPayAmount}&cu=INR&tn=${encodeURIComponent(`Bill ${invoiceNumber}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;

  return (
    <div
      id={containerId}
      className={`bg-white text-slate-900 p-6 sm:p-8 max-w-3xl mx-auto rounded-none font-sans text-xs sm:text-sm print:p-4 print:max-w-none print:w-full print:shadow-none ${className}`}
      style={{ minHeight: '1000px', backgroundColor: '#ffffff', color: '#0f172a' }}
    >
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4">
        {/* Left: Logo + Shop Info */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-3">
            <TechfixLogo
              variant="full"
              theme="light"
              className="h-12 sm:h-14 w-auto object-contain shrink-0"
              showSlogan={true}
              customLogoUrl={shop.logoUrl}
            />
            <span className="text-slate-400 font-semibold text-xs sm:text-sm tracking-wider uppercase">
              REPAIR SERVICE RECEIPT
            </span>
          </div>

          <div className="text-[11px] text-slate-700 leading-tight space-y-0.5 pt-1">
            <p className="font-semibold text-slate-800">{shop.address || 'Dubapara Lupta Char, Goalpara, Assam, India'}</p>
            <p className="text-blue-600 font-medium">
              Website: <span className="underline">{shop.websiteDomain || 'techfix.ai.studio'}</span>
            </p>
            <p className="text-slate-600 italic">GSTIN: Optional / Non-GST Bill</p>
            <p className="font-mono text-slate-700 font-medium">
              Ph/WhatsApp: {shop.phone || '+91 98642 45987'} / {shop.whatsapp || '919864245987'}
            </p>
          </div>
        </div>

        {/* Right: Invoice #, Date, Status */}
        <div className="shrink-0 text-left sm:text-right">
          <div className="border border-teal-300 bg-teal-50/40 rounded-xl p-3 inline-block space-y-1 min-w-[170px]">
            <p className="font-mono font-black text-sm sm:text-base text-slate-900 tracking-wide">
              {invoiceNumber}
            </p>
            <p className="text-xs text-slate-600 font-medium">
              Date: <strong className="text-slate-800 font-mono">{formattedDate}</strong>
            </p>
            <div className="pt-0.5">
              <span className="inline-block px-2.5 py-0.5 rounded-md border border-teal-400 bg-teal-100 text-teal-900 font-black text-[10px] uppercase tracking-wider">
                {statusDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-slate-200 my-3.5" />

      {/* 2. CUSTOMER & DEVICE INFO CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-3.5">
        {/* Card 1: Customer Details */}
        <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            CUSTOMER DETAILS:
          </span>
          <h4 className="text-sm font-black text-slate-900 uppercase">
            {customerName}
          </h4>
          <p className="text-xs text-slate-700 font-mono">Phone: {customerPhone}</p>
          <p className="text-xs text-slate-600">Address: {customerAddress}</p>
        </div>

        {/* Card 2: Mobile Technical Intake */}
        <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            MOBILE TECHNICAL INTAKE:
          </span>
          <p className="text-xs text-slate-700">
            Device: <strong className="font-bold text-blue-600">{fullDevice}</strong>
          </p>
          <p className="text-xs text-slate-700">
            Warranty: <strong className="font-bold text-emerald-600">{warrantyText}</strong>
          </p>
        </div>
      </div>

      {/* 3. ITEM / SERVICE DESCRIPTION TABLE */}
      <div className="my-4 border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3 w-8 text-center">#</th>
              <th className="py-2.5 px-3">ITEM / SERVICE DESCRIPTION</th>
              <th className="py-2.5 px-3 text-center">HSN/SAC</th>
              <th className="py-2.5 px-3 text-center">QTY</th>
              <th className="py-2.5 px-3 text-right">RATE</th>
              <th className="py-2.5 px-3 text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {items.map((it, idx) => (
              <tr key={it.id || idx} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                <td className="py-2.5 px-3 text-slate-900 font-semibold">{it.description}</td>
                <td className="py-2.5 px-3 text-center font-mono text-slate-600">{it.hsnSac || '998713'}</td>
                <td className="py-2.5 px-3 text-center font-mono">{it.qty}</td>
                <td className="py-2.5 px-3 text-right font-mono">₹{it.rate}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{it.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. TOTAL AMOUNT IN WORDS BOX */}
      <div className="border border-slate-200 rounded-xl p-3 bg-white my-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
          TOTAL AMOUNT IN WORDS:
        </span>
        <p className="text-xs sm:text-sm font-bold italic text-slate-900 mt-0.5">
          {totalWords}
        </p>
      </div>

      {/* 5. FINANCIAL BREAKDOWN & NOTES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3 items-start">
        {/* Left: Payment details & notes */}
        <div className="space-y-1 text-xs text-slate-700">
          <p><span className="text-slate-500">Payment Mode:</span> <strong className="text-slate-900">{paymentMode}</strong></p>
          <p><span className="text-slate-500">Technician:</span> <strong className="text-slate-900">{technicianName}</strong></p>
          <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
            <strong>Notes:</strong> {notesText}
          </p>
        </div>

        {/* Right: Subtotal, Net Total, Advance, Balance */}
        <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-1.5 text-xs text-right">
          <div className="flex items-center justify-between text-slate-600">
            <span>Subtotal Amount:</span>
            <span className="font-mono font-semibold">₹{subtotal}</span>
          </div>

          <div className="flex items-center justify-between text-slate-900 border-t border-slate-200 pt-1.5">
            <span className="font-bold">Net Total Invoice:</span>
            <span className="font-mono font-black text-sm text-emerald-700">₹{netTotal}</span>
          </div>

          <div className="flex items-center justify-between text-emerald-700">
            <span>Advance Paid:</span>
            <span className="font-mono font-bold">₹{advancePaid}</span>
          </div>

          <div className="flex items-center justify-between text-slate-900 border-t border-slate-200 pt-1 font-bold">
            <span>Balance Payable:</span>
            <span className="font-mono font-black text-sm text-slate-900">₹{balanceDue}</span>
          </div>
        </div>
      </div>

      {/* 6. SCAN TO PAY VIA UPI CARD */}
      <div className="my-4 p-4 rounded-xl bg-sky-50/80 border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-[10px] font-black uppercase text-sky-900 tracking-wider block">
            SCAN TO PAY STORE BALANCE VIA UPI
          </span>
          <p className="text-sm sm:text-base font-black text-blue-700 font-mono tracking-wide">
            {upiId}
          </p>
          <p className="text-[11px] text-slate-600 font-medium">
            Merchant: {upiName}
          </p>
        </div>

        <div className="shrink-0 bg-white p-2 rounded-lg border border-sky-200 shadow-xs flex flex-col items-center">
          <img
            src={qrCodeUrl}
            alt="UPI Payment QR"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
          />
        </div>
      </div>

      {/* 7. TERMS & CONDITIONS */}
      <div className="my-3 space-y-0.5 text-[10px] text-slate-500">
        <span className="font-bold text-slate-700 uppercase tracking-wider block">
          TERMS & CONDITIONS:
        </span>
        <p>1. 90 days warranty on replaced parts. 2. No warranty on physical drop or liquid damage.</p>
      </div>

      {/* 8. SIGNATURES */}
      <div className="pt-8 mt-6 flex items-end justify-between text-xs text-slate-700">
        <div className="text-center">
          <div className="w-40 border-t border-slate-400 mb-1" />
          <span className="font-semibold text-slate-700">Customer Signature</span>
        </div>

        <div className="text-center">
          <div className="w-48 border-t border-slate-400 mb-1" />
          <span className="font-semibold text-slate-700">Authorized Stamp & Signature</span>
        </div>
      </div>
    </div>
  );
};
