import React, { useState } from 'react';
import { 
  Camera, 
  MapPin, 
  Sparkles, 
  ZoomIn, 
  X, 
  ShieldCheck, 
  Wrench, 
  PhoneCall, 
  MessageCircle, 
  Clock,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { BUSINESS_DETAILS, INITIAL_SHOP_PHOTOS } from '../data/initialData';
import { ShopPhotoItem, ShopBusinessDetails } from '../types';
import { formatImageUrl } from '../lib/imageUtils';

interface ShopPhotosProps {
  photos?: ShopPhotoItem[];
  businessDetails?: ShopBusinessDetails;
}

export const ShopPhotos: React.FC<ShopPhotosProps> = ({
  photos = INITIAL_SHOP_PHOTOS,
  businessDetails = BUSINESS_DETAILS
}) => {
  const [activePhotoModal, setActivePhotoModal] = useState<{
    url: string;
    title: string;
    category: string;
    description: string;
  } | null>(null);

  const shopPhotos = photos.length > 0 ? photos : INITIAL_SHOP_PHOTOS;


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-4">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Studio Shop Gallery</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            TECHFIX Mobile Repair Centre Photos
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Take a virtual tour of our shop at Dubapara Lupta Char, Goalpara. Inspect our high-precision IC soldering workbench, component testing equipment, and customer reception counter.
          </p>
        </div>

        {/* Shop Address & Status Badge */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300 border-t border-slate-800">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            Verified Shop Location
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400" />
            {BUSINESS_DETAILS.address}
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            {BUSINESS_DETAILS.hours}
          </span>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {shopPhotos.map((photo) => (
          <div 
            key={photo.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between"
          >
            <div>
              {/* Image Container */}
              <div 
                className="relative h-64 bg-slate-900 overflow-hidden cursor-pointer"
                onClick={() => setActivePhotoModal(photo)}
              >
                <img 
                  src={formatImageUrl(photo.url || photo.image)} 
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback placeholder if image link fails or restricted by drive settings
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors" />

                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider border border-white/10">
                  {photo.category}
                </span>

                <div className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/80 backdrop-blur-md text-white opacity-90 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4 text-blue-400" />
                </div>
              </div>

              {/* Photo Text Details */}
              <div className="p-6 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition">
                  {photo.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {photo.description}
                </p>

                {/* Highlights List */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Shop Highlights:</p>
                  <div className="space-y-1">
                    {photo.highlights.map((hl, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-6 pt-0 border-t border-slate-100 mt-2 pt-4">
              <button
                onClick={() => setActivePhotoModal(photo)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>View Fullscreen Image</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Lightbox Zoom Modal */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center overflow-y-auto animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-3xl border border-slate-800 text-white overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8 my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 text-xs font-bold">
                  {activePhotoModal.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-1">
                  {activePhotoModal.title}
                </h2>
              </div>

              <button
                onClick={() => setActivePhotoModal(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Full High-Res Image */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[60vh] bg-black flex items-center justify-center">
              <img 
                src={formatImageUrl(activePhotoModal.url || activePhotoModal.image)} 
                alt={activePhotoModal.title}
                className="w-full h-full object-contain max-h-[60vh]"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>

            {/* Description & Contact */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {activePhotoModal.description}
              </p>

              <a
                href={`https://wa.me/${BUSINESS_DETAILS.whatsapp}?text=Hello%20TECHFIX,%20I%20saw%20your%20shop%20photo%20(${encodeURIComponent(activePhotoModal.title)})%20and%20want%20to%20visit.`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shrink-0 shadow-lg"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enquire Visit via WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
