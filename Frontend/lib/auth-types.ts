export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthSession {
  token: string;
  expiresAt: number;
  user: AuthUser;
}
