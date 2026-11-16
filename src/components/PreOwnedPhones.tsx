import React, { useState } from 'react';
import { 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck, 
  MessageCircle, 
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Maximize2
} from 'lucide-react';
import { PRE_OWNED_PHONES, BUSINESS_DETAILS } from '../data/initialData';
import { PreOwnedPhone, ShopBusinessDetails } from '../types';
import { formatImageUrl } from '../lib/imageUtils';

interface PreOwnedPhonesProps {
  phones?: PreOwnedPhone[];
  businessDetails?: ShopBusinessDetails;
  onOpenSellPhoneForm?: () => void;
}

const SIDE_LABELS = ['Front View', 'Back View', 'Side Profile', 'Camera View'];

export const PreOwnedPhones: React.FC<PreOwnedPhonesProps> = ({ 
  phones = PRE_OWNED_PHONES,
  businessDetails = BUSINESS_DETAILS,
  onOpenSellPhoneForm
}) => {
  const activePhones = phones;

  // Selected phone for multi-angle lightbox modal
  const [selectedPhoneForGallery, setSelectedPhoneForGallery] = useState<PreOwnedPhone | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  // Per-card selected photo index
  const [cardPhotoIndexes, setCardPhotoIndexes] = useState<{ [phoneId: string]: number }>({});

  const handleOpenGallery = (phone: PreOwnedPhone, initialIndex = 0) => {
    setSelectedPhoneForGallery(phone);
    setActiveGalleryIndex(initialIndex);
  };

  const handleNextPhoto = (total: number) => {
    setActiveGalleryIndex((prev) => (prev + 1) % total);
  };

  const handlePrevPhoto = (total: number) => {
    setActiveGalleryIndex((prev) => (prev - 1 + total) % total);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
            <Smartphone className="w-3.5 h-3.5 text-purple-300" />
            <span>Pre-Owned Smartphone Stock</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Second-Hand Mobile Phones
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every pre-owned smartphone at TECHFIX Goalpara undergoes a 20-point hardware diagnostic test. Click on any phone to view photos from all sides (Front, Back, Side Profile & Camera).
          </p>
        </div>

        {onOpenSellPhoneForm && (
          <div className="shrink-0 bg-slate-900/90 border border-emerald-500/40 p-4 rounded-2xl space-y-2 text-center md:text-left">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
              💵 Want to Sell Your Old Phone?
            </span>
            <p className="text-xs text-slate-300 max-w-xs">
              Get maximum cash value quote for your used iPhone, OnePlus, Samsung or Android device.
            </p>
            <button
              onClick={onOpenSellPhoneForm}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-4 h-4" />
              <span>Sell Old Phone Now</span>
            </button>
          </div>
        )}
      </div>

        {/* Customer Guidance Warning Pill */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2 max-w-2xl">
          <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <span>
            <strong>Multi-Photo Inspection:</strong> Click on the thumbnail buttons or "Inspect Side Photos" to see actual phone condition from different angles before visiting our Goalpara shop.
          </span>
        </div>

      {/* Stock List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activePhones.map((phone) => {
          const allImages = phone.images && phone.images.length > 0 
            ? phone.images 
            : [phone.image];
          
          const currentPhotoIndex = cardPhotoIndexes[phone.id] || 0;
          const currentImage = allImages[currentPhotoIndex] || phone.image;

          return (
            <div 
              key={phone.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Main Image & Badge */}
                <div className="relative h-60 bg-slate-900 overflow-hidden cursor-pointer" onClick={() => handleOpenGallery(phone, currentPhotoIndex)}>
                  <img 
                    src={formatImageUrl(currentImage)} 
                    alt={`${phone.brand} ${phone.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';
                    }}
                  />

                  {/* Condition Badge */}
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-bold border border-slate-700/50">
                    {phone.condition}
                  </span>

                  {/* Price Savings Badge */}
                  {phone.originalPrice && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-rose-500 text-white text-[10px] font-extrabold shadow">
                      SAVE ₹{phone.originalPrice - phone.price}
                    </span>
                  )}

                  {/* Side View Label Badge */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                    <Eye className="w-3 h-3 text-purple-400" />
                    <span>{SIDE_LABELS[currentPhotoIndex] || `Photo ${currentPhotoIndex + 1}`}</span>
                  </div>

                  {/* Expand Gallery Button */}
                  <div className="absolute bottom-3 right-3 p-2 rounded-lg bg-purple-600/90 text-white text-[10px] font-extrabold flex items-center gap-1 shadow hover:bg-purple-500 transition">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Inspect Photos</span>
                  </div>
                </div>

                {/* Side Photo Thumbnails Switcher */}
                {allImages.length > 1 && (
                  <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-1.5 overflow-x-auto">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase shrink-0 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-purple-600" />
                      Side Views:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardPhotoIndexes(prev => ({ ...prev, [phone.id]: idx }));
                          }}
                          className={`relative w-11 h-11 rounded-lg overflow-hidden border-2 transition-all ${
                            currentPhotoIndex === idx 
                              ? 'border-purple-600 ring-2 ring-purple-500/20 scale-105' 
                              : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                          }`}
                          title={SIDE_LABELS[idx] || `Angle ${idx + 1}`}
                        >
                          <img 
                            src={img} 
                            alt={`Angle ${idx + 1}`} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specs & Info */}
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">
                        {phone.brand} Certified Pre-Owned
                      </span>
                      {allImages.length > 1 && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          {allImages.length} Angle Photos
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mt-0.5">
                      {phone.model}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {phone.ram} RAM | {phone.storage} Storage | {phone.color}
                    </p>
                  </div>

                  {/* Testing Checklist */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      TECHFIX Diagnostic Verification:
                    </p>
                    <div className="space-y-1">
                      {phone.testedDetails.map((td, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{td}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-900 text-xs font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{phone.warranty}</span>
                  </div>

                </div>
              </div>

              {/* Footer Price & WhatsApp CTA */}
              <div className="p-6 pt-0 border-t border-slate-100 mt-2 pt-4 flex items-center justify-between gap-2">
                <div>
                  {phone.originalPrice && (
                    <span className="text-xs text-slate-400 line-through font-mono">₹{phone.originalPrice}</span>
                  )}
                  <p className="text-2xl font-black text-slate-900 font-mono">₹{phone.price}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenGallery(phone, currentPhotoIndex)}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 border border-slate-200 font-bold text-xs transition flex items-center gap-1"
                    title="View All Side Photos"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Side Photos</span>
                  </button>

                  <a
                    href={`https://wa.me/${BUSINESS_DETAILS.whatsapp}?text=Hello%20TECHFIX,%20I%20am%20interested%20in%20buying/checking%20the%20second-hand%20${encodeURIComponent(phone.brand + ' ' + phone.model)}%20(₹${phone.price}).`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Book / Enquire</span>
                  </a>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* MULTI-ANGLE SIDE PHOTO GALLERY LIGHTBOX MODAL */}
      {selectedPhoneForGallery && (() => {
        const modalImages = selectedPhoneForGallery.images && selectedPhoneForGallery.images.length > 0 
          ? selectedPhoneForGallery.images 
          : [selectedPhoneForGallery.image];
        
        const activeImg = modalImages[activeGalleryIndex] || selectedPhoneForGallery.image;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl text-white relative">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                      {selectedPhoneForGallery.brand} Certified
                    </span>
                    <span className="text-xs text-slate-400">
                      Condition: <strong className="text-white">{selectedPhoneForGallery.condition}</strong>
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {selectedPhoneForGallery.model} ({selectedPhoneForGallery.ram} / {selectedPhoneForGallery.storage})
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedPhoneForGallery(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Main Photo Display Stage */}
              <div className="relative h-72 sm:h-96 bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 group">
                <img 
                  src={formatImageUrl(activeImg)} 
                  alt={`${selectedPhoneForGallery.brand} ${selectedPhoneForGallery.model} - Angle ${activeGalleryIndex + 1}`}
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                {/* Angle Label Badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white text-xs font-bold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span>{SIDE_LABELS[activeGalleryIndex] || `Photo Angle ${activeGalleryIndex + 1}`}</span>
                  <span className="text-slate-400 font-mono">({activeGalleryIndex + 1} / {modalImages.length})</span>
                </div>

                {/* Prev & Next Controls */}
                {modalImages.length > 1 && (
                  <>
                    <button
                      onClick={() => handlePrevPhoto(modalImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-purple-600 text-white transition border border-slate-700 shadow-xl"
                      title="Previous Angle"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleNextPhoto(modalImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-purple-600 text-white transition border border-slate-700 shadow-xl"
                      title="Next Angle"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {modalImages.length > 1 && (
                <div className="flex items-center justify-center gap-3 pt-1">
                  {modalImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveGalleryIndex(idx)}
                      className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        activeGalleryIndex === idx 
                          ? 'border-purple-500 ring-2 ring-purple-500/30 scale-105' 
                          : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                      }`}
                    >
                      <img 
                        src={formatImageUrl(img)} 
                        alt={`Thumbnail ${idx + 1}`} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-center text-slate-300 font-bold py-0.5 truncate">
                        {SIDE_LABELS[idx] || `Angle ${idx + 1}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Footer Specs & WhatsApp CTA */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400">TECHFIX Goalpara Shop Price:</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono">
                    ₹{selectedPhoneForGallery.price}
                    {selectedPhoneForGallery.originalPrice && (
                      <span className="text-xs text-slate-500 line-through ml-2">₹{selectedPhoneForGallery.originalPrice}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Includes {selectedPhoneForGallery.warranty}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedPhoneForGallery(null)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800"
                  >
                    Close Viewer
                  </button>
                  <a
                    href={`https://wa.me/${BUSINESS_DETAILS.whatsapp}?text=Hello%20TECHFIX,%20I%20inspected%20the%20side%20photos%20of%20the%20second-hand%20${encodeURIComponent(selectedPhoneForGallery.brand + ' ' + selectedPhoneForGallery.model)}%20(₹${selectedPhoneForGallery.price}).%20Please%20confirm%20availability.`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enquire This Phone</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
