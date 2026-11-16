import React, { useRef, useState, useMemo } from 'react';
import { Printer, Download, MessageCircle, X, Upload, FileText, CheckCircle } from 'lucide-react';
import { CustomerRepairRequest, RepairProposal, ShopBusinessDetails, TaxInvoiceData } from '../types';
import { RepairServiceReceipt } from './RepairServiceReceipt';
import { TaxInvoiceView } from './TaxInvoiceView';
import { ManualLogoModal } from './ManualLogoModal';
import { BUSINESS_DETAILS } from '../data/initialData';
import { convertRepairRequestToTaxInvoice } from '../utils/taxInvoiceUtils';

interface RepairServiceInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: CustomerRepairRequest | null;
  proposal?: RepairProposal | null;
  businessDetails?: ShopBusinessDetails | null;
  onUpdateBusinessDetails?: (updated: ShopBusinessDetails) => void;
}

export const RepairServiceInvoiceModal: React.FC<RepairServiceInvoiceModalProps> = ({
  isOpen,
  onClose,
  request,
  proposal,
  businessDetails = BUSINESS_DETAILS,
  onUpdateBusinessDetails
}) => {
  const [invoiceFormat, setInvoiceFormat] = useState<'taxInvoice' | 'serviceReceipt'>('taxInvoice');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const receiptContainerRef = useRef<HTMLDivElement>(null);

  const [customInvoiceOverride, setCustomInvoiceOverride] = useState<Partial<TaxInvoiceData>>({});

  const taxInvoiceData = useMemo(() => {
    const base = convertRepairRequestToTaxInvoice(request, proposal, businessDetails);
    return { ...base, ...customInvoiceOverride };
  }, [request, proposal, businessDetails, customInvoiceOverride]);

  if (!isOpen) return null;

  // Invoice Number
  const invoiceNumber = taxInvoiceData.invoiceNumber;
  const customerName = taxInvoiceData.customerName;
  const customerPhone = taxInvoiceData.customerPhone;

  // Print function (A4 single-page print)
  const handlePrint = () => {
    const printElement = invoiceFormat === 'taxInvoice'
      ? document.getElementById('printable-tax-invoice-sheet')
      : document.getElementById('printable-repair-receipt-area');

    if (!printElement) {
      window.print();
      return;
    }

    try {
      const oldFrame = document.getElementById('techfix-receipt-print-frame');
      if (oldFrame) oldFrame.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'techfix-receipt-print-frame';
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
            <title>TECHFIX Invoice - ${invoiceNumber}</title>
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
              #printable-tax-invoice-sheet, #printable-repair-receipt-area {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: 6px 10px !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
              }
            </style>
          </head>
          <body>
            ${printElement.outerHTML}
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
    } catch (e) {
      window.print();
    }
  };

  // Download PDF
  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    setTimeout(() => {
      handlePrint();
      setIsDownloadingPdf(false);
    }, 200);
  };

  // WhatsApp sharing
  const handleShareWhatsApp = () => {
    const totalAmt = taxInvoiceData.totalAmountAfterTax.toFixed(2);
    const message = 
      `🧾 *TECHFIX TAX INVOICE - #${invoiceNumber}*\n` +
      `👤 Customer: ${customerName}\n` +
      `📅 Date: ${taxInvoiceData.invoiceDate}\n` +
      `💰 Total: ₹${totalAmt}\n` +
      `🛡️ Warranty: 90 Days Guarantee\n` +
      `📍 Shop: Dubapara Lupta Char, Goalpara, Assam\n` +
      `Thank you for trusting TECHFIX!`;

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone.length >= 10 
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-4xl w-full my-4 flex flex-col max-h-[95vh] shadow-2xl overflow-hidden">
        {/* Top Modal Navigation Header */}
        <div className="p-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-extrabold block">
                Invoice & Receipt Viewer
              </span>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>#{invoiceNumber}</span>
                <span className="text-xs font-normal text-slate-400">• {customerName}</span>
              </h3>
            </div>

            {/* Template Selector */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setInvoiceFormat('taxInvoice')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  invoiceFormat === 'taxInvoice'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🧾 Tax Invoice (Image Format)</span>
              </button>
              <button
                onClick={() => setInvoiceFormat('serviceReceipt')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  invoiceFormat === 'serviceReceipt'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📄 Service Receipt</span>
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Manual Logo Update Button */}
            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95"
              title="Manual Logo Update"
            >
              <Upload className="w-4 h-4" />
              <span>Update Logo</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-md active:scale-95"
              title="Print Invoice"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{isDownloadingPdf ? 'Generating...' : 'PDF'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-md active:scale-95"
              title="Share via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition ml-1"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950 flex justify-center">
          <div ref={receiptContainerRef} className="shadow-2xl bg-white w-full max-w-3xl">
            {invoiceFormat === 'taxInvoice' ? (
              <TaxInvoiceView
                invoice={taxInvoiceData}
                businessDetails={businessDetails || undefined}
                onUpdateInvoice={(upd) => setCustomInvoiceOverride((prev) => ({ ...prev, ...upd }))}
              />
            ) : (
              <RepairServiceReceipt
                containerId="printable-repair-receipt-area"
                request={request}
                proposal={proposal}
                businessDetails={businessDetails}
              />
            )}
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-3 sm:px-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Official TECHFIX Single-Page A4 Invoice Layout • Pixel-Perfect to Image</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
          >
            Done
          </button>
        </div>
      </div>

      {/* Manual Logo Upload Modal */}
      <ManualLogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        currentLogoUrl={businessDetails?.logoUrl}
        onLogoUpdated={(newUrl) => {
          if (businessDetails && onUpdateBusinessDetails) {
            onUpdateBusinessDetails({
              ...businessDetails,
              logoUrl: newUrl || ''
            });
          }
          setIsLogoModalOpen(false);
        }}
      />
    </div>
  );
};
