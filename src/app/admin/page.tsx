'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate, MealType } from '@/lib/utils';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Scale, 
  UtensilsCrossed, 
  Calendar, 
  ChevronRight, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { 
    meals, 
    tokens, 
    logWaste, 
    wasteLogs,
    getAdminStats 
  } = useApp();

  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');
  const [wasteInputs, setWasteInputs] = useState<Record<string, string>>({
    breakfast: '',
    lunch: '',
    dinner: ''
  });
  const [wasteStatus, setWasteStatus] = useState<string | null>(null);

  const todayStr = formatDate(new Date());
  
  // Fetch statistics for today's selected meal
  const stats = getAdminStats(todayStr, selectedMeal);
  
  // Find current menu for today
  const todayMenu = meals.find(m => m.date === todayStr);
  const currentMenuText = todayMenu ? todayMenu[selectedMeal].menu : 'Not specified';

  // Served Percentage
  const servedPercentage = stats.bookedCount > 0 
    ? Math.round((stats.attendedCount / stats.bookedCount) * 100)
    : 0;

  // Fetch recent check-ins today (scanned tokens)
  const todayTokens = tokens.filter(t => t.date === todayStr && t.status === 'used');
  const recentCheckins = [...todayTokens]
    .sort((a, b) => b.expiresAt.localeCompare(a.expiresAt)) // simulated order
    .slice(0, 5);

  // Waste logging handler
  const handleWasteLogSubmit = async (meal: MealType) => {
    setWasteStatus(null);
    const weightVal = parseFloat(wasteInputs[meal]);
    
    if (isNaN(weightVal) || weightVal < 0) {
      setWasteStatus(`Error: Please enter a valid quantity in kg for ${meal}.`);
      return;
    }

    const success = await logWaste(todayStr, meal, weightVal);
    if (success) {
      setWasteStatus(`Successfully logged ${weightVal} kg waste for ${meal}!`);
      setWasteInputs({
        ...wasteInputs,
        [meal]: ''
      });
      setTimeout(() => setWasteStatus(null), 3000);
    } else {
      setWasteStatus('Error: Failed to record waste log.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Dashboard Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Mess Control Center</span>
          <h2 className="text-3xl font-extrabold text-slate-900">Chef's Live Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Managing service for **{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}**
          </p>
        </div>
        
        {/* Navigation Quick Links */}
        <div className="flex gap-3 w-full sm:w-auto">
          <Link
            href="/admin/scan"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-colors"
          >
            Open QR Scanner
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {wasteStatus && (
        <div className={`mb-6 rounded-2xl p-4 text-xs font-bold border ${
          wasteStatus.startsWith('Error') 
            ? 'bg-red-50 text-red-800 border-red-100'
            : 'bg-emerald-50 text-emerald-800 border-emerald-100'
        }`}>
          {wasteStatus}
        </div>
      )}

      {/* Main Grid: Counters & Scans (Left 2/3), Logs & Quick Entry (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Counters & Scans */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Live Service Plate Tracker card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Live Plate Counter</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Today Menu: {currentMenuText}</p>
              </div>
              
              {/* Meal Filter Tabs */}
              <div className="flex rounded-2xl bg-slate-50 p-1 border border-slate-100">
                {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
                  <button
                    key={meal}
                    onClick={() => setSelectedMeal(meal)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                      selectedMeal === meal
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-950'
                    }`}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>

            {/* Attendance Progress Ring/Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>Plates Served</span>
                <span className="text-emerald-600 font-extrabold">{servedPercentage}% Served</span>
              </div>
              <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${servedPercentage}%` }}
                />
              </div>
            </div>

            {/* Numerical Gauges Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50/50 border border-slate-100/50 rounded-2xl p-4 text-center">
                <div className="text-slate-400 bg-slate-100 h-8 w-8 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-2xl font-extrabold text-slate-950">{stats.bookedCount}</span>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mt-1">Booked</span>
              </div>

              <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4 text-center">
                <div className="text-emerald-600 bg-emerald-50 h-8 w-8 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span className="text-2xl font-extrabold text-emerald-700">{stats.attendedCount}</span>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mt-1">Served</span>
              </div>

              <div className="bg-amber-50/30 border border-amber-100/50 rounded-2xl p-4 text-center">
                <div className="text-amber-600 bg-amber-50 h-8 w-8 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-2xl font-extrabold text-amber-700">{stats.remainingExpected}</span>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mt-1">Expected</span>
              </div>
            </div>
          </div>

          {/* Recent Scan Ticker Feed */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950 mb-4">Live Check-in Feed</h3>
            
            <div className="divide-y divide-slate-50 border border-slate-50 rounded-2xl overflow-hidden">
              {recentCheckins.length > 0 ? (
                recentCheckins.map((token, index) => (
                  <div key={token.id || index} className="flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                        {token.userName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-950">{token.userName}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold capitalize mt-0.5">{token.mealType} Ticket</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                        Serving Plate
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        {new Date(token.expiresAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs font-medium text-slate-400">
                  No plates served yet for today. Use the Scan Terminal to scan student QR codes.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Waste Logger & Quick Menu Updates */}
        <div className="space-y-8">
          
          {/* Chef Leftover Waste Logger card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-950">Leftover Waste Log</h3>
            </div>
            
            <p className="text-xs text-slate-400 font-medium mb-6">
              Enter leftover food at the end of each meal service to calculate accurate system efficiency and financial savings.
            </p>

            <div className="space-y-4">
              {(['breakfast', 'lunch', 'dinner'] as const).map(meal => {
                // Check if waste was logged already for today
                const isLogged = wasteLogs.find(w => w.date === todayStr && w.mealType === meal);
                
                return (
                  <div key={meal} className="flex flex-col gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 capitalize">{meal} Log</span>
                      {isLogged && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Logged: {isLogged.leftoverKg} kg
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 12.5"
                          value={wasteInputs[meal]}
                          onChange={(e) => setWasteInputs({ ...wasteInputs, [meal]: e.target.value })}
                          className="w-full text-xs font-medium bg-white rounded-xl border border-slate-200 py-2.5 pl-3 pr-12 focus:outline-none focus:border-emerald-500"
                        />
                        <span className="absolute right-3.5 top-2.5 text-[10px] font-bold text-slate-400">kg</span>
                      </div>
                      <button
                        onClick={() => handleWasteLogSubmit(meal)}
                        className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 transition-colors"
                      >
                        Log
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Analytics Redirection Card */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-100 flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                <TrendingDown className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Phase 1 + 2</span>
            </div>
            
            <div>
              <h4 className="text-sm font-bold">Predict Tomorrow's Demand</h4>
              <p className="text-xs text-slate-400 mt-1">Calculate exact ingredient weights & adjust predicted headcounts using student bookings.</p>
            </div>

            <Link 
              href="/admin/analytics"
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors group mt-2"
            >
              Analyze Demand
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
