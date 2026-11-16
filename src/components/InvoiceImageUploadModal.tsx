import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Trash2, Check, Image as ImageIcon, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { compressImageDataUrl } from '../lib/imageUtils';

interface InvoiceImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  currentImageUrl?: string;
  onImageSaved: (url: string | null) => void;
  aspectRatioHint?: string;
}

export const InvoiceImageUploadModal: React.FC<InvoiceImageUploadModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  currentImageUrl,
  onImageSaved,
  aspectRatioHint = 'Recommended ratio: 4:1 (e.g. 1200x300 for Header Banner)'
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [urlInput, setUrlInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentImageUrl || null);
      setErrorMsg(null);
    }
  }, [isOpen, currentImageUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size too large. Please select an image under 15MB.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const compressed = await compressImageDataUrl(result, {
        maxDim: 1100,
        maxChars: 420000,
        preserveAlpha: true
      });
      setPreviewUrl(compressed);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setPreviewUrl(urlInput.trim());
    setUrlInput('');
  };

  const handleSave = () => {
    onImageSaved(previewUrl);
    onClose();
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageSaved(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-5 text-white space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Live Preview */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Image Preview</label>
          <div className="bg-slate-950 border-2 border-dashed border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center min-h-[140px] max-h-[220px] overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Uploaded Banner"
                className="max-h-[180px] w-auto max-w-full object-contain rounded"
              />
            ) : (
              <div className="text-center text-slate-500 space-y-1">
                <ImageIcon className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-xs">No image selected</p>
                <p className="text-[10px] text-slate-600">{aspectRatioHint}</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Buttons */}
        <div className="space-y-3 pt-1">
          {/* File Picker */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>{isProcessing ? 'Processing Image...' : 'Choose Image from Phone / Computer'}</span>
            </button>
          </div>

          {/* Or URL input */}
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Or paste image URL here (https://...)"
              className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          {previewUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Image</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              <Check className="w-4 h-4" />
              <span>Save & Use in Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
