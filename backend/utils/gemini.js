const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Generate content from Gemini with structured JSON output.
 * @param {string} systemInstruction - The system prompt for the agent
 * @param {string} userPrompt - The user's intake data + rules
 * @returns {object} Parsed JSON response from Gemini
 */
async function generateContent(systemInstruction, userPrompt) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3, // Low temperature for deterministic rule evaluation
    },
  });

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('[Gemini] Failed to parse JSON response:', text.substring(0, 200));
    throw new Error('Gemini returned non-JSON response');
  }
}

module.exports = { generateContent };
