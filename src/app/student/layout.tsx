'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (currentUser.role !== 'student') {
        router.push('/admin');
      }
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser || currentUser.role !== 'student') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading student space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
