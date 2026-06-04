'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Award, 
  Flame, 
  Leaf, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XOctagon, 
  HelpCircle,
  Gift,
  Lock
} from 'lucide-react';

export default function StudentStatsPage() {
  const { currentUser, bookings, tokens } = useApp();

  if (!currentUser) return null;

  // Calculate stats
  const totalBookedCount = bookings.filter(b => b.userId === currentUser.uid && b.status === 'booked').length;
  const noShowsCount = currentUser.noShows;
  const attendedCount = currentUser.mealsAttended;
  
  // Calculate attendance rate (percentage)
  const attendanceRate = totalBookedCount > 0 
    ? Math.round((attendedCount / (attendedCount + noShowsCount)) * 100) 
    : 100;

  // Mock rewards database
  const rewardsList = [
    { id: 'r_1', title: 'Extra Weekend Dessert', points: 300, description: 'Get a free double serving of ice cream or pastry' },
    { id: 'r_2', title: 'Special Pizza Coupon', points: 600, description: 'Redeem one medium personal pizza on Saturday night' },
    { id: 'r_3', title: 'Skip-the-Line Mess Pass', points: 1000, description: '1-week pass to bypass the main counter queue' },
    { id: 'r_4', title: 'Exclusive MessMate Hoodie', points: 2000, description: 'Premium cotton hoodie with custom sustainability design' },
  ];

  // Badges calculation
  const badges = [
    { name: 'Eco Warrior 🌿', criteria: 'Save 5kg of food', earned: currentUser.foodSavedKg >= 5 },
    { name: 'Streak Master 🔥', criteria: 'Reach a 10-day streak', earned: currentUser.streak >= 10 },
    { name: 'Zero Waster 🥗', criteria: 'Zero no-shows in past 10 meals', earned: noShowsCount === 0 && attendedCount > 10 },
    { name: 'Elite Diner 🏆', criteria: 'Earn 500 reward points', earned: currentUser.rewardPoints >= 500 },
  ];

  // Generate unique list of historical bookings
  const sortedHistory = [...bookings]
    .filter(b => new Date(b.date) < new Date() || b.status === 'cancelled')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10); // Show last 10 bookings

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24 md:pb-12">
      
      {/* Page Title */}
      <div className="mb-6">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">My Progress</span>
        <h2 className="text-2xl font-extrabold text-slate-900">Stats & Rewards 🏆</h2>
        <p className="text-xs text-slate-500 mt-1">See your consistency stats and redeem eco-friendly reward points.</p>
      </div>

      {/* Primary Analytics Circle & Streak Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-6 flex flex-col items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Consistency Index</span>
        
        {/* Semi-circular representation or custom gauge */}
        <div className="relative flex items-center justify-center h-36 w-36 mb-4">
          <svg className="w-full h-full transform -rotate-95" viewBox="0 0 100 100">
            <circle 
              cx="50" cy="50" r="40" 
              className="stroke-slate-100 fill-none" 
              strokeWidth="8"
            />
            <circle 
              cx="50" cy="50" r="40" 
              className="stroke-emerald-500 fill-none transition-all duration-1000" 
              strokeWidth="8"
              strokeDasharray={`${2.51 * attendanceRate} 251.2`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-slate-900">{attendanceRate}%</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Attendance</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full border-t border-slate-50 pt-4 text-center">
          <div>
            <span className="text-xs font-bold text-slate-400 block">Meals Served</span>
            <span className="text-lg font-extrabold text-slate-900 mt-0.5">{attendedCount}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">No-shows</span>
            <span className="text-lg font-extrabold text-red-500 mt-0.5">{noShowsCount}</span>
          </div>
        </div>
      </div>

      {/* Carbon Offset & Green Savings card */}
      <div className="bg-emerald-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-100 mb-6">
        <div className="flex gap-4 items-center">
          <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Eco Impact Statement</h4>
            <p className="text-xs text-emerald-100 mt-0.5">
              By cancelling meals in advance, you saved **{currentUser.foodSavedKg} kg** of food. That represents an estimated carbon footprint reduction of **{(currentUser.foodSavedKg * 2.5).toFixed(1)} kg CO₂**.
            </p>
          </div>
        </div>
      </div>

      {/* Rewards Catalog */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-4">
          <Gift className="h-5 w-5 text-emerald-600" />
          <h3 className="text-md font-bold text-slate-900">Claim Rewards</h3>
          <span className="text-xs font-semibold text-slate-400">({currentUser.rewardPoints} points available)</span>
        </div>

        <div className="space-y-3">
          {rewardsList.map(reward => {
            const isAffordable = currentUser.rewardPoints >= reward.points;
            const progress = Math.min(100, (currentUser.rewardPoints / reward.points) * 100);

            return (
              <div 
                key={reward.id}
                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{reward.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{reward.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg block whitespace-nowrap">
                      {reward.points} pts
                    </span>
                  </div>
                </div>

                {/* Progress bar to target */}
                {!isAffordable && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Progress</span>
                      <span>{currentUser.rewardPoints} / {reward.points} pts</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}

                <button
                  disabled={!isAffordable}
                  className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors ${
                    isAffordable 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {!isAffordable && <Lock className="h-3 w-3" />}
                  {isAffordable ? 'Claim Reward' : 'Points Locked'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements / Badges Panel */}
      <div className="mb-6">
        <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-1.5">
          <Award className="h-5 w-5 text-emerald-600" />
          Earned Badges
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge, idx) => (
            <div 
              key={idx}
              className={`border rounded-2xl p-3 flex flex-col justify-center items-center text-center shadow-sm ${
                badge.earned 
                  ? 'bg-white border-emerald-100 text-slate-900' 
                  : 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60'
              }`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${
                badge.earned ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {badge.earned ? '✓' : '🔒'}
              </div>
              <span className="text-xs font-bold block">{badge.name}</span>
              <span className="text-[9px] font-medium text-slate-400 mt-0.5">{badge.criteria}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Booking History log */}
      <div className="mb-4">
        <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-1.5">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          Recent Activity
        </h3>

        <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-100 shadow-sm overflow-hidden">
          {sortedHistory.length > 0 ? (
            sortedHistory.map(history => {
              const date = new Date(history.date);
              const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
              
              // Match tokens to know attendance state
              const token = tokens.find(t => t.bookingId === history.id);
              const isUsed = token && token.status === 'used';
              
              let statusBadge = (
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <HelpCircle className="h-3 w-3" /> No Data
                </span>
              );

              if (history.status === 'cancelled') {
                statusBadge = (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                    <Leaf className="h-3 w-3" /> Food Saved
                  </span>
                );
              } else if (isUsed) {
                statusBadge = (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle className="h-3 w-3" /> Attended
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                    <XOctagon className="h-3 w-3" /> No-Show
                  </span>
                );
              }

              return (
                <div key={history.id} className="flex justify-between items-center p-4">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 capitalize">
                      {history.mealType}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{formattedDate}</p>
                  </div>
                  <div>
                    {statusBadge}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs font-medium text-slate-400">
              No recent meal activity to display.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
