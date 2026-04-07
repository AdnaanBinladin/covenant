export type Partner = 'A' | 'B';

export type RuleCategory = 'communication' | 'trust' | 'respect' | 'affection' | 'growth' | 'boundaries';

export type RuleStatus = 'active' | 'broken';
export type RuleApprovalStatus = 'pending' | 'approved';

export interface Rule {
  id: string;
  number: number;
  title: string;
  description: string;
  category: RuleCategory;
  consequence: string;
  createdBy: string;
  createdAt: Date;
  status: RuleStatus;
  approvalStatus: RuleApprovalStatus;
  approvalConfirmedBy: string[];
  lockedForDeletion: boolean;
  deletionConfirmedBy: string[];
}

export interface Violation {
  id: string;
  ruleId: string;
  brokenBy: Partner;
  note?: string;
  forgiven: boolean;
  createdAt: Date;
}

export interface Stats {
  totalRules: number;
  totalViolations: number;
  violationsByPartner: {
    A: number;
    B: number;
  };
  streakDays: number;
  lastViolationDate: Date | null;
}

export const CATEGORIES: { value: RuleCategory; label: string; icon: string }[] = [
  { value: 'communication', label: 'Communication', icon: '💬' },
  { value: 'trust', label: 'Trust', icon: '🤝' },
  { value: 'respect', label: 'Respect', icon: '👑' },
  { value: 'affection', label: 'Affection', icon: '💕' },
  { value: 'growth', label: 'Growth', icon: '🌱' },
  { value: 'boundaries', label: 'Boundaries', icon: '🛡️' },
];

export const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
