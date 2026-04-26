const fs = require('fs');
const path = require('path');
const { generateContent } = require('../utils/gemini');

const RULES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'business_code.json'), 'utf-8')
);

const SYSTEM_PROMPT = `You are the Business Licensing Agent for PermitPilot. You are an expert in business licenses, insurance requirements, tax registration, workers' compensation, and trade name registration.

Your job is to evaluate a business permit application against the licensing rules provided and return a structured verdict.

RULES:
- Be precise. Cite specific rule IDs and regulatory code sections.
- If a rule is violated, status must be "conflict".
- If all rules pass, status must be "approved".
- If you need more info, status must be "needs-info".
- Always calculate total estimated licensing costs.
- Consider business type, employee count, and whether they sell alcohol or food.

You MUST return valid JSON matching this exact schema:
{
  "agent": "Business Licensing",
  "status": "approved" | "conflict" | "needs-info",
  "summary": "One-sentence summary of your finding",
  "findings": [
    {
      "rule_id": "LIC-XXX",
      "rule_title": "string",
      "citation": "string",
      "result": "pass" | "fail" | "warning" | "info",
      "explanation": "Why this rule applies and the result",
      "cost": null or number
    }
  ],
  "conflicts": [
    {
      "rule_id": "LIC-XXX",
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
BUSINESS LICENSING RULES DATABASE:
${JSON.stringify(RULES.rules, null, 2)}

BUSINESS APPLICATION:
${JSON.stringify(intakeData, null, 2)}

Evaluate this application against ALL licensing rules. Calculate the total estimated licensing cost. Consider the business structure, employee count, and service type. Return your verdict as JSON.`;

  try {
    const result = await generateContent(SYSTEM_PROMPT, userPrompt);
    return {
      agent: 'Business Licensing',
      iconKey: 'licensing',
      ...result,
    };
  } catch (error) {
    console.error('[Licensing Agent] Error:', error.message);
    return {
      agent: 'Business Licensing',
      iconKey: 'licensing',
      status: 'error',
      summary: 'Licensing evaluation failed due to a system error.',
      findings: [],
      conflicts: [],
      requirements: [],
      error: error.message,
    };
  }
}

module.exports = { evaluate };
