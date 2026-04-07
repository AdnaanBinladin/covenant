import { Stats } from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface StatsPayload {
  totalRules: number;
  totalViolations: number;
  violationsByPartner: {
    A: number;
    B: number;
  };
  streakDays: number;
  lastViolationDate: string | null;
}

function toStats(payload: StatsPayload): Stats {
  return {
    ...payload,
    lastViolationDate: payload.lastViolationDate
      ? new Date(payload.lastViolationDate)
      : null,
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

export async function fetchStats(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await parseJson<{ stats: StatsPayload }>(response);
  return toStats(payload.stats);
}
