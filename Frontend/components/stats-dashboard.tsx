'use client';

import { useCovenantStore } from '@/lib/covenant-store';
import { PARTNER_DETAILS } from '@/lib/partner-labels';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, Flame, Trophy, User } from 'lucide-react';

export function StatsDashboard() {
  const getStats = useCovenantStore((state) => state.getStats);
  const isStatsLoading = useCovenantStore((state) => state.isStatsLoading);
  const statsError = useCovenantStore((state) => state.statsError);
  const stats = getStats();

  if (statsError) {
    return (
      <div className="rounded-2xl border border-crimson/20 bg-white/80 px-5 py-4 text-sm text-crimson shadow-sm">
        {statsError}
      </div>
    );
  }

  if (isStatsLoading) {
    return (
      <div className="rounded-2xl border border-gold/20 bg-white/80 px-5 py-4 text-sm text-stone-600 shadow-sm">
        Loading stats...
      </div>
    );
  }

  const cards = [
    {
      label: 'Sacred Covenants',
      value: stats.totalRules,
      icon: Shield,
      color: 'gold',
    },
    {
      label: 'Total Violations',
      value: stats.totalViolations,
      icon: AlertTriangle,
      color: 'crimson',
    },
    {
      label: 'Current Streak',
      value: `${stats.streakDays} days`,
      icon: Flame,
      color: 'gold',
    },
  ];

  const partnerAPercentage =
    stats.totalViolations > 0
      ? Math.round((stats.violationsByPartner.A / stats.totalViolations) * 100)
      : 50;
  const partnerBPercentage = 100 - partnerAPercentage;

  return (
    <div className="space-y-6">
      {/* Main stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn(
              'group relative overflow-hidden rounded-lg border p-6 transition-all',
              'bg-card/50 backdrop-blur-sm',
              card.color === 'gold'
                ? 'border-gold/30 hover:border-gold/60'
                : 'border-crimson/30 hover:border-crimson/60'
            )}
          >
            {/* Decorative corner */}
            <div
              className={cn(
                'absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-20',
                card.color === 'gold' ? 'bg-gold' : 'bg-crimson'
              )}
            />
            
            <card.icon
              className={cn(
                'mb-3 h-6 w-6',
                card.color === 'gold' ? 'text-gold' : 'text-crimson'
              )}
            />
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p
              className={cn(
                'mt-1 font-serif text-3xl font-bold',
                card.color === 'gold' ? 'text-gold' : 'text-crimson'
              )}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Partner comparison */}
      <div className="rounded-lg border border-gold/30 bg-card/50 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg text-gold">Accountability Balance</h3>
          <Trophy className="h-5 w-5 text-gold" />
        </div>

        <div className="space-y-4">
          {/* Visual bar */}
          <div className="relative h-8 overflow-hidden rounded-full bg-stone">
            <div
              className="absolute left-0 top-0 h-full bg-gold/60 transition-all duration-500"
              style={{ width: `${partnerAPercentage}%` }}
            />
            <div
              className="absolute right-0 top-0 h-full bg-crimson/60 transition-all duration-500"
              style={{ width: `${partnerBPercentage}%` }}
            />
            {/* Divider */}
            <div
              className="absolute top-0 h-full w-1 bg-background"
              style={{ left: `${partnerAPercentage}%`, transform: 'translateX(-50%)' }}
            />
          </div>

          {/* Labels */}
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20">
                <User className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="font-semibold text-gold">{PARTNER_DETAILS.A.name}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.violationsByPartner.A} violations ({partnerAPercentage}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <p className="text-right font-semibold text-crimson">{PARTNER_DETAILS.B.name}</p>
                <p className="text-right text-xs text-muted-foreground">
                  {stats.violationsByPartner.B} violations ({partnerBPercentage}%)
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-crimson/20">
                <User className="h-4 w-4 text-crimson" />
              </div>
            </div>
          </div>

          {/* Fun message */}
          <p className="text-center text-xs italic text-muted-foreground">
            {partnerAPercentage === partnerBPercentage
              ? "Perfectly balanced, as all things should be."
              : partnerAPercentage > partnerBPercentage
                ? `${PARTNER_DETAILS.A.name}, time for some reflection...`
                : `${PARTNER_DETAILS.B.name}, the scales are tipping...`}
          </p>
        </div>
      </div>

      {/* Streak celebration */}
      {stats.streakDays >= 7 && (
        <div className="animate-glow-gold rounded-lg border border-gold/50 bg-gold/10 p-4 text-center">
          <Flame className="mx-auto mb-2 h-8 w-8 text-gold" />
          <p className="font-serif text-lg text-gold">
            {stats.streakDays} Day Streak!
          </p>
          <p className="text-sm text-gold-muted">
            Your commitment to each other is inspiring.
          </p>
        </div>
      )}
    </div>
  );
}
