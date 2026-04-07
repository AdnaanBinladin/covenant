'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function RootPage() {
  const router = useRouter();
  const { user, isReady } = useAuthStore();

  useEffect(() => {
    void useAuthStore.getState().restoreSession();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    router.replace(user ? '/homepage' : '/login');
  }, [isReady, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      <div className="rounded-2xl border border-gold/20 bg-card/60 px-6 py-4 text-sm backdrop-blur-sm">
        Opening The Covenant...
      </div>
    </div>
  );
}
