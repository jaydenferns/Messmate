'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const { currentUser, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        if (currentUser.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/student');
        }
      } else {
        router.push('/login');
      }
    }
  }, [currentUser, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Redirecting to space...</p>
      </div>
    </div>
  );
}
