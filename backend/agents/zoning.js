const fs = require('fs');
const path = require('path');
const { generateContent } = require('../utils/gemini');

const RULES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'zoning_code.json'), 'utf-8')
);

const SYSTEM_PROMPT = `You are the Zoning Authority Agent for PermitPilot. You are an expert in municipal zoning codes, land use regulations, setback boundaries, and permitted operating zones.

Your job is to evaluate a business permit application against the zoning rules provided and return a structured verdict.

RULES:
- Be precise. Cite specific rule IDs and municipal code sections.
- If a rule is violated, status must be "conflict".
- If all rules pass, status must be "approved".
- If you need more info from the applicant, status must be "needs-info".
- Always provide actionable alternatives for any conflicts.
- Consider the business type and location carefully.

You MUST return valid JSON matching this exact schema:
{
  "agent": "Zoning Authority",
  "status": "approved" | "conflict" | "needs-info",
  "summary": "One-sentence summary of your finding",
  "findings": [
    {
      "rule_id": "ZA-XXX",
      "rule_title": "string",
      "citation": "string",
      "result": "pass" | "fail" | "warning" | "info",
      "explanation": "Why this rule applies and the result",
      "cost": null or number (estimated cost if applicable)
    }
  ],
  "conflicts": [
    {
      "rule_id": "ZA-XXX",
      "description": "What the conflict is",
      "alternatives": ["Alternative 1", "Alternative 2", "Alternative 3"]
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
ZONING RULES DATABASE:
${JSON.stringify(RULES.rules, null, 2)}

BUSINESS APPLICATION:
${JSON.stringify(intakeData, null, 2)}

Evaluate this application against ALL zoning rules. Check every rule for applicability based on the business type and location details. Return your verdict as JSON.`;

  try {
    const result = await generateContent(SYSTEM_PROMPT, userPrompt);
    return {
      agent: 'Zoning Authority',
      iconKey: 'zoning',
      ...result,
    };
  } catch (error) {
    console.error('[Zoning Agent] Error:', error.message);
    return {
      agent: 'Zoning Authority',
      iconKey: 'zoning',
      status: 'error',
      summary: 'Zoning evaluation failed due to a system error.',
      findings: [],
      conflicts: [],
      requirements: [],
      error: error.message,
    };
  }
}

module.exports = { evaluate };
