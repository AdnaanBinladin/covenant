'use client';

import { useState } from 'react';
import { Partner, Rule, ROMAN_NUMERALS } from '@/lib/types';
import { useCovenantStore } from '@/lib/covenant-store';
import { useAuthStore } from '@/lib/auth-store';
import { getPartnerFromEmail, PARTNER_DETAILS } from '@/lib/partner-labels';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRule = selectedRuleId ? getRuleById(selectedRuleId) : undefined;
  const currentPartner = getPartnerFromEmail(user?.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRuleId || (currentPartner && brokenBy === currentPartner)) return;

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
      note: note || undefined,
    });

    // Reset form
    setSelectedRuleId('');
    setBrokenBy('A');
    setNote('');
    setShowConsequence(false);
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
                  What happened? (optional)
                </Label>
                <Textarea
                  placeholder="Briefly describe the circumstances..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-20 border-crimson/30 bg-stone/50 text-foreground placeholder:text-muted-foreground focus:border-crimson"
                />
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
                  disabled={isSubmitting || !selectedRuleId || (currentPartner ? brokenBy === currentPartner : false)}
                  className="bg-crimson text-foreground hover:bg-crimson/90"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Gavel className="h-4 w-4 animate-pulse" />
                      Delivering Verdict...
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
