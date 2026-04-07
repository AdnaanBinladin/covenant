'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCovenantStore } from '@/lib/covenant-store';
import { useAuthStore } from '@/lib/auth-store';
import { Rule } from '@/lib/types';
import { Particles } from '@/components/particles';
import { StonePillar } from '@/components/stone-pillar';
import { AddRuleModal } from '@/components/add-rule-modal';
import { ViolationModal } from '@/components/violation-modal';
import { RuleDetailModal } from '@/components/rule-detail-modal';
import { StatsDashboard } from '@/components/stats-dashboard';
import { ViolationHistory } from '@/components/violation-history';
import { RequestsPanel } from '@/components/requests-panel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ScrollText,
  Plus,
  AlertTriangle,
  BarChart3,
  History,
  Heart,
  LogOut,
  Bell,
  ShieldCheck,
} from 'lucide-react';

export default function Homepage() {
  const router = useRouter();
  const rules = useCovenantStore((state) => state.rules);
  const isRulesLoading = useCovenantStore((state) => state.isRulesLoading);
  const rulesError = useCovenantStore((state) => state.rulesError);
  const loadRules = useCovenantStore((state) => state.loadRules);
  const loadStats = useCovenantStore((state) => state.loadStats);
  const violationsError = useCovenantStore((state) => state.violationsError);
  const loadViolations = useCovenantStore((state) => state.loadViolations);
  const { user, isReady, logout, isLoading: authLoading } = useAuthStore();
  const token = useAuthStore((state) => state.token);
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [violationOpen, setViolationOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [preselectedRuleForViolation, setPreselectedRuleForViolation] =
    useState<Rule | undefined>();

  useEffect(() => {
    void useAuthStore.getState().restoreSession();
  }, []);

  useEffect(() => {
    if (isReady && !user) {
      router.replace('/login');
    }
  }, [isReady, router, user]);

  useEffect(() => {
    if (token) {
      void loadRules(token);
      void loadViolations(token);
      void loadStats(token);
    }
  }, [loadRules, loadStats, loadViolations, token]);

  const handleRuleClick = (rule: Rule) => {
    setSelectedRule(rule);
    setDetailModalOpen(true);
  };

  const handleReportViolationFromDetail = () => {
    setPreselectedRuleForViolation(selectedRule || undefined);
    setViolationOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const activeRules = rules.filter((rule) => rule.approvalStatus === 'approved');

  if (!isReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <div className="rounded-2xl border border-gold/25 bg-white/85 px-6 py-4 text-sm text-stone-700 shadow-sm backdrop-blur-sm">
          Restoring your covenant access...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.16),_transparent_34%),linear-gradient(180deg,_rgba(251,247,238,0.98),_rgba(244,238,226,1))]" />
      <div className="absolute inset-y-0 left-[-10rem] w-72 rotate-12 bg-gold/10 blur-3xl" />
      <div className="absolute bottom-[-8rem] right-[-8rem] h-80 w-80 rounded-full bg-crimson/8 blur-3xl" />
      <Particles />

      <div className="relative z-10">
        <header className="border-b border-gold/20 bg-white/72 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
            <div className="flex items-center gap-3">
              <Heart className="h-7 w-7 shrink-0 text-gold sm:h-8 sm:w-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
                  The Covenant
                </h1>
                <p className="text-xs text-stone-600 sm:text-sm">
                  Sacred promises between two hearts
                </p>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gold/25 bg-white/85 px-3 py-2 text-xs text-stone-700 shadow-sm sm:rounded-full sm:py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                <span>{user.name}</span>
                <span className="text-stone-400">·</span>
                <span className="break-all sm:break-normal">{user.email}</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                disabled={authLoading}
                className="justify-start px-0 text-stone-600 hover:text-stone-950 sm:justify-end"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">
          <Tabs defaultValue="covenants" className="space-y-6">
            <div className="flex flex-col gap-4">
              <TabsList className="grid h-auto w-full grid-cols-4 gap-1 border border-gold/20 bg-white/75 p-1 shadow-sm sm:inline-flex sm:w-auto">
                <TabsTrigger
                  value="covenants"
                  className="gap-1 px-2 text-stone-700 data-[state=active]:bg-gold data-[state=active]:text-background sm:gap-2 sm:px-3"
                >
                  <ScrollText className="h-4 w-4" />
                  <span className="text-[11px] sm:text-sm">Covenants</span>
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="gap-1 px-2 text-stone-700 data-[state=active]:bg-gold data-[state=active]:text-background sm:gap-2 sm:px-3"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-[11px] sm:text-sm">Stats</span>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="gap-1 px-2 text-stone-700 data-[state=active]:bg-gold data-[state=active]:text-background sm:gap-2 sm:px-3"
                >
                  <History className="h-4 w-4" />
                  <span className="text-[11px] sm:text-sm">History</span>
                </TabsTrigger>
                <TabsTrigger
                  value="requests"
                  className="gap-1 px-2 text-stone-700 data-[state=active]:bg-gold data-[state=active]:text-background sm:gap-2 sm:px-3"
                >
                  <Bell className="h-4 w-4" />
                  <span className="text-[11px] sm:text-sm">Requests</span>
                </TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                <Button
                  onClick={() => setViolationOpen(true)}
                  variant="outline"
                  className="h-11 border-crimson/40 bg-white/75 px-3 text-crimson shadow-sm hover:bg-crimson/10 hover:text-crimson"
                >
                  <AlertTriangle className="h-4 w-4 sm:mr-2" />
                  <span className="truncate text-xs sm:text-sm">Report Violation</span>
                </Button>
                <Button
                  onClick={() => setAddRuleOpen(true)}
                  className="h-11 bg-gold px-3 text-background shadow-sm hover:bg-gold/90"
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="truncate text-xs sm:text-sm">Add Covenant</span>
                </Button>
              </div>
            </div>

            <TabsContent value="covenants" className="space-y-6">
              {rulesError && (
                <div className="rounded-2xl border border-crimson/20 bg-white/80 px-5 py-4 text-sm text-crimson shadow-sm">
                  {rulesError}
                </div>
              )}
              {isRulesLoading && rules.length === 0 && (
                <div className="rounded-2xl border border-gold/20 bg-white/80 px-5 py-4 text-sm text-stone-600 shadow-sm">
                  Loading covenants...
                </div>
              )}
              <StonePillar rules={activeRules} onRuleClick={handleRuleClick} />
              {activeRules.length === 0 && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={() => setAddRuleOpen(true)}
                    className="bg-gold text-background hover:bg-gold/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Inscribe First Covenant
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats">
              <StatsDashboard />
            </TabsContent>

            <TabsContent value="history">
              {violationsError && (
                <div className="mb-4 rounded-2xl border border-crimson/20 bg-white/80 px-5 py-4 text-sm text-crimson shadow-sm">
                  {violationsError}
                </div>
              )}
              <ViolationHistory />
            </TabsContent>

            <TabsContent value="requests">
              <RequestsPanel />
            </TabsContent>
          </Tabs>
        </main>

        <footer className="border-t border-gold/10 py-8 text-center">
          <p className="font-serif text-sm italic text-stone-600">
            {'"'}In covenant, we find strength. In promise, we find love.{'"'}
          </p>
        </footer>
      </div>

      <AddRuleModal open={addRuleOpen} onOpenChange={setAddRuleOpen} />
      <ViolationModal
        open={violationOpen}
        onOpenChange={(open) => {
          setViolationOpen(open);
          if (!open) setPreselectedRuleForViolation(undefined);
        }}
        preselectedRule={preselectedRuleForViolation}
      />
      <RuleDetailModal
        rule={selectedRule}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onReportViolation={handleReportViolationFromDetail}
      />
    </div>
  );
}
