import { Violation, Partner } from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface ViolationPayload {
  id: string;
  ruleId: string;
  brokenBy: Partner;
  note?: string;
  forgiven: boolean;
  createdAt: string;
}

function toViolation(payload: ViolationPayload): Violation {
  return {
    ...payload,
    createdAt: new Date(payload.createdAt),
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json();

  if (!response.ok) {
    const message =
      typeof payload?.error === 'string' ? payload.error : 'Request failed.';
    throw new Error(message);
  }

  return payload as T;
}

export async function fetchViolations(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/violations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await parseJson<{ violations: ViolationPayload[] }>(response);
  return payload.violations.map(toViolation);
}

export async function createViolation(
  token: string,
  violation: {
    ruleId: string;
    brokenBy: Partner;
    note?: string;
  }
) {
  const response = await fetch(`${API_BASE_URL}/api/violations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(violation),
  });

  const payload = await parseJson<{ violation: ViolationPayload }>(response);
  return toViolation(payload.violation);
}

export async function forgiveViolationRequest(token: string, violationId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/violations/${violationId}/forgive`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const payload = await parseJson<{ violation: ViolationPayload }>(response);
  return toViolation(payload.violation);
}
