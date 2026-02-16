'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Mic, Square, Loader2, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface ActionItem {
  task: string;
  priority: 'high' | 'medium' | 'low';
}

interface DigestResult {
  summary: string;
  action_items: ActionItem[];
}

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  medium: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
} as const;

export default function DoctorDigestRecorder({ familyId }: { familyId: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DigestResult | null>(null);
  const [showActions, setShowActions] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabase = createClient();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await uploadAndProcess(audioBlob);
      };

      mediaRecorder.current.start(1000); // collect in 1s chunks
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (err) {
      console.error('Microphone Access Error:', err);
      setError('Could not access microphone. Check browser permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const uploadAndProcess = async (blob: Blob) => {
    setIsProcessing(true);
    setError(null);
    const fileName = `${familyId}/${Date.now()}.webm`;

    try {
      // 1. Upload to private storage
      const { data, error: uploadErr } = await supabase.storage
        .from('medical-recordings')
        .upload(fileName, blob);

      if (uploadErr) throw uploadErr;

      // 2. Call our Next.js API route (replaces Edge Function)
      const res = await fetch('/api/doctor-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: data.path, familyId }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Processing failed (${res.status})`);
      }

      const digest = await res.json();
      setResult({ summary: digest.summary, action_items: digest.action_items });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing recording';
      console.error('Pipeline Error:', err);
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Recording Controls */}
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isProcessing}
            aria-label="Start recording"
            className="rounded-full w-14 h-14 bg-[var(--sage-600)] text-white flex items-center justify-center hover:bg-[var(--sage-700)] disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Mic className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            aria-label="Stop recording"
            className="rounded-full w-14 h-14 bg-red-500 text-white flex items-center justify-center shadow-md animate-pulse"
          >
            <Square className="w-5 h-5" />
          </button>
        )}

        <div className="flex-1">
          {isRecording && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-mono text-sm text-red-600">{formatTime(recordingTime)}</span>
              <span className="text-xs text-[var(--clay-500)]">Recording…</span>
            </div>
          )}
          {isProcessing && (
            <div className="flex items-center gap-2 text-[var(--sage-600)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Gemini is analyzing your recording…</span>
            </div>
          )}
          {!isRecording && !isProcessing && !result && !error && (
            <p className="text-sm text-[var(--clay-400)]">
              Tap to record a consultation. AI extracts action items automatically.
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="p-3 bg-[var(--sage-50)] dark:bg-[var(--sage-900)]/40 rounded-lg border border-[var(--sage-200)] dark:border-[var(--sage-800)]">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-[var(--sage-600)] dark:text-[var(--sage-400)]" />
              <span className="text-xs font-semibold text-[var(--sage-700)] dark:text-[var(--sage-300)] uppercase tracking-wide">Summary</span>
            </div>
            <p className="text-sm text-[var(--clay-700)] dark:text-[var(--clay-200)] leading-relaxed">{result.summary}</p>
          </div>

          {/* Action Items */}
          {result.action_items.length > 0 && (
            <div>
              <button
                onClick={() => setShowActions(!showActions)}
                className="flex items-center gap-1 text-xs font-semibold text-[var(--clay-500)] dark:text-[var(--clay-400)] uppercase tracking-wide mb-2 hover:text-[var(--clay-700)] dark:hover:text-[var(--clay-200)]"
              >
                Action Items ({result.action_items.length})
                {showActions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showActions && (
                <div className="space-y-2">
                  {result.action_items.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 p-2 rounded-md border text-sm ${PRIORITY_COLORS[item.priority]}`}
                    >
                      <span className="font-mono text-xs uppercase w-14 shrink-0 pt-0.5">{item.priority}</span>
                      <span>{item.task}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
