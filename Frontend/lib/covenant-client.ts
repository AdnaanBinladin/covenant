import { Rule, RuleCategory } from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface RulePayload {
  id: string;
  number: number;
  title: string;
  description: string;
  category: RuleCategory;
  consequence: string;
  createdBy: string;
  status: 'active' | 'broken';
  approvalStatus: 'pending' | 'approved';
  approvalConfirmedBy: string[];
  lockedForDeletion: boolean;
  deletionConfirmedBy: string[];
  createdAt: string;
}

function toRule(payload: RulePayload): Rule {
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

export async function fetchCovenants(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/covenants`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await parseJson<{ rules: RulePayload[] }>(response);
  return payload.rules.map(toRule);
}

export async function createCovenant(
  token: string,
  rule: {
    title: string;
    description: string;
    category: RuleCategory;
    consequence: string;
  }
) {
  const response = await fetch(`${API_BASE_URL}/api/covenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(rule),
  });

  const payload = await parseJson<{ rule: RulePayload }>(response);
  return toRule(payload.rule);
}

export async function requestCovenantDeletion(token: string, ruleId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/covenants/${ruleId}/delete-request`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const payload = await parseJson<{
    deleted: boolean;
    ruleId?: string;
    rule?: RulePayload;
  }>(response);

  return {
    deleted: payload.deleted,
    ruleId: payload.ruleId,
    rule: payload.rule ? toRule(payload.rule) : undefined,
  };
}

export async function approveCovenantAddition(token: string, ruleId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/covenants/${ruleId}/approve-addition`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const payload = await parseJson<{ rule: RulePayload }>(response);
  return toRule(payload.rule);
}

export async function cancelCovenantAddition(token: string, ruleId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/covenants/${ruleId}/cancel-addition`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return parseJson<{ deleted: boolean; ruleId: string }>(response);
}

export async function cancelCovenantDeletion(token: string, ruleId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/covenants/${ruleId}/cancel-deletion`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const payload = await parseJson<{ rule: RulePayload }>(response);
  return toRule(payload.rule);
}
