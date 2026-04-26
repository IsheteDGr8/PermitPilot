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

// Model selection: gemini-1.5-flash has the most generous and stable free-tier quotas
// You can override via GEMINI_MODEL env var (e.g., gemini-2.0-flash, gemini-2.5-flash)
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

/**
 * Sleep helper for retry backoff
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate content from Gemini with structured JSON output.
 * Includes retry logic with exponential backoff for rate limits.
 * @param {string} systemInstruction - The system prompt for the agent
 * @param {string} userPrompt - The user's intake data + rules
 * @param {number} maxRetries - Max retry attempts (default 3)
 * @returns {object} Parsed JSON response from Gemini
 */
async function generateContent(systemInstruction, userPrompt, maxRetries = 3) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3, // Low temperature for deterministic rule evaluation
    },
  });

  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 15000); // 2s, 4s, 8s, max 15s
        console.log(`  [⏳] Retry attempt ${attempt}/${maxRetries} after ${backoff}ms...`);
        await sleep(backoff);
      }

      const result = await model.generateContent(userPrompt);
      const text = result.response.text();

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('[Gemini] Failed to parse JSON response:', text.substring(0, 300));
        throw new Error('Gemini returned non-JSON response');
      }
    } catch (error) {
      lastError = error;
      const msg = error.message || '';
      
      // Only retry on rate limit errors (429)
      if (msg.includes('429') || msg.includes('quota') || msg.includes('rate')) {
        console.warn(`  [⚠️] Rate limited (attempt ${attempt + 1}/${maxRetries + 1})`);
        continue;
      }
      
      // For non-rate-limit errors, don't retry
      throw error;
    }
  }

  throw lastError;
}

module.exports = { generateContent, MODEL_NAME };
