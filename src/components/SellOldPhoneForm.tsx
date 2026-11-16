import React, { useState } from 'react';
import { OldPhoneSellRequest, CustomerUser, ShopBusinessDetails } from '../types';
import { saveOldPhoneSellRequestToFirestore } from '../lib/firebase';
import { 
  Smartphone, 
  DollarSign, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  HelpCircle, 
  Package, 
  Image as ImageIcon,
  MessageCircle,
  Phone,
  AlertCircle,
  User as UserIcon,
  ChevronRight,
  Upload,
  Camera,
  Trash2,
  X,
  Eye,
  Plus
} from 'lucide-react';

interface SellOldPhoneFormProps {
  customerUser: CustomerUser | null;
  businessDetails: ShopBusinessDetails;
  onSubmitSuccess: (newRequest: OldPhoneSellRequest) => void;
  onOpenCustomerLogin?: (initialTab?: 'bookings' | 'sell' | 'account') => void;
}

const BRANDS = [
  'Apple (iPhone)',
  'Samsung',
  'OnePlus',
  'Xiaomi / Redmi / Poco',
  'Realme',
  'Vivo',
  'Oppo',
  'Google Pixel',
  'Nothing',
  'Motorola',
  'Infinix / Tecno',
  'Other'
];

const STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'];

const ACCESSORY_LIST = [
  'Original Box',
  'Original Fast Charger',
  'Purchase Tax Bill / Invoice',
  'Charging Cable',
  'Headphones / Earbuds'
];

export const SellOldPhoneForm: React.FC<SellOldPhoneFormProps> = ({
  customerUser,
  businessDetails,
  onSubmitSuccess,
  onOpenCustomerLogin
}) => {
  const [customerName, setCustomerName] = useState(customerUser?.displayName || '');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState(customerUser?.email || '');
  const [sameAsMobile, setSameAsMobile] = useState(true);

  const [isCrackedMode, setIsCrackedMode] = useState(false);
  const [damageType, setDamageType] = useState('Screen Glass Cracked / Broken');
  const [screenStatus, setScreenStatus] = useState('Touch Working Fine (Only Glass Fault)');

  const [deviceBrand, setDeviceBrand] = useState('Apple (iPhone)');
  const [deviceModel, setDeviceModel] = useState('');
  const [storage, setStorage] = useState('128GB');
  const [color, setColor] = useState('');
  const [condition, setCondition] = useState<OldPhoneSellRequest['condition']>('Good (8-9/10)');
  const [expectedPrice, setExpectedPrice] = useState<number | ''>('');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>(['Original Box', 'Original Fast Charger']);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<OldPhoneSellRequest | null>(null);

  const handleToggleAccessory = (acc: string) => {
    setSelectedAccessories(prev => 
      prev.includes(acc) ? prev.filter(a => a !== acc) : [...prev, acc]
    );
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1000;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 6 - uploadedPhotos.length;
    if (remainingSlots <= 0) {
      alert('Maximum 6 photos allowed.');
      return;
    }

    const newPhotos: string[] = [];
    for (let i = 0; i < files.length && i < remainingSlots; i++) {
      const file: File = files[i];
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file);
        newPhotos.push(compressed);
      }
    }

    setUploadedPhotos(prev => [...prev, ...newPhotos].slice(0, 6));
    e.target.value = '';
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setUploadedPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !contactPhone.trim() || !deviceModel.trim() || expectedPrice === '' || Number(expectedPrice) <= 0) {
      alert('Please fill in Customer Name, Phone Number, Device Model, and Expected Price.');
      return;
    }

    setIsSubmitting(true);

    const randomIdNum = Math.floor(1000 + Math.random() * 9000);
    const resolvedPhotoUrl = uploadedPhotos[0] || photoUrl.trim() || undefined;
    const resolvedDevicePhotos = uploadedPhotos.length > 0 
      ? uploadedPhotos 
      : (photoUrl.trim() ? [photoUrl.trim()] : undefined);

    const newRequest: OldPhoneSellRequest = {
      id: `sell-${Date.now()}`,
      requestId: isCrackedMode ? `CRACKED-${randomIdNum}` : `SELL-2026-${randomIdNum}`,
      userId: customerUser?.uid || undefined,
      customerName: customerName.trim() || customerUser?.displayName || 'Customer',
      contactPhone: contactPhone.trim(),
      whatsappNumber: sameAsMobile ? contactPhone.trim() : (whatsappNumber.trim() || contactPhone.trim()),
      email: email.trim() || customerUser?.email || '',
      deviceBrand,
      deviceModel: deviceModel.trim(),
      storage,
      color: color.trim() || undefined,
      condition: isCrackedMode ? 'Cracked / Damaged (Screen/Body Fault)' : condition,
      isCrackedPhone: isCrackedMode,
      damageType: isCrackedMode ? damageType : undefined,
      screenStatus: isCrackedMode ? screenStatus : undefined,
      expectedPrice: Number(expectedPrice),
      accessoriesIncluded: selectedAccessories,
      photoUrl: resolvedPhotoUrl,
      devicePhotos: resolvedDevicePhotos,
      notes: notes.trim() || undefined,
      status: 'Pending',
      createdAt: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };

    // Save request ID to localStorage so user can see history in profile
    try {
      const existingIds: string[] = JSON.parse(localStorage.getItem('techfix_my_sell_ids') || '[]');
      if (!existingIds.includes(newRequest.id)) {
        existingIds.push(newRequest.id);
        localStorage.setItem('techfix_my_sell_ids', JSON.stringify(existingIds));
      }
    } catch (err) {}

    try {
      await saveOldPhoneSellRequestToFirestore(newRequest);
    } catch (err) {
      console.warn('Firestore sell submission note:', err);
    }

    if (typeof onSubmitSuccess === 'function') {
      onSubmitSuccess(newRequest);
    }
    setSubmittedData(newRequest);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Instant Shop Cash Offer
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Sell Your Old Mobile Phone <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">At Best Market Rate</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Want to upgrade or get quick cash for your old smartphone? Fill out the device details below. TECHFIX Shop team will inspect your request, quote the maximum price, and contact you directly!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200">100% Safe & Instant Payment</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl">
              <DollarSign className="w-5 h-5 text-cyan-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200">Best Cash Quote Guarantee</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl">
              <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200">Direct WhatsApp / Call Response</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {submittedData ? (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-emerald-400 tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Sell Request Submitted Successfully!
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Request ID: {submittedData.requestId}
            </h2>
            <p className="text-slate-300 text-sm max-w-lg mx-auto">
              Thank you <strong className="text-white">{submittedData.customerName}</strong>! Your device details for <strong className="text-cyan-300">{submittedData.deviceBrand} {submittedData.deviceModel} ({submittedData.storage})</strong> have been received by TECHFIX admin panel.
            </p>
          </div>

          {/* Device Summary Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Condition:</span>
              <span className="font-bold text-slate-200">{submittedData.condition}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Expected Selling Price:</span>
              <span className="font-bold text-emerald-400 text-sm">₹{submittedData.expectedPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Accessories:</span>
              <span className="font-bold text-slate-200">
                {submittedData.accessoriesIncluded && submittedData.accessoriesIncluded.length > 0 
                  ? submittedData.accessoriesIncluded.join(', ') 
                  : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Contact Number:</span>
              <span className="font-bold text-cyan-300">{submittedData.contactPhone}</span>
            </div>

            {submittedData.devicePhotos && submittedData.devicePhotos.length > 0 && (
              <div className="border-t border-slate-800 pt-2 space-y-1.5">
                <span className="text-slate-400 block text-[11px] font-semibold">
                  Uploaded Photos ({submittedData.devicePhotos.length}):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {submittedData.devicePhotos.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Phone photo ${i + 1}`}
                      className="w-14 h-14 rounded-xl object-cover border border-emerald-500/40 shrink-0 cursor-pointer hover:scale-105 transition shadow-sm"
                      onClick={() => setPreviewPhoto(img)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <a
              href={`https://wa.me/${businessDetails.whatsapp}?text=${encodeURIComponent(
                `Hello TECHFIX Admin, I submitted a sell request for my ${submittedData.deviceBrand} ${submittedData.deviceModel} (${submittedData.storage}). Request ID: ${submittedData.requestId}. My expected price is ₹${submittedData.expectedPrice}. Please check and contact me!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              Direct WhatsApp Inquiry
            </a>

            <button
              onClick={() => {
                if (onOpenCustomerLogin) {
                  onOpenCustomerLogin('sell');
                }
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 hover:scale-105"
            >
              <UserIcon className="w-4 h-4 text-cyan-300" />
              <span>View History in My Profile</span>
            </button>

            <button
              onClick={() => setSubmittedData(null)}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-2xl border border-slate-700 transition-all"
            >
              Submit Another Old Phone
            </button>
          </div>
        </div>
      ) : (
        /* MAIN FORM */
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
          
          {/* SELL MODE TOGGLE (USED vs CRACKED PHONE) */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Select What You Are Selling:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsCrackedMode(false);
                  setCondition('Good (8-9/10)');
                }}
                className={`py-3.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  !isCrackedMode
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Sell Working Old Mobile Phone</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCrackedMode(true);
                  setCondition('Cracked / Damaged (Screen/Body Fault)');
                }}
                className={`py-3.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  isCrackedMode
                    ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>Sell Cracked / Broken Phone (Instant Cash Estimate)</span>
              </button>
            </div>
            
            {isCrackedMode && (
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-black">Sell Broken Phone for Instant Cash!</strong>
                  Has your mobile display cracked, back glass broken, touch stopped working, or phone gone dead? Fill in the details below. TECHFIX Shop buys broken phones for spare parts and refurbishing at the best cash rate!
                </div>
              </div>
            )}
          </div>
          
          {/* SECTION 1: CUSTOMER DETAILS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs">1</div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Your Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joydeb Sarkar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mobile Number (For Call/SMS) <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98642 XXXXX"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    WhatsApp Number
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-cyan-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsMobile}
                      onChange={(e) => setSameAsMobile(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-cyan-400 focus:ring-0"
                    />
                    Same as Mobile
                  </label>
                </div>
                {!sameAsMobile && (
                  <input
                    type="tel"
                    placeholder="WhatsApp phone number"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-400 focus:outline-none font-mono"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DEVICE DETAILS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs">2</div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Old Phone Specifications</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Device Brand <span className="text-red-400">*</span>
                </label>
                <select
                  value={deviceBrand}
                  onChange={(e) => setDeviceBrand(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-400 focus:outline-none"
                >
                  {BRANDS.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Device Model Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPhone 13 / OnePlus 9R"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Storage Variant
                </label>
                <select
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-400 focus:outline-none font-mono"
                >
                  {STORAGE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Color / Variant (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midnight Black / Pacific Blue"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Expected Selling Price (₹) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-cyan-400 font-black font-mono">₹</span>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="e.g. 15000"
                    value={expectedPrice === 0 ? '' : expectedPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setExpectedPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-extrabold text-sm focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* CRACKED / DAMAGED PHONE SPECIFIC OPTIONS */}
            {isCrackedMode ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 space-y-4">
                <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Cracked Phone Damage & Fault Category
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Main Damage Type
                    </label>
                    <select
                      value={damageType}
                      onChange={(e) => setDamageType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-rose-300 text-xs font-bold focus:border-rose-500 focus:outline-none"
                    >
                      <option value="Front Display Glass Cracked">Front Display Glass Cracked / Shattered</option>
                      <option value="Touch Screen Dead / Unresponsive">Touch Screen Dead / Unresponsive</option>
                      <option value="Back Glass / Body Frame Broken">Back Glass / Body Frame Broken</option>
                      <option value="Display Black / Dead Screen">Display Black / Lines / Flickering</option>
                      <option value="Dead Phone / Water Damage">Dead Phone / No Power / Water Damage</option>
                      <option value="Camera / Speaker / Charging Fault">Camera / Speaker / Charging Fault</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Touch & Display Working Condition
                    </label>
                    <select
                      value={screenStatus}
                      onChange={(e) => setScreenStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 text-xs font-bold focus:border-rose-500 focus:outline-none"
                    >
                      <option value="Touch Working Fine (Only Glass Fault)">Touch Working Fine (Only Glass Fault)</option>
                      <option value="Touch Not Working / Ghost Touch">Touch Not Working / Ghost Touch</option>
                      <option value="Display Has Lines or Ink Spot">Display Has Lines or Ink Spot</option>
                      <option value="Completely Black / Dead Screen">Completely Black / Dead Screen</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* PHYSICAL CONDITION SELECTOR FOR WORKING PHONES */
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Device Physical & Functional Condition <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'Like New (10/10)' as const,
                      title: 'Like New (10/10)',
                      desc: 'No scratches, clean screen, perfectly working like brand new'
                    },
                    {
                      id: 'Good (8-9/10)' as const,
                      title: 'Good (8-9/10)',
                      desc: 'Minor hairline scuffs, fully functional, battery good'
                    },
                    {
                      id: 'Average (6-7/10)' as const,
                      title: 'Average (6-7/10)',
                      desc: 'Scratches or minor body dents, minor battery drain'
                    },
                    {
                      id: 'Cracked / Damaged (Screen/Body Fault)' as const,
                      title: 'Cracked / Damaged',
                      desc: 'Screen glass cracked, back broken, camera or display fault'
                    }
                  ].map((cond) => (
                    <button
                      key={cond.id}
                      type="button"
                      onClick={() => setCondition(cond.id)}
                      className={`text-left p-3.5 rounded-2xl border transition-all ${
                        condition === cond.id
                          ? 'bg-cyan-500/10 border-cyan-400 ring-2 ring-cyan-500/30'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-extrabold ${condition === cond.id ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {cond.title}
                        </span>
                        {condition === cond.id && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{cond.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: ACCESSORIES & PHOTOS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">3</div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Accessories & Photos</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Available Accessories (Increases Buyback Cash Value!)
              </label>
              <div className="flex flex-wrap gap-2">
                {ACCESSORY_LIST.map((acc) => {
                  const isChecked = selectedAccessories.includes(acc);
                  return (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => handleToggleAccessory(acc)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                        isChecked
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>{acc}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DIRECT PHOTO UPLOAD (GALLERY / CAMERA) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <label className="text-xs font-extrabold text-white uppercase tracking-wider">
                      Upload Device Photos (Purane Mobile Ki Photos)
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Upload screen, back glass, frame, and bill/box photos for instant valuation and best cash offer.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0 self-start sm:self-auto">
                  {uploadedPhotos.length} / 6 Photos Added
                </span>
              </div>

              {/* Upload Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95">
                  <Upload className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>Choose Photos (Gallery / Files)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition hover:scale-105 active:scale-95">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Take Camera Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {uploadedPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUploadedPhotos([])}
                    className="px-3 py-2 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:underline"
                  >
                    Clear all photos
                  </button>
                )}
              </div>

              {/* Photo Previews Grid */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                  {uploadedPhotos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-2xl overflow-hidden border-2 border-cyan-500/50 bg-slate-900 shadow-md aspect-square"
                    >
                      <img
                        src={photo}
                        alt={`Device photo ${idx + 1}`}
                        className="w-full h-full object-cover transition group-hover:scale-105"
                      />
                      {/* Photo Badge */}
                      <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-[10px] font-black text-cyan-300 border border-slate-700">
                        {idx === 0 ? 'Main Photo' : `#${idx + 1}`}
                      </span>

                      {/* Overlay Action Buttons */}
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto(photo)}
                          className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 text-cyan-300 hover:text-white border border-slate-700 shadow"
                          title="View Full Size"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white shadow"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Or Paste Photo Link / Cloud URL (Optional)
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="url"
                    placeholder="https://... or Google Drive photo URL"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Additional Notes / Defect Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Battery health 86%, touch screen 100% fine"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Free instant valuation. No commitment to sell until you approve our quote.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting Request...' : 'Submit Phone for Instant Offer'}
            </button>
          </div>

        </form>
      )}

      {/* FULL PHOTO LIGHTBOX MODAL */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewPhoto(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-slate-900 rounded-3xl p-3 border border-slate-800 shadow-2xl text-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 pt-1 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Device Photo Preview</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-600 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-hidden rounded-2xl bg-black flex items-center justify-center">
              <img
                src={previewPhoto}
                alt="Device Preview"
                className="max-h-[70vh] w-auto object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
