import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { genai } from '@/lib/genai';
import { searchDrugLabel } from '@/lib/openfda';

interface ScanRequest {
  imageBase64: string;
}

export async function POST(req: Request) {
  try {
    // 1. Authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Input Parsing
    const body: ScanRequest = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return new NextResponse('Missing image data', { status: 400 });
    }

    // Clean base64 string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // 3. Vision Analysis (Gemini 2.5 Flash)
    const visionPrompt = `
      Analyze this image of a medication.
      Identify:
      - Medication Name (Brand or Generic)
      - Strength/Dosage
      - Form
      
      Return ONLY a JSON object:
      {
        "medicationName": "string",
        "dosage": "string",
        "form": "string",
        "confidence": 0.0 to 1.0,
        "extractedText": "string"
      }
    `;

    const visionResult = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: visionPrompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg'
              }
            }
          ]
        }
      ]
    });

    const visionResponseText = visionResult.text || '';
    const jsonMatch = visionResponseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse vision response');
    }

    const scanData = JSON.parse(jsonMatch[0]);

    // 4. Fetch User Context & FDA Data
    const [userMedsRes, fdaData, consultationsRes] = await Promise.all([
      supabase
        .from('user_medications')
        .select('medication_name, dosage, frequency')
        .eq('profile_id', user.id),
      searchDrugLabel(scanData.medicationName || ''),
      supabase
        .from('medical_consultations')
        .select('summary, created_at')
        .eq('family_id', (await supabase.from('family_members').select('family_id').eq('profile_id', user.id).single()).data?.family_id)
        .order('created_at', { ascending: false })
        .limit(3)
    ]);

    const userMeds = userMedsRes.data || [];
    const recentConsultations = consultationsRes.data?.map(c => `[${new Date(c.created_at).toLocaleDateString()}] ${c.summary}`).join('\n') || 'None';

    // 5. Conflict Analysis
    const conflictPrompt = `
      Act as a clinical pharmacist.
      
      **Scanned Medication:**
      Name: ${scanData.medicationName}
      Dosage: ${scanData.dosage}
      
      **Patient's Current Medications:**
      ${JSON.stringify(userMeds)}

      **Recent Doctor Consultations (Medical History):**
      ${recentConsultations}

      **FDA Safety Data:**
      Warnings: ${JSON.stringify(fdaData.warnings || 'Not available')}
      Contraindications: ${JSON.stringify(fdaData.do_not_use || 'Not available')}
      Drug Interactions: ${JSON.stringify(fdaData.drug_interactions || 'Not available')}

      **Task:**
      Identify potential conflicts between the scanned medication and:
      1. Current Medications (Drug-Drug)
      2. Recent Medical History/Doctor's Advice (Drug-Condition)
      
      Return JSON:
      {
        "potentialConflicts": [
          {
            "severity": "HIGH" | "MEDIUM" | "LOW",
            "description": "string",
            "conflictingItem": "string"
          }
        ],
        "recommendation": "string",
        "disclaimer": "string"
      }
    `;

    const conflictResult = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: conflictPrompt }]
        }
      ]
    });

    const conflictResponseText = conflictResult.text || '';
    const conflictJsonMatch = conflictResponseText.match(/\{[\s\S]*\}/);

    let analysisData = {
      potentialConflicts: [],
      recommendation: "Consult your healthcare provider.",
      disclaimer: "AI analysis is not a substitute for professional medical advice."
    };

    if (conflictJsonMatch) {
      analysisData = JSON.parse(conflictJsonMatch[0]);
    }

    // 6. Final Response
    const finalResponse = {
      ...scanData,
      ...analysisData
    };

    return NextResponse.json(finalResponse);

  } catch (error: any) {
    console.error('[MedScanner] Error:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
