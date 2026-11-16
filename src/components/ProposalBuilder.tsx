import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Calculator, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  ShieldCheck, 
  Clock, 
  Send,
  Loader2,
  DollarSign,
  User,
  Smartphone,
  Info
} from 'lucide-react';
import { RepairProposal, RepairItem, RepairCategory } from '../types';
import { BUSINESS_DETAILS } from '../data/initialData';

interface ProposalBuilderProps {
  onSaveProposal: (proposal: RepairProposal) => void;
  onCancel: () => void;
}

const COMMON_BRANDS = ['Samsung', 'Redmi / Xiaomi', 'Vivo', 'Oppo', 'OnePlus', 'Realme', 'Poco', 'iPhone', 'Motorola', 'Other'];

export const ProposalBuilder: React.FC<ProposalBuilderProps> = ({
  onSaveProposal,
  onCancel
}) => {
  // Client Info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // Device Info
  const [deviceBrand, setDeviceBrand] = useState('Samsung');
  const [customBrand, setCustomBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [imeiOrSerial, setImeiOrSerial] = useState('');
  const [problemDescription, setProblemDescription] = useState('');

  // Technical & AI Diagnostics
  const [diagnosticNotes, setDiagnosticNotes] = useState('');
  const [riskAssessment, setRiskAssessment] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Line Items
  const [repairItems, setRepairItems] = useState<RepairItem[]>([
    {
      id: "item-init-1",
      description: "Comprehensive Hardware & Software Diagnostic Check",
      category: "Diagnosis",
      cost: 150,
      timeEstimate: "30 Mins",
      warrantyPeriod: "N/A"
    }
  ]);

  // Pricing & Financials
  const [discount, setDiscount] = useState<number>(100);
  const [advancePaid, setAdvancePaid] = useState<number>(500);
  const [warrantyDays, setWarrantyDays] = useState<number>(90);
  const [estimatedCompletionTime, setEstimatedCompletionTime] = useState('Same Day (4 Hours)');

  // Helper calculation
  const subtotal = repairItems.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const finalPrice = Math.max(0, subtotal - (Number(discount) || 0));
  const balanceDue = Math.max(0, finalPrice - (Number(advancePaid) || 0));

  // AI Diagnostic Call
  const handleRunAiDiagnosis = async () => {
    const targetBrand = deviceBrand === 'Other' ? customBrand : deviceBrand;
    if (!targetBrand || !deviceModel || !problemDescription) {
      setAiError("Please fill in Device Brand, Model, and Problem Symptoms first.");
      return;
    }

    setAiError(null);
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceBrand: targetBrand,
          deviceModel,
          symptoms: problemDescription
        })
      });

      if (!response.ok) {
        throw new Error("Diagnosis service unavailable.");
      }

      const data = await response.json();

      if (data.technicalAnalysis) {
        setDiagnosticNotes(data.technicalAnalysis);
      }
      if (data.riskAssessment) {
        setRiskAssessment(data.riskAssessment);
      }
      if (data.estimatedDays) {
        setEstimatedCompletionTime(data.estimatedDays);
      }

      if (data.proposedLineItems && Array.isArray(data.proposedLineItems) && data.proposedLineItems.length > 0) {
        const newItems: RepairItem[] = data.proposedLineItems.map((item: any, idx: number) => ({
          id: `ai-item-${Date.now()}-${idx}`,
          description: item.description || "Repair Service",
          category: (item.category as RepairCategory) || "Hardware",
          cost: Number(item.cost) || 500,
          timeEstimate: item.timeEstimate || "1 Hour",
          warrantyPeriod: item.warrantyPeriod || "90 Days"
        }));

        setRepairItems(newItems);
      }
    } catch (err: any) {
      console.error(err);
      setAiError("Could not run AI auto-diagnosis. You can enter technician line items manually below.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Line items handlers
  const handleAddItem = () => {
    const newItem: RepairItem = {
      id: `item-${Date.now()}`,
      description: "New Repair Service / Spare Part",
      category: "Hardware",
      cost: 500,
      timeEstimate: "1 Hour",
      warrantyPeriod: "90 Days"
    };
    setRepairItems([...repairItems, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof RepairItem, value: any) => {
    setRepairItems(
      repairItems.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    if (repairItems.length === 1) return;
    setRepairItems(repairItems.filter(item => item.id !== id));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBrand = deviceBrand === 'Other' ? customBrand : deviceBrand;

    if (!clientName || !clientPhone || !deviceModel) {
      alert("Please fill in Client Name, Phone Number, and Device Model.");
      return;
    }

    const proposalId = `prop-${Date.now()}`;
    const proposalNumber = `TECH-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const newProposal: RepairProposal = {
      id: proposalId,
      proposalNumber,
      clientName,
      clientPhone,
      clientEmail: clientEmail || undefined,
      deviceBrand: finalBrand || "Android Phone",
      deviceModel,
      imeiOrSerial: imeiOrSerial || undefined,
      problemDescription: problemDescription || "General Hardware/Software Maintenance",
      diagnosticNotes: diagnosticNotes || "Pre-repair hardware and software check completed.",
      riskAssessment: riskAssessment || "Standard shop repair terms apply.",
      repairItems,
      subtotal,
      discount: Number(discount) || 0,
      tax: 0,
      finalPrice,
      advancePaid: Number(advancePaid) || 0,
      balanceDue,
      estimatedCompletionTime,
      warrantyDays,
      status: 'Sent',
      createdAt: formattedDate,
      updatedAt: formattedDate,
      timelineEvents: [
        {
          id: `tl-${Date.now()}-1`,
          stage: "Intake & Diagnosis",
          title: "Proposal Created & Device Registered",
          description: `Device ${finalBrand} ${deviceModel} inspected at Goalpara shop.`,
          timestamp: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          completed: true
        },
        {
          id: `tl-${Date.now()}-2`,
          stage: "Proposal Approval",
          title: "Proposal Sent to Client",
          description: `Estimate of ₹${finalPrice} sent for client review & approval.`,
          timestamp: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          completed: false,
          isCurrent: true
        },
        {
          id: `tl-${Date.now()}-3`,
          stage: "Hardware & IC Repair",
          title: "Repair & IC Micro-soldering",
          description: "Component replacement and board-level repair process.",
          timestamp: "Pending",
          completed: false
        },
        {
          id: `tl-${Date.now()}-4`,
          stage: "Quality Testing",
          title: "QC Multi-point Inspection",
          description: "Display, touch, charging, signal, and audio testing.",
          timestamp: "Pending",
          completed: false
        },
        {
          id: `tl-${Date.now()}-5`,
          stage: "Ready for Pickup",
          title: "Ready at TECHFIX Shop",
          description: "Ready for pickup at Dubapara Lupta Char, Goalpara.",
          timestamp: "Pending",
          completed: false
        }
      ]
    };

    onSaveProposal(newProposal);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-semibold uppercase tracking-wider">
              TECHFIX Proposal Generator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Create Repair Proposal & Estimate
          </h1>
          <p className="text-sm text-slate-600">
            Generate formal itemized repair proposals, run AI issue diagnostics, and track client approvals.
          </p>
        </div>

        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
        >
          Cancel & Return
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Client Information */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h2>1. Client Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Das"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98642 45987"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. customer@gmail.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Mobile Device & Symptoms */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Smartphone className="w-5 h-5 text-indigo-600" />
                <h2>2. Device Information & Symptoms</h2>
              </div>

              {/* AI Auto-Diagnosis Button */}
              <button
                type="button"
                onClick={handleRunAiDiagnosis}
                disabled={isAiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs hover:opacity-90 transition shadow-sm disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Issue...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI Diagnostics Assistant</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{aiError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Device Brand *
                </label>
                <select
                  value={deviceBrand}
                  onChange={(e) => setDeviceBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 bg-white"
                >
                  {COMMON_BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {deviceBrand === 'Other' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specify Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lava, Tecno, Infinix"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Device Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Galaxy M31 / Redmi Note 10 Pro"
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                  />
                </div>
              )}

              {deviceBrand !== 'Other' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IMEI / Serial Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 358921004928172"
                    value={imeiOrSerial}
                    onChange={(e) => setImeiOrSerial(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reported Problem / Symptoms *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the problem (e.g. Water damaged, screen dead, charging connector broken, stuck on Mi logo, charging IC short, no network)..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                />
              </div>
            </div>

            {/* Diagnostics Analysis Notes */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Technician Diagnostic Analysis Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Pre-repair technical inspection details, multi-meter voltage checks, motherboard condition..."
                  value={diagnosticNotes}
                  onChange={(e) => setDiagnosticNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Risk & Pre-Repair Disclaimer Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Water damage IC reballing carries mild risk. Customer data backup recommended."
                  value={riskAssessment}
                  onChange={(e) => setRiskAssessment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Itemized Repair Services & Parts */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h2>3. Itemized Repair Services & Parts</h2>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {repairItems.map((item, index) => (
                <div 
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 transition-all hover:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-600">
                      Line Item #{index + 1}
                    </span>

                    {repairItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Service / Part Name
                      </label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Category
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value as RepairCategory)}
                        className="w-full px-2.5 py-2 bg-white rounded-lg border border-slate-300 text-xs text-slate-900"
                      >
                        <option value="Hardware">Hardware</option>
                        <option value="Software">Software</option>
                        <option value="IC-Level">IC-Level</option>
                        <option value="Parts & Accessories">Parts</option>
                        <option value="Diagnosis">Diagnosis</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Cost (₹ INR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="0"
                        value={item.cost === 0 ? '' : item.cost}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleUpdateItem(item.id, 'cost', e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Time Estimate
                      </label>
                      <input
                        type="text"
                        value={item.timeEstimate}
                        onChange={(e) => handleUpdateItem(item.id, 'timeEstimate', e.target.value)}
                        placeholder="e.g. 1 Hour"
                        className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Warranty Period
                      </label>
                      <input
                        type="text"
                        value={item.warrantyPeriod}
                        onChange={(e) => handleUpdateItem(item.id, 'warrantyPeriod', e.target.value)}
                        placeholder="e.g. 90 Days"
                        className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Commercial Terms & Turnaround */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-3">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <h2>4. Commercials, Advance & Timeline</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discount Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discount === 0 ? '' : discount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDiscount(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Advance Payment Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={advancePaid === 0 ? '' : advancePaid}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setAdvancePaid(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop Warranty (Days)
                </label>
                <select
                  value={warrantyDays}
                  onChange={(e) => setWarrantyDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                >
                  <option value={30}>30 Days Warranty</option>
                  <option value={60}>60 Days Warranty</option>
                  <option value={90}>90 Days Warranty (Standard)</option>
                  <option value={180}>180 Days Warranty (6 Months)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Repair Turnaround Time
                </label>
                <input
                  type="text"
                  value={estimatedCompletionTime}
                  onChange={(e) => setEstimatedCompletionTime(e.target.value)}
                  placeholder="e.g. Same Day (4:00 PM) or 24-48 Hours"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Live Formal Proposal Preview & Action Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6">
            
            {/* Live Document Document Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-5">
              
              {/* Document Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-blue-400 font-extrabold text-lg tracking-tight">
                    <Wrench className="w-5 h-5 text-blue-400" />
                    <span>TECHFIX MOBILE REPAIRING SHOP</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Dubapara Lupta Char, Goalpara, Assam | Ph: +91 98642 45987
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                    ESTIMATE PROPOSAL
                  </span>
                </div>
              </div>

              {/* Client & Device Summary */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-800/80 text-xs border border-slate-700/60">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-semibold">Client</p>
                  <p className="font-semibold text-slate-100">{clientName || "Client Name"}</p>
                  <p className="text-slate-400">{clientPhone || "+91 Phone"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-semibold">Device</p>
                  <p className="font-semibold text-blue-300">
                    {(deviceBrand === 'Other' ? customBrand : deviceBrand) || "Brand"} {deviceModel || "Model"}
                  </p>
                  <p className="text-slate-400 truncate">{imeiOrSerial || "No IMEI"}</p>
                </div>
              </div>

              {/* Problem Brief */}
              <div className="text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Symptoms:</span>
                <p className="p-2.5 rounded-lg bg-slate-950 text-slate-300 italic border border-slate-800">
                  "{problemDescription || "Device issue details will appear here..."}"
                </p>
              </div>

              {/* Itemized Table */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">Proposed Line Items</p>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {repairItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 text-xs border border-slate-700/50"
                    >
                      <div className="pr-2">
                        <p className="font-medium text-slate-200">{item.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="text-blue-400">{item.category}</span>
                          <span>• {item.warrantyPeriod} warranty</span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-100 shrink-0">
                        ₹{item.cost}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-white pt-1 border-t border-slate-800">
                  <span>Final Estimated Cost:</span>
                  <span className="text-emerald-400">₹{finalPrice}</span>
                </div>
                <div className="flex justify-between text-slate-300 text-[11px] pt-1">
                  <span>Advance Received: ₹{advancePaid}</span>
                  <span className="font-bold text-amber-300">Balance Due: ₹{balanceDue}</span>
                </div>
              </div>

              {/* Shop Guarantee Note */}
              <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/50 text-[11px] text-blue-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Includes {warrantyDays}-Day TECHFIX Shop Warranty on replaced hardware & IC components. Estimated completion: <strong className="text-white">{estimatedCompletionTime}</strong>.
                </span>
              </div>

              {/* Save & Generate Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Save & Send Repair Proposal</span>
              </button>

            </div>

          </div>
        </div>

      </form>
    </div>
  );
};
