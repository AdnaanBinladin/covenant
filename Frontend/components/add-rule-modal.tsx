'use client';

import { useState } from 'react';
import { RuleCategory, CATEGORIES } from '@/lib/types';
import { useCovenantStore } from '@/lib/covenant-store';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Scroll, Sparkles } from 'lucide-react';

interface AddRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddRuleModal({ open, onOpenChange }: AddRuleModalProps) {
  const addRule = useCovenantStore((state) => state.addRule);
  const token = useAuthStore((state) => state.token);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RuleCategory>('communication');
  const [consequence, setConsequence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !consequence) return;

    setIsSubmitting(true);
    
    // Simulate a brief delay for dramatic effect
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!token) {
      setIsSubmitting(false);
      return;
    }

    await addRule(token, {
      title,
      description,
      category,
      consequence,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('communication');
    setConsequence('');
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gold/30 bg-background/95 backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-serif text-2xl text-gold">
            <Scroll className="h-6 w-6" />
            Inscribe a New Covenant
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Submit a covenant request. It will be added after the other person approves it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm text-gold-muted">
              The Oath
            </Label>
            <Input
              id="title"
              placeholder="e.g., We Listen Fully"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-gold/30 bg-stone/50 text-foreground placeholder:text-muted-foreground focus:border-gold"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-gold-muted">
              The Meaning
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what this promise means to your relationship..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24 border-gold/30 bg-stone/50 text-foreground placeholder:text-muted-foreground focus:border-gold"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm text-gold-muted">
              The Domain
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v as RuleCategory)}>
              <SelectTrigger className="border-gold/30 bg-stone/50 text-foreground focus:border-gold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-gold/30 bg-background">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="consequence" className="text-sm text-gold-muted">
              The Consequence
            </Label>
            <Input
              id="consequence"
              placeholder="e.g., You owe a heartfelt hug"
              value={consequence}
              onChange={(e) => setConsequence(e.target.value)}
              className="border-gold/30 bg-stone/50 text-foreground placeholder:text-muted-foreground focus:border-gold"
              required
            />
            <p className="text-xs text-muted-foreground">
              A playful consequence when this covenant is broken.
            </p>
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
              disabled={isSubmitting || !title || !description || !consequence}
              className="bg-gold text-background hover:bg-gold/90"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Sending Request...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Submit Request
                </span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
