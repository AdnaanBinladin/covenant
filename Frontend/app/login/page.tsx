'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { user, isReady, isLoading, error, login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    void useAuthStore.getState().restoreSession();
  }, []);

  useEffect(() => {
    if (isReady && user) {
      router.replace('/homepage');
    }
  }, [isReady, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    try {
      await login(email, password);
      router.replace('/homepage');
    } catch (loginError) {
      setLocalError(
        loginError instanceof Error ? loginError.message : 'Unable to sign in.'
      );
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.18),_transparent_35%),linear-gradient(180deg,_rgba(251,247,238,0.98),_rgba(244,238,226,1))]" />
      <div className="absolute inset-y-0 left-[-12rem] w-72 rotate-12 bg-gold/15 blur-3xl" />
      <div className="absolute bottom-[-8rem] right-[-8rem] h-80 w-80 rounded-full bg-crimson/8 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-4 py-12 lg:flex-row lg:items-center lg:gap-16">
        <section className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-gold/30 bg-white/70 px-4 py-2 text-sm text-gold shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Private covenant access
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Heart className="h-9 w-9 text-gold" />
              <h1 className="font-serif text-4xl text-gold sm:text-5xl">
                Enter The Covenant
              </h1>
            </div>

            <p className="max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              Sign in before entering your shared vows, your accountability history,
              and the promises you want to protect together.
            </p>
          </div>

        </section>

        <section className="w-full max-w-md rounded-[2rem] border border-gold/25 bg-white/82 p-8 shadow-[0_20px_60px_rgba(146,122,69,0.12)] backdrop-blur-xl">
          <div className="mb-8 space-y-2">
            <p className="text-sm uppercase tracking-[0.25em] text-gold-muted">
              Login
            </p>
            <h2 className="font-serif text-3xl text-stone-950">Sacred access only</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Sign in with your email and password to continue into your covenant.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-gold-muted" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 rounded-xl border-gold/25 bg-white"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gold-muted" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 rounded-xl border-gold/25 bg-white"
                autoComplete="current-password"
                required
              />
            </div>

            {(localError || error) && (
              <div className="rounded-xl border border-crimson/30 bg-crimson/10 px-4 py-3 text-sm text-crimson">
                {localError || error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-xl bg-gold text-background hover:bg-gold/90"
            >
              <KeyRound className="h-4 w-4" />
              {isLoading ? 'Entering...' : 'Enter The Covenant'}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
