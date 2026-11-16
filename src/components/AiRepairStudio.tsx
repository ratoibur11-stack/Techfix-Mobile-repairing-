import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Wrench, 
  Send, 
  MessageSquare, 
  RefreshCw, 
  Copy, 
  Check, 
  Smartphone, 
  Cpu, 
  Zap, 
  AlertTriangle, 
  ChevronRight, 
  FileText, 
  MessageCircle, 
  ShieldCheck,
  Languages,
  Info
} from 'lucide-react';
import { BUSINESS_DETAILS, COMMON_BRANDS } from '../data/initialData';
import { RepairProposal } from '../types';

interface AiRepairStudioProps {
  proposals: RepairProposal[];
  onCreateProposalFromAi: (deviceBrand: string, deviceModel: string, diagnosisText: string) => void;
}

export const AiRepairStudio: React.FC<AiRepairStudioProps> = ({
  proposals,
  onCreateProposalFromAi
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'whatsapp' | 'kb'>('diagnostic');

  // Diagnostic State
  const [brand, setBrand] = useState('Samsung');
  const [model, setModel] = useState('Galaxy M31');
  const [customSymptom, setCustomSymptom] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  // WhatsApp Generator State
  const [selectedProposalId, setSelectedProposalId] = useState<string>(proposals[0]?.id || '');
  const [clientName, setClientName] = useState(proposals[0]?.clientName || '');
  const [deviceModel, setDeviceModel] = useState(proposals[0]?.deviceModel || '');
  const [ticketNo, setTicketNo] = useState(proposals[0]?.proposalNumber || 'TECH-8842');
  const [ticketStatus, setTicketStatus] = useState(proposals[0]?.status || 'In Progress');
  const [ticketPrice, setTicketPrice] = useState(proposals[0]?.finalPrice || 1450);
  const [language, setLanguage] = useState<'English' | 'Assamese' | 'Hindi'>('English');
  const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);
  const [generatedMsg, setGeneratedMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick Preset Symptoms
  const presetSymptoms = [
    "💧 Phone fell in water, won't turn on, red charging LED",
    "⚡ Stuck on Brand Logo / Bootloop after software update",
    "🔌 Charging icon shows but percentage stays stuck or drains",
    "📱 Blank screen / backlight dim, touch vibration works",
    "📶 No network service / emergency calls only after drop",
    "🔥 Phone gets extremely hot near camera area when charging",
    "🔊 Ear speaker and primary mic dead during normal calls"
  ];

  // Handle Diagnostic API Call
  const handleRunAiDiagnosis = async (symptomText?: string) => {
    const textToAnalyze = symptomText || customSymptom;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: textToAnalyze,
          deviceBrand: brand,
          deviceModel: model
        })
      });

      const data = await res.json();
      setAiResult(data.answer || "Diagnosis complete.");
    } catch (err) {
      console.error(err);
      setAiResult(`[Diagnostic Summary]\n• Device: ${brand} ${model}\n• Reported Issue: "${textToAnalyze}"\n• Suggested Action: Micro-soldering DC power supply line test & battery rail measurement.\n• Estimated Shop Repair Cost: ₹600 - ₹1,800 INR.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Proposal Selection in WhatsApp Generator
  const handleSelectProposalForMsg = (pId: string) => {
    setSelectedProposalId(pId);
    const found = proposals.find(p => p.id === pId);
    if (found) {
      setClientName(found.clientName);
      setDeviceModel(`${found.deviceBrand} ${found.deviceModel}`);
      setTicketNo(found.proposalNumber);
      setTicketStatus(found.status);
      setTicketPrice(found.finalPrice);
    }
  };

  // Handle WhatsApp Generator API Call
  const handleGenerateWhatsAppMsg = async () => {
    setIsGeneratingMsg(true);
    setGeneratedMsg(null);

    try {
      const res = await fetch('/api/ai/generate-whatsapp-msg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          deviceModel,
          proposalNumber: ticketNo,
          status: ticketStatus,
          finalPrice: ticketPrice,
          language
        })
      });

      const data = await res.json();
      setGeneratedMsg(data.message || "Message generated.");
    } catch (err) {
      console.error(err);
      setGeneratedMsg(`Hello ${clientName}, your ${deviceModel} repair (Ticket: *${ticketNo}*) is currently: *${ticketStatus}*. Total estimate: ₹${ticketPrice}. - TECHFIX Shop, Goalpara.`);
    } finally {
      setIsGeneratingMsg(false);
    }
  };

  const handleCopyMsg = () => {
    if (!generatedMsg) return;
    navigator.clipboard.writeText(generatedMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-indigo-900/50 shadow-2xl space-y-4">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>TECHFIX AI Mobile Engineering Hub</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Smart AI Repair Diagnostic Studio
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Powered by Google Gemini 3.7 Thinking Engine. Analyze complex smartphone circuit symptoms, reballing feasibility, firmware crash loops, and auto-generate multilingual customer WhatsApp updates.
          </p>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'diagnostic'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>AI Symptom Diagnostic & Estimator</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'whatsapp'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Languages className="w-4 h-4 text-emerald-400" />
            <span>AI Multilingual Customer Updates</span>
          </button>

          <button
            onClick={() => setActiveTab('kb')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'kb'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>IC Micro-Soldering KB</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI Symptom Diagnostic & Estimator */}
      {activeTab === 'diagnostic' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Input Panel */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                <span>Mobile Device & Symptom Input</span>
              </h2>
              <p className="text-xs text-slate-500">
                Select device model and describe or pick hardware symptoms for AI circuit analysis.
              </p>
            </div>

            {/* Device Brand & Model */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  {COMMON_BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model Name</label>
                <input
                  type="text"
                  placeholder="e.g. M31 / Note 10"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Preset Symptom Selector Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quick Preset Symptoms:
              </label>
              <div className="space-y-2">
                {presetSymptoms.map((ps, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCustomSymptom(ps);
                      handleRunAiDiagnosis(ps);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 font-medium transition-all flex items-start gap-2 group"
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="line-clamp-2">{ps}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Custom Problem Description</label>
              <textarea
                rows={3}
                placeholder="Describe phone condition, current draw on DC supply, water exposure, or crash symptoms..."
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
              />
            </div>

            <button
              onClick={() => handleRunAiDiagnosis()}
              disabled={isAnalyzing || !customSymptom.trim()}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Gemini 3.7 Thinking Engine in progress...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Run Gemini 3.7 Diagnostic Analysis</span>
                </>
              )}
            </button>
          </div>

          {/* AI Result Panel */}
          <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-400">Gemini 3.7 Thinking Diagnostic Report</span>
                    <h3 className="text-base font-bold">{brand} {model}</h3>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  Ready
                </span>
              </div>

              {!aiResult && !isAnalyzing && (
                <div className="py-12 text-center space-y-3">
                  <Cpu className="w-12 h-12 text-slate-700 mx-auto" />
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    Select a preset symptom or enter problem details on the left to receive AI root-cause analysis and repair cost estimate.
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="py-12 text-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
                  <p className="text-xs text-blue-300 font-mono">
                    Analyzing motherboard schematics, IC rails & repair market prices...
                  </p>
                </div>
              )}

              {aiResult && !isAnalyzing && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                    {aiResult}
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Technician Guarantee:</strong> All estimates include component testing and TECHFIX shop warranty at Goalpara.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {aiResult && !isAnalyzing && (
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => onCreateProposalFromAi(brand, model, customSymptom || "AI Diagnostic Diagnosis")}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Convert AI Result to Repair Proposal Ticket</span>
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 2: AI Multilingual WhatsApp Message Studio */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Languages className="w-5 h-5 text-emerald-600" />
                <span>Customer Update Generator</span>
              </h2>
              <p className="text-xs text-slate-500">
                Generate professional, customer-friendly WhatsApp status updates in English, Assamese, or Hindi.
              </p>
            </div>

            {/* Proposal Selector */}
            {proposals.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pick Active Proposal Ticket</label>
                <select
                  value={selectedProposalId}
                  onChange={(e) => handleSelectProposalForMsg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium"
                >
                  {proposals.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.proposalNumber} - {p.clientName} ({p.deviceModel})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Device Model</label>
                <input
                  type="text"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Status</label>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900"
                >
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Approved">Approved</option>
                  <option value="In Progress">In Progress (Diagnosis / IC Repair)</option>
                  <option value="Ready for Pickup">Ready for Pickup</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Cost (₹)</label>
                <input
                  type="number"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Language Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Select Language:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['English', 'Assamese', 'Hindi'] as const).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      language === lang
                        ? 'bg-slate-900 text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateWhatsAppMsg}
              disabled={isGeneratingMsg}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isGeneratingMsg ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Drafting Message in {language}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate AI Message ({language})</span>
                </>
              )}
            </button>

          </div>

          {/* Generated Message Display */}
          <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400">WhatsApp Template</span>
                    <h3 className="text-base font-bold">{clientName || 'Customer'} - {ticketNo}</h3>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                  {language}
                </span>
              </div>

              {!generatedMsg && !isGeneratingMsg && (
                <div className="py-12 text-center space-y-3">
                  <MessageSquare className="w-12 h-12 text-slate-700 mx-auto" />
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    Click "Generate AI Message" to create an automated status update to send via WhatsApp.
                  </p>
                </div>
              )}

              {isGeneratingMsg && (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-xs text-emerald-300">Formulating polite message in {language}...</p>
                </div>
              )}

              {generatedMsg && !isGeneratingMsg && (
                <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 text-sm text-slate-100 whitespace-pre-line leading-relaxed font-sans shadow-inner">
                  {generatedMsg}
                </div>
              )}
            </div>

            {generatedMsg && !isGeneratingMsg && (
              <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3 justify-end">
                <button
                  onClick={handleCopyMsg}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <a
                  href={`https://wa.me/${BUSINESS_DETAILS.whatsapp}?text=${encodeURIComponent(generatedMsg)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open WhatsApp Direct</span>
                </a>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 3: IC Micro-Soldering Knowledge Lookup */}
      {activeTab === 'kb' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-600" />
              <span>IC Micro-Soldering Technical Reference</span>
            </h2>
            <p className="text-xs text-slate-500">
              Reference guide for multi-meter diode values, rail voltages, and IC replacement procedures at TECHFIX.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>Charging IC (PMI632 / BQ25601)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Check VBUS input 5.0V from USB port. Measure VBAT output rail (3.7V - 4.2V). If current draw is stuck at 0.06A on USB tester, replace or reball the Charging IC.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>CPU & RAM Dual-Decker</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Common in Samsung M31/M21 & Poco X3 Pro dead CPU issues. Heat top RAM chip at 280°C to separate, then reball bottom CPU at 340°C with 0.12mm stencil.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Display Light IC & Coil</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If phone has touch & call sound but no screen light, test diode value on Anode (+) pin (approx 0.450V). Replace boost coil and 6-pin LED driver IC if burned.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
