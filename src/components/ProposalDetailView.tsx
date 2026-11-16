import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Share2, 
  Printer, 
  MessageSquare, 
  Star, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowLeft,
  ChevronRight,
  Phone,
  Check,
  UserCheck,
  Smartphone,
  MessageCircle,
  MoreVertical,
  MoreHorizontal,
  Copy,
  FileText,
  FileDown,
  QrCode
} from 'lucide-react';
import { RepairProposal, RepairStatus, TimelineEvent, ShopBusinessDetails } from '../types';
import { BUSINESS_DETAILS } from '../data/initialData';
import { TechfixLogo } from './TechfixLogo';
import { RepairServiceReceipt } from './RepairServiceReceipt';

interface ProposalDetailViewProps {
  proposal: RepairProposal;
  onUpdateProposal: (updated: RepairProposal) => void;
  onBack: () => void;
  businessDetails?: ShopBusinessDetails;
  isAdmin?: boolean;
}

export const ProposalDetailView: React.FC<ProposalDetailViewProps> = ({
  proposal,
  onUpdateProposal,
  onBack,
  businessDetails = BUSINESS_DETAILS,
  isAdmin = false
}) => {
  const [signatureName, setSignatureName] = useState(proposal.clientSignature || '');
  const [feedbackText, setFeedbackText] = useState(proposal.clientFeedback?.comment || '');
  const [rating, setRating] = useState<number>(proposal.clientFeedback?.rating || 5);
  const [isApproving, setIsApproving] = useState(false);
  const [techNoteInput, setTechNoteInput] = useState('');

  // 3-Dots Menu State & Ref
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsDetailMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simulated SMS Notification State
  const [sendSmsNotification, setSendSmsNotification] = useState<boolean>(true);
  const [smsLogs, setSmsLogs] = useState<Array<{ id: string; time: string; phone: string; text: string }>>([]);
  const [activeSmsToast, setActiveSmsToast] = useState<{ phone: string; text: string; time: string } | null>(null);

  // Helper function to simulate dispatching SMS
  const dispatchSimulatedSms = (statusText: string, extraNote?: string) => {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const smsText = `[TECHFIX SMS] Hello ${proposal.clientName}, your ${proposal.deviceBrand} ${proposal.deviceModel} repair (Ticket: ${proposal.proposalNumber}) status is now: *${statusText}*. ${extraNote ? `Note: ${extraNote}` : 'Thank you for choosing TECHFIX Goalpara.'}`;

    const newLog = {
      id: `sms-${Date.now()}`,
      time: timeStr,
      phone: proposal.clientPhone,
      text: smsText
    };

    setSmsLogs(prev => [newLog, ...prev]);
    setActiveSmsToast({ phone: proposal.clientPhone, text: smsText, time: timeStr });

    // Auto-dismiss toast after 6 seconds
    setTimeout(() => {
      setActiveSmsToast(null);
    }, 6000);
  };

  // Timeline Progress calculation
  const completedEvents = proposal.timelineEvents.filter(e => e.completed).length;
  const progressPercent = Math.round((completedEvents / proposal.timelineEvents.length) * 100);

  // Client Accept Proposal
  const handleApproveProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName) {
      alert("Please enter your name as signature to approve.");
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Update timeline step 2 (Proposal Approval) as completed
    const updatedEvents = proposal.timelineEvents.map((evt, idx) => {
      if (idx === 1) {
        return {
          ...evt,
          completed: true,
          isCurrent: false,
          timestamp: formattedDate
        };
      }
      if (idx === 2) {
        return {
          ...evt,
          isCurrent: true
        };
      }
      return evt;
    });

    const updated: RepairProposal = {
      ...proposal,
      status: 'Approved',
      approvedAt: formattedDate,
      clientSignature: signatureName,
      timelineEvents: updatedEvents,
      updatedAt: formattedDate
    };

    onUpdateProposal(updated);
    setIsApproving(false);

    if (sendSmsNotification) {
      dispatchSimulatedSms('Approved & Client Signed', `Digitally signed by ${signatureName}`);
    }
  };

  // Submit Client Review / Feedback
  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText) return;

    const updated: RepairProposal = {
      ...proposal,
      clientFeedback: {
        id: `fb-${Date.now()}`,
        clientName: proposal.clientName,
        rating,
        comment: feedbackText,
        submittedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        approved: true,
        serviceType: proposal.repairItems[0]?.description || "Mobile Repairing",
        deviceModel: `${proposal.deviceBrand} ${proposal.deviceModel}`
      }
    };

    onUpdateProposal(updated);
  };

  // Technician Update Timeline Stage
  const handleAdvanceTimelineStage = (stageIndex: number) => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const updatedEvents = proposal.timelineEvents.map((evt, idx) => {
      if (idx <= stageIndex) {
        return {
          ...evt,
          completed: true,
          isCurrent: false,
          timestamp: (!evt.timestamp || evt.timestamp === 'Pending' || idx === stageIndex) ? now : evt.timestamp,
          technicianNote: idx === stageIndex ? (techNoteInput || evt.technicianNote) : evt.technicianNote
        };
      }
      if (idx === stageIndex + 1) {
        return {
          ...evt,
          isCurrent: true
        };
      }
      return evt;
    });

    let newStatus: RepairStatus = proposal.status;
    if (stageIndex === 2) newStatus = 'In Progress';
    if (stageIndex === 3) newStatus = 'In Progress';
    if (stageIndex === 4 || stageIndex === proposal.timelineEvents.length - 1) newStatus = 'Completed';

    const updated: RepairProposal = {
      ...proposal,
      status: newStatus,
      timelineEvents: updatedEvents,
      updatedAt: now
    };

    onUpdateProposal(updated);
    setTechNoteInput('');

    if (sendSmsNotification) {
      const stageName = updatedEvents[stageIndex]?.title || newStatus;
      dispatchSimulatedSms(newStatus, `Stage completed: ${stageName}${techNoteInput ? `. Tech note: ${techNoteInput}` : ''}`);
    }
  };

  // Print Invoice Action (Isolated Single-Page Print)
  const handlePrint = () => {
    const printElement = document.getElementById('printable-estimate-document');
    if (!printElement) {
      window.print();
      return;
    }

    try {
      const oldFrame = document.getElementById('techfix-proposal-print-frame');
      if (oldFrame) oldFrame.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'techfix-proposal-print-frame';
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
            <title>TECHFIX Proposal Estimate - ${proposal.proposalNumber}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page {
                size: A4 portrait;
                margin: 6mm 8mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
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
              #printable-estimate-document {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: 0 !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .serial-number-red {
                color: #dc2626 !important;
                border-color: #dc2626 !important;
                font-weight: 900 !important;
              }
            </style>
          </head>
          <body class="bg-white p-2">
            <div style="width: 100%; max-width: 100%; margin: 0 auto;">
              ${printElement.outerHTML}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          window.print();
        }
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      }, 450);
    } catch (err) {
      window.print();
    }
  };

  // Dedicated PDF Download Action using html2pdf
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printDocumentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const element = printDocumentRef.current || document.getElementById('printable-estimate-document');
      if (!element) {
        window.print();
        setIsGeneratingPdf(false);
        return;
      }

      // Dynamically import html2pdf.js
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

      const opt = {
        margin: [10, 8, 10, 8],
        filename: `TECHFIX_Estimate_${proposal.proposalNumber}_${proposal.clientName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.warn('html2pdf direct download fallback to print dialog', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Inline Print Styles for clean PDF invoice export */}
      <style>{`
        @media print {
          html, body, #root, main {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-estimate-document, #printable-estimate-document * {
            visibility: visible !important;
          }
          #printable-estimate-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: 2px solid #0f172a !important;
            border-radius: 0 !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 13pt !important;
            line-height: 1.45 !important;
          }
          #printable-estimate-document p, 
          #printable-estimate-document span, 
          #printable-estimate-document div {
            font-size: 12pt !important;
          }
          #printable-estimate-document table {
            font-size: 12pt !important;
          }
          #printable-estimate-document th {
            font-size: 11.5pt !important;
            font-weight: 900 !important;
          }
          #printable-estimate-document td {
            font-size: 12pt !important;
          }
          .serial-number-red {
            color: #dc2626 !important;
            font-weight: 900 !important;
            font-size: 16pt !important;
            border: 2px solid #dc2626 !important;
            background-color: #fef2f2 !important;
            padding: 4px 12px !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Bar Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Proposals</span>
        </button>

        <div className="flex flex-wrap items-center gap-2" ref={menuRef}>
          {/* Top-Level Mark Complete Button */}
          {proposal.status === 'Completed' ? (
            <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Completed</span>
            </span>
          ) : (
            <button
              onClick={() => {
                const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                const updatedEvents = proposal.timelineEvents.map(evt => ({
                  ...evt,
                  completed: true,
                  isCurrent: false,
                  timestamp: (!evt.timestamp || evt.timestamp === 'Pending') ? now : evt.timestamp
                }));
                const updatedProposal: RepairProposal = {
                  ...proposal,
                  status: 'Completed',
                  timelineEvents: updatedEvents,
                  updatedAt: now
                };
                onUpdateProposal(updatedProposal);
                dispatchSimulatedSms('Completed', 'Repair marked as COMPLETED by technician.');
                alert(`Proposal ${proposal.proposalNumber} has been marked as COMPLETED!`);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md active:scale-95"
              title="Mark repair as fully completed"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-100" />
              <span>Mark Complete</span>
            </button>
          )}

          {/* Main Print to PDF Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold transition-all shadow-md active:scale-95"
            title="Print or Save as PDF Repair Invoice"
          >
            <Printer className="w-4.5 h-4.5 text-emerald-100" />
            <span>Print to PDF Repair Bill</span>
          </button>

          {/* Dedicated Download PDF File Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Download PDF Document File"
          >
            <FileDown className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce text-cyan-200' : 'text-cyan-400'}`} />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF File'}</span>
          </button>

          <a
            href={`https://wa.me/${proposal.clientPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(proposal.clientName)},%20here%20is%20your%20TECHFIX%20repair%20proposal%20${proposal.proposalNumber}:%20Amount%20₹${proposal.finalPrice}.`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share via WhatsApp</span>
          </a>

          {/* 3-DOTS (...) ALL PROPOSAL FUNCTIONS DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDetailMenuOpen(!isDetailMenuOpen)}
              className={`p-2.5 sm:px-3 sm:py-2 rounded-xl transition-all border flex items-center gap-1.5 text-xs font-bold ${
                isDetailMenuOpen
                  ? 'bg-slate-900 text-cyan-400 border-cyan-500 shadow-md'
                  : 'bg-white text-slate-800 hover:bg-slate-100 border-slate-300'
              }`}
              title="All Proposal Actions Menu"
            >
              <MoreVertical className="w-4 h-4 text-slate-700" />
              <span className="hidden md:inline">Actions</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1 rounded font-mono font-bold">...</span>
            </button>

            {isDetailMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-2xl z-50 p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-cyan-400 tracking-wider flex items-center gap-1">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                    All Ticket Actions ({proposal.proposalNumber})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Options</span>
                </div>

                <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                  <button
                    onClick={() => {
                      handleDownloadPdf();
                      setIsDetailMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-cyan-300 hover:bg-slate-800 flex items-center gap-2.5 transition"
                  >
                    <FileDown className="w-4 h-4 text-cyan-400" />
                    <span>Download PDF Document</span>
                  </button>

                  <button
                    onClick={() => {
                      handlePrint();
                      setIsDetailMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition"
                  >
                    <Printer className="w-4 h-4 text-blue-400" />
                    <span>Print Invoice / Save PDF</span>
                  </button>

                  <a
                    href={`tel:${proposal.clientPhone}`}
                    onClick={() => setIsDetailMenuOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Direct Call ({proposal.clientPhone})</span>
                  </a>

                  <a
                    href={`https://wa.me/${proposal.clientPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(proposal.clientName)},%20here%20is%20your%20TECHFIX%20repair%20proposal%20${proposal.proposalNumber}:%20Amount%20₹${proposal.finalPrice}.`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setIsDetailMenuOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Send Proposal on WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      dispatchSimulatedSms(proposal.status, 'Triggered from 3-dots actions menu');
                      setIsDetailMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition"
                  >
                    <Smartphone className="w-4 h-4 text-purple-400" />
                    <span>Send Update SMS to Client</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsApproving(true);
                      setIsDetailMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition"
                  >
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Client Digital Signature / Approve</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://techfix-goalpara.app/track/${proposal.proposalNumber}`);
                      dispatchSimulatedSms(proposal.status, 'Copied tracking link');
                      setIsDetailMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition"
                  >
                    <Copy className="w-4 h-4 text-cyan-400" />
                    <span>Copy Tracking Link</span>
                  </button>

                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 px-3 uppercase tracking-wider">Quick Status Change:</span>
                    <div className="grid grid-cols-2 gap-1.5 px-2 pt-1">
                      {(['Proposal Sent', 'Approved', 'In Progress', 'Ready for Pickup', 'Completed'] as RepairStatus[]).map(st => (
                        <button
                          key={st}
                          onClick={() => {
                            const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                            let updatedEvents = [...proposal.timelineEvents];
                            if (st === 'Completed') {
                              updatedEvents = updatedEvents.map(evt => ({
                                ...evt,
                                completed: true,
                                isCurrent: false,
                                timestamp: (!evt.timestamp || evt.timestamp === 'Pending') ? now : evt.timestamp
                              }));
                            } else if (st === 'Ready for Pickup') {
                              updatedEvents = updatedEvents.map((evt, idx) => {
                                if (idx < updatedEvents.length - 1) {
                                  return {
                                    ...evt,
                                    completed: true,
                                    isCurrent: false,
                                    timestamp: (!evt.timestamp || evt.timestamp === 'Pending') ? now : evt.timestamp
                                  };
                                }
                                return { ...evt, isCurrent: true };
                              });
                            } else if (st === 'In Progress' || st === 'Approved') {
                              updatedEvents = updatedEvents.map((evt, idx) => {
                                if (idx <= 1) {
                                  return {
                                    ...evt,
                                    completed: true,
                                    isCurrent: false,
                                    timestamp: (!evt.timestamp || evt.timestamp === 'Pending') ? now : evt.timestamp
                                  };
                                }
                                if (idx === 2) return { ...evt, isCurrent: true };
                                return evt;
                              });
                            }
                            onUpdateProposal({ ...proposal, status: st, timelineEvents: updatedEvents, updatedAt: now });
                            dispatchSimulatedSms(st, `Status manually updated to ${st}`);
                            setIsDetailMenuOpen(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-center border transition ${
                            proposal.status === st
                              ? 'bg-blue-600 text-white border-blue-400'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setIsDetailMenuOpen(false);
                      onBack();
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Proposals List</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Proposal Summary Card - Official Single Page White Receipt */}
      <div 
        ref={printDocumentRef} 
        id="printable-estimate-document" 
        className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden p-2 sm:p-4"
      >
        <RepairServiceReceipt 
          proposal={proposal} 
          businessDetails={businessDetails} 
          containerId="printable-estimate-document"
        />

        {/* Client Digital Approval Section */}
        {proposal.status !== 'Approved' && proposal.status !== 'Completed' && (
          <div className="p-5 mt-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3 no-print">
            <div className="flex items-center gap-2 text-blue-950 font-bold">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <h3>Client Proposal Approval & Digital Signature</h3>
            </div>
            <p className="text-xs text-blue-800">
              Review the estimated repair cost of ₹{proposal.finalPrice} and terms above. Enter your name below to digitally accept this repair proposal.
            </p>

            <form onSubmit={handleApproveProposal} className="flex flex-wrap items-center gap-3 pt-1">
              <input
                type="text"
                required
                placeholder="Enter Full Name (Digital Signature)"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="flex-1 min-w-[220px] px-3.5 py-2.5 bg-white rounded-xl border border-blue-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition"
              >
                Accept & Approve Proposal
              </button>
            </form>
          </div>
        )}

        {proposal.clientSignature && (
          <div className="p-3.5 mt-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between no-print">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Digitally Approved by <strong>{proposal.clientSignature}</strong></span>
            </div>
            <span className="text-slate-500">{proposal.approvedAt}</span>
          </div>
        )}
      </div>

      {/* SMS Notification Switch Card (Admin Only) */}
      {isAdmin && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-all ${sendSmsNotification ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Send Update SMS to Client</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${sendSmsNotification ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                  {sendSmsNotification ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulates text message alert to <strong className="text-slate-200">{proposal.clientName}</strong> at <strong className="text-emerald-400 font-mono">{proposal.clientPhone}</strong> whenever repair status changes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => dispatchSimulatedSms(proposal.status, 'Manual status notification test from technician portal')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>Send Test SMS Now</span>
            </button>

            {/* Switch Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={sendSmsNotification}
              onClick={() => setSendSmsNotification(!sendSmsNotification)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                sendSmsNotification ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span className="sr-only">Toggle Send Update SMS</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  sendSmsNotification ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* SMS Dispatch History Log (Admin Only) */}
      {isAdmin && smsLogs.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 space-y-2 text-xs shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Simulated SMS Dispatch Log ({smsLogs.length})
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Client Phone: {proposal.clientPhone}</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {smsLogs.map(log => (
              <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono flex items-start justify-between gap-3">
                <span className="text-slate-300 leading-relaxed">{log.text}</span>
                <span className="text-slate-500 shrink-0 text-[10px]">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Active SMS Sent Toast */}
      {activeSmsToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl border border-emerald-500/50 shadow-2xl flex items-start gap-3 animate-bounce">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">
                📱 Simulated SMS Dispatched!
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{activeSmsToast.time}</span>
            </div>
            <p className="text-xs text-slate-200 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800 leading-relaxed">
              {activeSmsToast.text}
            </p>
            <p className="text-[10px] text-slate-400">
              Recipient: <span className="text-emerald-300 font-mono font-bold">{activeSmsToast.phone}</span>
            </p>
          </div>
          <button 
            onClick={() => setActiveSmsToast(null)}
            className="text-slate-400 hover:text-white text-xs font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Repair Timeline Progress Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Live Progress
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Repair Timeline Tracker
            </h2>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500">Stage Progress</span>
            <p className="text-lg font-bold text-blue-600">{progressPercent}% Completed</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Timeline Steps */}
        <div className="space-y-4 pt-2">
          {proposal.timelineEvents.map((evt, idx) => (
            <div 
              key={evt.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                evt.completed 
                  ? 'bg-emerald-50/40 border-emerald-200 text-slate-800' 
                  : evt.isCurrent 
                  ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20' 
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full mt-0.5 shrink-0 ${
                  evt.completed ? 'bg-emerald-500 text-white' :
                  evt.isCurrent ? 'bg-blue-600 text-white animate-bounce' :
                  'bg-slate-200 text-slate-500'
                }`}>
                  {evt.completed ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Step {idx + 1}: {evt.stage}
                    </span>
                    {evt.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        Current Stage
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{evt.title}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{evt.description}</p>

                  {evt.technicianNote && (
                    <p className="text-xs font-mono text-blue-700 bg-blue-100/60 p-2 rounded-lg mt-2">
                      Technician Note: "{evt.technicianNote}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {evt.completed && (!evt.timestamp || evt.timestamp === 'Pending')
                    ? 'Completed'
                    : evt.timestamp}
                </span>

                {/* Technician Advance Button (Admin Only) */}
                {isAdmin && !evt.completed && (
                  <button
                    onClick={() => handleAdvanceTimelineStage(idx)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Mark Complete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Feedback & Review Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-4 print:hidden">
        <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-3">
          <MessageSquare className="w-5 h-5 text-rose-500" />
          <h2>Client Repair Review & Feedback</h2>
        </div>

        {proposal.clientFeedback ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">
                {proposal.clientFeedback.clientName}
              </span>
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < proposal.clientFeedback!.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-700 italic">
              "{proposal.clientFeedback.comment}"
            </p>
            <p className="text-[10px] text-slate-400 text-right">
              Submitted at {proposal.clientFeedback.submittedAt}
            </p>
          </div>
        ) : (
          <form onSubmit={handleAddFeedback} className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star 
                      className={`w-5 h-5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={2}
              placeholder="Share your experience with TECHFIX Mobile Repairing Shop..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
            >
              Submit Review Feedback
            </button>
          </form>
        )}
      </div>

    </div>
  );
};
