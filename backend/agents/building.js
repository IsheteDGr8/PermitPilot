const fs = require('fs');
const path = require('path');
const { generateContent } = require('../utils/gemini');

const RULES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'building_code.json'), 'utf-8')
);

const SYSTEM_PROMPT = `You are the Building Department Agent for PermitPilot. You are an expert in building codes, electrical requirements, plumbing, ADA compliance, and tenant improvement permits.

Your job is to evaluate a business permit application against the building code rules provided and return a structured verdict.

RULES:
- Be precise. Cite specific rule IDs and building code sections.
- If a rule is violated, status must be "conflict".
- If all rules pass, status must be "approved".
- If you need more info, status must be "needs-info".
- Always provide practical alternatives for conflicts.
- Consider electrical load, structural modifications, and accessibility requirements.

You MUST return valid JSON matching this exact schema:
{
  "agent": "Building Dept",
  "status": "approved" | "conflict" | "needs-info",
  "summary": "One-sentence summary of your finding",
  "findings": [
    {
      "rule_id": "BD-XXX",
      "rule_title": "string",
      "citation": "string",
      "result": "pass" | "fail" | "warning" | "info",
      "explanation": "Why this rule applies and the result",
      "cost": null or number
    }
  ],
  "conflicts": [
    {
      "rule_id": "BD-XXX",
      "description": "What the conflict is",
      "alternatives": ["Alternative 1", "Alternative 2"]
    }
  ],
  "requirements": [
    {
      "action": "What the applicant needs to do",
      "estimated_cost": number or null,
      "estimated_time": "e.g. 4-8 weeks",
      "priority": "required" | "recommended" | "optional",
      "dependency": null or "requirement that must come first"
    }
  ]
}`;

async function evaluate(intakeData) {
  const userPrompt = `
BUILDING CODE RULES DATABASE:
${JSON.stringify(RULES.rules, null, 2)}

BUSINESS APPLICATION:
${JSON.stringify(intakeData, null, 2)}

Evaluate this application against ALL building code rules. Consider the property type, planned modifications, electrical needs, and ADA requirements. Return your verdict as JSON.`;

  try {
    const result = await generateContent(SYSTEM_PROMPT, userPrompt);
    return {
      agent: 'Building Dept',
      iconKey: 'building',
      ...result,
    };
  } catch (error) {
    console.error('[Building Agent] Error:', error.message);
    return {
      agent: 'Building Dept',
      iconKey: 'building',
      status: 'error',
      summary: 'Building evaluation failed due to a system error.',
      findings: [],
      conflicts: [],
      requirements: [],
      error: error.message,
    };
  }
}

module.exports = { evaluate };
