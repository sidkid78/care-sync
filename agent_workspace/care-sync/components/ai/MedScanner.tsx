'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Camera,
  X,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Upload,
} from 'lucide-react';

interface Conflict {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  conflictingItem: string;
}

interface ScanResult {
  medicationName: string;
  dosage: string;
  confidence: number;
  extractedText: string;
  potentialConflicts: Conflict[];
  recommendation: string;
  disclaimer: string;
}

const SEVERITY_STYLES = {
  HIGH: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', icon: ShieldAlert },
  MEDIUM: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', icon: AlertTriangle },
  LOW: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', icon: ShieldCheck },
} as const;

export default function MedScanner() {
  const [mode, setMode] = useState<'idle' | 'camera' | 'processing' | 'result'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCamera = useCallback(async () => {
    try {
      setError(null);
      setResult(null);
      setPreview(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      setMode('camera');
      // Wait for ref to be available
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setError('Could not access camera. Check browser permissions.');
    }
  }, []);

  const closeCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setMode('idle');
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreview(dataUrl);
    closeCamera();
    analyze(dataUrl);
  }, [closeCamera]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      analyze(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  }, []);

  const analyze = async (imageBase64: string) => {
    setMode('processing');
    setError(null);
    try {
      const res = await fetch('/api/med-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Analysis failed (${res.status})`);
      }

      const data: ScanResult = await res.json();
      setResult(data);
      setMode('result');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(msg);
      setMode('idle');
    }
  };

  const reset = () => {
    setMode('idle');
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Camera View */}
      {mode === 'camera' && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Viewfinder overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-1/2 border-2 border-white/50 rounded-2xl" />
          </div>
          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4">
            <button
              onClick={closeCamera}
              className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={capturePhoto}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white/60 active:scale-90 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--sage-600)]" />
            </button>
          </div>
        </div>
      )}

      {/* Idle — action buttons */}
      {mode === 'idle' && (
        <div className="flex gap-3">
          <button
            onClick={openCamera}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[var(--sage-600)] text-white rounded-xl hover:bg-[var(--sage-700)] transition-colors font-medium text-sm shadow-sm"
          >
            <Camera className="w-4 h-4" />
            Scan Label
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--clay-100)] text-[var(--clay-700)] rounded-xl hover:bg-[var(--clay-200)] transition-colors font-medium text-sm"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Processing */}
      {mode === 'processing' && (
        <div className="space-y-3">
          {preview && (
            <img src={preview} alt="Captured medication" className="w-full rounded-xl object-cover max-h-48" />
          )}
          <div className="flex items-center justify-center gap-2 py-4 text-[var(--sage-600)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Gemini is analyzing the label…</span>
          </div>
        </div>
      )}

      {/* Results */}
      {mode === 'result' && result && (
        <div className="space-y-3">
          {preview && (
            <img src={preview} alt="Scanned medication" className="w-full rounded-xl object-cover max-h-36" />
          )}

          {/* Identified Medication */}
          <div className="p-3 bg-white rounded-lg border border-[var(--clay-200)]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-[var(--clay-900)]">{result.medicationName}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  result.confidence >= 0.8
                    ? 'bg-emerald-100 text-emerald-700'
                    : result.confidence >= 0.5
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
            {result.dosage && (
              <p className="text-sm text-[var(--clay-500)]">Dosage: {result.dosage}</p>
            )}
          </div>

          {/* Conflicts */}
          {result.potentialConflicts.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--clay-500)] uppercase tracking-wide">
                ⚠ Potential Interactions ({result.potentialConflicts.length})
              </span>
              {result.potentialConflicts.map((c, i) => {
                const style = SEVERITY_STYLES[c.severity] || SEVERITY_STYLES.LOW;
                const Icon = style.icon;
                return (
                  <div key={i} className={`p-3 rounded-lg border ${style.bg} ${style.border}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${style.text}`} />
                      <span className={`text-xs font-bold uppercase ${style.text}`}>{c.severity}</span>
                      <span className={`text-xs ${style.text}`}>— {c.conflictingItem}</span>
                    </div>
                    <p className={`text-sm ${style.text}`}>{c.description}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-700 text-sm">
              <ShieldCheck className="w-4 h-4" />
              No known interactions detected with your current medications.
            </div>
          )}

          {/* Recommendation */}
          <div className="p-3 bg-[var(--lav-50)] rounded-lg border border-[var(--lav-200)]">
            <span className="text-xs font-semibold text-[var(--lav-700)] uppercase tracking-wide">Recommendation</span>
            <p className="text-sm text-[var(--clay-700)] mt-1">{result.recommendation}</p>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-[var(--clay-400)] italic">{result.disclaimer}</p>

          {/* Reset */}
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-sm text-[var(--clay-600)] hover:text-[var(--clay-800)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
}
