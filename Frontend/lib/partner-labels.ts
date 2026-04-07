import { Partner } from './types';

export const PARTNER_DETAILS: Record<
  Partner,
  { name: string; email: string }
> = {
  A: {
    name: 'Adnaan',
    email: 'adaubdool@gmail.com',
  },
  B: {
    name: 'Hibah',
    email: 'hibah0403@gmail.com',
  },
};

export function getPartnerFromEmail(email: string | null | undefined): Partner | null {
  const normalized = (email || '').trim().toLowerCase();

  for (const [partner, details] of Object.entries(PARTNER_DETAILS) as Array<
    [Partner, { name: string; email: string }]
  >) {
    if (details.email.toLowerCase() === normalized) {
      return partner;
    }
  }

  return null;
}
