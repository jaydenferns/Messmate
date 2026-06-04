'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  MealMenu, 
  Booking, 
  Token, 
  WasteLog, 
  generateMockDatabase 
} from '../lib/db';
import { MealType, formatDate, getMealCutoff, generateTokenId } from '../lib/utils';
import { predictMealDemand, calculateSavings } from '../lib/prediction';

interface AppContextProps {
  currentUser: UserProfile | null;
  users: UserProfile[];
  meals: MealMenu[];
  bookings: Booking[];
  tokens: Token[];
  wasteLogs: WasteLog[];
  totalStudents: number;
  loading: boolean;
  
  // Auth actions
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  
  // Student actions
  bookMeal: (dateStr: string, mealType: MealType) => Promise<{ success: boolean; error?: string }>;
  cancelMeal: (dateStr: string, mealType: MealType) => Promise<{ success: boolean; error?: string }>;
  getUserBookings: (userId: string) => Booking[];
  getUserActiveToken: (userId: string, dateStr: string, mealType: MealType) => Token | null;
  
  // Admin actions
  scanToken: (tokenId: string) => Promise<{ success: boolean; message: string; studentName?: string }>;
  logWaste: (dateStr: string, mealType: MealType, leftoverKg: number) => Promise<boolean>;
  getAdminStats: (dateStr: string, mealType: MealType) => {
    bookedCount: number;
    attendedCount: number;
    remainingExpected: number;
  };
  
  // Prediction calculations
  calculatePrediction: (dateStr: string, mealType: MealType, factors: {
    isExamDay: boolean;
    weather: 'sunny' | 'cloudy' | 'rainy';
    isHoliday: boolean;
  }) => any;
  
  // Reports
  getReportsData: () => {
    labels: string[];
    booked: number[];
    attended: number[];
    waste: number[];
    moneySavedCumulative: number[];
  };
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [meals, setMeals] = useState<MealMenu[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
  const [totalStudents, setTotalStudents] = useState(150);

  // Initialize DB from localStorage or fallback to generator
  useEffect(() => {
    setMounted(true);
    const storedUsers = localStorage.getItem('mm_users');
    const storedMeals = localStorage.getItem('mm_meals');
    const storedBookings = localStorage.getItem('mm_bookings');
    const storedTokens = localStorage.getItem('mm_tokens');
    const storedWasteLogs = localStorage.getItem('mm_wastelogs');
    const storedCurrentUser = localStorage.getItem('mm_currentuser');

    if (storedUsers && storedMeals && storedBookings && storedTokens && storedWasteLogs) {
      setUsers(JSON.parse(storedUsers));
      setMeals(JSON.parse(storedMeals));
      setBookings(JSON.parse(storedBookings));
      setTokens(JSON.parse(storedTokens));
      setWasteLogs(JSON.parse(storedWasteLogs));
      if (storedCurrentUser) {
        setCurrentUser(JSON.parse(storedCurrentUser));
      }
    } else {
      // Seed default data
      const mockDB = generateMockDatabase();
      setUsers(mockDB.users);
      setMeals(mockDB.meals);
      setBookings(mockDB.bookings);
      setTokens(mockDB.tokens);
      setWasteLogs(mockDB.wasteLogs);
      setTotalStudents(mockDB.totalStudents);
      
      // Default auto-login to Student Jaydeep for easier demo onboarding
      setCurrentUser(mockDB.users[0]);
      
      localStorage.setItem('mm_users', JSON.stringify(mockDB.users));
      localStorage.setItem('mm_meals', JSON.stringify(mockDB.meals));
      localStorage.setItem('mm_bookings', JSON.stringify(mockDB.bookings));
      localStorage.setItem('mm_tokens', JSON.stringify(mockDB.tokens));
      localStorage.setItem('mm_wastelogs', JSON.stringify(mockDB.wasteLogs));
      localStorage.setItem('mm_currentuser', JSON.stringify(mockDB.users[0]));
    }
    
    setLoading(false);
  }, []);

  // Save changes to localStorage helper
  const syncToLocalStorage = (
    newUsers: UserProfile[],
    newMeals: MealMenu[],
    newBookings: Booking[],
    newTokens: Token[],
    newWasteLogs: WasteLog[],
    newCurrentUser: UserProfile | null = currentUser
  ) => {
    localStorage.setItem('mm_users', JSON.stringify(newUsers));
    localStorage.setItem('mm_meals', JSON.stringify(newMeals));
    localStorage.setItem('mm_bookings', JSON.stringify(newBookings));
    localStorage.setItem('mm_tokens', JSON.stringify(newTokens));
    localStorage.setItem('mm_wastelogs', JSON.stringify(newWasteLogs));
    if (newCurrentUser) {
      localStorage.setItem('mm_currentuser', JSON.stringify(newCurrentUser));
    } else {
      localStorage.removeItem('mm_currentuser');
    }
  };

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  const login = async (email: string): Promise<boolean> => {
    setLoading(true);
    // Simple email checks
    const formattedEmail = email.trim().toLowerCase();
    
    let existingUser = users.find(u => u.email === formattedEmail);
    
    if (!existingUser) {
      // Register new user on the fly
      const isChef = formattedEmail.includes('admin') || formattedEmail.includes('chef');
      const namePart = formattedEmail.split('@')[0];
      const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      
      existingUser = {
        uid: 'u_' + Math.random().toString(36).substring(2, 9),
        email: formattedEmail,
        name: displayName,
        role: isChef ? 'admin' : 'student',
        streak: 0,
        rewardPoints: 100, // Initial signup bonus points!
        mealsAttended: 0,
        noShows: 0,
        foodSavedKg: 0,
      };
      
      const newUsers = [...users, existingUser];
      setUsers(newUsers);
      setCurrentUser(existingUser);
      syncToLocalStorage(newUsers, meals, bookings, tokens, wasteLogs, existingUser);
    } else {
      setCurrentUser(existingUser);
      syncToLocalStorage(users, meals, bookings, tokens, wasteLogs, existingUser);
    }
    
    setLoading(false);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mm_currentuser');
  };

  // ==========================================
  // STUDENT ACTIONS
  // ==========================================

  const bookMeal = async (dateStr: string, mealType: MealType): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    
    // Validate Cutoff
    const cutoff = getMealCutoff(dateStr, mealType);
    if (cutoff.isPassed) {
      return { success: false, error: `Booking cutoff has passed (${cutoff.formattedCutoff})` };
    }

    // Check if already booked
    const bookingId = `${currentUser.uid}_${dateStr}_${mealType}`;
    const exists = bookings.find(b => b.id === bookingId);
    
    if (exists && exists.status === 'booked') {
      return { success: false, error: 'Meal already booked' };
    }

    let updatedBookings: Booking[];
    if (exists) {
      // Re-activate a cancelled booking
      updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, status: 'booked' as const } : b);
    } else {
      // Create new booking
      const newBooking: Booking = {
        id: bookingId,
        userId: currentUser.uid,
        userName: currentUser.name,
        date: dateStr,
        mealType,
        status: 'booked',
        createdAt: new Date().toISOString()
      };
      updatedBookings = [...bookings, newBooking];
    }

    // Create Token
    const tokenId = generateTokenId();
    const targetDate = new Date(dateStr);
    
    // Set expiry to the end of meal service window
    let expiryHours = 21;
    if (mealType === 'breakfast') expiryHours = 9.5;
    else if (mealType === 'lunch') expiryHours = 14.5;
    
    targetDate.setHours(Math.floor(expiryHours), (expiryHours % 1) * 60, 0, 0);

    // Filter out old token for this booking if it exists
    const cleanTokens = tokens.filter(t => t.bookingId !== bookingId);

    const newToken: Token = {
      id: tokenId,
      bookingId,
      userId: currentUser.uid,
      userName: currentUser.name,
      mealType,
      date: dateStr,
      status: 'unused',
      expiresAt: targetDate.toISOString()
    };
    
    const updatedTokens = [...cleanTokens, newToken];

    // Update Meal booked counts
    const updatedMeals = meals.map(m => {
      if (m.date === dateStr) {
        const mealInfo = m[mealType];
        return {
          ...m,
          [mealType]: {
            ...mealInfo,
            bookedCount: mealInfo.bookedCount + 1
          }
        };
      }
      return m;
    });

    setBookings(updatedBookings);
    setTokens(updatedTokens);
    setMeals(updatedMeals);
    
    syncToLocalStorage(users, updatedMeals, updatedBookings, updatedTokens, wasteLogs, currentUser);
    return { success: true };
  };

  const cancelMeal = async (dateStr: string, mealType: MealType): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    // Validate Cutoff
    const cutoff = getMealCutoff(dateStr, mealType);
    if (cutoff.isPassed) {
      return { success: false, error: `Cancellation cutoff has passed (${cutoff.formattedCutoff})` };
    }

    const bookingId = `${currentUser.uid}_${dateStr}_${mealType}`;
    const booking = bookings.find(b => b.id === bookingId);

    if (!booking || booking.status === 'cancelled') {
      return { success: false, error: 'No active booking found to cancel' };
    }

    // Update Booking status to cancelled
    const updatedBookings: Booking[] = bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b);

    // Cancel related token
    const updatedTokens = tokens.map(t => t.bookingId === bookingId ? { ...t, status: 'expired' as const } : t);

    // Reward points for cancelling in advance (food saving behavior)
    // +10 rewards and +0.4kg food saved (standard estimated plate weight)
    const pointsAwarded = 10;
    const foodSavedAmount = 0.4;
    
    const updatedCurrentUser = {
      ...currentUser,
      rewardPoints: currentUser.rewardPoints + pointsAwarded,
      foodSavedKg: Number((currentUser.foodSavedKg + foodSavedAmount).toFixed(1))
    };
    
    const updatedUsers = users.map(u => u.uid === currentUser.uid ? updatedCurrentUser : u);

    // Decrement Meal booked counts
    const updatedMeals = meals.map(m => {
      if (m.date === dateStr) {
        const mealInfo = m[mealType];
        return {
          ...m,
          [mealType]: {
            ...mealInfo,
            bookedCount: Math.max(0, mealInfo.bookedCount - 1)
          }
        };
      }
      return m;
    });

    setCurrentUser(updatedCurrentUser);
    setUsers(updatedUsers);
    setBookings(updatedBookings);
    setTokens(updatedTokens);
    setMeals(updatedMeals);

    syncToLocalStorage(updatedUsers, updatedMeals, updatedBookings, updatedTokens, wasteLogs, updatedCurrentUser);
    return { success: true };
  };

  const getUserBookings = (userId: string): Booking[] => {
    return bookings.filter(b => b.userId === userId);
  };

  const getUserActiveToken = (userId: string, dateStr: string, mealType: MealType): Token | null => {
    return tokens.find(t => t.userId === userId && t.date === dateStr && t.mealType === mealType && t.status === 'unused') || null;
  };

  // ==========================================
  // ADMIN ACTIONS
  // ==========================================

  const scanToken = async (tokenId: string): Promise<{ success: boolean; message: string; studentName?: string }> => {
    const tokenIndex = tokens.findIndex(t => t.id === tokenId);
    
    if (tokenIndex === -1) {
      return { success: false, message: 'Invalid QR Token code' };
    }
    
    const token = tokens[tokenIndex];
    
    if (token.status === 'used') {
      return { success: false, message: 'Token already used for dinner/lunch', studentName: token.userName };
    }
    
    if (token.status === 'expired') {
      return { success: false, message: 'Token has been cancelled or expired', studentName: token.userName };
    }

    // Expiry verification
    const now = new Date();
    const expiryTime = new Date(token.expiresAt);
    if (now.getTime() > expiryTime.getTime()) {
      // Mark as expired
      const updatedTokens = tokens.map((t, i) => i === tokenIndex ? { ...t, status: 'expired' as const } : t);
      setTokens(updatedTokens);
      syncToLocalStorage(users, meals, bookings, updatedTokens, wasteLogs, currentUser);
      return { success: false, message: 'Token has expired', studentName: token.userName };
    }

    // Set token to used
    const updatedTokens = tokens.map((t, i) => i === tokenIndex ? { ...t, status: 'used' as const } : t);

    // Increment meal attendance counter
    const updatedMeals = meals.map(m => {
      if (m.date === token.date) {
        const mealInfo = m[token.mealType];
        return {
          ...m,
          [token.mealType]: {
            ...mealInfo,
            attendedCount: mealInfo.attendedCount + 1
          }
        };
      }
      return m;
    });

    // Update student's profile statistics, streak, and rewards
    // +15 reward points for completing a booked meal
    const pointsAwarded = 15;
    
    const student = users.find(u => u.uid === token.userId);
    let updatedUsers = users;
    
    if (student) {
      const updatedStudent = {
        ...student,
        mealsAttended: student.mealsAttended + 1,
        rewardPoints: student.rewardPoints + pointsAwarded,
        streak: student.streak + 1 // Add 1 to current streak
      };
      
      updatedUsers = users.map(u => u.uid === token.userId ? updatedStudent : u);
      
      // If the scanned student is also the logged-in student, update local profile state
      if (currentUser && currentUser.uid === token.userId) {
        setCurrentUser(updatedStudent);
      }
    }

    setTokens(updatedTokens);
    setMeals(updatedMeals);
    setUsers(updatedUsers);
    
    syncToLocalStorage(updatedUsers, updatedMeals, bookings, updatedTokens, wasteLogs, currentUser);
    return { 
      success: true, 
      message: 'Token verification successful. Plate served!', 
      studentName: token.userName 
    };
  };

  const logWaste = async (dateStr: string, mealType: MealType, leftoverKg: number): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') return false;

    // Check if log already exists for this date and meal
    const existingIndex = wasteLogs.findIndex(w => w.date === dateStr && w.mealType === mealType);
    
    let updatedWasteLogs: WasteLog[];
    
    if (existingIndex !== -1) {
      updatedWasteLogs = wasteLogs.map((w, idx) => idx === existingIndex ? { ...w, leftoverKg, recordedBy: currentUser.name } : w);
    } else {
      const newLog: WasteLog = {
        id: 'w_' + Math.random().toString(36).substring(2, 9),
        date: dateStr,
        mealType,
        leftoverKg,
        recordedBy: currentUser.name,
        createdAt: new Date().toISOString()
      };
      updatedWasteLogs = [...wasteLogs, newLog];
    }

    setWasteLogs(updatedWasteLogs);
    syncToLocalStorage(users, meals, bookings, tokens, updatedWasteLogs, currentUser);
    return true;
  };

  const getAdminStats = (dateStr: string, mealType: MealType) => {
    const meal = meals.find(m => m.date === dateStr);
    if (!meal) {
      return { bookedCount: 0, attendedCount: 0, remainingExpected: 0 };
    }
    const mealInfo = meal[mealType];
    const remainingExpected = Math.max(0, mealInfo.bookedCount - mealInfo.attendedCount);
    
    return {
      bookedCount: mealInfo.bookedCount,
      attendedCount: mealInfo.attendedCount,
      remainingExpected
    };
  };

  // ==========================================
  // PREDICTION CALCULATIONS
  // ==========================================

  const calculatePrediction = (dateStr: string, mealType: MealType, factors: {
    isExamDay: boolean;
    weather: 'sunny' | 'cloudy' | 'rainy';
    isHoliday: boolean;
  }) => {
    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getDay();
    
    // Get active counts if date is today/tomorrow
    const meal = meals.find(m => m.date === dateStr);
    const currentBooked = meal ? meal[mealType].bookedCount : 0;
    
    // Calculate cancellations for the day
    const dayBookings = bookings.filter(b => b.date === dateStr && b.mealType === mealType);
    const cancellationCount = dayBookings.filter(b => b.status === 'cancelled').length;

    return predictMealDemand(
      dayOfWeek,
      mealType,
      totalStudents,
      currentBooked,
      cancellationCount,
      factors
    );
  };

  // ==========================================
  // ANALYTICS & REPORTS
  // ==========================================

  const getReportsData = () => {
    // Sort meals by date ascending, filter last 10 days
    const pastMeals = [...meals]
      .filter(m => new Date(m.date) < new Date(formatDate(new Date())))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);

    const labels = pastMeals.map(m => {
      const d = new Date(m.date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const booked = pastMeals.map(m => m.breakfast.bookedCount + m.lunch.bookedCount + m.dinner.bookedCount);
    const attended = pastMeals.map(m => m.breakfast.attendedCount + m.lunch.attendedCount + m.dinner.attendedCount);
    
    // Waste per day (sum of breakfast, lunch, dinner waste)
    const waste = pastMeals.map(m => {
      const dayLogs = wasteLogs.filter(w => w.date === m.date);
      return dayLogs.reduce((sum, current) => sum + current.leftoverKg, 0);
    });

    // Money saved cumulative calculation
    // We assume food waste has been reduced from an initial baseline of 45kg total waste per day
    let cumulativeSavings = 0;
    const baselineWastePerDay = 45; // kg average waste before MessMate
    
    const moneySavedCumulative = pastMeals.map(m => {
      const dayLogs = wasteLogs.filter(w => w.date === m.date);
      const actualWaste = dayLogs.reduce((sum, curr) => sum + curr.leftoverKg, 0);
      
      const wasteAvoided = Math.max(0, baselineWastePerDay - actualWaste);
      const savings = calculateSavings(wasteAvoided);
      cumulativeSavings += savings.moneySaved;
      return Number(cumulativeSavings.toFixed(2));
    });

    return {
      labels,
      booked,
      attended,
      waste,
      moneySavedCumulative
    };
  };

  // Do not render children until client hydration is finished
  if (!mounted) return null;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        meals,
        bookings,
        tokens,
        wasteLogs,
        totalStudents,
        loading,
        login,
        logout,
        bookMeal,
        cancelMeal,
        getUserBookings,
        getUserActiveToken,
        scanToken,
        logWaste,
        getAdminStats,
        calculatePrediction,
        getReportsData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
