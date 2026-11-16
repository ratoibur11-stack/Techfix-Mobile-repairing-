import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Upload,
  RefreshCw,
  Eye,
  CheckCircle,
  Smartphone,
  Wrench,
  Shield,
  Layers,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import {
  TaxInvoiceData,
  TaxInvoiceItem,
  ShopBusinessDetails,
  CustomerRepairRequest
} from '../types';
import { TaxInvoiceView } from './TaxInvoiceView';
import { ManualLogoModal } from './ManualLogoModal';
import { InvoiceImageUploadModal } from './InvoiceImageUploadModal';
import { SAMPLE_TAX_INVOICE } from '../data/sampleTaxInvoice';
import { numberToIndianTaxWords } from '../utils/numberToWords';
import {
  saveTaxInvoiceToFirestore,
  deleteTaxInvoiceFromFirestore,
  subscribeToTaxInvoices,
  saveInvoiceBrandingToFirestore,
  subscribeToInvoiceBranding,
  logActivityToFirestore
} from '../lib/firebase';

interface AdminTaxInvoiceManagerProps {
  businessDetails: ShopBusinessDetails;
  onUpdateBusinessDetails: (updated: ShopBusinessDetails) => void;
  repairRequests?: CustomerRepairRequest[];
}

export const AdminTaxInvoiceManager: React.FC<AdminTaxInvoiceManagerProps> = ({
  businessDetails,
  onUpdateBusinessDetails,
  repairRequests = []
}) => {
  // Saved Invoices list synced with Cloud Firestore + localStorage
  const [invoices, setInvoices] = useState<TaxInvoiceData[]>(() => {
    try {
      const saved = localStorage.getItem('techfix_tax_invoices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [SAMPLE_TAX_INVOICE];
  });

  // Current active invoice in editor
  const [activeInvoice, setActiveInvoice] = useState<TaxInvoiceData>(() => {
    try {
      const saved = localStorage.getItem('techfix_tax_invoices');
      const sig = localStorage.getItem('techfix_invoice_signature') || undefined;
      const termsRaw = localStorage.getItem('techfix_invoice_default_terms');
      const parsedTerms = termsRaw ? JSON.parse(termsRaw) : undefined;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return {
            ...parsed[0],
            ...(sig && !parsed[0].digitalSignatureUrl ? { digitalSignatureUrl: sig } : {}),
            ...(Array.isArray(parsedTerms) && (!parsed[0].terms || parsed[0].terms.length === 0) ? { terms: parsedTerms } : {})
          };
        }
      }
      return {
        ...SAMPLE_TAX_INVOICE,
        ...(sig ? { digitalSignatureUrl: sig } : {}),
        ...(Array.isArray(parsedTerms) ? { terms: parsedTerms } : {})
      };
    } catch (e) {}
    return SAMPLE_TAX_INVOICE;
  });

  // View state: 'editor' | 'preview' | 'list'
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'list'>('editor');

  // Modals
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isHeaderImageModalOpen, setIsHeaderImageModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Subscribe to saved invoices and invoice branding from Cloud Firestore
  useEffect(() => {
    const unsubInvoices = subscribeToTaxInvoices((remoteInvoices) => {
      if (Array.isArray(remoteInvoices) && remoteInvoices.length > 0) {
        setInvoices(remoteInvoices);
        try {
          localStorage.setItem('techfix_tax_invoices', JSON.stringify(remoteInvoices));
        } catch (e) {}
      }
    });

    const unsubBranding = subscribeToInvoiceBranding((branding) => {
      setActiveInvoice((prev) => ({
        ...prev,
        ...(branding.headerBannerImageUrl !== undefined && !prev.headerBannerImageUrl
          ? { headerBannerImageUrl: branding.headerBannerImageUrl }
          : {}),
        ...(branding.digitalSignatureUrl !== undefined && !prev.digitalSignatureUrl
          ? { digitalSignatureUrl: branding.digitalSignatureUrl }
          : {}),
        ...(Array.isArray(branding.defaultTerms) && branding.defaultTerms.length > 0
          ? { terms: branding.defaultTerms }
          : {})
      }));
      try {
        if (branding.headerBannerImageUrl) {
          localStorage.setItem('techfix_invoice_header_banner', branding.headerBannerImageUrl);
        }
        if (branding.digitalSignatureUrl) {
          localStorage.setItem('techfix_invoice_signature', branding.digitalSignatureUrl);
        }
        if (Array.isArray(branding.defaultTerms)) {
          localStorage.setItem('techfix_invoice_default_terms', JSON.stringify(branding.defaultTerms));
        }
      } catch (e) {}
    });

    return () => {
      unsubInvoices();
      unsubBranding();
    };
  }, []);

  // Sync saved invoices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('techfix_tax_invoices', JSON.stringify(invoices));
    } catch (e) {}
  }, [invoices]);

  // Recalculate totals whenever items or rates change
  const recalculateInvoice = (inv: TaxInvoiceData): TaxInvoiceData => {
    let subtotal = 0;
    let totalQty = 0;
    let totalTax = 0;
    const isNonGst = inv.isNonGst !== false;

    const updatedItems = inv.items.map((item) => {
      const qty = item.quantity || 1;
      const rate = item.rate || 0;
      const taxable = rate * qty;
      const igstPct = isNonGst ? 0 : (item.igstPercent !== undefined ? item.igstPercent : 18);
      const igstAmt = isNonGst ? 0 : (taxable * igstPct) / 100;
      const total = isNonGst ? taxable : taxable + igstAmt;

      subtotal += taxable;
      totalQty += qty;
      totalTax += igstAmt;

      return {
        ...item,
        quantity: qty,
        rate,
        taxableValue: Math.round(taxable * 100) / 100,
        igstPercent: igstPct,
        igstAmount: Math.round(igstAmt * 100) / 100,
        total: Math.round(total * 100) / 100
      };
    });

    const discount = inv.discount || 0;
    const totalAmount = Math.max(0, subtotal - discount + totalTax);
    const words = numberToIndianTaxWords(totalAmount);

    return {
      ...inv,
      items: updatedItems,
      totalQty,
      subtotal: Math.round(subtotal * 100) / 100,
      taxableAmount: Math.round(subtotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalAmountAfterTax: Math.round(totalAmount * 100) / 100,
      totalInWords: words
    };
  };

  // Update a field in activeInvoice
  const updateInvoiceField = <K extends keyof TaxInvoiceData>(key: K, value: TaxInvoiceData[K]) => {
    setActiveInvoice((prev) => recalculateInvoice({ ...prev, [key]: value }));
  };

  // Item updates
  const handleItemChange = (index: number, field: keyof TaxInvoiceItem, val: any) => {
    setActiveInvoice((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: val
      };
      return recalculateInvoice({ ...prev, items: newItems });
    });
  };

  const addItem = (itemPartial?: Partial<TaxInvoiceItem>) => {
    setActiveInvoice((prev) => {
      const rate = itemPartial?.rate || 450;
      const qty = itemPartial?.quantity || 1;
      const isNonGst = prev.isNonGst !== false;
      const igstPct = isNonGst ? 0 : (itemPartial?.igstPercent || 18);
      const igstAmt = isNonGst ? 0 : (rate * qty * igstPct) / 100;

      const newItem: TaxInvoiceItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: itemPartial?.name || 'New Mobile Service / Product',
        subText: itemPartial?.subText || '',
        hsnSac: itemPartial?.hsnSac || '9987',
        quantity: qty,
        unit: itemPartial?.unit || 'PCS',
        rate: rate,
        taxableValue: rate * qty,
        igstPercent: igstPct,
        igstAmount: igstAmt,
        total: rate * qty + igstAmt
      };
      return recalculateInvoice({ ...prev, items: [...prev.items, newItem] });
    });
  };

  const removeItem = (index: number) => {
    if (activeInvoice.items.length <= 1) {
      alert('Invoice must have at least one product or service.');
      return;
    }
    setActiveInvoice((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return recalculateInvoice({ ...prev, items: newItems });
    });
  };

  // Presets
  const addPreset = (type: 'phone' | 'screen' | 'glass' | 'cover' | 'charger') => {
    switch (type) {
      case 'phone':
        addItem({
          name: 'Redmi Note 13 (8GB/128GB)',
          subText: 'IMEI: 867530123456789',
          hsnSac: '8517',
          quantity: 1,
          unit: 'PCS',
          rate: 16999
        });
        break;
      case 'screen':
        addItem({
          name: 'Mobile Repairing Service',
          subText: '(Display Folder Replacement)',
          hsnSac: '9987',
          quantity: 1,
          unit: 'PCS',
          rate: 1200
        });
        break;
      case 'glass':
        addItem({
          name: 'Tempered Glass (9D Screen Protector)',
          subText: 'Edge-to-Edge HD Protection',
          hsnSac: '3926',
          quantity: 1,
          unit: 'PCS',
          rate: 199
        });
        break;
      case 'cover':
        addItem({
          name: 'Mobile Back Cover (Silicon Protection)',
          subText: 'Shockproof Matte Finish',
          hsnSac: '3926',
          quantity: 1,
          unit: 'PCS',
          rate: 299
        });
        break;
      case 'charger':
        addItem({
          name: 'Fast Charger & USB Cable (33W)',
          subText: 'Type-C Quick Charging Adapter',
          hsnSac: '8504',
          quantity: 1,
          unit: 'PCS',
          rate: 650
        });
        break;
    }
  };

  // Import from an existing repair request
  const handleImportRequest = (reqId: string) => {
    const req = repairRequests.find((r) => r.id === reqId);
    if (!req) return;

    const deviceName = `${req.deviceBrand || ''} ${req.deviceModel || ''}`.trim() || 'Customer Smartphone';
    const problem = req.problemDescription || 'Hardware / Display Repair Service';
    const cost = req.estimatedCost || 1200;

    const imported: TaxInvoiceData = recalculateInvoice({
      ...activeInvoice,
      id: `inv-${Date.now()}`,
      invoiceNumber: req.requestId?.replace(/[^0-9]/g, '') || String(Math.floor(10 + Math.random() * 90)),
      invoiceDate: new Date().toLocaleDateString('en-GB'),
      isNonGst: true,
      invoiceTitle: 'INVOICE',
      customerName: req.customerName || 'Customer',
      customerPhone: req.contactPhone || '',
      customerAddress: req.pickupAddress || 'Goalpara, Assam',
      items: [
        {
          id: `item-${Date.now()}-1`,
          name: `Mobile Repairing Service - ${deviceName}`,
          subText: `(${problem}) - Serial/IMEI: ${req.imei || 'Checked'}`,
          hsnSac: '9987',
          quantity: 1,
          unit: 'PCS',
          rate: cost,
          taxableValue: cost,
          igstPercent: 0,
          igstAmount: 0,
          total: cost
        }
      ]
    });

    setActiveInvoice(imported);
    setActiveTab('editor');
    setSaveSuccessMsg(`Imported from Repair Ticket #${req.requestId || req.id}`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Load sample invoice
  const handleLoadSample = () => {
    setActiveInvoice(SAMPLE_TAX_INVOICE);
    setSaveSuccessMsg('Loaded sample Non-GST invoice!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Save current invoice permanently to Cloud Firestore
  const handleSaveInvoice = async () => {
    setInvoices((prev) => {
      const exists = prev.findIndex((inv) => inv.id === activeInvoice.id);
      if (exists >= 0) {
        const copy = [...prev];
        copy[exists] = activeInvoice;
        return copy;
      }
      return [activeInvoice, ...prev];
    });
    const ok = await saveTaxInvoiceToFirestore(activeInvoice);
    if (activeInvoice.terms && activeInvoice.terms.length > 0) {
      saveInvoiceBrandingToFirestore({ defaultTerms: activeInvoice.terms }).catch(() => {});
      try { localStorage.setItem('techfix_invoice_default_terms', JSON.stringify(activeInvoice.terms)); } catch (e) {}
    }
    logActivityToFirestore(
      'Invoice Saved',
      'INVOICE',
      `Saved Invoice #${activeInvoice.invoiceNumber} for ${activeInvoice.customerName} (₹${activeInvoice.totalAmountAfterTax.toFixed(2)})`
    ).catch(() => {});
    setSaveSuccessMsg(
      ok
        ? `Invoice #${activeInvoice.invoiceNumber} Firebase Cloud me permanently save ho gaya!`
        : `Invoice #${activeInvoice.invoiceNumber} saved locally!`
    );
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Print current invoice
  const handlePrint = () => {
    logActivityToFirestore(
      'Invoice Printed / PDF',
      'INVOICE',
      `Printed Invoice #${activeInvoice.invoiceNumber} for ${activeInvoice.customerName} (₹${activeInvoice.totalAmountAfterTax.toFixed(2)})`
    ).catch(() => {});
    const printArea = document.getElementById('printable-tax-invoice-sheet');
    if (!printArea) {
      window.print();
      return;
    }

    try {
      const oldFrame = document.getElementById('tax-invoice-print-frame');
      if (oldFrame) oldFrame.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'tax-invoice-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!frameDoc) {
        window.print();
        return;
      }

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>TECHFIX Invoice - ${activeInvoice.invoiceNumber}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page {
                size: A4 portrait;
                margin: 4mm 6mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #0f172a !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                height: auto !important;
                overflow: visible !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              #printable-tax-invoice-sheet {
                width: 100% !important;
                max-width: 100% !important;
                min-height: 286mm !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                margin: 0 auto !important;
                padding: 8px 12px !important;
                box-sizing: border-box !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
              }
            </style>
          </head>
          <body>
            ${printArea.outerHTML}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 350);
              };
            </script>
          </body>
        </html>
      `);
      frameDoc.close();
    } catch (err) {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & IMAGE UPLOADS CONTROL CARD                    */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-950 p-5 rounded-2xl border border-blue-500/30 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-black bg-blue-600 text-white uppercase tracking-wider">
                INVOICE & BILLING SYSTEM
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                NON-GST BILL MODE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Create & Print Customer Invoices
            </h2>
            <p className="text-xs text-slate-300">
              Non-GST bill format with custom header letterhead upload, scan & pay UPI QR, authenticity verification and stamp upload.
            </p>
          </div>

          {/* Quick Image Upload Tools Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Top Header Banner Upload Button */}
            <button
              type="button"
              onClick={() => setIsHeaderImageModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
              title="Upload your shop header banner / letterhead image"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>📸 Upload Header Banner</span>
            </button>

            {/* 3. Shop Logo Button */}
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Shop Logo</span>
            </button>

            {/* 4. Signature / Sign Karna Option Button */}
            <button
              type="button"
              onClick={() => setIsSignatureModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition"
              title="Signature & Stamp image upload / customize"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>✍️ Sign / Stamp Upload</span>
            </button>

            {/* 5. Terms & Conditions Manual Type Button */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('editor');
                setTimeout(() => {
                  const el = document.getElementById('terms-and-conditions-editor-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition"
              title="Manually type Terms & Conditions"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📋 Type Terms & Conditions</span>
            </button>
          </div>
        </div>

        {/* Action Tabs Bar */}
        <div className="mt-4 pt-4 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Invoice Form Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>2. Live Print Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Saved Invoices ({invoices.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 transition flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Load Sample (#47)</span>
            </button>

            <button
              onClick={handleSaveInvoice}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 shadow-md"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Save Invoice</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg text-xs font-black bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. TAB 1: INVOICE FORM EDITOR                                  */}
      {/* ============================================================== */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            {/* Quick Import from Repair Tickets */}
            {repairRequests.length > 0 && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-bold text-blue-950">⚡ One-Click Auto Fill from Repair Request:</p>
                  <p className="text-blue-700 text-[11px]">Select a customer ticket to auto-populate customer details & repair cost.</p>
                </div>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleImportRequest(e.target.value);
                  }}
                  defaultValue=""
                  className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold bg-white border border-blue-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Choose Repair Request...</option>
                  {repairRequests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestId || r.id} — {r.customerName} ({r.deviceBrand} {r.deviceModel})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Invoice Mode & Type Settings */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Billing Mode:</span>
                <button
                  type="button"
                  onClick={() => updateInvoiceField('isNonGst', true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                    activeInvoice.isNonGst !== false
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Non-GST Bill (No Tax)
                </button>
                <button
                  type="button"
                  onClick={() => updateInvoiceField('isNonGst', false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                    activeInvoice.isNonGst === false
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  GST Bill (18% IGST)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Title Ribbon:</span>
                <select
                  value={activeInvoice.invoiceTitle || 'INVOICE'}
                  onChange={(e) => updateInvoiceField('invoiceTitle', e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg font-bold text-slate-900"
                >
                  <option value="INVOICE">INVOICE</option>
                  <option value="RETAIL INVOICE">RETAIL INVOICE</option>
                  <option value="CASH MEMO">CASH MEMO</option>
                  <option value="TAX INVOICE">TAX INVOICE</option>
                </select>
              </div>
            </div>

            {/* Customer & Invoice Meta Details */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Customer & Invoice Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.customerName}
                    onChange={(e) => updateInvoiceField('customerName', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                    placeholder="e.g. Rahul Das"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.customerPhone}
                    onChange={(e) => updateInvoiceField('customerPhone', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Customer Address
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.customerAddress}
                    onChange={(e) => updateInvoiceField('customerAddress', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Goalpara, Assam"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Location / Area
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.placeOfSupply}
                    onChange={(e) => updateInvoiceField('placeOfSupply', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Goalpara (Assam)"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.invoiceNumber}
                    onChange={(e) => updateInvoiceField('invoiceNumber', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 47"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.invoiceDate}
                    onChange={(e) => updateInvoiceField('invoiceDate', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 11/10/2026"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Editor */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>Products & Services ({activeInvoice.items.length})</span>
                </h3>

                {/* Quick Add Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => addPreset('phone')}
                    className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200"
                  >
                    + Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => addPreset('screen')}
                    className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200"
                  >
                    + Display Repair
                  </button>
                  <button
                    type="button"
                    onClick={() => addPreset('glass')}
                    className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200"
                  >
                    + Tempered
                  </button>
                  <button
                    type="button"
                    onClick={() => addPreset('cover')}
                    className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200"
                  >
                    + Back Cover
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {activeInvoice.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-700">
                        Item #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-8">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Product / Service Name
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-bold"
                          placeholder="e.g. Redmi Note 13 (8GB/128GB)"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Item Code / HSN
                        </label>
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                          placeholder="e.g. 8517 or 9987"
                        />
                      </div>

                      <div className="sm:col-span-12">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          IMEI / Serial / Warranty / Problem Subtitle
                        </label>
                        <input
                          type="text"
                          value={item.subText || ''}
                          onChange={(e) => handleItemChange(idx, 'subText', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono text-slate-700"
                          placeholder="e.g. IMEI: 867530123456789 or (Display Replacement)"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono text-center font-bold"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Rate (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono text-right font-bold"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Total Amount (₹)
                        </label>
                        <div className="px-2.5 py-1.5 text-xs bg-slate-200/60 border border-slate-300 rounded font-mono text-right font-black text-slate-900">
                          ₹{item.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addItem()}
                  className="w-full py-2 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 bg-blue-50/50 hover:bg-blue-50 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Product / Service Item</span>
                </button>

                {/* Discount Input Bar */}
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <label className="block text-xs font-black text-emerald-900">
                      Discount (₹)
                    </label>
                    <p className="text-[10px] text-emerald-700">
                      Apply flat discount or quick % off on subtotal
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateInvoiceField('discount', Math.round((activeInvoice.subtotal || 0) * 0.05))}
                      className="px-2 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300"
                    >
                      5%
                    </button>
                    <button
                      type="button"
                      onClick={() => updateInvoiceField('discount', Math.round((activeInvoice.subtotal || 0) * 0.1))}
                      className="px-2 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300"
                    >
                      10%
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={activeInvoice.discount || ''}
                      onChange={(e) => updateInvoiceField('discount', Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0"
                      className="w-28 px-2.5 py-1.5 text-xs bg-white border border-emerald-400 rounded-lg font-mono text-right font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    {(activeInvoice.discount || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => updateInvoiceField('discount', 0)}
                        className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details & Shop Settings */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Bank Details & UPI Configuration</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bank Account Name
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.bankDetails?.name || ''}
                    onChange={(e) =>
                      setActiveInvoice((prev) => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, name: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
                    placeholder="TECHFIX MOBILE REPAIRING SHOP"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bank Branch
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.bankDetails?.branch || ''}
                    onChange={(e) =>
                      setActiveInvoice((prev) => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, branch: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="Goalpara"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.bankDetails?.accountNumber || ''}
                    onChange={(e) =>
                      setActiveInvoice((prev) => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                    placeholder="50200012345678"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.bankDetails?.ifsc || ''}
                    onChange={(e) =>
                      setActiveInvoice((prev) => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, ifsc: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                    placeholder="HDFC0001234"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    UPI ID (For Scan & Pay QR)
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.bankDetails?.upiId || ''}
                    onChange={(e) =>
                      setActiveInvoice((prev) => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, upiId: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg text-blue-600"
                    placeholder="techfix@okaxis"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Verification Domain / Link
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.verificationUrl || ''}
                    onChange={(e) => updateInvoiceField('verificationUrl', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg text-blue-700"
                    placeholder="sarate.wuaze.com/verify"
                  />
                </div>
              </div>
            </div>

            {/* Signature & Stamp Settings (✍️ Sign Karna Option) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>Signature & Stamp Settings (✍️ Sign Karna Option)</span>
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Option Niche Set Hai
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Authorized Signatory Label
                  </label>
                  <input
                    type="text"
                    value={activeInvoice.authorizedSignatoryName || `For ${businessDetails?.name || 'TECHFIX MOBILE REPAIRING SHOP'}`}
                    onChange={(e) => updateInvoiceField('authorizedSignatoryName', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                    placeholder="For TECHFIX MOBILE REPAIRING SHOP"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">This text appears right below the signature line.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sign Line Position (Single Karna Option)
                  </label>
                  <select
                    value={activeInvoice.signaturePosition || 'lower'}
                    onChange={(e) => updateInvoiceField('signaturePosition', e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="lower">Thoda Niche (Lower Down - Recommended)</option>
                    <option value="extra-space">Extra Niche (Maximum Space for Stamp & Sign)</option>
                    <option value="standard">Standard Height</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Controls spacing so signing line is placed comfortably lower.</p>
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showCustomerSignatureCheck"
                      checked={activeInvoice.showCustomerSignature !== false}
                      onChange={(e) => updateInvoiceField('showCustomerSignature', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <label htmlFor="showCustomerSignatureCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Include "Customer's Signature" line on bottom-left
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeInvoice.digitalSignatureUrl ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={activeInvoice.digitalSignatureUrl}
                          alt="Signature Preview"
                          className="h-8 max-w-28 object-contain border border-slate-200 rounded p-0.5 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateInvoiceField('digitalSignatureUrl', undefined);
                            try { localStorage.removeItem('techfix_invoice_signature'); } catch (e) {}
                            saveInvoiceBrandingToFirestore({ digitalSignatureUrl: '' }).catch(() => {});
                            logActivityToFirestore(
                              'Authorized Signature Image Removed',
                              'INVOICE',
                              'Removed authorized signature/stamp image from invoice branding'
                            ).catch(() => {});
                          }}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded font-bold"
                        >
                          Remove Sign
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSignatureModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-300 transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Digital Sign / Rubber Stamp Image</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Conditions Manual Typing Card (As Requested: Trems and condition manually type karne ka option) */}
            <div id="terms-and-conditions-editor-section" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  <span>Terms & Conditions (Manually Type Karein)</span>
                </h3>
                <span className="text-[10px] bg-purple-100 text-purple-900 font-bold px-2.5 py-0.5 rounded-full">
                  {(activeInvoice.terms || []).filter((t) => t.trim().length > 0).length || 5} Line(s) on Bill
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Type Conditions Here (Har nayi line ek bullet point banegi):
                  </label>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const repairTerms = [
                          'Please keep this invoice for warranty/service reference.',
                          'Warranty is valid only for the specified period as per company policy.',
                          'Physical damage, water damage and misuse are not covered under warranty.',
                          'Goods once sold/repaired will not be taken back.',
                          'Delivery by: 3–7 working days (for non-stock items).'
                        ];
                        updateInvoiceField('terms', repairTerms);
                      }}
                      className="px-2 py-1 text-[10.5px] rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-200 transition"
                      title="Insert Mobile Repair Terms Preset"
                    >
                      📱 Repair Preset
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const salesTerms = [
                          'Testing warranty of 7 days on pre-owned mobile phones.',
                          'Brand new phones are covered under official brand service center warranty.',
                          'Accessories warranty is valid only with original box packaging & bill.',
                          'No cash refunds; exchange/replacement for manufacturing defects only.',
                          'Physical and liquid damage will void any warranty immediately.'
                        ];
                        updateInvoiceField('terms', salesTerms);
                      }}
                      className="px-2 py-1 text-[10.5px] rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-200 transition"
                      title="Insert Phone Sales & Accessories Preset"
                    >
                      🛒 Sales Preset
                    </button>

                    <button
                      type="button"
                      onClick={() => updateInvoiceField('terms', [])}
                      className="px-2 py-1 text-[10.5px] rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold border border-slate-300 transition"
                      title="Clear and write custom terms from scratch"
                    >
                      🧹 Clear (Blank)
                    </button>
                  </div>
                </div>

                {/* Multiline Textarea */}
                <textarea
                  rows={6}
                  value={(activeInvoice.terms || [
                    'Please keep this invoice for warranty/service reference.',
                    'Warranty is valid only for the specified period as per company policy.',
                    'Physical damage, water damage and misuse are not covered under warranty.',
                    'Goods once sold will not be taken back.',
                    'Delivery by: 3–7 working days (for non-stock items).'
                  ]).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    updateInvoiceField('terms', lines);
                  }}
                  onBlur={() => {
                    const cleanTerms = (activeInvoice.terms || []).filter(t => t.trim().length > 0);
                    if (cleanTerms.length > 0) {
                      try { localStorage.setItem('techfix_invoice_default_terms', JSON.stringify(cleanTerms)); } catch (e) {}
                      saveInvoiceBrandingToFirestore({ defaultTerms: cleanTerms }).catch(() => {});
                      logActivityToFirestore(
                        'Invoice Terms & Conditions Updated',
                        'INVOICE',
                        `Saved ${cleanTerms.length} custom terms line(s) to Firebase`
                      ).catch(() => {});
                    }
                  }}
                  placeholder="Apni terms and conditions yahan type karein (Enter press karke nayi line likhein)...&#10;1. Screen replacement par 30 days testing warranty.&#10;2. Water damage par koi warranty nahi hogi."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-sans leading-relaxed focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 Tip: Har line automatic bullet point ban jayegi. Aap Hindi, English ya Assamese me koi bhi rule type kar sakte hain.
                </p>
              </div>

              {/* Live Preview List */}
              <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-200">
                <span className="text-[10px] font-black uppercase text-purple-950 block mb-1 tracking-wider">
                  Live Preview on Invoice:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-800 font-medium">
                  {((activeInvoice.terms && activeInvoice.terms.length > 0)
                    ? activeInvoice.terms.filter((t) => t.trim().length > 0)
                    : [
                        'Please keep this invoice for warranty/service reference.',
                        'Warranty is valid only for the specified period as per company policy.',
                        'Physical damage, water damage and misuse are not covered under warranty.',
                        'Goods once sold will not be taken back.',
                        'Delivery by: 3–7 working days (for non-stock items).'
                      ]
                  ).map((term, idx) => (
                    <li key={idx} className="leading-snug">
                      {term}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Live Summary & Quick Preview: 5 cols */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-4 space-y-4">
              {/* Financial Calculations Summary Box */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Invoice Total Summary
                  </h4>
                  <span className="text-xs font-bold text-blue-600">
                    {activeInvoice.items.length} Item(s)
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Subtotal Amount:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(activeInvoice.subtotal ?? activeInvoice.taxableAmount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-emerald-700">Discount (₹):</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={activeInvoice.discount || ''}
                      onChange={(e) => updateInvoiceField('discount', Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0.00"
                      className="w-28 px-2 py-1 text-xs font-mono font-bold text-right border border-emerald-300 rounded-lg bg-emerald-50/40 text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                    <span className="font-black text-slate-900 text-sm">Total Payable:</span>
                    <span className="font-mono font-black text-lg text-blue-700">
                      ₹{activeInvoice.totalAmountAfterTax.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50/70 border border-blue-100 p-2.5 rounded-lg text-[10px] text-blue-900 leading-tight">
                  <span className="font-bold uppercase block text-[9px] text-blue-700 mb-0.5">
                    Amount in Words:
                  </span>
                  <span className="font-bold break-words">{activeInvoice.totalInWords}</span>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Live Printable Invoice</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Invoice Now (A4 Format)</span>
                  </button>
                </div>
              </div>

              {/* Mini Invoice Preview Card */}
              <div className="bg-slate-100 p-3 rounded-2xl border border-slate-300 overflow-hidden shadow-inner flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Full A4 Invoice Preview (Zoomed Out)
                </span>
                <div className="w-full flex justify-center overflow-hidden" style={{ height: '540px' }}>
                  <div
                    className="bg-white border border-slate-400 shadow-md origin-top transform scale-[0.46] sm:scale-[0.48]"
                    style={{ width: '800px', pointerEvents: 'none', flexShrink: 0 }}
                  >
                    <TaxInvoiceView
                      invoice={activeInvoice}
                      businessDetails={businessDetails}
                      hideActionButtons={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. TAB 2: LIVE FULL PRINT PREVIEW                              */}
      {/* ============================================================== */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="bg-slate-800 text-white p-3 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-300">
              Invoice #{activeInvoice.invoiceNumber} — Full Page Preview (Matches A4 Sheet)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsHeaderImageModalOpen(true)}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Header Banner</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>

          <div className="flex justify-center bg-slate-900/40 p-2 sm:p-6 rounded-2xl border border-slate-300">
            <div className="bg-white shadow-2xl rounded-none border border-slate-400 w-full max-w-[820px]">
              <TaxInvoiceView
                invoice={activeInvoice}
                businessDetails={businessDetails}
                onUpdateInvoice={setActiveInvoice}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. TAB 3: SAVED INVOICES LIST                                  */}
      {/* ============================================================== */}
      {activeTab === 'list' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Saved Invoices ({invoices.length})
            </h3>
            <button
              onClick={() => {
                setActiveInvoice({
                  ...SAMPLE_TAX_INVOICE,
                  id: `inv-${Date.now()}`,
                  invoiceNumber: String(Math.floor(100 + Math.random() * 900)),
                  invoiceDate: new Date().toLocaleDateString('en-GB')
                });
                setActiveTab('editor');
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Invoice</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition bg-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-blue-700 text-sm">
                      #{inv.invoiceNumber}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {inv.invoiceDate}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 text-sm uppercase truncate">
                    {inv.customerName}
                  </h4>
                  <p className="text-xs text-slate-600 font-mono">
                    {inv.customerPhone}
                  </p>
                  <p className="text-xs text-slate-500">
                    {inv.items.length} Item(s) • Total Amount: <strong className="text-slate-900">₹{inv.totalAmountAfterTax.toFixed(2)}</strong>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setActiveInvoice(inv);
                      setActiveTab('editor');
                    }}
                    className="flex-1 py-1.5 text-center text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                  >
                    Edit / Open
                  </button>

                  <button
                    onClick={() => {
                      setActiveInvoice(inv);
                      setActiveTab('preview');
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded-lg transition"
                    title="View & Print"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {invoices.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete invoice #${inv.invoiceNumber}?`)) {
                          setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
                          deleteTaxInvoiceFromFirestore(inv.id).catch(() => {});
                          logActivityToFirestore(
                            'Invoice Deleted',
                            'INVOICE',
                            `Deleted Invoice #${inv.invoiceNumber} (${inv.customerName})`
                          ).catch(() => {});
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Logo Upload Modal */}
      <ManualLogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        currentLogoUrl={businessDetails.logoUrl}
        onLogoUpdated={(newUrl) => {
          onUpdateBusinessDetails({
            ...businessDetails,
            logoUrl: newUrl || ''
          });
          setIsLogoModalOpen(false);
          setSaveSuccessMsg('Logo updated & saved to Firebase!');
          setTimeout(() => setSaveSuccessMsg(null), 3000);
        }}
      />

      {/* Header Banner Upload Modal */}
      <InvoiceImageUploadModal
        isOpen={isHeaderImageModalOpen}
        onClose={() => setIsHeaderImageModalOpen(false)}
        title="Upload Header Banner Image"
        description="This image will replace the top header area of the invoice (Top Red Square)"
        currentImageUrl={activeInvoice.headerBannerImageUrl || (typeof window !== 'undefined' ? localStorage.getItem('techfix_invoice_header_banner') || undefined : undefined)}
        onImageSaved={(url) => {
          const updatedInv = { ...activeInvoice, headerBannerImageUrl: url || '' };
          setActiveInvoice(updatedInv);
          try {
            if (url) localStorage.setItem('techfix_invoice_header_banner', url);
            else localStorage.removeItem('techfix_invoice_header_banner');
          } catch (e) {}
          saveInvoiceBrandingToFirestore({ headerBannerImageUrl: url || '' }).catch(() => {});
          saveTaxInvoiceToFirestore(updatedInv).catch(() => {});
          logActivityToFirestore(
            url ? 'Invoice Header Banner Saved' : 'Invoice Header Banner Removed',
            'INVOICE',
            url ? 'Updated header banner image & saved to Firebase' : 'Removed invoice header banner'
          ).catch(() => {});
          setSaveSuccessMsg(url ? 'Header banner Firebase me permanently save ho gaya!' : 'Header banner removed.');
          setTimeout(() => setSaveSuccessMsg(null), 3000);
        }}
        aspectRatioHint="Recommended: 1200x260px or wide letterhead banner"
      />

      {/* Signature / Rubber Stamp Upload Modal */}
      <InvoiceImageUploadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        title="Upload Signature or Official Stamp Image"
        description="This image will display directly above the Authorized Signature line on the invoice"
        currentImageUrl={activeInvoice.digitalSignatureUrl}
        onImageSaved={(url) => {
          const updatedInv = { ...activeInvoice, digitalSignatureUrl: url || undefined };
          setActiveInvoice(updatedInv);
          try {
            if (url) localStorage.setItem('techfix_invoice_signature', url);
            else localStorage.removeItem('techfix_invoice_signature');
          } catch (e) {}
          saveInvoiceBrandingToFirestore({ digitalSignatureUrl: url || '' }).catch(() => {});
          saveTaxInvoiceToFirestore(updatedInv).catch(() => {});
          logActivityToFirestore(
            url ? 'Authorized Signature Image Saved' : 'Authorized Signature Image Removed',
            'INVOICE',
            url ? 'Uploaded authorized signature/stamp to Firebase' : 'Removed authorized signature image'
          ).catch(() => {});
          setSaveSuccessMsg(url ? 'Signature Firebase me permanently save ho gaya!' : 'Signature image removed.');
          setTimeout(() => setSaveSuccessMsg(null), 3000);
        }}
        aspectRatioHint="Recommended: 300x120px transparent PNG or clean photo of signature/stamp"
      />
    </div>
  );
};
