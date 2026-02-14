import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenAI } from '@google/genai';

function getAI() {
  const key = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY (or GOOGLE_GENAI_API_KEY) is not configured');
  return new GoogleGenAI({ apiKey: key });
}

import { checkSubscription } from '@/lib/subscription';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPremium = await checkSubscription(user.id);
  if (!isPremium) {
    return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
  }

  try {
    const { filePath, familyId } = await req.json();

    // 1. Download audio from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('medical-recordings')
      .download(filePath);

    if (downloadError) throw downloadError;

    // 2. Convert to base64 for Gemini
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    // 3. Call Gemini 2.5 Flash — multimodal audio-to-JSON in one pass
    const prompt = `You are a medical scribe AI. Transcribe the following audio recording of a doctor's visit.
Provide a concise summary and a list of structured action items (tasks).
Return ONLY valid JSON with this structure:
{
  "transcript": "full transcription text here",
  "summary": "concise 2-3 sentence summary here",
  "action_items": [{"task": "description", "priority": "high|medium|low"}]
}`;

    const result = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'user', parts: [{ inlineData: { mimeType: 'audio/webm', data: base64Audio } }] }
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(result.text ?? '{}');

    // 4. Persist to database
    const { error: dbError } = await supabase.from('medical_consultations').insert({
      family_id: familyId,
      created_by: user.id,
      transcript: parsed.transcript,
      summary: parsed.summary,
      action_items: parsed.action_items,
      status: 'completed',
    });

    if (dbError) throw dbError;

    // 5. Purge raw audio from storage (data minimization)
    await supabase.storage.from('medical-recordings').remove([filePath]);

    // 6. Post to family feed
    await supabase.from('feed_posts').insert({
      family_id: familyId,
      profile_id: user.id,
      content: `Doctor Digest: ${parsed.summary}`,
      post_type: 'update',
      metadata: { action_items: parsed.action_items },
    });

    return NextResponse.json({
      success: true,
      summary: parsed.summary,
      action_items: parsed.action_items,
    });
  } catch (error) {
    console.error('Doctor Digest Error:', error);
    return NextResponse.json(
      { error: 'Failed to process recording' },
      { status: 500 }
    );
  }
}
