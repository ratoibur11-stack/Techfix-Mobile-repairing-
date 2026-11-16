import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Smartphone, 
  Phone, 
  MessageCircle, 
  Mail, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Clock, 
  ShieldCheck, 
  Zap,
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  X,
  Camera,
  Image as ImageIcon,
  Upload,
  Trash2
} from 'lucide-react';
import { CustomerRepairRequest, ShopBusinessDetails } from '../types';
import { BUSINESS_DETAILS } from '../data/initialData';
import { CustomerUser } from './CustomerAuthModal';
import { saveRepairRequestToFirestore } from '../lib/firebase';

interface RepairRequestFormProps {
  onSubmitRequest: (newReq: CustomerRepairRequest) => void;
  businessDetails?: ShopBusinessDetails;
  customerUser?: CustomerUser | null;
  onOpenAuthModal?: () => void;
  onViewTracker?: (requestId?: string) => void;
}

const POPULAR_BRANDS = ['Samsung', 'Apple iPhone', 'Xiaomi / Redmi', 'Realme', 'Vivo', 'Oppo', 'OnePlus', 'Poco', 'Motorola', 'IQOO'];

const COMMON_ISSUES = [
  'Display Broken / Touch Not Working',
  'Battery Draining Fast / Battery Replacement',
  'Charging Port Broken / Loose / Slow Charging',
  'Water / Liquid Damage Diagnosis',
  'Software Bootloop / Hang on Logo / Dead',
  'Speaker / Microphone / Earpiece Sound Noisy',
  'Camera Lens Cracked / Blur Focus',
  'Back Glass / Housing Replacement',
  'IC-Level Motherboard Repair'
];

export const RepairRequestForm: React.FC<RepairRequestFormProps> = ({
  onSubmitRequest,
  businessDetails = BUSINESS_DETAILS,
  customerUser,
  onOpenAuthModal,
  onViewTracker
}) => {
  const [formData, setFormData] = useState({
    customerName: customerUser?.displayName || '',
    contactPhone: '',
    whatsappNumber: '',
    email: customerUser?.email || '',
    deviceBrand: 'Samsung',
    deviceModel: '',
    problemDescription: '',
    urgency: 'Standard' as 'Standard' | 'Urgent Express',
    preferredDate: 'Today / Tomorrow',
    serviceType: 'Shop Walk-in' as 'Shop Walk-in' | 'Doorstep Pickup',
    pickupAddress: '',
    devicePasscode: ''
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  // Sync if customer signs in
  useEffect(() => {
    if (customerUser) {
      setFormData(prev => ({
        ...prev,
        customerName: prev.customerName || customerUser.displayName || '',
        email: prev.email || customerUser.email || ''
      }));
    }
  }, [customerUser]);

  const [submittedReq, setSubmittedReq] = useState<CustomerRepairRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleBrandSelect = (brand: string) => {
    setFormData(prev => ({ ...prev, deviceBrand: brand }));
  };

  const handleIssueSelect = (issue: string) => {
    setFormData(prev => {
      const current = prev.problemDescription.trim();
      if (!current) return { ...prev, problemDescription: issue };
      if (current.includes(issue)) return prev;
      return { ...prev, problemDescription: `${current}, ${issue}` };
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          setUploadedPhotos(prev => [...prev, base64].slice(0, 4)); // max 4 photos
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setUploadedPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.contactPhone || !formData.deviceModel || !formData.problemDescription) {
      alert('Please fill in all required fields (Name, Phone, Model, and Problem description).');
      return;
    }

    if (formData.serviceType === 'Doorstep Pickup' && !formData.pickupAddress.trim()) {
      alert('Please provide your complete address for doorstep pickup service.');
      return;
    }

    setIsSubmitting(true);

    const dateStr = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const reqIdNum = Math.floor(1000 + Math.random() * 9000);
    const newRequest: CustomerRepairRequest = {
      id: `req-${Date.now()}`,
      requestId: `TF-REQ-${reqIdNum}`,
      userId: customerUser?.uid || undefined,
      customerName: formData.customerName.trim() || customerUser?.displayName || 'Customer',
      contactPhone: formData.contactPhone.trim(),
      whatsappNumber: formData.whatsappNumber.trim() || formData.contactPhone.trim(),
      email: formData.email.trim() || customerUser?.email || '',
      deviceBrand: formData.deviceBrand.trim(),
      deviceModel: formData.deviceModel.trim(),
      problemDescription: formData.problemDescription.trim(),
      urgency: formData.urgency,
      preferredDate: formData.preferredDate.trim(),
      serviceType: formData.serviceType,
      pickupAddress: formData.pickupAddress.trim(),
      devicePasscode: formData.devicePasscode.trim(),
      status: 'Pending',
      progressPercent: 15,
      expectedDeliveryDate: formData.urgency === 'Urgent Express' ? 'Today / Same Day Express' : 'Tomorrow / 1-2 Days',
      technicianNote: 'Request received online. Technician will review diagnostic details shortly.',
      assignedTechnician: 'TECHFIX Goalpara Lab',
      createdAt: dateStr,
      photoUrl: uploadedPhotos[0] || undefined,
      devicePhotos: uploadedPhotos,
      historyLog: [
        {
          id: `h-${Date.now()}`,
          timestamp: dateStr,
          stage: 'Submitted',
          title: 'Online Repair Application Registered',
          note: `Customer applied for repair. Priority: ${formData.urgency}. Service: ${formData.serviceType}.`
        }
      ]
    };

    // 1. Immediately save to LocalStorage so customer and admin always see it even on instant refresh
    try {
      const savedIds = JSON.parse(localStorage.getItem('techfix_my_repair_ids') || '[]');
      if (!savedIds.includes(newRequest.requestId)) savedIds.unshift(newRequest.requestId);
      if (!savedIds.includes(newRequest.id)) savedIds.unshift(newRequest.id);
      localStorage.setItem('techfix_my_repair_ids', JSON.stringify(savedIds));

      // Prepend to techfix_repair_requests in localStorage immediately
      const existingReqs: CustomerRepairRequest[] = JSON.parse(localStorage.getItem('techfix_repair_requests') || '[]');
      const filteredReqs = existingReqs.filter(r => (r.requestId || r.id).toLowerCase() !== (newRequest.requestId || newRequest.id).toLowerCase());
      const updatedReqs = [newRequest, ...filteredReqs];
      localStorage.setItem('techfix_repair_requests', JSON.stringify(updatedReqs));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    // 2. Direct server REST API save for immediate multi-device & admin synchronization
    try {
      fetch('/api/repair-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      }).catch(e => console.warn('Server repair request POST note:', e));
    } catch (e) {}

    // 3. Save to Firestore and parent state
    try {
      await saveRepairRequestToFirestore(newRequest);
    } catch (e) {}

    // 4. Update parent App state
    onSubmitRequest(newRequest);

    // 5. Broadcast update event so all listeners immediately update
    try {
      window.dispatchEvent(new CustomEvent('techfix_requests_updated', { detail: newRequest }));
    } catch (e) {}

    setIsSubmitting(false);
    setSubmittedReq(newRequest);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
            <Wrench className="w-3.5 h-3.5 text-purple-300 animate-spin-slow" />
            <span>TECHFIX Online Repair Request Form</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Book Mobile Phone Repair Service
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Whether your smartphone has a broken screen, drained battery, malfunctioning charging port, or software issues — fill out the form below. Our Goalpara certified technicians will connect with you via <strong className="text-purple-300">WhatsApp or Call</strong> promptly.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Zap className="w-4 h-4 text-amber-400" /> Instant Estimate & Contact
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Goalpara Shop Warranty Guaranteed
            </span>
          </div>
        </div>
      </div>

      {/* Main Repair Form Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-400" />
            <h2 className="font-extrabold text-base">Customer & Device Repair Details</h2>
          </div>
          <span className="text-[10px] text-purple-300 bg-purple-900/60 px-2.5 py-1 rounded-full border border-purple-700 font-bold uppercase">
            Step 1 of 1 • Fast Booking
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">

          {/* SECTION 1: Customer Contact Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                1. Customer Contact Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Das"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 font-medium"
                  />
                </div>
              </div>

              {/* Contact Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Mobile Number (Calling Number) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98642 12345"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 font-mono font-medium"
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Number (For Estimate & Photo Update)
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-3.5 top-3 w-4 h-4 text-emerald-500" />
                  <input
                    type="tel"
                    placeholder="e.g. 98642 12345 (Optional if same as calling)"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 font-mono"
                  />
                </div>
              </div>

              {/* Gmail / Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gmail / Email ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-blue-500" />
                  <input
                    type="email"
                    placeholder="e.g. example@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2: Mobile Phone Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  2. Kharap Mobile Details (Brand & Model)
                </h3>
              </div>
            </div>

            {/* Quick Brand Selector Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Select Mobile Brand:</label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_BRANDS.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => handleBrandSelect(brand)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      formData.deviceBrand === brand
                        ? 'bg-purple-700 text-white shadow-md ring-2 ring-purple-400'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Device Brand Custom/Selected */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samsung, Redmi, Vivo"
                  value={formData.deviceBrand}
                  onChange={(e) => setFormData({ ...formData, deviceBrand: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 font-bold"
                />
              </div>

              {/* Device Model */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Model Name / Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Galaxy M31, Note 10 Pro, iPhone 13"
                  value={formData.deviceModel}
                  onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 font-bold"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Problem Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                3. Problem Description (Mobile me kya kharabi hai?)
              </h3>
            </div>

            {/* Quick Issue Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Click to add common problems:</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_ISSUES.map((issue) => (
                  <button
                    key={issue}
                    type="button"
                    onClick={() => handleIssueSelect(issue)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-medium transition"
                  >
                    + {issue}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Problem Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Detailed Issue Explanation <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Mobile kaise kharap hua ya kya prblm aa rhi h (e.g. Screen tut gaya hai, battery drain ho rha h, water me gir gaya hai...)"
                value={formData.problemDescription}
                onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 leading-relaxed font-medium"
              />
            </div>

            {/* PHOTO UPLOAD: Broken Screen / Damage Photos */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Upload Mobile Photos (Screen Damage, Broken Glass, Camera, or Bill Photo)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                  Optional (Max 4 Photos)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition shadow-xs">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <span>Choose Photos from Gallery / Files</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition">
                  <Camera className="w-4 h-4 text-slate-600" />
                  <span>Take Camera Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Previews */}
              {uploadedPhotos.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {uploadedPhotos.map((photo, idx) => (
                    <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-300 shadow-sm">
                      <img src={photo} alt={`Damage photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 transition shadow"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: Service Delivery Option, Urgency & Passcode */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                3. Service Mode & Timing (Kaise Aur Kab Repair Chahiye)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service Method: Shop Walk-in vs Doorstep Pickup */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Type (Kaise Denge Phone?) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, serviceType: 'Shop Walk-in' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      formData.serviceType === 'Shop Walk-in'
                        ? 'bg-purple-900 text-white border-purple-800 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🏪 Shop Walk-in (Goalpara)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, serviceType: 'Doorstep Pickup' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      formData.serviceType === 'Doorstep Pickup'
                        ? 'bg-purple-900 text-white border-purple-800 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🛵 Doorstep Pickup (Free)
                  </button>
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Repair Priority Level</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, urgency: 'Standard' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      formData.urgency === 'Standard'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Standard (1-2 Days)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, urgency: 'Urgent Express' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition ${
                      formData.urgency === 'Urgent Express'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Urgent Express (Same Day)
                  </button>
                </div>
              </div>
            </div>

            {/* Address if Doorstep Pickup */}
            {formData.serviceType === 'Doorstep Pickup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pickup & Drop Address in Goalpara / Dubapara <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Lupta Char Masjid, Dubapara, Goalpara"
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 font-medium"
                />
              </div>
            )}

            {/* Preferred Timing & Passcode Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time / Date</label>
                <select
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600"
                >
                  <option value="Today / Tomorrow">Today or Tomorrow (Aaj ya Kal)</option>
                  <option value="Urgent 1 Hour Visit">Urgent Within 1 Hour</option>
                  <option value="This Weekend">This Weekend (Saturday/Sunday)</option>
                  <option value="Doorstep Pickup Required">Doorstep Pickup Required</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Device Screen Lock / PIN (Optional for QC Testing)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PIN 1234 or Pattern L (Optional)"
                  value={formData.devicePasscode}
                  onChange={(e) => setFormData({ ...formData, devicePasscode: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Submit karte hi Ticket ID generate hogi jisse aap live track kar sakenge ki kitna kaam hua aur kab milega!</span>
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting Request...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Repair Request (Apply Now)</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {submittedReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-3xl max-w-lg w-full min-h-screen sm:min-h-0 p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-2xl text-white relative animate-in fade-in duration-150 my-0 sm:my-8">
            
            <button
              onClick={() => setSubmittedReq(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-white">Repair Request Registered!</h3>
              <p className="text-xs text-slate-300">
                Aapki mobile repair application safaltapoorvak receive ho gayi hai.
              </p>
            </div>

            {/* Request Ticket Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Tracking Ticket ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-400 text-base">{submittedReq.requestId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(submittedReq.requestId);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="px-2 py-0.5 rounded bg-purple-900/60 hover:bg-purple-800 text-[10px] text-purple-300 border border-purple-700"
                  >
                    {copiedId ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Customer Name:</span>
                <span className="text-white font-bold">{submittedReq.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Mobile Device:</span>
                <span className="text-amber-300 font-bold">{submittedReq.deviceBrand} {submittedReq.deviceModel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Service Mode:</span>
                <span className="text-cyan-400 font-bold">{submittedReq.serviceType || 'Shop Walk-in'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Live Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px]">
                  ● Request Received (15%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Kab Milega (Expected):</span>
                <span className="text-emerald-400 font-bold">{submittedReq.expectedDeliveryDate}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-slate-300">
                <span className="text-slate-400 block mb-1">Problem Reported:</span>
                <p className="italic bg-slate-900 p-2 rounded border border-slate-800 text-[11px]">
                  "{submittedReq.problemDescription}"
                </p>
              </div>
            </div>

            {/* Live Tracking Information Callout */}
            <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/60 text-xs text-purple-200 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                Aap apne <strong>Profile (User Dashboard)</strong> ya <strong>Live Tracker</strong> me jaakar kisi bhi samay dekh sakte hain ki repair kitna tak hua aur mobile kab milega. Admin dwara live updates seedhe dikhayi denge.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <a
                href={`https://wa.me/${businessDetails.whatsapp}?text=Hello%20TECHFIX%20Goalpara,%20I%20just%20applied%20for%20mobile%20repair%20Ticket%20${submittedReq.requestId}%20for%20my%20${encodeURIComponent(submittedReq.deviceBrand + ' ' + submittedReq.deviceModel)}.%20Problem:%20${encodeURIComponent(submittedReq.problemDescription)}.%20Customer:%20${encodeURIComponent(submittedReq.customerName)}%20(Phone:%20${submittedReq.contactPhone}).`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Ticket Details via WhatsApp to Shop Immediately</span>
              </a>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${businessDetails.phone}`}
                  className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call Shop</span>
                </a>

                <button
                  onClick={() => {
                    const reqId = submittedReq.requestId;
                    setSubmittedReq(null);
                    if (onViewTracker) onViewTracker(reqId);
                  }}
                  className="py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Track Live Status</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
