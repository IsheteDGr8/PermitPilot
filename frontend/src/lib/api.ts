import type { IntakeData, EvaluationResponse } from './types';

const API_BASE = '/api';

/**
 * Submit business intake data for multi-agent evaluation.
 */
export async function evaluatePermit(intakeData: IntakeData): Promise<EvaluationResponse> {
  const res = await fetch(`${API_BASE}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(intakeData),
  });

  if (!res.ok) {
    throw new Error(`Evaluation failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Check API health.
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

/**
 * Fetch past applications (admin).
 */
export async function getApplications() {
  const res = await fetch(`${API_BASE}/applications`);
  return res.json();
}
