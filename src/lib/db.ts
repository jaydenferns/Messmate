import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { MealType, formatDate } from './utils';

// Firebase configuration structure (loaded optionally from environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase keys are fully provided to trigger production mode
const isFirebaseEnabled = 
  typeof window !== 'undefined' && 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let app;
let auth: any = null;
let db: any = null;

if (isFirebaseEnabled) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization failed. Falling back to Mock Mode.', error);
  }
}

export { auth, db, isFirebaseEnabled };

// ==========================================
// MOCK DATA TYPES
// ==========================================

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  streak: number;
  rewardPoints: number;
  mealsAttended: number;
  noShows: number;
  foodSavedKg: number;
}

export interface MealMenu {
  id: string; // YYYY-MM-DD
  date: string;
  breakfast: { menu: string; bookedCount: number; attendedCount: number };
  lunch: { menu: string; bookedCount: number; attendedCount: number };
  dinner: { menu: string; bookedCount: number; attendedCount: number };
}

export interface Booking {
  id: string; // userId_date_mealType
  userId: string;
  userName: string;
  date: string;
  mealType: MealType;
  status: 'booked' | 'cancelled';
  createdAt: string;
}

export interface Token {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  mealType: MealType;
  date: string;
  status: 'unused' | 'used' | 'expired';
  expiresAt: string;
}

export interface WasteLog {
  id: string;
  date: string;
  mealType: MealType;
  leftoverKg: number;
  recordedBy: string;
  createdAt: string;
}

// ==========================================
// GENERATE 14 DAYS OF HISTORICAL MOCK DATA
// ==========================================

export function generateMockDatabase() {
  const users: UserProfile[] = [
    {
      uid: 'u_1',
      email: 'jaydeep@hostel.edu',
      name: 'Jaydeep',
      role: 'student',
      streak: 5,
      rewardPoints: 350,
      mealsAttended: 38,
      noShows: 2,
      foodSavedKg: 4.8,
    },
    {
      uid: 'u_2',
      email: 'alex@hostel.edu',
      name: 'Alex Rivera',
      role: 'student',
      streak: 12,
      rewardPoints: 840,
      mealsAttended: 42,
      noShows: 0,
      foodSavedKg: 8.4,
    },
    {
      uid: 'u_3',
      email: 'priya@hostel.edu',
      name: 'Priya Sharma',
      role: 'student',
      streak: 0,
      rewardPoints: 120,
      mealsAttended: 25,
      noShows: 5,
      foodSavedKg: 1.2,
    },
    {
      uid: 'u_4',
      email: 'marcus@hostel.edu',
      name: 'Marcus Vance',
      role: 'student',
      streak: 8,
      rewardPoints: 480,
      mealsAttended: 32,
      noShows: 1,
      foodSavedKg: 3.6,
    },
    {
      uid: 'u_admin',
      email: 'admin@hostel.edu',
      name: 'Chef Rajan (Mess Head)',
      role: 'admin',
      streak: 0,
      rewardPoints: 0,
      mealsAttended: 0,
      noShows: 0,
      foodSavedKg: 0,
    }
  ];

  const meals: MealMenu[] = [];
  const bookings: Booking[] = [];
  const tokens: Token[] = [];
  const wasteLogs: WasteLog[] = [];

  const totalStudents = 150; // Total hostel size
  const today = new Date();

  // Create menu items for mapping
  const breakfastMenu = ['Aloo Paratha & Curd', 'Idli Sambar & Chutney', 'Poha & Jalebi', 'Bread Butter & Omelette', 'Puri Bhaji'];
  const lunchMenu = ['Dal Tadka, Rice, Mix Veg & Roti', 'Chole Bhature & Jeera Rice', 'Rajma Chawal, Raita & Salad', 'Kadhibari, Rice & Bhindi Fry', 'Veg Biryani, Salan & Curd'];
  const dinnerMenu = ['Shahi Paneer, Butter Roti & Rice', 'Chicken Curry, Roti & Rice', 'Egg Curry, Plain Dal & Roti', 'Alu Gobi, Yellow Dal & Phulka', 'Special Veg Pulao, Paneer Masala'];

  // Loop back 14 days and forward 2 days (for booking demos)
  for (let i = -14; i <= 2; i++) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + i);
    const dateStr = formatDate(targetDate);
    const dayOfWeek = targetDate.getDay();

    // Determine menus
    const menuIndex = Math.abs(dayOfWeek + i) % 5;
    
    // For past days, simulate realistic total bookings and actual attendance
    // Dips on weekends (Friday night, Saturday, Sunday)
    let baseAttendanceMultiplier = 0.85; // Default weekday
    if (dayOfWeek === 0) baseAttendanceMultiplier = 0.35; // Sunday dip
    else if (dayOfWeek === 6) baseAttendanceMultiplier = 0.50; // Saturday dip
    else if (dayOfWeek === 5) baseAttendanceMultiplier = 0.70; // Friday dip

    // Generate bookings count for this day
    const bBooked = Math.round(totalStudents * (baseAttendanceMultiplier + (Math.random() * 0.1 - 0.05)));
    const lBooked = Math.round(totalStudents * ((baseAttendanceMultiplier * 1.05) + (Math.random() * 0.1 - 0.05)));
    const dBooked = Math.round(totalStudents * ((baseAttendanceMultiplier * 0.95) + (Math.random() * 0.1 - 0.05)));

    // Actual attendance (some bookings will fail to show up, e.g. 5-15% no-show rate)
    // Over the last 14 days, the no-show rate is decreasing as MessMate is implemented
    const messmateImpactFactor = Math.max(0.1, 1 - (i + 14) * 0.05); // No-shows decrease from 15% to 5%
    const bNoShowRate = 0.05 + (Math.random() * 0.10) * messmateImpactFactor;
    const lNoShowRate = 0.04 + (Math.random() * 0.08) * messmateImpactFactor;
    const dNoShowRate = 0.06 + (Math.random() * 0.12) * messmateImpactFactor;

    const bAttended = Math.round(bBooked * (1 - bNoShowRate));
    const lAttended = Math.round(lBooked * (1 - lNoShowRate));
    const dAttended = Math.round(dBooked * (1 - dNoShowRate));

    meals.push({
      id: dateStr,
      date: dateStr,
      breakfast: { menu: breakfastMenu[menuIndex], bookedCount: bBooked, attendedCount: i >= 0 ? 0 : bAttended },
      lunch: { menu: lunchMenu[menuIndex], bookedCount: lBooked, attendedCount: i >= 0 ? 0 : lAttended },
      dinner: { menu: dinnerMenu[menuIndex], bookedCount: dBooked, attendedCount: i >= 0 ? 0 : dAttended }
    });

    // Record past bookings and tokens for the current main user (jaydeep@hostel.edu)
    // This gives them a real booking history in their UI
    if (i < 0) {
      // Jaydeep booked 80% of past meals and attended 95% of them
      const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
      mealTypes.forEach(meal => {
        const didBook = Math.random() < 0.85;
        if (didBook) {
          const bookingId = `u_1_${dateStr}_${meal}`;
          const didAttend = Math.random() < 0.95;

          bookings.push({
            id: bookingId,
            userId: 'u_1',
            userName: 'Jaydeep',
            date: dateStr,
            mealType: meal,
            status: 'booked',
            createdAt: new Date(targetDate.getTime() - 12 * 60 * 60 * 1000).toISOString()
          });

          tokens.push({
            id: `tok_past_${i}_${meal}`,
            bookingId,
            userId: 'u_1',
            userName: 'Jaydeep',
            mealType: meal,
            date: dateStr,
            status: didAttend ? 'used' : 'expired',
            expiresAt: new Date(targetDate.getTime() + 10 * 60 * 60 * 1000).toISOString()
          });
        } else {
          // Record explicit cancellations for some meals to simulate food saved points
          if (Math.random() < 0.3) {
            bookings.push({
              id: `u_1_${dateStr}_${meal}`,
              userId: 'u_1',
              userName: 'Jaydeep',
              date: dateStr,
              mealType: meal,
              status: 'cancelled',
              createdAt: new Date(targetDate.getTime() - 15 * 60 * 60 * 1000).toISOString()
            });
          }
        }
      });
    }

    // Historical Waste Logs (in kg)
    // Leftover waste is proportional to no-shows and cooking error margins
    // As MessMate tracking starts, cooking prediction improves, reducing average waste
    if (i < 0) {
      // Over the 14 days, waste reduces from 35kg/day to 8kg/day
      const baselineReduction = Math.max(8, 30 - (i + 14) * 1.5); 
      
      // Random variation
      const bWaste = Math.max(1, baselineReduction * 0.25 + (Math.random() * 4 - 2));
      const lWaste = Math.max(2, baselineReduction * 0.45 + (Math.random() * 6 - 3));
      const dWaste = Math.max(1.5, baselineReduction * 0.30 + (Math.random() * 4 - 2));

      wasteLogs.push(
        {
          id: `w_b_${dateStr}`,
          date: dateStr,
          mealType: 'breakfast',
          leftoverKg: Number(bWaste.toFixed(1)),
          recordedBy: 'Chef Rajan',
          createdAt: new Date(targetDate.getTime() + 10 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `w_l_${dateStr}`,
          date: dateStr,
          mealType: 'lunch',
          leftoverKg: Number(lWaste.toFixed(1)),
          recordedBy: 'Chef Rajan',
          createdAt: new Date(targetDate.getTime() + 15 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `w_d_${dateStr}`,
          date: dateStr,
          mealType: 'dinner',
          leftoverKg: Number(dWaste.toFixed(1)),
          recordedBy: 'Chef Rajan',
          createdAt: new Date(targetDate.getTime() + 22 * 60 * 60 * 1000).toISOString()
        }
      );
    }
  }

  // Pre-book today's lunch/dinner and tomorrow's meals for the demo user
  const todayStr = formatDate(today);
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  // Pre-book breakfast and lunch for today (assume breakfast was already served/expired)
  // Let's add a booking for Dinner today so the user sees a valid active QR code they can demo scan!
  const todayDinnerBookingId = `u_1_${todayStr}_dinner`;
  bookings.push({
    id: todayDinnerBookingId,
    userId: 'u_1',
    userName: 'Jaydeep',
    date: todayStr,
    mealType: 'dinner',
    status: 'booked',
    createdAt: new Date().toISOString()
  });

  tokens.push({
    id: 'tok_demo_active_dinner',
    bookingId: todayDinnerBookingId,
    userId: 'u_1',
    userName: 'Jaydeep',
    mealType: 'dinner',
    date: todayStr,
    status: 'unused',
    expiresAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString() // Valid
  });

  // Pre-book breakfast tomorrow
  const tomorrowBreakfastBookingId = `u_1_${tomorrowStr}_breakfast`;
  bookings.push({
    id: tomorrowBreakfastBookingId,
    userId: 'u_1',
    userName: 'Jaydeep',
    date: tomorrowStr,
    mealType: 'breakfast',
    status: 'booked',
    createdAt: new Date().toISOString()
  });

  tokens.push({
    id: 'tok_demo_tomorrow_bf',
    bookingId: tomorrowBreakfastBookingId,
    userId: 'u_1',
    userName: 'Jaydeep',
    mealType: 'breakfast',
    date: tomorrowStr,
    status: 'unused',
    expiresAt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString()
  });

  return {
    users,
    meals,
    bookings,
    tokens,
    wasteLogs,
    totalStudents
  };
}
