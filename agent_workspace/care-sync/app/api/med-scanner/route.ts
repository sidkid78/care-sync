import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenAI, Type } from '@google/genai';

function getAI() {
  const key = process.env.GOOGLE_GENAI_API_KEY;
  if (!key) throw new Error('GOOGLE_GENAI_API_KEY is not configured');
  return new GoogleGenAI({ apiKey: key });
}

// Structured output schema — forces Gemini to return typed JSON
const responseSchema = {
  type: Type.OBJECT,
  description: 'Medication analysis and conflict report',
  properties: {
    medicationName: { type: Type.STRING, description: 'Name of the medication identified' },
    dosage: { type: Type.STRING, description: 'Dosage from the label' },
    confidence: { type: Type.NUMBER, description: '0-1 confidence score for OCR accuracy' },
    extractedText: { type: Type.STRING, description: 'Raw text extracted from the label' },
    potentialConflicts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, description: 'HIGH, MEDIUM, or LOW' },
          description: { type: Type.STRING, description: 'Description of the interaction' },
          conflictingItem: { type: Type.STRING, description: 'The medication it conflicts with' },
        },
      },
    },
    recommendation: { type: Type.STRING, description: 'Safety recommendation for the user' },
    disclaimer: { type: Type.STRING, description: 'AI tool disclaimer' },
  },
  required: ['medicationName', 'potentialConflicts', 'recommendation', 'disclaimer'],
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { imageBase64 } = await req.json();

    // 1. Fetch user context — current medications for conflict detection
    const { data: currentMeds } = await supabase
      .from('user_medications')
      .select('medication_name, dosage')
      .eq('profile_id', user.id);

    const contextString =
      currentMeds?.map((m) => `${m.medication_name} (${m.dosage})`).join(', ') || 'None on file';

    // 2. Agentic prompt with user context injection
    const prompt = `ACT AS: A pharmaceutical safety assistant.
TASK: Analyze the provided image of a medication bottle or pill label.
USER CONTEXT: The user is currently taking: [${contextString}].

INSTRUCTIONS:
1. Extract the medication name and dosage from the label using OCR.
2. Identify potential drug-drug interactions between the scanned medication and the USER CONTEXT.
3. Provide a clear safety recommendation.
4. If the image is blurry or the label is unreadable, set confidence below 0.5.
5. ALWAYS include a disclaimer that this is an AI tool and not a substitute for professional medical advice.`;

    // 3. Call Gemini 2.5 Flash with vision + structured output
    const result = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64,
                mimeType: 'image/jpeg',
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const analysis = JSON.parse(result.text ?? '{}');

    // Data minimization: image is never persisted — only the analysis result
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Med-Scanner Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze medication' },
      { status: 500 }
    );
  }
}
