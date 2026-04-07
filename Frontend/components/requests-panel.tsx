'use client';

import { useMemo } from 'react';
import { useCovenantStore } from '@/lib/covenant-store';
import { useAuthStore } from '@/lib/auth-store';
import { ROMAN_NUMERALS, Rule } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Check, Clock3, Trash2, X } from 'lucide-react';

function RequestCard({
  title,
  subtitle,
  body,
  primaryActionLabel,
  onPrimaryAction,
  primaryDisabled,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryDisabled,
  destructiveSecondary,
}: {
  title: string;
  subtitle: string;
  body: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryDisabled?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryDisabled?: boolean;
  destructiveSecondary?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-white/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-muted">{subtitle}</p>
          <h3 className="font-serif text-xl text-stone-950">{title}</h3>
          <p className="text-sm text-stone-600">{body}</p>
        </div>
        <Clock3 className="mt-1 h-5 w-5 text-gold" />
      </div>
      {(primaryActionLabel && onPrimaryAction) || (secondaryActionLabel && onSecondaryAction) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {primaryActionLabel && onPrimaryAction && (
            <Button
              onClick={onPrimaryAction}
              disabled={primaryDisabled}
              className="bg-gold text-background hover:bg-gold/90"
            >
              <Check className="mr-2 h-4 w-4" />
              {primaryActionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              onClick={onSecondaryAction}
              disabled={secondaryDisabled}
              variant={destructiveSecondary ? 'outline' : 'ghost'}
              className={
                destructiveSecondary
                  ? 'border-crimson/40 text-crimson hover:bg-crimson/10 hover:text-crimson'
                  : 'text-stone-600 hover:text-stone-950'
              }
            >
              <X className="mr-2 h-4 w-4" />
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function RequestsPanel() {
  const rules = useCovenantStore((state) => state.rules);
  const approveRuleAddition = useCovenantStore((state) => state.approveRuleAddition);
  const cancelRuleAddition = useCovenantStore((state) => state.cancelRuleAddition);
  const requestDeletion = useCovenantStore((state) => state.requestDeletion);
  const cancelDeletionRequest = useCovenantStore((state) => state.cancelDeletionRequest);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const { pendingAdditions, pendingDeletions } = useMemo(() => {
    const additions = rules.filter((rule) => rule.approvalStatus === 'pending');
    const deletions = rules.filter(
      (rule) => rule.approvalStatus === 'approved' && rule.deletionConfirmedBy.length > 0
    );

    return {
      pendingAdditions: additions,
      pendingDeletions: deletions,
    };
  }, [rules, user]);

  const handleApproveAddition = async (rule: Rule) => {
    if (!token) return;
    await approveRuleAddition(token, rule.id);
  };

  const handleCancelAddition = async (rule: Rule) => {
    if (!token) return;
    await cancelRuleAddition(token, rule.id);
  };

  const handleApproveDeletion = async (rule: Rule) => {
    if (!token) return;
    await requestDeletion(token, rule.id);
  };

  const handleCancelDeletion = async (rule: Rule) => {
    if (!token) return;
    await cancelDeletionRequest(token, rule.id);
  };

  if (pendingAdditions.length === 0 && pendingDeletions.length === 0) {
    return (
      <div className="rounded-2xl border border-gold/20 bg-white/80 p-8 text-center shadow-sm">
        <h3 className="font-serif text-xl text-stone-950">No Pending Requests</h3>
        <p className="mt-2 text-sm text-stone-600">
          Addition and deletion requests will appear here for review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pendingAdditions.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-serif text-xl text-stone-950">Pending Addition Requests</h3>
          {pendingAdditions.map((rule) => {
            const createdByCurrentUser = !!user && rule.createdBy === user.id;
            const userAlreadyApproved = !!user && rule.approvalConfirmedBy.includes(user.id);
            return (
              <RequestCard
                key={rule.id}
                title={`${ROMAN_NUMERALS[rule.number - 1] || rule.number}. ${rule.title}`}
                subtitle="Addition Request"
                body={rule.description}
                primaryActionLabel={
                  createdByCurrentUser || userAlreadyApproved
                    ? 'Awaiting Partner Response'
                    : 'Approve Addition'
                }
                onPrimaryAction={
                  createdByCurrentUser ? undefined : () => handleApproveAddition(rule)
                }
                primaryDisabled={createdByCurrentUser || userAlreadyApproved}
                secondaryActionLabel={
                  createdByCurrentUser ? 'Cancel Request' : 'Decline Request'
                }
                onSecondaryAction={() => handleCancelAddition(rule)}
                destructiveSecondary
              />
            );
          })}
        </section>
      )}

      {pendingDeletions.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-serif text-xl text-stone-950">Pending Deletion Requests</h3>
          {pendingDeletions.map((rule) => {
            const userAlreadyApproved = !!user && rule.deletionConfirmedBy.includes(user.id);
            return (
              <div
                key={rule.id}
                className="rounded-2xl border border-crimson/20 bg-white/80 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-crimson-muted">
                      Deletion Request
                    </p>
                    <h3 className="font-serif text-xl text-stone-950">
                      {ROMAN_NUMERALS[rule.number - 1] || rule.number}. {rule.title}
                    </h3>
                    <p className="text-sm text-stone-600">{rule.description}</p>
                  </div>
                  <Trash2 className="mt-1 h-5 w-5 text-crimson" />
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleApproveDeletion(rule)}
                      disabled={userAlreadyApproved}
                      variant="outline"
                      className="border-crimson/40 text-crimson hover:bg-crimson/10 hover:text-crimson"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {userAlreadyApproved ? 'Awaiting Another User' : 'Approve Deletion'}
                    </Button>
                    <Button
                      onClick={() => handleCancelDeletion(rule)}
                      variant="ghost"
                      className="text-stone-600 hover:text-stone-950"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel Request
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
