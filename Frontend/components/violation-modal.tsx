'use client';

import { useEffect, useState } from 'react';
import { Partner, Rule, ROMAN_NUMERALS, ViolationJudgment } from '@/lib/types';
import { useCovenantStore } from '@/lib/covenant-store';
import { useAuthStore } from '@/lib/auth-store';
import { getPartnerFromEmail, PARTNER_DETAILS } from '@/lib/partner-labels';
import { judgeViolation } from '@/lib/violation-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViolationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedRule?: Rule;
}

export function ViolationModal({ open, onOpenChange, preselectedRule }: ViolationModalProps) {
  const { rules, addViolation, getRuleById } = useCovenantStore();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [selectedRuleId, setSelectedRuleId] = useState<string>(preselectedRule?.id || '');
  const [brokenBy, setBrokenBy] = useState<Partner>('A');
  const [note, setNote] = useState('');
  const [showConsequence, setShowConsequence] = useState(false);
  const [judgment, setJudgment] = useState<ViolationJudgment | null>(null);
  const [judgmentError, setJudgmentError] = useState<string | null>(null);
  const [isJudging, setIsJudging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRule = selectedRuleId ? getRuleById(selectedRuleId) : undefined;
  const currentPartner = getPartnerFromEmail(user?.email);
  const canJudge =
    !!token &&
    !!selectedRuleId &&
    !!note.trim() &&
    !(currentPartner && brokenBy === currentPartner);
  const canRecord = judgment?.decision === 'violation';

  useEffect(() => {
    if (open) {
      setSelectedRuleId(preselectedRule?.id || '');
      return;
    }

    setSelectedRuleId(preselectedRule?.id || '');
    setBrokenBy('A');
    setNote('');
    setShowConsequence(false);
    setJudgment(null);
    setJudgmentError(null);
    setIsJudging(false);
    setIsSubmitting(false);
  }, [open, preselectedRule]);

  useEffect(() => {
    setJudgment(null);
    setJudgmentError(null);
  }, [selectedRuleId, brokenBy, note]);

  const handleJudge = async () => {
    if (!token || !selectedRuleId || !note.trim()) return;

    setJudgmentError(null);
    setJudgment(null);
    setIsJudging(true);

    try {
      const result = await judgeViolation(token, {
        ruleId: selectedRuleId,
        accusedName: PARTNER_DETAILS[brokenBy].name,
        happened: note.trim(),
      });
      setJudgment(result);
    } catch (error) {
      setJudgmentError(
        error instanceof Error ? error.message : 'Unable to get the AI judgment.'
      );
    } finally {
      setIsJudging(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRuleId || (currentPartner && brokenBy === currentPartner) || !canRecord) {
      return;
    }

    setIsSubmitting(true);
    
    // Show the consequence dramatically
    setShowConsequence(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (!token) {
      setShowConsequence(false);
      setIsSubmitting(false);
      return;
    }

    await addViolation(token, {
      ruleId: selectedRuleId,
      brokenBy,
      note:
        note ||
        judgment?.summary ||
        undefined,
    });

    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-crimson/30 bg-background/95 backdrop-blur-xl sm:max-w-lg">
        {showConsequence && selectedRule ? (
          <div className="animate-fade-in py-8 text-center">
            <div className="mb-6">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-crimson/20">
                <Gavel className="h-10 w-10 text-crimson" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-crimson">
                The Verdict
              </h2>
            </div>
            
            <p className="mb-4 text-muted-foreground">
              {PARTNER_DETAILS[brokenBy].name} has broken Covenant {ROMAN_NUMERALS[selectedRule.number - 1]}
            </p>
            
            <div className="mx-auto max-w-sm rounded-lg border border-crimson/30 bg-crimson/10 p-6">
              <p className="font-serif text-xl italic text-crimson">
                {'"'}{selectedRule.consequence}{'"'}
              </p>
            </div>
            
            <p className="mt-6 text-sm text-muted-foreground">
              This has been recorded in the sacred ledger.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 font-serif text-2xl text-crimson">
                <AlertTriangle className="h-6 w-6" />
                Report a Violation
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Record when a covenant has been broken. This is meant to foster accountability, not blame.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm text-crimson-muted">
                  Who broke the covenant?
                </Label>
                <div className="flex gap-3">
                  {(['A', 'B'] as Partner[]).map((partner) => (
                    (() => {
                      const isSelf = currentPartner === partner;
                      return (
                    <button
                      key={partner}
                      type="button"
                      onClick={() => setBrokenBy(partner)}
                      disabled={isSelf}
                      className={cn(
                        'flex-1 rounded-lg border-2 px-4 py-3 text-center transition-all',
                        isSelf && 'cursor-not-allowed opacity-45',
                        brokenBy === partner
                          ? 'border-crimson bg-crimson/20 text-crimson'
                          : 'border-stone-light bg-stone/50 text-muted-foreground hover:border-crimson/50'
                      )}
                    >
                      <span className="text-lg font-semibold">{PARTNER_DETAILS[partner].name}</span>
                      <span className="mt-1 block text-xs">
                        {isSelf ? 'You cannot report yourself' : PARTNER_DETAILS[partner].email}
                      </span>
                    </button>
                      );
                    })()
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-crimson-muted">
                  Which covenant was broken?
                </Label>
                <Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
                  <SelectTrigger className="border-crimson/30 bg-stone/50 text-foreground focus:border-crimson">
                    <SelectValue placeholder="Select a covenant..." />
                  </SelectTrigger>
                  <SelectContent className="border-crimson/30 bg-background">
                    {rules.map((rule) => (
                      <SelectItem key={rule.id} value={rule.id}>
                        <span className="flex items-center gap-2">
                          <span className="font-serif text-gold">
                            {ROMAN_NUMERALS[rule.number - 1]}
                          </span>
                          <span>{rule.title}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRule && (
                <div className="rounded-lg border border-gold/20 bg-stone/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedRule.description}
                  </p>
                  <p className="mt-2 text-xs text-crimson-muted">
                    Consequence: {selectedRule.consequence}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm text-crimson-muted">
                  What happened?
                </Label>
                <Textarea
                  placeholder="Describe exactly what happened so the AI judge can evaluate it fairly..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-20 border-crimson/30 bg-stone/50 text-foreground placeholder:text-muted-foreground focus:border-crimson"
                />
                <p className="text-xs text-muted-foreground">
                  Include what was said or done, and any context or evidence that matters.
                </p>
              </div>

              <div className="space-y-3 rounded-lg border border-gold/20 bg-stone/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg text-foreground">AI Judge</p>
                    <p className="text-sm text-muted-foreground">
                      Gemini will evaluate whether this actually breaks the covenant.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleJudge}
                    disabled={!canJudge || isJudging || isSubmitting}
                    variant="outline"
                    className="border-gold/30 bg-white/70 text-stone-900 hover:bg-gold/10"
                  >
                    {isJudging ? 'Judging...' : 'Ask AI Judge'}
                  </Button>
                </div>

                {judgmentError && (
                  <div className="rounded-lg border border-crimson/20 bg-crimson/10 px-4 py-3 text-sm text-crimson">
                    {judgmentError}
                  </div>
                )}

                {judgment && (
                  <div className="rounded-lg border border-gold/20 bg-white/70 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif text-lg text-stone-950">
                        {judgment.summary}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide',
                          judgment.decision === 'violation'
                            ? 'bg-crimson/15 text-crimson'
                            : judgment.decision === 'no_violation'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {judgment.decision.replace('_', ' ')}
                      </span>
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">
                        Confidence: {judgment.confidence}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-stone-700">
                      {judgment.reasoning}
                    </p>
                    {judgment.decision !== 'violation' && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        The violation can only be recorded when the AI judge decides this is a real covenant breach.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isJudging ||
                    !selectedRuleId ||
                    (currentPartner ? brokenBy === currentPartner : false) ||
                    !canRecord
                  }
                  className="bg-crimson text-foreground hover:bg-crimson/90"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Gavel className="h-4 w-4 animate-pulse" />
                      Recording Verdict...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Gavel className="h-4 w-4" />
                      Record Violation
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
