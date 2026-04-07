'use client';

import { Rule, ROMAN_NUMERALS, CATEGORIES } from '@/lib/types';
import { useCovenantStore } from '@/lib/covenant-store';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, AlertTriangle, Trash2, Lock, Unlock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface RuleDetailModalProps {
  rule: Rule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportViolation: () => void;
}

export function RuleDetailModal({
  rule,
  open,
  onOpenChange,
  onReportViolation,
}: RuleDetailModalProps) {
  const requestDeletion = useCovenantStore((state) => state.requestDeletion);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!rule) return null;

  const category = CATEGORIES.find((c) => c.value === rule.category);
  const romanNumeral = ROMAN_NUMERALS[rule.number - 1] || rule.number.toString();
  const currentUserConfirmed = !!user && rule.deletionConfirmedBy.includes(user.id);
  const otherUserConfirmed = rule.deletionConfirmedBy.length > 0 && !currentUserConfirmed;
  const isPendingAddition = rule.approvalStatus === 'pending';

  const handleRequestDeletion = async () => {
    if (!token) return;

    await requestDeletion(token, rule.id);
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gold/30 bg-background/95 backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-serif text-3xl text-gold">
            <span>{romanNumeral}</span>
            <span className="h-px flex-1 bg-gold/30" />
            {rule.status === 'active' ? (
              <Shield className="h-6 w-6 text-gold" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-crimson" />
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Details for covenant {romanNumeral}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Title and description */}
          <div>
            <h3 className="font-serif text-2xl text-foreground">{rule.title}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              {rule.description}
            </p>
          </div>

          {/* Category */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
                'bg-stone-light/50 text-gold-muted'
              )}
            >
              <span>{category?.icon}</span>
              <span>{category?.label}</span>
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                isPendingAddition
                  ? 'bg-amber-100 text-amber-700'
                  : rule.status === 'active'
                  ? 'bg-gold/20 text-gold'
                  : 'bg-crimson/20 text-crimson'
              )}
            >
              {isPendingAddition
                ? 'Pending Approval'
                : rule.status === 'active'
                  ? 'Active'
                  : 'Broken Recently'}
            </span>
          </div>

          {/* Consequence */}
          <div className="rounded-lg border border-crimson/20 bg-crimson/5 p-4">
            <p className="text-xs uppercase tracking-wider text-crimson-muted">
              Consequence if Broken
            </p>
            <p className="mt-2 font-serif text-lg italic text-crimson">
              {'"'}{rule.consequence}{'"'}
            </p>
          </div>

          {/* Date */}
          <p className="text-sm text-muted-foreground">
            Sworn on{' '}
            {new Date(rule.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          {/* Sacred lock status */}
          <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gold" />
              <span className="text-sm font-medium text-gold">Sacred Lock Active</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Both people must agree before removal takes effect.
            </p>
            
            {/* Deletion status */}
            {(currentUserConfirmed || otherUserConfirmed) && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  {currentUserConfirmed ? (
                    <Check className="h-3 w-3 text-gold" />
                  ) : (
                    <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                  )}
                  <span className={currentUserConfirmed ? 'text-gold' : 'text-muted-foreground'}>
                    You confirmed removal
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {otherUserConfirmed ? (
                    <Check className="h-3 w-3 text-gold" />
                  ) : (
                    <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                  )}
                  <span className={otherUserConfirmed ? 'text-gold' : 'text-muted-foreground'}>
                    Another user confirmed removal
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button
              onClick={() => {
                onReportViolation();
                onOpenChange(false);
              }}
              variant="outline"
              className="flex-1 border-crimson/50 text-crimson hover:bg-crimson/10 hover:text-crimson"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report Violation
            </Button>

            {!isPendingAddition && !showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="ghost"
                className="flex-1 text-muted-foreground hover:text-foreground"
              >
                <Unlock className="mr-2 h-4 w-4" />
                {currentUserConfirmed ? 'Awaiting Another User' : 'Request Removal'}
              </Button>
            ) : !isPendingAddition ? (
              <div className="flex flex-1 gap-2">
                <Button
                  onClick={handleRequestDeletion}
                  variant="destructive"
                  className="flex-1 bg-crimson hover:bg-crimson/90"
                  disabled={currentUserConfirmed}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Confirm
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="ghost"
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                This covenant is waiting for addition approval in the Requests tab.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
