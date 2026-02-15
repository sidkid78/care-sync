import { type } from 'os';

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
}

export async function searchDrugLabel(medicationName: string): Promise<OpenFDAResult> {
    if (!medicationName || medicationName.length < 3) {
        return { found: false };
    }

    try {
        // OpenFDA search syntax: field:"value"
        // We search both brand and generic names
        const query = `openfda.brand_name:"${medicationName}"+OR+openfda.generic_name:"${medicationName}"`;
        const url = `${OPENFDA_API_URL}?search=${encodeURIComponent(query)}&limit=1`;

        const res = await fetch(url);

        if (!res.ok) {
            if (res.status === 404) {
                return { found: false };
            }
            console.warn(`[OpenFDA] API Error ${res.status}: ${res.statusText}`);
            return { found: false };
        }

        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            return { found: false };
        }

        const label = data.results[0];
        const openfda = label.openfda || {};

        return {
            found: true,
            brand_name: openfda.brand_name?.[0],
            generic_name: openfda.generic_name?.[0],
            warnings: label.warnings,
            do_not_use: label.do_not_use,
            drug_interactions: label.drug_interactions,
            boxed_warning: label.boxed_warning,
            purpose: label.purpose,
            indications_and_usage: label.indications_and_usage,
        };

    } catch (error) {
        console.error('[OpenFDA] Request failed:', error);
        return { found: false };
    }
}
