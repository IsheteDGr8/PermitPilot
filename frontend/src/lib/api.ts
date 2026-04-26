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
 * Fetch past applications.
 */
export async function getApplications(userId?: string) {
  const url = userId ? `${API_BASE}/applications?user_id=${userId}` : `${API_BASE}/applications`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch applications');
  return res.json();
}

/**
 * Delete a past application.
 */
export async function deleteApplication(appId: string, userId: string) {
  const res = await fetch(`${API_BASE}/applications/${appId}?user_id=${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete application');
  return res.json();
}
