'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Leaf, 
  LogOut, 
  QrCode, 
  Award, 
  TrendingUp, 
  ClipboardList, 
  Flame, 
  User, 
  ShieldAlert
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isStudent = currentUser.role === 'student';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href={isStudent ? '/student' : '/admin'} className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200 transition-transform group-hover:scale-105">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-950">
              Mess<span className="text-emerald-600">Mate</span>
            </span>
          </Link>
          {currentUser.role === 'admin' && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
              <ShieldAlert className="h-3 w-3" /> Admin Portal
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          {isStudent ? (
            <>
              <Link 
                href="/student" 
                className={`text-sm font-medium transition-colors hover:text-emerald-600 ${
                  pathname === '/student' ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                Bookings
              </Link>
              <Link 
                href="/student/stats" 
                className={`text-sm font-medium transition-colors hover:text-emerald-600 ${
                  pathname === '/student/stats' ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                My Stats
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/admin" 
                className={`text-sm font-medium transition-colors hover:text-emerald-600 ${
                  pathname === '/admin' ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                Live Counter
              </Link>
              <Link 
                href="/admin/scan" 
                className={`text-sm font-medium transition-colors hover:text-emerald-600 ${
                  pathname === '/admin/scan' ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                Scan Terminal
              </Link>
              <Link 
                href="/admin/analytics" 
                className={`text-sm font-medium transition-colors hover:text-emerald-600 ${
                  pathname === '/admin/analytics' ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                Analytics & Prediction
              </Link>
            </>
          )}
        </nav>

        {/* Profile / Stats & Log out */}
        <div className="flex items-center gap-4">
          {/* Quick Streak/Points indicators for Students */}
          {isStudent && (
            <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1 text-orange-600 animate-pulse">
                <Flame className="h-4 w-4 fill-orange-500" />
                <span>{currentUser.streak} Day Streak</span>
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <div className="flex items-center gap-1 text-emerald-600">
                <Award className="h-4 w-4" />
                <span>{currentUser.rewardPoints} pts</span>
              </div>
            </div>
          )}

          {/* User profile dropdown trigger */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1.5 ring-1 ring-slate-200">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden lg:inline text-xs font-medium text-slate-700 pr-1">
                {currentUser.name}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-sm"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Bottom navbar for mobile screens (Floating PWA style) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white px-4 py-2 shadow-lg md:hidden">
        <div className="flex justify-around items-center">
          {isStudent ? (
            <>
              <Link 
                href="/student" 
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                  pathname === '/student' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <ClipboardList className="h-5 w-5" />
                <span className="text-[10px] font-medium">Bookings</span>
              </Link>
              <Link 
                href="/student/stats" 
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                  pathname === '/student/stats' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <Award className="h-5 w-5" />
                <span className="text-[10px] font-medium">My Stats</span>
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/admin" 
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                  pathname === '/admin' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <ClipboardList className="h-5 w-5" />
                <span className="text-[10px] font-medium">Counter</span>
              </Link>
              <Link 
                href="/admin/scan" 
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                  pathname === '/admin/scan' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <QrCode className="h-5 w-5" />
                <span className="text-[10px] font-medium">Scanner</span>
              </Link>
              <Link 
                href="/admin/analytics" 
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                  pathname === '/admin/analytics' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-[10px] font-medium">Analytics</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
