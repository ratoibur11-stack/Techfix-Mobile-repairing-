import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  Wrench, 
  Phone, 
  MapPin, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  User,
  Zap,
  X,
  MessageCircle,
  Calendar,
  ArrowRight,
  Image as ImageIcon,
  Check,
  Smartphone
} from 'lucide-react';
import { RepairProposal, CustomerRepairRequest, CustomerUser } from '../types';
import { BUSINESS_DETAILS } from '../data/initialData';

interface TimelineTrackerProps {
  proposals: RepairProposal[];
  repairRequests?: CustomerRepairRequest[];
  onSelectProposal: (proposal: RepairProposal) => void;
  initialSearchQuery?: string;
  customerUser?: CustomerUser | null;
  isOwner?: boolean;
}

export const TimelineTracker: React.FC<TimelineTrackerProps> = ({
  proposals,
  repairRequests = [],
  onSelectProposal,
  initialSearchQuery = '',
  customerUser,
  isOwner = false
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('All');
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);

  // Read local device saved repair IDs so user's bookings are prominently recognized
  const [myLocalRepairIds, setMyLocalRepairIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('techfix_my_repair_ids') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const [selectedTrackItem, setSelectedTrackItem] = useState<any | null>(null);

  // Map CustomerRepairRequest objects as the primary source of truth for online requests!
  const mappedRequests: any[] = repairRequests.map(req => {
    const isCompleted = req.status === 'Completed';
    const isReady = req.status === 'Ready for Pickup';
    const isTesting = req.status === 'Quality Testing';
    const isInProgress = req.status === 'In Progress';
    const isContacted = req.status === 'Contacted' || req.status === 'Approved';

    // Calculate live progress: if explicitly set use it, otherwise compute from status
    const progress = req.progressPercent !== undefined ? req.progressPercent : (
      isCompleted ? 100 : isReady ? 95 : isTesting ? 80 : isInProgress ? 60 : isContacted ? 35 : 15
    );

    // If there is an associated proposal, take additional items
    const matchingProp = proposals.find(p => p.proposalNumber.toLowerCase() === req.requestId.toLowerCase());

    const photos: string[] = [];
    if (req.photoUrl) photos.push(req.photoUrl);
    if (Array.isArray(req.devicePhotos)) {
      req.devicePhotos.forEach(p => {
        if (p && !photos.includes(p)) photos.push(p);
      });
    }
    if (matchingProp?.photoUrl && !photos.includes(matchingProp.photoUrl)) {
      photos.push(matchingProp.photoUrl);
    }
    if (Array.isArray(matchingProp?.devicePhotos)) {
      matchingProp.devicePhotos.forEach(p => {
        if (p && !photos.includes(p)) photos.push(p);
      });
    }

    return {
      id: req.id || `prop-from-${req.requestId}`,
      proposalNumber: req.requestId,
      clientName: req.customerName,
      clientPhone: req.contactPhone,
      whatsappNumber: req.whatsappNumber || req.contactPhone,
      clientEmail: req.email || '',
      deviceBrand: req.deviceBrand,
      deviceModel: req.deviceModel,
      problemDescription: req.problemDescription,
      diagnosticNotes: req.technicianNote || matchingProp?.diagnosticNotes || `Submitted online by ${req.customerName}. Urgency: ${req.urgency}`,
      technicianNote: req.technicianNote || matchingProp?.technicianNote,
      assignedTechnician: req.assignedTechnician || 'TECHFIX Goalpara Lab',
      photoUrl: photos[0] || undefined,
      devicePhotos: photos,
      repairItems: matchingProp?.repairItems || [
        {
          id: `item-${req.id}`,
          description: `${req.deviceBrand} ${req.deviceModel} Diagnostic & Repair (${req.urgency})`,
          category: 'Hardware',
          cost: req.estimatedCost || 0,
          timeEstimate: req.urgency === 'Urgent Express' ? '1-2 Hours' : 'Same Day',
          warrantyPeriod: req.warrantyPeriod || '90 Days Guarantee'
        }
      ],
      subtotal: req.estimatedCost || matchingProp?.subtotal || 0,
      discount: matchingProp?.discount || 0,
      tax: 0,
      finalPrice: req.estimatedCost || matchingProp?.finalPrice || 0,
      advancePaid: req.advancePaid || matchingProp?.advancePaid || 0,
      balanceDue: req.balanceDue !== undefined ? req.balanceDue : (
        Math.max(0, (req.estimatedCost || matchingProp?.finalPrice || 0) - (req.advancePaid || matchingProp?.advancePaid || 0))
      ),
      estimatedCompletionTime: req.expectedDeliveryDate || (req.urgency === 'Urgent Express' ? 'Express Same Day' : '1-2 Days'),
      expectedDeliveryDate: req.expectedDeliveryDate || (req.urgency === 'Urgent Express' ? 'Express Same Day' : '1-2 Days'),
      progressPercent: progress,
      serviceType: req.serviceType || 'Shop Walk-in',
      pickupAddress: req.pickupAddress,
      urgency: req.urgency,
      warrantyDays: 90,
      status: req.status,
      historyLog: req.historyLog || [],
      timelineEvents: [
        { id: '1', stage: 'Submitted', title: '1. Online Request Registered', description: `Booked by ${req.customerName} (${req.requestId})`, completed: true, timestamp: req.createdAt },
        { id: '2', stage: 'Received', title: '2. Device Received at Lab', description: 'Technician logged mobile intake and physical inspection', completed: progress >= 30, timestamp: progress >= 30 ? req.createdAt : 'Pending' },
        { id: '3', stage: 'Inspection', title: '3. Technical Diagnosis Complete', description: 'Hardware fault identified and component quote confirmed', completed: progress >= 50, timestamp: progress >= 50 ? req.createdAt : 'Pending' },
        { id: '4', stage: 'Repair', title: '4. IC / Component Repairing', description: 'Display replacement / Motherboard soldering in progress', completed: progress >= 70, timestamp: progress >= 70 ? req.createdAt : 'Pending' },
        { id: '5', stage: 'Testing', title: '5. Quality & Stress Testing', description: 'Touch, display, charging, speaker & network stress test', completed: progress >= 85, timestamp: progress >= 85 ? req.createdAt : 'Pending' },
        { id: '6', stage: 'Ready', title: '6. Ready for Pickup / Delivery', description: isCompleted ? 'Repair completed & device handed over' : 'Repair completed, ready for handover to customer', completed: progress >= 95 || isCompleted, timestamp: isCompleted ? 'Completed' : (progress >= 95 ? 'Ready' : 'Pending') }
      ],
      createdAt: req.createdAt,
      updatedAt: req.createdAt
    };
  });

  // Only add standalone proposals that don't match any repairRequest
  const standaloneProposals = proposals
    .filter(p => !repairRequests.some(r => r.requestId.toLowerCase() === p.proposalNumber.toLowerCase()))
    .map(p => {
      const completedCount = p.timelineEvents?.filter((e: any) => e.completed)?.length || 0;
      const progress = p.progressPercent !== undefined ? p.progressPercent : (
        p.status === 'Completed' ? 100 :
        p.status === 'Ready for Pickup' ? 95 :
        p.status === 'Quality Testing' ? 80 :
        p.status === 'In Progress' ? 60 :
        Math.round((completedCount / (p.timelineEvents?.length || 1)) * 100)
      );
      return {
        ...p,
        progressPercent: progress,
        devicePhotos: p.devicePhotos || (p.photoUrl ? [p.photoUrl] : [])
      };
    });

  // Combined items with requests taking top precedence
  const combinedItems = [...mappedRequests, ...standaloneProposals];

  // User Privacy Isolation: Non-admin users can ONLY see their own repairs!
  const userEmail = customerUser?.email?.toLowerCase().trim() || '';
  const userPhone = (customerUser?.phoneNumber || '').replace(/\D/g, '');
  const userUid = customerUser?.uid || '';
  const userName = customerUser?.displayName?.toLowerCase().trim() || '';

  const authorizedItems = isOwner ? combinedItems : combinedItems.filter(p => {
    // 1. Matched by authenticated User ID
    if (userUid && p.userId && p.userId === userUid) return true;
    // 2. Matched by account email
    const pEmail = (p.clientEmail || '').toLowerCase().trim();
    if (userEmail && pEmail === userEmail) return true;
    // 3. Matched by phone
    const pPhone = (p.clientPhone || '').replace(/\D/g, '');
    if (userPhone && userPhone.length >= 7 && pPhone.includes(userPhone)) return true;
    // 4. Matched by name if distinctive
    const pName = (p.clientName || '').toLowerCase().trim();
    if (userName && userName.length > 3 && (pName === userName || pName.includes(userName) || userName.includes(pName))) return true;
    // 5. Matched by device's local repair IDs for this customer
    if (myLocalRepairIds.some(id => id.toLowerCase() === (p.proposalNumber || '').toLowerCase() || id.toLowerCase() === (p.id || '').toLowerCase())) return true;
    return false;
  });

  // Robust Search & Filter
  const cleanQuery = searchQuery.trim().toLowerCase();
  const cleanDigits = searchQuery.replace(/\D/g, '');

  const filteredProposals = authorizedItems.filter(p => {
    // 1. Status Filter
    if (activeStatusFilter === 'MyBookings') {
      const isMine = myLocalRepairIds.some(id => 
        id.toLowerCase() === (p.proposalNumber || '').toLowerCase() || 
        id.toLowerCase() === (p.id || '').toLowerCase()
      );
      if (!isMine) return false;
    } else if (activeStatusFilter === 'Urgent') {
      if (p.urgency !== 'Urgent Express') return false;
    } else if (activeStatusFilter !== 'All') {
      if (p.status !== activeStatusFilter) return false;
    }

    // 2. Query Search
    if (!cleanQuery) return true;

    const pNumber = (p.proposalNumber || '').toLowerCase();
    const pName = (p.clientName || '').toLowerCase();
    const pPhone = (p.clientPhone || '').replace(/\D/g, '');
    const pWhatsapp = (p.whatsappNumber || '').replace(/\D/g, '');
    const pModel = (p.deviceModel || '').toLowerCase();
    const pBrand = (p.deviceBrand || '').toLowerCase();
    const pEmail = (p.clientEmail || '').toLowerCase();
    const pProblem = (p.problemDescription || '').toLowerCase();
    const pStatus = (p.status || '').toLowerCase();
    const pService = (p.serviceType || '').toLowerCase();

    return (
      pNumber.includes(cleanQuery) ||
      pName.includes(cleanQuery) ||
      pModel.includes(cleanQuery) ||
      pBrand.includes(cleanQuery) ||
      `${pBrand} ${pModel}`.includes(cleanQuery) ||
      pEmail.includes(cleanQuery) ||
      pProblem.includes(cleanQuery) ||
      pStatus.includes(cleanQuery) ||
      pService.includes(cleanQuery) ||
      (cleanDigits.length >= 3 && (pPhone.includes(cleanDigits) || pWhatsapp.includes(cleanDigits)))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-4">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>TECHFIX Live Repair Tracker Portal</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Track Smartphone Repair & Booking Status
          </h1>

          <p className="text-xs sm:text-sm text-slate-300">
            Enter your Request ID (e.g. <strong className="text-amber-300">TF-REQ-3812</strong> or <strong className="text-cyan-300">TF-REQ-8821</strong>), client name, phone number, or model to view real-time repair progress, uploaded device photos, QC testing milestones, and expected pickup time.
          </p>
        </div>

        {/* Live Search Input & Quick Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Request ID (TF-REQ-XXXX), Client Name, Phone, Brand, or Model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-slate-800/90 rounded-2xl border border-slate-700 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700"
            >
              Show All ({authorizedItems.length})
            </button>
          )}
        </div>

        {/* Private Customer Notice */}
        {!isOwner && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>🔒 Private Account Tracker: Viewing repairs registered under your account only.</span>
          </div>
        )}

        {/* Status Filter Chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {[
            { id: 'All', label: `My Repairs (${authorizedItems.length})` },
            ...(myLocalRepairIds.length > 0 ? [{ id: 'MyBookings', label: `My Submitted Bookings (${myLocalRepairIds.length})` }] : []),
            { id: 'In Progress', label: 'In Progress' },
            { id: 'Quality Testing', label: 'Quality Testing' },
            { id: 'Ready for Pickup', label: 'Ready for Pickup' },
            { id: 'Completed', label: 'Completed' },
            { id: 'Urgent', label: 'Urgent Express' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeStatusFilter === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md ring-2 ring-cyan-300'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Active Tracked Repairs ({filteredProposals.length})</span>
          <span>Goalpara Centre • Real-time Sync Active</span>
        </div>

        {filteredProposals.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 shadow-sm">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800">No matching repair booking found</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No tickets match your query "{searchQuery}". Make sure the Request ID (e.g. TF-REQ-XXXX) or phone number is correct.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveStatusFilter('All');
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md"
              >
                View All My Repairs ({authorizedItems.length})
              </button>
              <a
                href={`tel:${BUSINESS_DETAILS.phone}`}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition border border-slate-300 flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call Shop ({BUSINESS_DETAILS.phone})</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProposals.map((prop: any) => {
              const progressPct = prop.progressPercent !== undefined ? prop.progressPercent : (
                prop.status === 'Completed' ? 100 :
                prop.status === 'Ready for Pickup' ? 95 :
                prop.status === 'Quality Testing' ? 80 :
                prop.status === 'In Progress' ? 60 : 25
              );
              const isOnlineBooking = prop.proposalNumber.startsWith('TF-REQ-');
              const isMyBooking = myLocalRepairIds.some(id => 
                id.toLowerCase() === (prop.proposalNumber || '').toLowerCase() || 
                id.toLowerCase() === (prop.id || '').toLowerCase()
              );

              return (
                <div 
                  key={prop.id}
                  onClick={() => setSelectedTrackItem(prop)}
                  className={`bg-white rounded-3xl p-6 border transition-all cursor-pointer group space-y-4 relative overflow-hidden shadow-sm hover:shadow-xl ${
                    isMyBooking ? 'border-purple-300 ring-2 ring-purple-400/20' : 'border-slate-200'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-md border ${
                          isOnlineBooking ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-blue-600 bg-blue-50 border-blue-200'
                        }`}>
                          {prop.proposalNumber}
                        </span>
                        {isOnlineBooking && (
                          <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                            Online Application
                          </span>
                        )}
                        {isMyBooking && (
                          <span className="text-[10px] bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase shadow-xs">
                            ★ Your Booking
                          </span>
                        )}
                        {prop.serviceType && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                            {prop.serviceType}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-slate-900 mt-2 group-hover:text-blue-600 transition">
                        {prop.deviceBrand} {prop.deviceModel}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Client: {prop.clientName}</span>
                        {prop.clientPhone && (
                          <span className="text-slate-400 font-mono" title="Private Customer Contact">
                            • {prop.clientPhone.length >= 10 ? `${prop.clientPhone.slice(0, 3)}*****${prop.clientPhone.slice(-2)}` : '••••••••••'}
                          </span>
                        )}
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0 ${
                      prop.status === 'Approved' || prop.status === 'Completed' || prop.status === 'Ready for Pickup' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      prop.status === 'Quality Testing' ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' :
                      prop.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                      'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      ● {prop.status}
                    </span>
                  </div>

                  {/* Problem Brief */}
                  <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    "{prop.problemDescription || prop.issueDescription}"
                  </p>

                  {/* Uploaded Photos Preview If Available */}
                  {prop.devicePhotos && prop.devicePhotos.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span className="flex items-center gap-1 text-purple-700">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Customer Uploaded Photos ({prop.devicePhotos.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Click to preview</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {prop.devicePhotos.map((imgUrl: string, idx: number) => (
                          <img
                            key={idx}
                            src={imgUrl}
                            alt="Damaged Device"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewPhotoModal(imgUrl);
                            }}
                            className="w-14 h-14 object-cover rounded-xl border border-purple-200 hover:scale-105 transition shadow-xs shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LIVE TRACKING: KITNA TAK HUA */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-cyan-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>Kitna Tak Hua (Live Repair Progress)</span>
                      </span>
                      <span className="font-mono font-black text-cyan-400">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
                      <div 
                        className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(progressPct, 12)}%` }}
                      />
                    </div>
                  </div>

                  {/* LIVE TRACKING: KAB MOBILE MILEGA */}
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-2.5 text-xs">
                    <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                        Kab Mobile Milega (Expected Delivery / Pickup):
                      </span>
                      <span className="text-emerald-950 font-black text-sm">
                        {prop.expectedDeliveryDate || prop.estimatedCompletionTime || 'Same Day / 24 Hours'}
                      </span>
                    </div>
                  </div>

                  {/* Technician Live Note if present */}
                  {prop.technicianNote && (
                    <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-950 flex items-start gap-2">
                      <Wrench className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[10px] uppercase text-blue-800 block">Technician Live Note:</span>
                        <p className="text-slate-700 italic text-[11px] mt-0.5">{prop.technicianNote}</p>
                      </div>
                    </div>
                  )}

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      {prop.finalPrice > 0 ? `₹${prop.finalPrice} Total` : 'Free Inspection Quote'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTrackItem(prop);
                      }}
                      className="flex items-center gap-1 text-blue-600 font-bold group-hover:translate-x-1 transition-transform"
                    >
                      <span>View Live Timeline Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FULL SCREEN LIVE TRACKING DETAIL MODAL */}
      {selectedTrackItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-3xl max-w-2xl w-full min-h-screen sm:min-h-0 p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl border-0 sm:border border-slate-200 my-0 sm:my-8 text-slate-900 relative animate-in fade-in duration-150">
            
            {/* Top Navigation Bar for Mobile & Desktop */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 sticky top-0 bg-white/95 backdrop-blur-md z-20 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setSelectedTrackItem(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition"
              >
                <ArrowRight className="w-4 h-4 rotate-180 text-slate-600" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-purple-100 text-purple-900 border border-purple-200">
                  {selectedTrackItem.proposalNumber}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  selectedTrackItem.status === 'Completed' || selectedTrackItem.status === 'Ready for Pickup' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  selectedTrackItem.status === 'Quality Testing' ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' :
                  selectedTrackItem.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                  'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  ● {selectedTrackItem.status}
                </span>
              </div>

              <button
                onClick={() => setSelectedTrackItem(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs text-slate-500 font-bold block">
                  {selectedTrackItem.serviceType || 'Goalpara Workshop'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  {selectedTrackItem.deviceBrand} {selectedTrackItem.deviceModel}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Client: <strong className="text-slate-800">{selectedTrackItem.clientName}</strong> • Date: {selectedTrackItem.createdAt}
                </p>
              </div>

              {selectedTrackItem.urgency === 'Urgent Express' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-rose-100 text-rose-800 border border-rose-300 self-start sm:self-center flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-rose-600" /> Urgent Express
                </span>
              )}
            </div>

            {/* Uploaded Damage Photos in Detail View */}
            {selectedTrackItem.devicePhotos && selectedTrackItem.devicePhotos.length > 0 && (
              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  Customer Uploaded Device Photos ({selectedTrackItem.devicePhotos.length}):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedTrackItem.devicePhotos.map((imgUrl: string, idx: number) => (
                    <div 
                      key={idx}
                      onClick={() => setPreviewPhotoModal(imgUrl)}
                      className="group/img relative rounded-xl overflow-hidden border border-purple-200 cursor-pointer shadow-xs aspect-video bg-slate-900"
                    >
                      <img
                        src={imgUrl}
                        alt="Uploaded phone damage"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                        Click to Zoom
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LIVE TRACKING HIGHLIGHT 1: KITNA TAK HUA (PERCENTAGE GAUGE) */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                    Kitna Tak Repair Hua (Real-time Progress)
                  </span>
                  <p className="text-base font-extrabold text-white mt-0.5">
                    {selectedTrackItem.status === 'Completed' ? 'Mobile Repair Fully Completed!' :
                     selectedTrackItem.status === 'Ready for Pickup' ? 'Quality Testing Done & Ready for Collection!' :
                     selectedTrackItem.status === 'Quality Testing' ? 'QC & Display/Battery Stress Testing' :
                     selectedTrackItem.status === 'In Progress' ? 'Motherboard / Display Repair In-Progress' :
                     'Inspection & Component Procurement'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono text-3xl font-black text-cyan-400">
                    {selectedTrackItem.progressPercent !== undefined ? selectedTrackItem.progressPercent : 50}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(selectedTrackItem.progressPercent || 30, 15)}%` }}
                />
              </div>
            </div>

            {/* LIVE TRACKING HIGHLIGHT 2: KAB MOBILE MILEGA */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Kab Mobile Milega (Expected Delivery / Pickup Time)
                </span>
                <p className="text-lg font-black text-emerald-950">
                  {selectedTrackItem.expectedDeliveryDate || selectedTrackItem.estimatedCompletionTime || 'Same Day / 24 Hours'}
                </p>
                <p className="text-xs text-emerald-700 font-medium">
                  {selectedTrackItem.status === 'Ready for Pickup' ? '✅ Aap abhi TECHFIX Goalpara shop par aakar apna mobile le sakte hain.' : 
                   selectedTrackItem.status === 'Completed' ? '✅ Device successfully completed and delivered!' :
                   'Technician is timeline ke anusaar mobile ready kar rahe hain.'}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="inline-block px-2.5 py-1 rounded bg-emerald-200/80 text-emerald-900 font-mono font-black text-xs">
                  {BUSINESS_DETAILS.hours}
                </span>
              </div>
            </div>

            {/* TECHNICIAN LIVE NOTE */}
            {selectedTrackItem.technicianNote && (
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-1 text-xs">
                <span className="font-black text-blue-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-blue-600" />
                  Technician Live Update Note (Directly from Workshop):
                </span>
                <p className="text-slate-800 text-sm italic font-medium leading-relaxed">
                  "{selectedTrackItem.technicianNote}"
                </p>
                {selectedTrackItem.assignedTechnician && (
                  <p className="text-[11px] text-blue-700 font-bold pt-1">
                    Assigned Master Technician: {selectedTrackItem.assignedTechnician}
                  </p>
                )}
              </div>
            )}

            {/* TIMELINE STAGES LIST */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Repair Milestones & Status Timeline
              </h4>

              <div className="space-y-2 border-l-2 border-slate-200 ml-3 pl-4">
                {(selectedTrackItem.timelineEvents || []).map((ev: any, idx: number) => (
                  <div key={ev.id || idx} className="relative group">
                    <div className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      ev.completed ? 'border-emerald-500 text-emerald-500' : 'border-slate-300 text-slate-300'
                    }`}>
                      {ev.completed ? <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                    </div>

                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${ev.completed ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}>
                          {ev.title}
                        </span>
                        {ev.timestamp && ev.timestamp !== 'Pending' && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            • {ev.timestamp}
                          </span>
                        )}
                      </div>
                      {ev.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{ev.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CHRONOLOGICAL HISTORY LOG (IF ADMIN ADDED LOGS) */}
            {selectedTrackItem.historyLog && selectedTrackItem.historyLog.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Live Activity & Updates Log ({selectedTrackItem.historyLog.length}):
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedTrackItem.historyLog.map((log: any, idx: number) => (
                    <div key={log.id || idx} className="text-xs bg-white p-2 rounded-xl border border-slate-200 flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-800">{log.title}</span>
                        {log.note && <p className="text-[11px] text-slate-600 italic mt-0.5">{log.note}</p>}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FINANCIAL SUMMARY */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Estimated Price</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {selectedTrackItem.finalPrice > 0 ? `₹${selectedTrackItem.finalPrice}` : 'Inspection Quote'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Advance Paid</span>
                <span className="font-extrabold text-emerald-600 text-sm">
                  ₹{selectedTrackItem.advancePaid || 0}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Balance Due</span>
                <span className="font-extrabold text-rose-600 text-sm">
                  ₹{selectedTrackItem.balanceDue || 0}
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <a
                href={`tel:${BUSINESS_DETAILS.phone}`}
                className="w-full sm:flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call Technician ({BUSINESS_DETAILS.phone})</span>
              </a>

              <a
                href={`https://wa.me/${BUSINESS_DETAILS.whatsapp}?text=Hello%20TECHFIX%20Goalpara,%20I%20am%20tracking%20my%20repair%20Ticket%20${selectedTrackItem.proposalNumber}%20(${encodeURIComponent(selectedTrackItem.deviceBrand + ' ' + selectedTrackItem.deviceModel)}).%20Please%20let%20me%20know%20the%20latest%20update.`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Shop for Update</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* FULL PHOTO ZOOM PREVIEW MODAL */}
      {previewPhotoModal && (
        <div 
          onClick={() => setPreviewPhotoModal(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewPhotoModal(null)}
              className="absolute -top-3 -right-3 p-2 bg-white text-slate-900 rounded-full shadow-lg hover:bg-slate-200 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewPhotoModal}
              alt="Device Damage Zoom Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-700"
            />
          </div>
        </div>
      )}

    </div>
  );
};

