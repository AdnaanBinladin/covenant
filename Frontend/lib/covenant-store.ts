'use client';

import { create } from 'zustand';
import { Rule, Violation, Stats } from './types';
import {
  approveCovenantAddition,
  cancelCovenantAddition,
  cancelCovenantDeletion,
  createCovenant,
  fetchCovenants,
  requestCovenantDeletion,
} from './covenant-client';
import {
  createViolation,
  fetchViolations,
  forgiveViolationRequest,
} from './violation-client';
import { fetchStats } from './stats-client';

interface NewRuleInput {
  title: string;
  description: string;
  category: Rule['category'];
  consequence: string;
}

interface CovenantState {
  rules: Rule[];
  violations: Violation[];
  isRulesLoading: boolean;
  isViolationsLoading: boolean;
  isStatsLoading: boolean;
  rulesError: string | null;
  violationsError: string | null;
  statsError: string | null;
  stats: Stats;
  loadRules: (token: string) => Promise<void>;
  loadViolations: (token: string) => Promise<void>;
  loadStats: (token: string) => Promise<void>;
  addRule: (token: string, rule: NewRuleInput) => Promise<void>;
  approveRuleAddition: (token: string, ruleId: string) => Promise<void>;
  cancelRuleAddition: (token: string, ruleId: string) => Promise<void>;
  addViolation: (
    token: string,
    violation: Omit<Violation, 'id' | 'createdAt' | 'forgiven'>
  ) => Promise<void>;
  forgiveViolation: (token: string, violationId: string) => Promise<void>;
  requestDeletion: (token: string, ruleId: string) => Promise<void>;
  cancelDeletionRequest: (token: string, ruleId: string) => Promise<void>;
  getRuleById: (ruleId: string) => Rule | undefined;
  getStats: () => Stats;
}

export const useCovenantStore = create<CovenantState>()((set, get) => ({
  rules: [],
  violations: [],
  isRulesLoading: false,
  isViolationsLoading: false,
  isStatsLoading: false,
  rulesError: null,
  violationsError: null,
  statsError: null,
  stats: {
    totalRules: 0,
    totalViolations: 0,
    violationsByPartner: { A: 0, B: 0 },
    streakDays: 0,
    lastViolationDate: null,
  },

  loadRules: async (token) => {
    set({ isRulesLoading: true, rulesError: null });

    try {
      const rules = await fetchCovenants(token);
      set({ rules, isRulesLoading: false, rulesError: null });
    } catch (error) {
      set({
        isRulesLoading: false,
        rulesError:
          error instanceof Error ? error.message : 'Unable to load covenants.',
      });
    }
  },

  loadViolations: async (token) => {
    set({ isViolationsLoading: true, violationsError: null });

    try {
      const violations = await fetchViolations(token);
      set({ violations, isViolationsLoading: false, violationsError: null });
    } catch (error) {
      set({
        isViolationsLoading: false,
        violationsError:
          error instanceof Error ? error.message : 'Unable to load violations.',
      });
    }
  },

  loadStats: async (token) => {
    set({ isStatsLoading: true, statsError: null });

    try {
      const stats = await fetchStats(token);
      set({ stats, isStatsLoading: false, statsError: null });
    } catch (error) {
      set({
        isStatsLoading: false,
        statsError: error instanceof Error ? error.message : 'Unable to load stats.',
      });
    }
  },

  addRule: async (token, ruleData) => {
    await createCovenant(token, ruleData);
    const [rules, stats] = await Promise.all([fetchCovenants(token), fetchStats(token)]);
    set({
      rules,
      stats,
      rulesError: null,
      statsError: null,
    });
  },

  approveRuleAddition: async (token, ruleId) => {
    await approveCovenantAddition(token, ruleId);
    const [rules, stats] = await Promise.all([fetchCovenants(token), fetchStats(token)]);
    set({
      rules,
      stats,
      rulesError: null,
      statsError: null,
    });
  },

  cancelRuleAddition: async (token, ruleId) => {
    await cancelCovenantAddition(token, ruleId);
    const [rules, stats] = await Promise.all([fetchCovenants(token), fetchStats(token)]);
    set({
      rules,
      stats,
      rulesError: null,
      statsError: null,
    });
  },

  addViolation: async (token, violationData) => {
    const violation = await createViolation(token, violationData);
    set((state) => ({
      violations: [violation, ...state.violations].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      rules: state.rules.map((rule) =>
        rule.id === violation.ruleId ? { ...rule, status: 'broken' as const } : rule
      ),
      violationsError: null,
      stats: {
        ...state.stats,
        totalViolations: state.stats.totalViolations + 1,
        violationsByPartner: {
          ...state.stats.violationsByPartner,
          [violation.brokenBy]:
            state.stats.violationsByPartner[violation.brokenBy] + 1,
        },
        streakDays: 0,
        lastViolationDate: violation.createdAt,
      },
    }));
  },

  forgiveViolation: async (token, violationId) => {
    const updatedViolation = await forgiveViolationRequest(token, violationId);

    set((state) => {
      const updatedViolations = state.violations.map((violation) =>
        violation.id === violationId ? updatedViolation : violation
      );

      const hasUnforgivenViolations = updatedViolations.some(
        (violation) =>
          violation.ruleId === updatedViolation.ruleId && !violation.forgiven
      );

      return {
        violations: updatedViolations,
        rules: state.rules.map((rule) =>
          rule.id === updatedViolation.ruleId
            ? { ...rule, status: hasUnforgivenViolations ? 'broken' : 'active' }
            : rule
        ),
      };
    });
  },

  requestDeletion: async (token, ruleId) => {
    await requestCovenantDeletion(token, ruleId);
    const [rules, stats] = await Promise.all([fetchCovenants(token), fetchStats(token)]);
    set({
      rules,
      stats,
      rulesError: null,
      statsError: null,
    });
  },

  cancelDeletionRequest: async (token, ruleId) => {
    await cancelCovenantDeletion(token, ruleId);
    const [rules, stats] = await Promise.all([fetchCovenants(token), fetchStats(token)]);
    set({
      rules,
      stats,
      rulesError: null,
      statsError: null,
    });
  },

  getRuleById: (ruleId) => get().rules.find((rule) => rule.id === ruleId),

  getStats: () => get().stats,
}));
