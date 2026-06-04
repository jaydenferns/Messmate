'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Leaf, Mail, Shield, UserCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { currentUser, login, loading } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/student');
      }
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your college email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      await login(email);
      // useEffect handles redirect
    } catch (err) {
      setError('Authentication failed. Please try again.');
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: 'student' | 'admin') => {
    setSubmitting(true);
    const demoEmail = role === 'student' ? 'jayden@hostel.edu' : 'admin@hostel.edu';
    try {
      await login(demoEmail);
    } catch (err) {
      setError('Demo authentication failed.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-100 transition-all hover:scale-105">
          <Leaf className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
          Mess<span className="text-emerald-600">Mate</span>
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xs text-center font-medium">
          Smart Food Demand Prediction & Attendance Management
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Sign in to your account</h2>
        
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              College Email Address
            </label>
            <div className="relative rounded-2xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hostel.edu"
                className="block w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 px-4 text-sm font-bold text-white shadow-md shadow-emerald-100 transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
            <span className="bg-white px-3 text-slate-400">Quick Demo Shortcuts</span>
          </div>
        </div>

        {/* Quick Demo Access Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleQuickLogin('student')}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <UserCheck className="h-4 w-4 text-emerald-600" />
            Student (Jayden)
          </button>
          
          <button
            onClick={() => handleQuickLogin('admin')}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Shield className="h-4 w-4 text-amber-600" />
            Admin (Chef Rajan)
          </button>
        </div>
      </div>
      
      {/* Environmental Footer Note */}
      <p className="mt-8 text-center text-xs text-slate-400 font-medium">
        🌿 MessMate helps college messes save up to 40% in food waste daily.
      </p>
    </div>
  );
}
