import { MealType } from './utils';

export interface PredictionFactors {
  isExamDay: boolean;
  weather: 'sunny' | 'cloudy' | 'rainy';
  isHoliday: boolean;
}

export interface IngredientRequirement {
  name: string;
  quantity: number;
  unit: string;
}

export interface PredictionResult {
  predictedCount: number;
  expectedBookings: number;
  expectedNoShows: number;
  undecidedConversion: number;
  factorsApplied: {
    baseRate: number;
    noShowRate: number;
    modifier: number;
  };
  ingredients: IngredientRequirement[];
}

// Historical default rates based on weekday and meal type (simulated history)
// Key: weekday_mealType (0 = Sunday, 1 = Monday, etc.)
const HISTORICAL_BASELINES: Record<string, { bookingRate: number; noShowRate: number }> = {
  // Sunday (Massive dips, students eat out or go home)
  '0_breakfast': { bookingRate: 0.35, noShowRate: 0.25 },
  '0_lunch': { bookingRate: 0.40, noShowRate: 0.20 },
  '0_dinner': { bookingRate: 0.30, noShowRate: 0.30 },
  // Monday (High compliance)
  '1_breakfast': { bookingRate: 0.85, noShowRate: 0.08 },
  '1_lunch': { bookingRate: 0.80, noShowRate: 0.10 },
  '1_dinner': { bookingRate: 0.88, noShowRate: 0.07 },
  // Tuesday
  '2_breakfast': { bookingRate: 0.82, noShowRate: 0.09 },
  '2_lunch': { bookingRate: 0.78, noShowRate: 0.12 },
  '2_dinner': { bookingRate: 0.85, noShowRate: 0.08 },
  // Wednesday
  '3_breakfast': { bookingRate: 0.80, noShowRate: 0.10 },
  '3_lunch': { bookingRate: 0.75, noShowRate: 0.11 },
  '3_dinner': { bookingRate: 0.89, noShowRate: 0.06 }, // Special meal night
  // Thursday
  '4_breakfast': { bookingRate: 0.81, noShowRate: 0.09 },
  '4_lunch': { bookingRate: 0.76, noShowRate: 0.13 },
  '4_dinner': { bookingRate: 0.83, noShowRate: 0.10 },
  // Friday (Start of weekend dip)
  '5_breakfast': { bookingRate: 0.78, noShowRate: 0.12 },
  '5_lunch': { bookingRate: 0.65, noShowRate: 0.18 },
  '5_dinner': { bookingRate: 0.50, noShowRate: 0.22 },
  // Saturday
  '6_breakfast': { bookingRate: 0.45, noShowRate: 0.20 },
  '6_lunch': { bookingRate: 0.50, noShowRate: 0.15 },
  '6_dinner': { bookingRate: 0.40, noShowRate: 0.25 },
};

/**
 * Predicts attendance and calculates recommended ingredient amounts.
 * 
 * @param weekday Day of the week (0 = Sunday, 6 = Saturday)
 * @param mealType 'breakfast' | 'lunch' | 'dinner'
 * @param totalStudents Total registered students in hostel
 * @param currentBookings Current number of confirmed bookings
 * @param currentCancellations Current number of students who explicitly cancelled
 * @param factors Environmental variables (exams, weather, holiday)
 */
export function predictMealDemand(
  weekday: number,
  mealType: MealType,
  totalStudents: number,
  currentBookings: number,
  currentCancellations: number,
  factors: PredictionFactors
): PredictionResult {
  const key = `${weekday}_${mealType}`;
  const baseline = HISTORICAL_BASELINES[key] || { bookingRate: 0.75, noShowRate: 0.10 };

  const baseRate = baseline.bookingRate;
  const noShowRate = baseline.noShowRate;

  // 1. Calculate uncommitted/undecided students
  const uncommittedStudents = Math.max(0, totalStudents - currentBookings - currentCancellations);

  // 2. Adjust factors (Multipliers)
  let multiplier = 1.0;

  if (factors.isExamDay) {
    // Exam day: Students stay at hostel to study -> higher attendance at Mess
    multiplier += 0.12; 
  }

  if (factors.weather === 'rainy') {
    // Rainy weather: Students prefer not to step out -> higher attendance
    multiplier += 0.15;
  } else if (factors.weather === 'cloudy') {
    multiplier += 0.02;
  }

  if (factors.isHoliday) {
    // Holiday: Most students go home -> massive dip
    multiplier -= 0.60;
  }

  // Ensure multiplier doesn't drop below 0.1 (minimum attendance baseline)
  multiplier = Math.max(0.1, multiplier);

  // 3. Expected attendance from confirmed bookings (accounting for historic no-show rate)
  const expectedFromBookings = currentBookings * (1 - noShowRate);

  // 4. Expected conversion of uncommitted students based on historical base booking rate & current multiplier
  const adjustedConversionRate = Math.min(0.95, baseRate * multiplier);
  const expectedFromUncommitted = uncommittedStudents * adjustedConversionRate * (1 - noShowRate);

  // 5. Total predicted headcount
  let predictedCount = Math.round(expectedFromBookings + expectedFromUncommitted);
  
  // Predicted count shouldn't exceed bookings + uncommitted (unless bookings exist and we project standard no-shows)
  // Clamp predicted count to a logical ceiling of total remaining students
  const activeExpectedCeiling = currentBookings + Math.round(uncommittedStudents * adjustedConversionRate);
  predictedCount = Math.min(activeExpectedCeiling, predictedCount);
  predictedCount = Math.max(1, predictedCount); // At least 1 person predicted

  // Expected actual no-shows
  const expectedNoShows = Math.round(currentBookings * noShowRate);

  // 6. Ingredient Calculations (in kilograms/liters per person)
  const ingredients: IngredientRequirement[] = [];

  if (mealType === 'breakfast') {
    ingredients.push(
      { name: 'Wheat Flour (Atta)', quantity: Number((predictedCount * 0.08).toFixed(1)), unit: 'kg' },
      { name: 'Potatoes (Aloo)', quantity: Number((predictedCount * 0.10).toFixed(1)), unit: 'kg' },
      { name: 'Milk', quantity: Number((predictedCount * 0.15).toFixed(1)), unit: 'L' },
      { name: 'Tea Leaves / Coffee Powder', quantity: Number((predictedCount * 0.005).toFixed(2)), unit: 'kg' }
    );
  } else if (mealType === 'lunch') {
    ingredients.push(
      { name: 'Rice', quantity: Number((predictedCount * 0.12).toFixed(1)), unit: 'kg' },
      { name: 'Lentils (Dal)', quantity: Number((predictedCount * 0.06).toFixed(1)), unit: 'kg' },
      { name: 'Mixed Vegetables', quantity: Number((predictedCount * 0.15).toFixed(1)), unit: 'kg' },
      { name: 'Paneer / Tofu', quantity: Number((predictedCount * 0.05).toFixed(1)), unit: 'kg' },
      { name: 'Cooking Oil', quantity: Number((predictedCount * 0.015).toFixed(2)), unit: 'L' }
    );
  } else if (mealType === 'dinner') {
    // Dinner typically has Roti + Rice
    ingredients.push(
      { name: 'Rice', quantity: Number((predictedCount * 0.08).toFixed(1)), unit: 'kg' },
      { name: 'Wheat Flour (Roti)', quantity: Number((predictedCount * 0.07).toFixed(1)), unit: 'kg' },
      { name: 'Lentils (Dal)', quantity: Number((predictedCount * 0.05).toFixed(1)), unit: 'kg' },
      { name: 'Green Vegetables / Curry', quantity: Number((predictedCount * 0.12).toFixed(1)), unit: 'kg' },
      { name: 'Curd / Yogurt', quantity: Number((predictedCount * 0.08).toFixed(1)), unit: 'kg' }
    );
  }

  return {
    predictedCount,
    expectedBookings: currentBookings,
    expectedNoShows,
    undecidedConversion: Math.round(uncommittedStudents * adjustedConversionRate),
    factorsApplied: {
      baseRate,
      noShowRate,
      modifier: Number(multiplier.toFixed(2))
    },
    ingredients
  };
}

/**
 * Estimates monetary savings and food waste avoided.
 * Average cost of hostel meal = $1.50 (or local equivalent)
 * Average portion weight = 0.4 kg
 */
export function calculateSavings(wasteReductionKg: number): { moneySaved: number; carbonSavedKg: number } {
  const avgCostPerKg = 3.75; // $3.75 per kg of food
  const co2PerKgFood = 2.5;  // 2.5 kg CO2 emission saved per kg of food waste avoided

  return {
    moneySaved: Number((wasteReductionKg * avgCostPerKg).toFixed(2)),
    carbonSavedKg: Number((wasteReductionKg * co2PerKgFood).toFixed(1))
  };
}
