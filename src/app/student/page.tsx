'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate, getMealCutoff, MealType, isMealTimeWindowOpen } from '@/lib/utils';
import { 
  Flame, 
  Award, 
  Leaf, 
  QrCode, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight, 
  UtensilsCrossed 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentDashboard() {
  const { 
    currentUser, 
    meals, 
    bookings, 
    tokens, 
    bookMeal, 
    cancelMeal 
  } = useApp();

  const [activeToken, setActiveToken] = useState<{
    id: string;
    mealType: MealType;
    date: string;
    menu: string;
  } | null>(null);

  const [bookingConfirmation, setBookingConfirmation] = useState<{
    dateStr: string;
    mealType: MealType;
    menu: string;
  } | null>(null);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!currentUser) return null;

  const todayStr = formatDate(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  // Get menus for today and tomorrow
  const todayMenu = meals.find(m => m.date === todayStr);
  const tomorrowMenu = meals.find(m => m.date === tomorrowStr);

  const handleBook = async (dateStr: string, mealType: MealType) => {
    setStatusMessage(null);
    const res = await bookMeal(dateStr, mealType);
    if (res.success) {
      showStatus('success', `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} booked successfully!`);
    } else {
      showStatus('error', res.error || 'Failed to book meal');
    }
  };

  const handleCancel = async (dateStr: string, mealType: MealType) => {
    setStatusMessage(null);
    const res = await cancelMeal(dateStr, mealType);
    if (res.success) {
      showStatus('success', `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} cancelled. +10 reward points for saving food!`);
    } else {
      showStatus('error', res.error || 'Failed to cancel meal');
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Look up token to display
  const handleShowQR = (mealType: MealType, dateStr: string, menu: string) => {
    const bookingId = `${currentUser.uid}_${dateStr}_${mealType}`;
    const token = tokens.find(t => t.bookingId === bookingId && t.status === 'unused');
    if (token) {
      setActiveToken({
        id: token.id,
        mealType,
        date: dateStr,
        menu
      });
    } else {
      showStatus('error', 'Token not found. Make sure booking is active and unused.');
    }
  };

  const renderMealCard = (dateStr: string, mealType: MealType, menu: string) => {
    const bookingId = `${currentUser.uid}_${dateStr}_${mealType}`;
    const userBooking = bookings.find(b => b.id === bookingId);
    const isBooked = userBooking && userBooking.status === 'booked';
    const isCancelled = userBooking && userBooking.status === 'cancelled';
    
    const cutoff = getMealCutoff(dateStr, mealType);
    const isCutoffPassed = cutoff.isPassed;
    
    // Check if token exists and is used/expired
    const relatedToken = tokens.find(t => t.bookingId === bookingId);
    const isTokenUsed = relatedToken && relatedToken.status === 'used';
    const isTokenExpired = relatedToken && relatedToken.status === 'expired';

    // Theme values based on states
    let stateColor = 'border-slate-100 bg-white';
    let statusText = 'Not Booked';
    let icon = <Clock className="h-5 w-5 text-slate-400" />;

    if (isTokenUsed) {
      stateColor = 'border-emerald-200 bg-emerald-50/20';
      statusText = 'Meal Attended';
      icon = <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    } else if (isBooked) {
      stateColor = 'border-emerald-600 bg-white shadow-emerald-50/50 shadow-md';
      statusText = 'Booked';
      icon = <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    } else if (isCancelled) {
      stateColor = 'border-amber-200 bg-amber-50/10';
      statusText = 'Cancelled (Food Saved)';
      icon = <Leaf className="h-5 w-5 text-amber-500" />;
    } else if (isCutoffPassed) {
      stateColor = 'border-slate-100 bg-slate-50/50';
      statusText = 'Missed Deadline';
      icon = <XCircle className="h-5 w-5 text-slate-300" />;
    }

    return (
      <div 
        key={`${dateStr}_${mealType}`}
        className={`flex flex-col rounded-3xl border p-5 transition-all hover:shadow-md ${stateColor}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{mealType}</span>
            <h4 className="text-sm font-semibold text-slate-900 mt-0.5 capitalize">
              {mealType === 'breakfast' && '🌅 Breakfast'}
              {mealType === 'lunch' && '☀️ Lunch'}
              {mealType === 'dinner' && '🌙 Dinner'}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
            {icon}
            <span>{statusText}</span>
          </div>
        </div>

        {/* Menu description */}
        <p className="text-xs text-slate-600 font-medium mt-3 bg-slate-50 rounded-2xl p-3 border border-slate-50">
          🍽️ {menu || 'Menu details not updated yet.'}
        </p>

        {/* Cutoff / Countdown Info */}
        {!isTokenUsed && !isTokenExpired && (
          <div className="flex items-center gap-1 mt-3.5 text-[10px] font-semibold text-slate-400">
            <Clock className="h-3 w-3" />
            <span>Cutoff: {cutoff.formattedCutoff}</span>
            {isCutoffPassed && <span className="text-red-500 font-bold ml-1">(Passed)</span>}
          </div>
        )}

        {/* Interactive CTA Actions */}
        <div className="mt-4 flex gap-2">
          {isTokenUsed ? (
            <div className="w-full text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-2.5 rounded-2xl border border-emerald-100">
              🍽️ Hope you enjoyed your meal!
            </div>
          ) : isBooked ? (
            <>
              {/* Show QR Code button */}
              <button
                onClick={() => handleShowQR(mealType, dateStr, menu)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs py-3 shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-colors"
              >
                <QrCode className="h-4 w-4" />
                QR Token
              </button>
              
              {/* Cancel action if allowed */}
              {!isCutoffPassed && (
                <button
                  onClick={() => handleCancel(dateStr, mealType)}
                  className="rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold px-4 py-3 transition-colors"
                >
                  Cancel
                </button>
              )}
            </>
          ) : (
            /* Book meal button */
            <button
              onClick={() => setBookingConfirmation({ dateStr, mealType, menu })}
              disabled={isCutoffPassed}
              className={`w-full rounded-2xl font-bold text-xs py-3 border transition-colors ${
                isCutoffPassed 
                  ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'border-emerald-600 bg-emerald-50/50 hover:bg-emerald-600 hover:text-white text-emerald-700'
              }`}
            >
              {isCutoffPassed ? 'Booking Closed' : 'Book Meal'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24 md:pb-12">
      
      {/* Greeting Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Student Dashboard</span>
          <h2 className="text-2xl font-extrabold text-slate-900">Hello, {currentUser.name}! 🌿</h2>
        </div>
        <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
          {currentUser.name.charAt(0)}
        </div>
      </div>

      {/* Floating Alert / Status Notification */}
      {statusMessage && (
        <div className={`mb-6 rounded-2xl p-4 text-xs font-bold border animate-bounce ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
            : 'bg-red-50 text-red-800 border-red-100'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Overview Statistics Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-8">
        <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm text-center">
          <div className="text-orange-500 bg-orange-50 h-8 w-8 rounded-full flex items-center justify-center mb-1.5 animate-pulse">
            <Flame className="h-4 w-4 fill-orange-500" />
          </div>
          <span className="text-sm font-extrabold text-slate-900">{currentUser.streak} Days</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Streak</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm text-center">
          <div className="text-emerald-600 bg-emerald-50 h-8 w-8 rounded-full flex items-center justify-center mb-1.5">
            <Award className="h-4 w-4" />
          </div>
          <span className="text-sm font-extrabold text-slate-900">{currentUser.rewardPoints} pts</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Rewards</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm text-center">
          <div className="text-blue-500 bg-blue-50 h-8 w-8 rounded-full flex items-center justify-center mb-1.5">
            <Leaf className="h-4 w-4" />
          </div>
          <span className="text-sm font-extrabold text-slate-900">{currentUser.foodSavedKg} kg</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Saved Food</span>
        </div>
      </div>

      {/* Date Header: Today */}
      <div className="mb-8">
        <div className="flex items-center gap-1.5 mb-4">
          <Calendar className="h-5 w-5 text-emerald-600" />
          <h3 className="text-md font-bold text-slate-900">Today's Meals</h3>
          <span className="text-xs font-semibold text-slate-400">({new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})</span>
        </div>
        
        <div className="space-y-4">
          {renderMealCard(todayStr, 'breakfast', todayMenu?.breakfast.menu || '')}
          {renderMealCard(todayStr, 'lunch', todayMenu?.lunch.menu || '')}
          {renderMealCard(todayStr, 'dinner', todayMenu?.dinner.menu || '')}
        </div>
      </div>

      {/* Date Header: Tomorrow */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-4">
          <Calendar className="h-5 w-5 text-slate-400" />
          <h3 className="text-md font-bold text-slate-900">Tomorrow's Meals</h3>
          <span className="text-xs font-semibold text-slate-400">({tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})</span>
        </div>
        
        <div className="space-y-4">
          {renderMealCard(tomorrowStr, 'breakfast', tomorrowMenu?.breakfast.menu || '')}
          {renderMealCard(tomorrowStr, 'lunch', tomorrowMenu?.lunch.menu || '')}
          {renderMealCard(tomorrowStr, 'dinner', tomorrowMenu?.dinner.menu || '')}
        </div>
      </div>

      {/* QR Code Modal Drawer */}
      {activeToken && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white p-6 shadow-2xl transition-all sm:max-w-md sm:rounded-3xl border border-slate-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{activeToken.mealType} Ticket</span>
                <h3 className="text-lg font-bold text-slate-950 capitalize">Meal QR Pass</h3>
              </div>
              <button 
                onClick={() => setActiveToken(null)}
                className="rounded-full bg-slate-50 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* QR Scanner Ticket Payload */}
            <div className="flex flex-col items-center py-8">
              
              {/* QR Container */}
              <div className="relative flex items-center justify-center rounded-3xl bg-slate-50 p-6 border-2 border-dashed border-slate-200">
                <QRCodeSVG 
                  value={activeToken.id} 
                  size={200}
                  level="H"
                  includeMargin={true}
                  className="rounded-xl"
                />
              </div>

              {/* Unique Cryptographic ID indicator */}
              <div className="mt-4 text-center">
                <p className="text-[10px] font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 tracking-wider">
                  ID: {activeToken.id}
                </p>
                <h4 className="mt-3 text-sm font-bold text-slate-900 capitalize">
                  {activeToken.mealType} Service
                </h4>
                <p className="text-xs font-medium text-slate-500 mt-1 px-4">
                  {activeToken.menu}
                </p>
              </div>

              {/* Warning/Cutoff Alert */}
              <div className="mt-6 w-full rounded-2xl bg-amber-50 p-3.5 border border-amber-100 text-left">
                <div className="flex gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-950">Valid for 1 Meal Plate</h5>
                    <p className="text-[10px] text-amber-800 mt-0.5">
                      Present this QR token to the server at the mess counter. Token becomes invalid immediately after scanning.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Close CTA */}
            <button
              onClick={() => setActiveToken(null)}
              className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {bookingConfirmation && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white p-6 shadow-2xl transition-all sm:max-w-md sm:rounded-3xl border border-slate-100 animate-slide-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Confirm Booking</span>
                <h3 className="text-lg font-bold text-slate-950 capitalize">Book {bookingConfirmation.mealType}?</h3>
              </div>
              <button 
                onClick={() => setBookingConfirmation(null)}
                className="rounded-full bg-slate-50 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-6">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {new Date(bookingConfirmation.dateStr.replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-3">Today Menu</span>
                <p className="text-xs font-medium text-slate-700 mt-0.5">
                  🍽️ {bookingConfirmation.menu || 'Menu details not updated yet.'}
                </p>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-left">
                <div className="flex gap-2.5">
                  <Leaf className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">Food Waste Reduction</h5>
                    <p className="text-[10px] text-emerald-800 mt-0.5">
                      Confirming this booking lets the kitchen cook exact quantities. If you change your mind, cancel before the cutoff time to avoid waste!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setBookingConfirmation(null)}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  handleBook(bookingConfirmation.dateStr, bookingConfirmation.mealType);
                  setBookingConfirmation(null);
                }}
                className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-colors"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
