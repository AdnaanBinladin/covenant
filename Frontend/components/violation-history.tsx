'use client';

import { useCovenantStore } from '@/lib/covenant-store';
import { useAuthStore } from '@/lib/auth-store';
import { ROMAN_NUMERALS } from '@/lib/types';
import { PARTNER_DETAILS } from '@/lib/partner-labels';
import { cn } from '@/lib/utils';
import { Heart, AlertTriangle, Check, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ViolationHistory() {
  const { violations, rules, forgiveViolation } = useCovenantStore();
  const token = useAuthStore((state) => state.token);

  const sortedViolations = [...violations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getRule = (ruleId: string) => rules.find((r) => r.id === ruleId);

  if (sortedViolations.length === 0) {
    return (
      <div className="rounded-lg border border-gold/30 bg-card/50 p-8 text-center backdrop-blur-sm">
        <Heart className="mx-auto mb-4 h-12 w-12 text-gold" />
        <h3 className="font-serif text-xl text-gold">No Violations Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your covenant remains unbroken. Keep cherishing each other.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-xl text-gold">The Sacred Ledger</h3>
      <p className="text-sm text-muted-foreground">
        A record of transgressions and forgiveness.
      </p>

      <div className="relative space-y-4 pl-4 sm:pl-6">
        {/* Timeline line */}
        <div className="absolute bottom-0 left-2 top-0 w-px bg-gold/30" />

        {sortedViolations.map((violation, index) => {
          const rule = getRule(violation.ruleId);
          if (!rule) return null;

          return (
            <div
              key={violation.id}
              className={cn(
                'animate-fade-in relative rounded-lg border p-4 transition-all sm:p-4',
                'bg-card/50 backdrop-blur-sm',
                violation.forgiven
                  ? 'border-gold/30'
                  : 'border-crimson/30'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Timeline dot */}
              <div
                className={cn(
                  'absolute -left-4 top-4 flex h-4 w-4 items-center justify-center rounded-full sm:-left-6',
                  violation.forgiven
                    ? 'bg-gold'
                    : 'bg-crimson'
                )}
              >
                {violation.forgiven ? (
                  <Check className="h-2.5 w-2.5 text-background" />
                ) : (
                  <AlertTriangle className="h-2.5 w-2.5 text-background" />
                )}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full',
                        violation.brokenBy === 'A'
                          ? 'bg-gold/20 text-gold'
                          : 'bg-crimson/20 text-crimson'
                      )}
                    >
                      <User className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {PARTNER_DETAILS[violation.brokenBy].name}
                    </span>
                    <span className="text-xs text-muted-foreground">broke</span>
                    <span className="font-serif text-sm text-gold sm:text-base">
                      {ROMAN_NUMERALS[rule.number - 1]}. {rule.title}
                    </span>
                  </div>

                  {/* Note */}
                  {violation.note && (
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      {'"'}{violation.note}{'"'}
                    </p>
                  )}

                  {/* Date */}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(violation.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  {/* Status */}
                  {violation.forgiven && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gold">
                      <Heart className="h-3 w-3" />
                      <span>Forgiven</span>
                    </div>
                  )}
                </div>

                {/* Forgive button */}
                {!violation.forgiven && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => token && forgiveViolation(token, violation.id)}
                    className="self-start text-gold hover:bg-gold/10 hover:text-gold"
                  >
                    <Heart className="mr-1 h-4 w-4" />
                    Forgive
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
