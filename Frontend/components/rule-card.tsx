'use client';

import { Rule, ROMAN_NUMERALS, CATEGORIES } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface RuleCardProps {
  rule: Rule;
  onClick?: () => void;
  showConsequence?: boolean;
}

export function RuleCard({ rule, onClick, showConsequence = false }: RuleCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const category = CATEGORIES.find((c) => c.value === rule.category);
  const romanNumeral = ROMAN_NUMERALS[rule.number - 1] || rule.number.toString();

  const handleClick = () => {
    if (rule.status === 'broken') {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg border p-6 transition-all duration-300',
        'bg-card/50 backdrop-blur-sm hover:bg-card/80',
        rule.status === 'active'
          ? 'border-gold/30 hover:border-gold/60 animate-glow-gold'
          : 'border-crimson/50 hover:border-crimson animate-glow-crimson',
        isAnimating && 'animate-shake'
      )}
    >
      {/* Decorative corner elements */}
      <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-gold/40" />
      <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-gold/40" />

      {/* Status indicator */}
      <div className="absolute right-4 top-4">
        {rule.status === 'active' ? (
          <Shield className="h-5 w-5 text-gold" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-crimson" />
        )}
      </div>

      {/* Roman numeral */}
      <div className="mb-4">
        <span className="font-serif text-4xl font-bold text-gold">{romanNumeral}</span>
      </div>

      {/* Title */}
      <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">
        {rule.title}
      </h3>

      {/* Description */}
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {rule.description}
      </p>

      {/* Category badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
            'bg-stone-light/50 text-gold-muted'
          )}
        >
          <span>{category?.icon}</span>
          <span>{category?.label}</span>
        </span>
      </div>

      {/* Consequence (shown on hover or when explicitly requested) */}
      {showConsequence && (
        <div className="mt-4 border-t border-gold/20 pt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Consequence
          </p>
          <p className="mt-1 font-serif text-sm italic text-crimson-muted">
            {'"'}{rule.consequence}{'"'}
          </p>
        </div>
      )}

      {/* Hover effect */}
      <div
        className={cn(
          'absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          rule.status === 'active'
            ? 'bg-gold/5'
            : 'bg-crimson/5'
        )}
      />

      {/* Date created */}
      <p className="mt-4 text-xs text-muted-foreground">
        Sworn on {new Date(rule.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  );
}
