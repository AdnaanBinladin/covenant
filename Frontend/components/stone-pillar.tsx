'use client';

import { Rule, ROMAN_NUMERALS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface StonePillarProps {
  rules: Rule[];
  onRuleClick?: (rule: Rule) => void;
}

export function StonePillar({ rules, onRuleClick }: StonePillarProps) {
  return (
    <div className="relative mx-auto max-w-3xl">
      {/* Stone pillar container */}
      <div className="stone-inset relative overflow-hidden rounded-[1.75rem] border border-gold/25 bg-[linear-gradient(180deg,rgba(255,251,243,0.96),rgba(242,234,220,0.94))] shadow-[0_24px_60px_rgba(146,122,69,0.14)]">
        {/* Stone texture overlay */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Top decorative molding */}
        <div className="relative">
          <div className="h-3 bg-[#efe4d1]" style={{ boxShadow: 'inset 0 -2px 4px rgba(146,122,69,0.12)' }} />
          <div className="h-1 bg-gold/30" />
          <div className="h-2 bg-[#f7efe2]" style={{ boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.7)' }} />
        </div>
        
        {/* Pillar header */}
        <div className="relative border-b border-gold/20 px-8 py-8 text-center">
          <h2 className="carved-text font-serif text-2xl font-bold uppercase tracking-[0.4em] text-gold/90">
            The Sacred Laws
          </h2>
          <div className="mx-auto mt-3 flex items-center justify-center gap-2">
            <div className="h-px w-16 bg-gold/30" />
            <div className="h-1.5 w-1.5 rotate-45 bg-gold/50" />
            <div className="h-px w-16 bg-gold/30" />
          </div>
        </div>

        {/* Rules carved into stone */}
        <div className="relative">
          {rules.map((rule, index) => {
            const romanNumeral = ROMAN_NUMERALS[rule.number - 1] || rule.number.toString();
            const isBroken = rule.status === 'broken';
            
            return (
              <div
                key={rule.id}
                onClick={() => onRuleClick?.(rule)}
                className={cn(
                  'group relative cursor-pointer transition-all duration-300',
                  'hover:bg-gold/[0.05]',
                  isBroken && 'bg-crimson/[0.06]'
                )}
              >
                {/* Top groove line */}
                <div 
                  className="h-px bg-gold/20"
                  style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.55)' }}
                />
                
                {/* Rule content */}
                <div className="flex items-start gap-6 px-8 py-5">
                  {/* Roman numeral - deeply carved */}
                  <div className="flex-shrink-0 pt-0.5">
                    <span 
                      className={cn(
                        'carved-text font-serif text-4xl font-bold',
                        isBroken ? 'text-crimson/60' : 'text-gold/70'
                      )}
                    >
                      {romanNumeral}
                    </span>
                  </div>
                  
                  {/* Rule text - etched into stone */}
                  <div className="flex-1 min-w-0">
                    <h3 
                      className={cn(
                        'carved-text font-serif text-lg font-semibold uppercase tracking-wider',
                        isBroken ? 'text-crimson/80' : 'text-stone-900'
                      )}
                    >
                      {rule.title}
                    </h3>
                    <p className="carved-text mt-2 text-sm leading-relaxed text-stone-600">
                      {rule.description}
                    </p>
                    
                    {/* Consequence revealed on hover */}
                    <div className="mt-3 max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-20 group-hover:opacity-100">
                      <p className="carved-text font-serif text-xs italic text-crimson-muted/80">
                        Penalty: {'"'}{rule.consequence}{'"'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Broken indicator */}
                  <div className="flex-shrink-0 pt-1">
                    {isBroken && (
                      <div className="relative">
                        <AlertTriangle className="h-5 w-5 text-crimson/70" />
                        <div className="absolute inset-0 animate-ping">
                          <AlertTriangle className="h-5 w-5 text-crimson/30" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Final groove line */}
          {rules.length > 0 && (
            <div 
              className="h-px bg-gold/20"
              style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.55)' }}
            />
          )}
        </div>

        {/* Empty state */}
        {rules.length === 0 && (
          <div className="px-8 py-20 text-center">
            <p className="carved-text font-serif text-xl italic text-stone-500">
              No laws have been inscribed...
            </p>
            <p className="carved-text mt-3 text-sm text-stone-400">
              The stone awaits your first covenant
            </p>
          </div>
        )}

        {/* Bottom decorative molding */}
        <div className="relative">
          <div className="h-2 bg-[#f7efe2]" style={{ boxShadow: 'inset 0 -2px 4px rgba(255,255,255,0.7)' }} />
          <div className="h-1 bg-gold/30" />
          <div className="h-3 bg-[#efe4d1]" style={{ boxShadow: 'inset 0 2px 4px rgba(146,122,69,0.12)' }} />
        </div>
      </div>
      
      {/* Shadow beneath pillar */}
      <div className="mx-auto mt-2 h-6 w-[95%] rounded-b-full bg-[rgba(146,122,69,0.14)] blur-md" />
    </div>
  );
}
