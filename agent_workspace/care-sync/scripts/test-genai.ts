const fs = require('fs');
const path = require('path');

// Manually load env vars
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^"(.*)"$/, '$1');
            process.env[key] = value;
        }
    });
} catch (e) {
    console.warn('Could not load .env.local', e);
}

// NOW import genai, which expects process.env to be populated
const { genai } = require('../lib/genai');

async function testGenAI() {
    console.log('Testing Google GenAI Client...');
    if (!process.env.GOOGLE_GENAI_API_KEY) {
        console.error('FAILURE: GOOGLE_GENAI_API_KEY not found in environment');
        return;
    }

    try {
        const result = await genai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: 'Hello, are you working? Respond with "Yes".' }] }]
        });

        const text = result.text;
        console.log('Response:', text);

        if (text.includes('Yes')) {
            console.log('SUCCESS: Gemini 2.5 Flash is responding.');
        } else {
            console.warn('WARNING: Gemini responded but not with "Yes"');
        }
    } catch (error) {
        console.error('FAILURE: GenAI Error:', error);
    }
}

testGenAI();
