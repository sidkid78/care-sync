'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Camera,
  X,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Upload,
  Save,
  Check
} from 'lucide-react';

interface Conflict {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  conflictingItem: string;
}

interface ScanResult {
  medicationName: string;
  dosage: string;
  form?: string;
  confidence: number;
  extractedText: string;
  potentialConflicts: Conflict[];
  recommendation: string;
  disclaimer: string;
}

const SEVERITY_STYLES = {
  HIGH: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: ShieldAlert
  },
  MEDIUM: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    icon: AlertTriangle
  },
  LOW: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-800 dark:text-emerald-200',
    icon: ShieldCheck
  },
} as const;

export default function MedScanner() {
  const [mode, setMode] = useState<'idle' | 'camera' | 'processing' | 'result'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const openCamera = useCallback(async () => {
    try {
      setError(null);
      setResult(null);
      setPreview(null);
      setSaved(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      setMode('camera');
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
    setSaved(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      analyze(dataUrl);
    };
    reader.readAsDataURL(file);
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

  const saveMedication = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to save medications.');

      const { error: saveError } = await supabase.from('user_medications').insert({
        profile_id: user.id,
        medication_name: result.medicationName,
        dosage: result.dosage || null,
        frequency: null, // User can update this later
      });

      if (saveError) throw saveError;
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save medication.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setMode('idle');
    setPreview(null);
    setResult(null);
    setError(null);
    setSaved(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg text-sm border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Camera View */}
      {mode === 'camera' && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
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
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--clay-100)] dark:bg-[var(--clay-800)] text-[var(--clay-700)] dark:text-[var(--clay-200)] rounded-xl hover:bg-[var(--clay-200)] dark:hover:bg-[var(--clay-700)] transition-colors font-medium text-sm"
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
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-[var(--clay-200)] dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-900 dark:text-white">{result.medicationName}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${result.confidence >= 0.8
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : result.confidence >= 0.5
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                  }`}
              >
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
            {result.dosage && (
              <p className="text-sm text-gray-600 dark:text-gray-300">Dosage: {result.dosage}</p>
            )}
            {result.form && (
              <p className="text-sm text-gray-600 dark:text-gray-300">Form: {result.form}</p>
            )}
          </div>

          {/* Conflicts */}
          {result.potentialConflicts.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                ⚠ Potential Interactions ({result.potentialConflicts.length})
              </span>
              {result.potentialConflicts.map((c, i) => {
                // Determine styling based on severity
                // Note: The severity string from API might be "HIGH" etc.
                const sev = c.severity || 'LOW';
                let colors = {
                  bg: 'bg-emerald-50 dark:bg-emerald-900/40',
                  border: 'border-emerald-200 dark:border-emerald-800',
                  text: 'text-emerald-800 dark:text-emerald-100',
                  Icon: ShieldCheck
                };

                if (sev === 'HIGH') {
                  colors = {
                    bg: 'bg-red-50 dark:bg-red-900/40',
                    border: 'border-red-200 dark:border-red-800',
                    text: 'text-red-800 dark:text-red-100',
                    Icon: ShieldAlert
                  };
                } else if (sev === 'MEDIUM') {
                  colors = {
                    bg: 'bg-amber-50 dark:bg-amber-900/40',
                    border: 'border-amber-200 dark:border-amber-800',
                    text: 'text-amber-800 dark:text-amber-100',
                    Icon: AlertTriangle
                  };
                }

                const { Icon } = colors;

                return (
                  <div key={i} className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${colors.text} shrink-0`} />
                      <span className={`text-xs font-bold uppercase ${colors.text}`}>{sev}</span>
                      <span className={`text-xs ${colors.text} opacity-90 truncate`}>— {c.conflictingItem}</span>
                    </div>
                    <p className={`text-sm ${colors.text} leading-snug`}>{c.description}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-100 text-sm">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>No known interactions detected with your current medications.</span>
            </div>
          )}

          {/* Recommendation */}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide block mb-1">Recommendation</span>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{result.recommendation}</p>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-2 leading-tight">{result.disclaimer}</p>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Scan Another
            </button>
            <button
              onClick={saveMedication}
              disabled={saved || saving}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg text-white font-medium transition-all shadow-sm
                ${saved
                  ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-500'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save to Cabinet
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
