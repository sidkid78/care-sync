'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Mic, Square, Loader2 } from 'lucide-react';

export default function DoctorDigestRecorder({ familyId }: { familyId: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const supabase = createClient();

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];

        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };

        mediaRecorder.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          await uploadAndProcess(audioBlob);
        };

        mediaRecorder.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Microphone Access Error:", err);
        alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  const uploadAndProcess = async (blob: Blob) => {
    setIsUploading(true);
    const fileName = `${familyId}/${Date.now()}.webm`;

    try {
      // 1. Upload to private storage
      const { data, error } = await supabase.storage
        .from('medical-recordings')
        .upload(fileName, blob);

      if (error) throw error;

      // 2. Trigger Edge Function for Agentic Processing
      const { error: funcError } = await supabase.functions.invoke('process-doctor-digest', {
        body: { filePath: data.path, familyId },
      });

      if (funcError) throw funcError;
      
      alert("Consultation uploaded. AI is generating your digest...");
    } catch (err) {
      console.error("Pipeline Error:", err);
      alert("Error processing recording.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-white flex flex-col items-center gap-4">
      <h3 className="text-lg font-semibold">Doctor Digest</h3>
      <p className="text-sm text-gray-500 text-center">
        Record the consultation. Gemini will extract action items automatically.
      </p>
      
      {!isRecording ? (
        <button 
            onClick={startRecording} 
            disabled={isUploading} 
            className="rounded-full w-16 h-16 bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
        >
          <Mic className="w-8 h-8" />
        </button>
      ) : (
        <button 
            onClick={stopRecording} 
            className="rounded-full w-16 h-16 bg-red-600 text-white flex items-center justify-center animate-pulse"
        >
          <Square className="w-8 h-8" />
        </button>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="animate-spin" /> Processing Audio...
        </div>
      )}
    </div>
  );
}
