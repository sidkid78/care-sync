

const OPENFDA_API_URL = 'https://api.fda.gov/drug/label.json';

export interface OpenFDAResult {
    found: boolean;
    brand_name?: string;
    generic_name?: string;
    warnings?: string[];
    do_not_use?: string[];
    drug_interactions?: string[];
    boxed_warning?: string[];
    purpose?: string[];
    indications_and_usage?: string[];
    stop_use?: string[];
}

export async function searchDrugLabel(medicationName: string): Promise<OpenFDAResult> {
    if (!medicationName) return { found: false };

    const apiKey = process.env.OPENFDA_API_KEY;

    // Helper to run query
    const runQuery = async (query: string) => {
        let url = `${OPENFDA_API_URL}?search=${query}&limit=1`;
        if (apiKey) {
            url += `&api_key=${apiKey}`;
        }
        try {
            const res = await fetch(url);
            if (!res.ok) return null;
            return res.json();
        } catch (e) {
            return null;
        }
    };

    try {
        // 1. Clean the medication name (remove dosage, form, punctuation)
        // e.g. "Diclofenac Sodium 50mg Tablet" -> "Diclofenac Sodium"
        const cleanName = medicationName
            .replace(/\d+\s*(mg|ml|mcg|g|%)/gi, '') // Remove dosage
            .replace(/(tablet|capsule|injection|cream|ointment|gel|patch|solution|suspension|syrup|drops)/gi, '') // Remove form
            .replace(/[^\w\s-]/g, '') // Remove special chars except hyphen
            .trim();

        // Create search terms: ensure they are long enough to be meaningful
        const terms = cleanName.split(/\s+/).filter(t => t.length > 2).join('+');

        if (!terms) {
            console.warn(`[OpenFDA] Name cleaned to empty string: ${medicationName}`);
            return { found: false };
        }

        let data = null;

        // 2. Strategy A: Exact Brand Name Match
        // openfda.brand_name:"Diclofenac+Sodium"
        data = await runQuery(`openfda.brand_name:"${terms}"`);

        // 3. Strategy B: Exact Generic Name Match
        // openfda.generic_name:"Diclofenac+Sodium"
        if (!data) {
            data = await runQuery(`openfda.generic_name:"${terms}"`);
        }

        // 4. Strategy C: Broad Search (Brand OR Generic)
        // (openfda.brand_name:"Diclofenac+Sodium"+OR+openfda.generic_name:"Diclofenac+Sodium")
        if (!data) {
            data = await runQuery(`(openfda.brand_name:"${terms}"+OR+openfda.generic_name:"${terms}")`);
        }

        if (!data || !data.results || data.results.length === 0) {
            console.warn(`[OpenFDA] No data found for ${medicationName} (cleaned: ${terms})`);
            return { found: false };
        }

        const label = data.results[0];
        const openfda = label.openfda || {};

        return {
            found: true,
            brand_name: openfda.brand_name?.[0],
            generic_name: openfda.generic_name?.[0],
            warnings: label.warnings || [],
            do_not_use: label.do_not_use || label.contraindications || [],
            drug_interactions: label.drug_interactions || [],
            boxed_warning: label.boxed_warning || [],
            purpose: label.purpose || [],
            indications_and_usage: label.indications_and_usage || [],
            stop_use: label.stop_use || [],
        };

    } catch (error) {
        console.error('[OpenFDA] Request failed:', error);
        return { found: false };
    }
}
