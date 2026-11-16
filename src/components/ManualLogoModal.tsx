import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  X,
  Link as LinkIcon,
  Sparkles,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { saveLogoToDb, clearLogoFromDb } from '../utils/logoStorage';
import { saveShopLogoToFirestore, isDurableImageValue } from '../lib/firebase';
import { compressImageDataUrl } from '../lib/imageUtils';

interface ManualLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl?: string | null;
  onLogoUpdated: (newLogoUrl: string | null) => void;
}

export const ManualLogoModal: React.FC<ManualLogoModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  onLogoUpdated
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewBg, setPreviewBg] = useState<'dark' | 'light'>('dark');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentLogoUrl || null);
      setUrlInput('');
      setSelectedFile(null);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentLogoUrl]);

  if (!isOpen) return null;

  // Handle local file selection from phone or computer
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Kripya sirf image file chunein (PNG, JPG, WEBP, SVG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Image size 15MB se kam hona chahiye.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      const compressed = await compressImageDataUrl(raw, {
        maxDim: 650,
        maxChars: 450000,
        preserveAlpha: true
      });
      setPreviewUrl(compressed);
    };
    reader.readAsDataURL(file);
  };

  // Handle URL input preview
  const handleUrlPreview = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setErrorMsg('Kripya image ka link enter karein.');
      return;
    }
    setPreviewUrl(trimmed);
    setSelectedFile(null);
  };

  // Save and apply logo permanently to Cloud Firestore + IndexedDB + localStorage
  const handleSaveLogo = async () => {
    if (!previewUrl) {
      setErrorMsg('Kripya pehle koi image chunein ya link dalein.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      let finalUrl = previewUrl.trim();

      if (finalUrl.startsWith('data:image/')) {
        // Compress cleanly so it fits inside Firestore 1MB doc & localStorage permanently
        finalUrl = await compressImageDataUrl(finalUrl, {
          maxDim: 650,
          maxChars: 450000,
          preserveAlpha: true
        });
        // Optional backup to local server disk (NEVER replace finalUrl with ephemeral /uploads/ path!)
        fetch('/api/upload-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: finalUrl })
        }).catch(() => {});
      } else if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) {
        // Try converting external URL into a durable dataUrl via backend proxy
        try {
          const res = await fetch('/api/fetch-logo-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: finalUrl })
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.success && data?.dataUrl && isDurableImageValue(data.dataUrl)) {
              finalUrl = await compressImageDataUrl(data.dataUrl, {
                maxDim: 650,
                maxChars: 450000,
                preserveAlpha: true
              });
            }
          }
        } catch (serverErr) {
          console.warn('Server URL fetch note, keeping direct URL:', serverErr);
        }
      }

      // Save durable value to IndexedDB & LocalStorage
      await saveLogoToDb(finalUrl);
      try {
        localStorage.setItem('techfix_custom_logo', finalUrl);
        sessionStorage.setItem('techfix_custom_logo', finalUrl);
      } catch (e) {}

      // Save permanently to Cloud Firestore
      const fsSaved = await saveShopLogoToFirestore(finalUrl);

      // Trigger global event
      window.dispatchEvent(new Event('techfix_logo_updated'));

      onLogoUpdated(finalUrl);
      setSuccessMsg(
        fsSaved
          ? 'Logo safalta-purvak update ho gaya! (Firebase Cloud me permanently save hua)'
          : 'Logo update ho gaya! (Local storage me save hua)'
      );
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Logo update karne me error aayi.');
    } finally {
      setIsUploading(false);
    }
  };

  // Remove logo completely (reset to clean text/default SVG)
  const handleRemoveLogo = async () => {
    setIsUploading(true);
    setErrorMsg(null);

    try {
      try {
        await fetch('/api/logo', { method: 'DELETE' });
      } catch (e) {}

      try {
        await saveShopLogoToFirestore('');
      } catch (e) {}

      await clearLogoFromDb();
      try {
        localStorage.removeItem('techfix_custom_logo');
        sessionStorage.removeItem('techfix_custom_logo');
      } catch (e) {}

      window.dispatchEvent(new Event('techfix_logo_updated'));
      onLogoUpdated(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setUrlInput('');
      setSuccessMsg('Logo remove kar diya gaya hai (Firebase me bhi update hua).');
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Logo remove karne me error aayi.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in text-left">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-5 sm:p-6 text-white shadow-2xl space-y-4 my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shrink-0">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                <span>Manual Logo Manager</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-400">
                Apna shop logo manually upload ya remove karein
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Logo Preview</span>
            </span>
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg text-[10px]">
              <button
                type="button"
                onClick={() => setPreviewBg('dark')}
                className={`px-2 py-0.5 rounded font-bold transition ${previewBg === 'dark' ? 'bg-slate-950 text-cyan-400 shadow-sm' : 'text-slate-400'}`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('light')}
                className={`px-2 py-0.5 rounded font-bold transition ${previewBg === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                Light
              </button>
            </div>
          </div>

          <div
            className={`w-full h-32 rounded-2xl border border-slate-700/80 flex items-center justify-center p-4 transition-colors relative overflow-hidden ${
              previewBg === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
            }`}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Logo Preview"
                className="max-h-full max-w-full object-contain drop-shadow-md select-none"
              />
            ) : (
              <div className="text-center space-y-1">
                <span className="font-black text-2xl tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent block">
                  TECHFIX
                </span>
                <span className={`text-[10px] font-bold block ${previewBg === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  (Koi logo nahi hai - Plain Text show hoga)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Upload Options */}
        <div className="space-y-3 pt-1">
          {/* Option A: Choose File from Device */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{selectedFile ? `File: ${selectedFile.name}` : '📁 Mobile / Computer Se Image Chunein'}</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-1">
              Supports: Transparent PNG, JPG, WEBP, SVG
            </p>
          </div>

          {/* Option B: Direct URL */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-cyan-400" />
              <span>Ya Image Ka Online Link Dalein:</span>
            </span>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/shop-logo.png"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleUrlPreview}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer shrink-0"
              >
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveLogo}
              disabled={isUploading || !previewUrl}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save & Apply Logo</span>
                </>
              )}
            </button>

            {/* Remove Logo Button */}
            <button
              type="button"
              onClick={handleRemoveLogo}
              disabled={isUploading}
              title="Remove logo completely and return to text"
              className="py-3 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-black text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Remove</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Cancel / Close
          </button>
        </div>

      </div>
    </div>
  );
};
