'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate, MealType } from '@/lib/utils';
import { 
  TrendingUp, 
  Scale, 
  HelpCircle, 
  Settings, 
  Calculator, 
  DollarSign, 
  Leaf,
  Info,
  ChevronRight,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminAnalyticsPage() {
  const { 
    calculatePrediction, 
    getReportsData, 
    totalStudents 
  } = useApp();

  const [predictionDate, setPredictionDate] = useState('tomorrow'); // today or tomorrow
  const [predictionMeal, setPredictionMeal] = useState<MealType>('lunch');
  
  // Phase 2 prediction adjustments
  const [isExamDay, setIsExamDay] = useState(false);
  const [weather, setWeather] = useState<'sunny' | 'cloudy' | 'rainy'>('sunny');
  const [isHoliday, setIsHoliday] = useState(false);

  // Compute dates
  const today = new Date();
  const todayStr = formatDate(today);
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  const targetDateStr = predictionDate === 'today' ? todayStr : tomorrowStr;

  // Run prediction
  const prediction = calculatePrediction(targetDateStr, predictionMeal, {
    isExamDay,
    weather,
    isHoliday
  });

  // Load analytics reports data
  const reports = getReportsData();

  // Cumulative savings calculations
  const totalWasteLoggedKg = reports.waste.reduce((sum, curr) => sum + curr, 0);
  const totalSavingsUsd = reports.moneySavedCumulative[reports.moneySavedCumulative.length - 1] || 0;
  const totalCarbonAvoidedKg = Math.round(totalSavingsUsd * 0.67); // Ratio approximation

  // Chart 1: Booked vs Attended
  const bookingChartData = {
    labels: reports.labels,
    datasets: [
      {
        label: 'Plates Booked',
        data: reports.booked,
        borderColor: '#94a3b8',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.2,
      },
      {
        label: 'Plates Served',
        data: reports.attended,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 3,
        pointRadius: 4,
        tension: 0.2,
        fill: true,
      }
    ]
  };

  // Chart 2: Leftover Waste
  const wasteChartData = {
    labels: reports.labels,
    datasets: [
      {
        label: 'Leftover Food (kg)',
        data: reports.waste,
        backgroundColor: reports.waste.map((w, idx) => {
          // Highlight high waste in red/orange, low waste in green
          if (w > 25) return '#f59e0b';
          if (w > 40) return '#ef4444';
          return '#10b981';
        }),
        borderRadius: 8,
        borderWidth: 0,
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { size: 10, weight: 'bold' as const },
          usePointStyle: true,
          boxWidth: 6,
        }
      },
      tooltip: {
        padding: 12,
        cornerRadius: 12,
        titleFont: { size: 11, weight: 'bold' as const },
        bodyFont: { size: 12 },
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 9, weight: 'bold' as const } }
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 9, weight: 'bold' as const } }
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Page Header */}
      <div className="mb-8">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Predictive Kitchen Logistics</span>
        <h2 className="text-3xl font-extrabold text-slate-900">Demand Prediction & Analytics</h2>
        <p className="text-sm text-slate-500 mt-1">
          Review meal attendance analytics and simulate ingredients demand calculations.
        </p>
      </div>

      {/* Overview Analytics Banner cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Money saved */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hostel Savings</span>
            <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">${totalSavingsUsd.toLocaleString()}</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Cumulative food budget saved</p>
          </div>
        </div>

        {/* Carbon Offset */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carbon Offset</span>
            <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalCarbonAvoidedKg} kg CO₂</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Emissions saved via food conservation</p>
          </div>
        </div>

        {/* Waste logged total */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leftovers Registered</span>
            <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalWasteLoggedKg.toFixed(1)} kg</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Total measured leftover waste</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Prediction Engine (Left 1/3), Analytics charts (Right 2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Prediction Simulator Panel */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
              <Calculator className="h-5 w-5 text-emerald-600" />
              <h3 className="text-md font-extrabold text-slate-950">Demand Calculator</h3>
            </div>

            {/* Target Selectors */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Date</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button
                    onClick={() => setPredictionDate('today')}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
                      predictionDate === 'today' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setPredictionDate('tomorrow')}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
                      predictionDate === 'tomorrow' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Meal Type</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
                    <button
                      key={meal}
                      onClick={() => setPredictionMeal(meal)}
                      className={`rounded-lg py-1.5 text-xs font-bold capitalize transition-colors ${
                        predictionMeal === meal ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Adjustments Section (Phase 2 Simple ML controls) */}
              <div className="border-t border-slate-50 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Settings className="h-4 w-4 text-emerald-600" />
                  Predictive Modifiers
                </h4>
                
                {/* Weather Select */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Weather condition</label>
                  <select
                    value={weather}
                    onChange={(e: any) => setWeather(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="sunny">☀️ Sunny Day (Normal)</option>
                    <option value="cloudy">⛅ Cloudy Day</option>
                    <option value="rainy">🌧️ Heavy Rain (+15% Mess load)</option>
                  </select>
                </div>

                {/* Exam toggler */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-800 uppercase">Exam Season</label>
                    <span className="text-[9px] text-slate-400 font-semibold block">Students stay inside hostel</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isExamDay}
                    onChange={(e) => setIsExamDay(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                </div>

                {/* Holiday toggler */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-800 uppercase">Holiday / Long Weekend</label>
                    <span className="text-[9px] text-slate-400 font-semibold block">Students leave campus</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isHoliday}
                    onChange={(e) => setIsHoliday(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Prediction Output Headcount Result Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-xl">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[9px] font-bold tracking-widest text-emerald-400 uppercase">Predicted Attendance</span>
              <Sparkles className="h-4 w-4 text-emerald-400 animate-bounce" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{prediction.predictedCount}</span>
              <span className="text-xs text-slate-400">plates predicted</span>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-normal font-semibold mt-3 bg-white/5 border border-white/5 rounded-xl p-2.5">
              💡 **Breakdown:** Based on **{prediction.expectedBookings}** bookings (minus ~{prediction.expectedNoShows} no-shows) + **{prediction.undecidedConversion}** projected conversions from undecided students.
            </p>

            <div className="grid grid-cols-3 gap-2 mt-4 border-t border-white/5 pt-4 text-center">
              <div>
                <span className="text-[9px] font-bold text-slate-500 block uppercase">No-Show Est</span>
                <span className="text-xs font-bold text-amber-400">{prediction.factorsApplied.noShowRate * 100}%</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-500 block uppercase">Conversion</span>
                <span className="text-xs font-bold text-emerald-400">{Math.round(prediction.factorsApplied.baseRate * 100)}%</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-500 block uppercase">Modifier</span>
                <span className="text-xs font-bold text-white">x{prediction.factorsApplied.modifier}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Ingredients checklist & Graphs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Predicted Ingredients Checklist card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-600" />
                <h3 className="text-md font-extrabold text-slate-900">Grocery Requirements</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Quantities for {prediction.predictedCount} plates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {prediction.ingredients.map((ing: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-800">{ing.name}</span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    {ing.quantity} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance & Waste Charts Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart 1 container */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <h4 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Booking vs Attendance
              </h4>
              <div className="h-56">
                <Line data={bookingChartData} options={chartOptions} />
              </div>
            </div>

            {/* Chart 2 container */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <h4 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-1">
                <Scale className="h-4 w-4 text-amber-500" />
                Leftover Waste Food
              </h4>
              <div className="h-56">
                <Bar data={wasteChartData} options={chartOptions} />
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
