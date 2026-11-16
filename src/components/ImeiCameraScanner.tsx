import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, Zap, CheckCircle2, AlertCircle, Upload, Sparkles, Check, Hash } from 'lucide-react';

interface ImeiCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedImei: string) => void;
}

export const ImeiCameraScanner: React.FC<ImeiCameraScannerProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrStatusText, setOcrStatusText] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [detectedImeis, setDetectedImeis] = useState<string[]>([]);
  const [manualImeiInput, setManualImeiInput] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrIntervalRef = useRef<any>(null);

  // Clean and extract potential IMEI (15 digits)
  const extractImeiFromRawText = (raw: string): string => {
    const trimmed = raw.trim();
    const imeiMatch = trimmed.match(/\b\d{15}\b/);
    if (imeiMatch) {
      return imeiMatch[0];
    }
    const prefixedMatch = trimmed.match(/(?:IMEI|SN|S\/N|MEID)[:\s-]*([A-Z0-9]{14,18})/i);
    if (prefixedMatch && prefixedMatch[1]) {
      return prefixedMatch[1].trim();
    }
    const cleanDigits = trimmed.replace(/[^0-9]/g, '');
    return cleanDigits.length === 15 ? cleanDigits : trimmed;
  };

  const notifySuccessAndFinish = (cleanImei: string) => {
    // Play pleasant confirmation audio tone
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}

    // Haptic vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    stopScanner();
    onScanSuccess(cleanImei);
  };

  // AI-powered OCR Frame Capture to read text from *#06# screen dialogs
  const captureAndScanScreenOCR = async (auto = false) => {
    if (isOcrProcessing) return;

    const videoEl = document.querySelector('#imei-reader-viewport video') as HTMLVideoElement;
    if (!videoEl || videoEl.videoWidth === 0) {
      if (!auto) setOcrStatusText('Camera feed not ready yet. Please wait...');
      return;
    }

    setIsOcrProcessing(true);
    setOcrStatusText('Analyzing screen numbers via AI...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsOcrProcessing(false);
        return;
      }

      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);

      const res = await fetch('/api/ai/scan-imei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      });

      if (!res.ok) {
        throw new Error('Server scan response error');
      }

      const data = await res.json();

      if (data.found && data.imeis && data.imeis.length > 0) {
        setDetectedImeis(data.imeis);
        setOcrStatusText(`Found ${data.imeis.length} IMEI(s) on screen!`);

        // If single IMEI, auto-select immediately
        if (data.imeis.length === 1) {
          notifySuccessAndFinish(data.imeis[0]);
        }
      } else {
        if (!auto) {
          setOcrStatusText('No 15-digit IMEI found. Hold camera closer to the screen or sticker.');
          setTimeout(() => setOcrStatusText(null), 3000);
        } else {
          setOcrStatusText(null);
        }
      }
    } catch (err: any) {
      console.warn('OCR Scan error:', err);
      if (!auto) {
        setOcrStatusText('Could not scan frame. Try holding steady or use photo upload.');
        setTimeout(() => setOcrStatusText(null), 3000);
      }
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleDetectedCode = (decodedText: string) => {
    const cleanImei = extractImeiFromRawText(decodedText);
    notifySuccessAndFinish(cleanImei);
  };

  const startScanner = async (cameraIdToUse?: string) => {
    setScannerError(null);
    setIsScanning(true);
    setDetectedImeis([]);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('imei-reader-viewport', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.ITF
          ],
          verbose: false
        });
      }

      const availableCameras = await Html5Qrcode.getCameras();
      if (availableCameras && availableCameras.length > 0) {
        setCameras(availableCameras);
        const backCamera = availableCameras.find(c => 
          c.label.toLowerCase().includes('back') || 
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('environment')
        ) || availableCameras[availableCameras.length - 1];

        const targetCamId = cameraIdToUse || backCamera.id;
        setSelectedCameraId(targetCamId);

        await html5QrCodeRef.current.start(
          targetCamId,
          {
            fps: 15,
            qrbox: { width: 300, height: 180 },
            aspectRatio: 1.777778
          },
          (decodedText) => {
            handleDetectedCode(decodedText);
          },
          () => {}
        );
      } else {
        await html5QrCodeRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 300, height: 180 },
            aspectRatio: 1.777778
          },
          (decodedText) => {
            handleDetectedCode(decodedText);
          },
          () => {}
        );
      }

      // Start periodic OCR background analysis every 2.8 seconds
      if (ocrIntervalRef.current) clearInterval(ocrIntervalRef.current);
      ocrIntervalRef.current = setInterval(() => {
        captureAndScanScreenOCR(true);
      }, 2800);

    } catch (err: any) {
      console.warn('Camera scanner error:', err);
      setScannerError(
        err?.message || 
        'Unable to access camera. Please allow camera permissions or upload a photo of the phone screen (*#06#) or barcode.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (ocrIntervalRef.current) {
      clearInterval(ocrIntervalRef.current);
      ocrIntervalRef.current = null;
    }
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
    }
    setIsScanning(false);
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamId = cameras[nextIndex].id;
    setSelectedCameraId(nextCamId);
    await stopScanner();
    await startScanner(nextCamId);
  };

  const toggleTorch = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        const newTorch = !torchOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: newTorch } as any]
        });
        setTorchOn(newTorch);
      } catch (e) {
        console.warn('Torch not supported on this device');
      }
    }
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    setOcrStatusText('Analyzing uploaded photo for IMEI numbers & barcode...');

    // 1. First try barcode scan
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('imei-reader-viewport');
      }
      const result = await html5QrCodeRef.current.scanFile(file, true);
      if (result) {
        setIsOcrProcessing(false);
        handleDetectedCode(result);
        return;
      }
    } catch (barcodeErr) {
      // Continue to AI Vision OCR
    }

    // 2. Try AI Vision OCR on uploaded image
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/ai/scan-imei', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64Data })
          });
          const data = await res.json();
          if (data.found && data.imeis && data.imeis.length > 0) {
            setDetectedImeis(data.imeis);
            setOcrStatusText(`Found ${data.imeis.length} IMEI(s) in photo!`);
            if (data.imeis.length === 1) {
              notifySuccessAndFinish(data.imeis[0]);
            }
          } else {
            setScannerError('Could not find a 15-digit IMEI in this image. Please take a clear photo of the *#06# screen or barcode.');
          }
        } catch (e) {
          setScannerError('Failed to process image. Please try again.');
        } finally {
          setIsOcrProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsOcrProcessing(false);
      setScannerError('Could not read image file.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-600/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Scan Mobile IMEI / Barcode
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  AI OCR + BARCODE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Reads *#06# screen dialogs, box barcodes, & back stickers
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport & Scan Area */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center space-y-4 overflow-y-auto">
          
          {/* Multiple IMEIs Found Pill List (e.g. Dual SIM on *#06#) */}
          {detectedImeis.length > 0 && (
            <div className="w-full bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3.5 space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Found {detectedImeis.length} IMEI Number(s) on Screen:
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono">Tap to apply</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {detectedImeis.map((imei, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => notifySuccessAndFinish(imei)}
                    className="w-full p-2.5 rounded-xl bg-slate-900/90 hover:bg-emerald-600 border border-emerald-500/50 hover:border-emerald-400 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-emerald-100">
                        {idx === 0 ? 'SIM 1 / Primary IMEI:' : `SIM ${idx + 1} / Secondary IMEI:`}
                      </span>
                      <p className="font-mono text-sm font-extrabold text-amber-300 group-hover:text-white">
                        {imei}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 group-hover:bg-white text-emerald-300 group-hover:text-slate-900 text-xs font-black flex items-center gap-1 transition">
                      <Check className="w-3.5 h-3.5" />
                      <span>Select</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {scannerError ? (
            <div className="w-full p-4 bg-rose-950/50 border border-rose-500/40 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-200">{scannerError}</p>
                <p className="text-[11px] text-slate-400">
                  Ensure camera permissions are allowed, or take a photo of the phone screen / barcode.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => startScanner()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Choose Photo of Screen</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center space-y-3">
              {/* Scanner Viewport */}
              <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-black min-h-[260px]">
                <div id="imei-reader-viewport" className="w-full h-full" />
                
                {/* Aiming Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  <div className="w-full max-w-[280px] h-32 border-2 border-emerald-400/90 rounded-2xl relative shadow-[0_0_20px_rgba(52,211,153,0.35)] animate-pulse">
                    <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_#f43f5e]" />
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono font-black text-emerald-300 bg-slate-950/90 px-3 py-0.5 rounded-full border border-emerald-500/40 whitespace-nowrap shadow-md">
                      Point at *#06# Screen or Barcode
                    </span>
                  </div>
                </div>

                {/* Live OCR Status Badge */}
                {isOcrProcessing && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/90 border border-amber-500/50 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm whitespace-nowrap animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span>Reading Screen Numbers...</span>
                  </div>
                )}
              </div>

              {ocrStatusText && (
                <p className="text-xs font-bold text-center text-amber-300 animate-pulse">
                  {ocrStatusText}
                </p>
              )}

              {/* PRIMARY SCAN BUTTON: Read Screen Numbers (*#06#) */}
              <button
                type="button"
                onClick={() => captureAndScanScreenOCR(false)}
                disabled={isOcrProcessing}
                className="w-full max-w-sm py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className={`w-4 h-4 text-slate-950 ${isOcrProcessing ? 'animate-spin' : ''}`} />
                <span>{isOcrProcessing ? 'Scanning Screen...' : '⚡ Scan *#06# Screen Numbers Now'}</span>
              </button>

              {/* Secondary Controls Bar */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full max-w-sm">
                {cameras.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                    <span>Flip Camera</span>
                  </button>
                )}

                <button
                  onClick={toggleTorch}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                    torchOn 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{torchOn ? 'Flashlight ON' : 'Flashlight'}</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload Screen Photo</span>
                </button>
              </div>

              {/* Manual Input Fallback */}
              <div className="w-full max-w-sm pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Or enter 15-digit IMEI manually..."
                      value={manualImeiInput}
                      onChange={(e) => setManualImeiInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500"
                    />
                    <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (manualImeiInput.trim()) {
                        notifySuccessAndFinish(manualImeiInput.trim());
                      }
                    }}
                    disabled={!manualImeiInput.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileScan}
          />
        </div>

        {/* Footer Guidance */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Dial <strong>*#06#</strong> on customer phone to view IMEI on screen</span>
          </span>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-xs font-bold text-slate-400 hover:text-white transition px-2 py-1 rounded"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
