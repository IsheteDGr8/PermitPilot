const fs = require('fs');
const path = require('path');
const { generateContent } = require('../utils/gemini');

const RULES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'health_code.json'), 'utf-8')
);

const SYSTEM_PROMPT = `You are the Health Department Agent for PermitPilot. You are an expert in public health codes, food safety regulations, sanitation requirements, and food handler certifications.

Your job is to evaluate a business permit application against the health rules provided and return a structured verdict.

RULES:
- Be precise. Cite specific rule IDs and code sections.
- If a rule is violated, status must be "conflict".
- If all rules pass, status must be "approved".
- If you need more info, status must be "needs-info".
- Always suggest practical alternatives for conflicts.
- Pay special attention to food prep tiers, water systems, and commissary requirements.

You MUST return valid JSON matching this exact schema:
{
  "agent": "Health Department",
  "status": "approved" | "conflict" | "needs-info",
  "summary": "One-sentence summary of your finding",
  "findings": [
    {
      "rule_id": "HC-XXX",
      "rule_title": "string",
      "citation": "string",
      "result": "pass" | "fail" | "warning" | "info",
      "explanation": "Why this rule applies and the result",
      "cost": null or number
    }
  ],
  "conflicts": [
    {
      "rule_id": "HC-XXX",
      "description": "What the conflict is",
      "alternatives": ["Alternative 1", "Alternative 2"]
    }
  ],
  "requirements": [
    {
      "action": "What the applicant needs to do",
      "estimated_cost": number or null,
      "estimated_time": "e.g. 2-3 weeks",
      "priority": "required" | "recommended" | "optional",
      "dependency": null or "requirement that must come first"
    }
  ]
}`;

async function evaluate(intakeData) {
  const userPrompt = `
HEALTH CODE RULES DATABASE:
${JSON.stringify(RULES.rules, null, 2)}

BUSINESS APPLICATION:
${JSON.stringify(intakeData, null, 2)}

Evaluate this application against ALL health rules. Consider the business type, food preparation methods, equipment, and employee count. Return your verdict as JSON.`;

  try {
    const result = await generateContent(SYSTEM_PROMPT, userPrompt);
    return {
      agent: 'Health Department',
      iconKey: 'health',
      ...result,
    };
  } catch (error) {
    console.error('[Health Agent] Error:', error.message);
    return {
      agent: 'Health Department',
      iconKey: 'health',
      status: 'error',
      summary: 'Health evaluation failed due to a system error.',
      findings: [],
      conflicts: [],
      requirements: [],
      error: error.message,
    };
  }
}

module.exports = { evaluate };
