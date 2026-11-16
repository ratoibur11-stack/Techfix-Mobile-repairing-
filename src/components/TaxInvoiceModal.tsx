import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  X,
  Edit3,
  Upload,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { TaxInvoiceData, ShopBusinessDetails } from '../types';
import { TaxInvoiceView } from './TaxInvoiceView';
import { ManualLogoModal } from './ManualLogoModal';
import { SAMPLE_TAX_INVOICE } from '../data/sampleTaxInvoice';

interface TaxInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: TaxInvoiceData | null;
  businessDetails?: ShopBusinessDetails;
  onUpdateBusinessDetails?: (updated: ShopBusinessDetails) => void;
  onEditInvoice?: (invoice: TaxInvoiceData) => void;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice = SAMPLE_TAX_INVOICE,
  businessDetails,
  onUpdateBusinessDetails,
  onEditInvoice
}) => {
  const [isManualLogoOpen, setIsManualLogoOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<TaxInvoiceData>(() => invoice || SAMPLE_TAX_INVOICE);

  if (!isOpen) return null;

  // Print function (A4 single-page print)
  const handlePrint = () => {
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
            <title>TECHFIX Invoice - ${currentInvoice.invoiceNumber}</title>
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
                margin: 0 auto !important;
                padding: 6px 10px !important;
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

  // WhatsApp share
  const handleShareWhatsApp = () => {
    const text = `🧾 *TECHFIX INVOICE - #${currentInvoice.invoiceNumber}*\n` +
      `👤 Customer: ${currentInvoice.customerName}\n` +
      `📅 Date: ${currentInvoice.invoiceDate}\n` +
      `💰 Total Amount: ₹${currentInvoice.totalAmountAfterTax.toFixed(2)}\n` +
      `🏪 Shop: TECHFIX MOBILE REPAIRING SHOP, Goalpara\n` +
      `📞 Contact: ${businessDetails?.phone || '+91 9864245987'}\n` +
      `🔗 Verification: ${currentInvoice.verificationUrl || 'https://sarate.wuaze.com/verify'}\n\n` +
      `Thank you for choosing TECHFIX Goalpara!`;

    const encoded = encodeURIComponent(text);
    const phone = currentInvoice.customerPhone?.replace(/[^0-9]/g, '') || '';
    const url = phone.length >= 10
      ? `https://wa.me/91${phone.slice(-10)}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
  };

  const handleLogoUpdated = (newUrl: string | null) => {
    if (businessDetails && onUpdateBusinessDetails) {
      onUpdateBusinessDetails({
        ...businessDetails,
        logoUrl: newUrl || ''
      });
    }
    setIsManualLogoOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar */}
        <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider">
              {currentInvoice.invoiceTitle || 'INVOICE'}
            </span>
            <span className="font-bold text-sm">
              #{currentInvoice.invoiceNumber} — {currentInvoice.customerName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Manual Logo Update Button */}
            <button
              onClick={() => setIsManualLogoOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-xs transition"
              title="Manual Logo Update (Upload file or URL)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Shop Logo</span>
            </button>

            {/* Edit Invoice Button if callback provided */}
            {onEditInvoice && (
              <button
                onClick={() => onEditInvoice(currentInvoice)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            )}

            {/* WhatsApp Share */}
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* Print / Download Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: The Non-GST Invoice Paper Preview */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/50 flex justify-center">
          <div className="bg-white shadow-2xl rounded-none border border-slate-300 w-full max-w-[820px]">
            <TaxInvoiceView
              invoice={currentInvoice}
              businessDetails={businessDetails}
              onUpdateInvoice={setCurrentInvoice}
            />
          </div>
        </div>
      </div>

      {/* Manual Logo Upload Modal */}
      <ManualLogoModal
        isOpen={isManualLogoOpen}
        onClose={() => setIsManualLogoOpen(false)}
        currentLogoUrl={businessDetails?.logoUrl}
        onLogoUpdated={handleLogoUpdated}
      />
    </div>
  );
};
