import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenAI, Type } from '@google/genai';
import { searchDrugLabel } from '@/lib/openfda';
import { checkSubscription } from '@/lib/subscription';

function getAI() {
  const key = process.env.GOOGLE_GENAI_API_KEY;
  if (!key) throw new Error('GOOGLE_GENAI_API_KEY is not configured');
  return new GoogleGenAI({ apiKey: key });
}

// 1. Schema for visual extraction (just name/dosage)
const extractionSchema = {
  type: Type.OBJECT,
  properties: {
    medicationName: { type: Type.STRING, description: 'Name of the medication identified' },
    dosage: { type: Type.STRING, description: 'Dosage from the label' },
    extractedText: { type: Type.STRING, description: 'Raw text extracted from the label' },
    confidence: { type: Type.NUMBER, description: '0-1 confidence score for OCR accuracy' },
  },
  required: ['medicationName', 'dosage', 'extractedText', 'confidence'],
};

// 2. Schema for final analysis
const analysisSchema = {
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

  const isPremium = await checkSubscription(user.id);
  if (!isPremium) {
    return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
  }

  try {
    const { imageBase64 } = await req.json();

    // ─── Step 1: Visual Extraction ───
    // Fast, low-temp call to just get the text
    const extractionResult = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Extract the medication name and dosage from this image. Return JSON." },
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
        responseSchema: extractionSchema,
        temperature: 0.1, // Low temp for OCR precision
      },
    });

    const extraction = JSON.parse(extractionResult.text ?? '{}');
    const medName = extraction.medicationName;

    // ─── Step 2: OpenFDA Verification ───
    let fdaContext = "No official FDA data found for this specific name.";
    let fdaWarnings = [];

    if (medName && medName.length > 2) {
      console.log(`[MedScanner] Querying OpenFDA for: ${medName}`);
      const fdaData = await searchDrugLabel(medName);

      if (fdaData.found) {
        fdaContext = `OFFICIAL FDA LABEL DATA FOUND for ${fdaData.brand_name || fdaData.generic_name || medName}.\n`;
        if (fdaData.boxed_warning) {
          fdaContext += `\nBOXED WARNINGS:\n${fdaData.boxed_warning.join('\n')}\n`;
          fdaWarnings.push(...fdaData.boxed_warning);
        }
        if (fdaData.drug_interactions) {
          // Limit length to avoid context window issues
          const interactions = fdaData.drug_interactions.join('\n').substring(0, 1000);
          fdaContext += `\nDRUG INTERACTIONS SECTION:\n${interactions}...\n`;
        }
        if (fdaData.do_not_use) {
          fdaContext += `\nDO NOT USE IF:\n${fdaData.do_not_use.join('\n')}\n`;
        }
      }
    }

    // ─── Step 3: Analysis with Context ───
    // 1. Fetch user context — current medications for conflict detection
    const { data: currentMeds } = await supabase
      .from('user_medications')
      .select('medication_name, dosage')
      .eq('profile_id', user.id);

    const contextString =
      currentMeds?.map((m) => `${m.medication_name} (${m.dosage})`).join(', ') || 'None on file';

    const prompt = `ACT AS: A pharmaceutical safety assistant.
TASK: Analyze the medication identified as "${medName}" (${extraction.dosage}).
USER CONTEXT: The user is currently taking: [${contextString}].
FDA DATABASE DATA: 
${fdaContext}

INSTRUCTIONS:
1. Identify potential drug-drug interactions between ${medName} and the USER CONTEXT.
2. USE THE FDA DATA as the primary source of truth for interactions and warnings.
3. If the FDA data mentions a specific interaction that matches the user's meds, flag it as HIGH severity.
4. Provide a clear safety recommendation.
5. ALWAYS include a disclaimer that this is an AI tool and not a substitute for professional medical advice.`;

    const finalResult = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
      },
    });

    const analysis = JSON.parse(finalResult.text ?? '{}');

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
