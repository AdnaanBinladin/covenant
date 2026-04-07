import { AuthSession } from './auth-types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json();

  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : 'Request failed.';
    throw new Error(message);
  }

  return payload as T;
}

export async function loginRequest(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return parseJson<AuthSession>(response);
}

export async function getSessionRequest(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJson<AuthSession>(response);
}

export async function logoutRequest(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJson<{ success: boolean }>(response);
}
