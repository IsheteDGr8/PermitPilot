const fs = require('fs');
const path = require('path');
const { generateContent } = require('../utils/gemini');

const RULES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'fire_code.json'), 'utf-8')
);

const SYSTEM_PROMPT = `You are the Fire Marshal Agent for PermitPilot. You are an expert in fire safety codes, propane/LPG regulations, fire suppression systems, generator placement, and life safety requirements.

Your job is to evaluate a business permit application against the fire code rules provided and return a structured verdict.

RULES:
- Be precise. Cite specific rule IDs and fire code sections.
- If a rule is violated, status must be "conflict".
- If all rules pass, status must be "approved".
- If you need more info, status must be "needs-info".
- Always provide safety-focused alternatives for conflicts.
- Pay special attention to fuel sources, cooking equipment, and proximity rules.

You MUST return valid JSON matching this exact schema:
{
  "agent": "Fire Marshal",
  "status": "approved" | "conflict" | "needs-info",
  "summary": "One-sentence summary of your finding",
  "findings": [
    {
      "rule_id": "FM-XXX",
      "rule_title": "string",
      "citation": "string",
      "result": "pass" | "fail" | "warning" | "info",
      "explanation": "Why this rule applies and the result",
      "cost": null or number
    }
  ],
  "conflicts": [
    {
      "rule_id": "FM-XXX",
      "description": "What the conflict is",
      "alternatives": ["Alternative 1", "Alternative 2"]
    }
  ],
  "requirements": [
    {
      "action": "What the applicant needs to do",
      "estimated_cost": number or null,
      "estimated_time": "e.g. 1-2 weeks",
      "priority": "required" | "recommended" | "optional",
      "dependency": null or "requirement that must come first"
    }
  ]
}`;

async function evaluate(intakeData) {
  const userPrompt = `
FIRE CODE RULES DATABASE:
${JSON.stringify(RULES.rules, null, 2)}

BUSINESS APPLICATION:
${JSON.stringify(intakeData, null, 2)}

Evaluate this application against ALL fire code rules. Consider the fuel type, cooking equipment, location, and structure type. Return your verdict as JSON.`;

  try {
    const result = await generateContent(SYSTEM_PROMPT, userPrompt);
    return {
      agent: 'Fire Marshal',
      iconKey: 'fire',
      ...result,
    };
  } catch (error) {
    console.error('[Fire Agent] Error:', error.message);
    return {
      agent: 'Fire Marshal',
      iconKey: 'fire',
      status: 'error',
      summary: 'Fire safety evaluation failed due to a system error.',
      findings: [],
      conflicts: [],
      requirements: [],
      error: error.message,
    };
  }
}

module.exports = { evaluate };
