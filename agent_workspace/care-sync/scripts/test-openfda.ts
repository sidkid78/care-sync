
import { searchDrugLabel } from '../lib/openfda';

async function test() {
    const drugName = 'DICLOFENAC SODIUM';
    console.log(`Testing OpenFDA search for: ${drugName}`);

    try {
        const data = await searchDrugLabel(drugName);
        console.log('Result:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
