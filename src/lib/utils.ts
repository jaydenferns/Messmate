/**
 * Utility functions for MessMate
 */

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface CutoffInfo {
  cutoffTime: Date;
  isPassed: boolean;
  formattedCutoff: string;
}

/**
 * Calculates the cutoff time for booking/cancelling a meal on a given target date.
 * - Breakfast: 10:00 PM of the PREVIOUS day.
 * - Lunch: 9:00 AM of the SAME day.
 * - Dinner: 4:00 PM of the SAME day.
 */
export function getMealCutoff(targetDateStr: string, mealType: MealType): CutoffInfo {
  const now = new Date();
  const targetDate = new Date(targetDateStr);
  
  // Set cutoff hours
  const cutoff = new Date(targetDate);
  let formattedCutoff = '';

  if (mealType === 'breakfast') {
    // 10:00 PM previous day
    cutoff.setDate(targetDate.getDate() - 1);
    cutoff.setHours(22, 0, 0, 0);
    formattedCutoff = '10:00 PM previous day';
  } else if (mealType === 'lunch') {
    // 9:00 AM same day
    cutoff.setHours(9, 0, 0, 0);
    formattedCutoff = '9:00 AM same day';
  } else {
    // Dinner: 4:00 PM same day
    cutoff.setHours(16, 0, 0, 0);
    formattedCutoff = '4:00 PM same day';
  }

  return {
    cutoffTime: cutoff,
    isPassed: now.getTime() > cutoff.getTime(),
    formattedCutoff
  };
}

/**
 * Check if the active time window for a meal is open for dining (token scanning)
 * e.g., Breakfast: 7:30 AM - 9:30 AM
 *       Lunch: 12:00 PM - 2:30 PM
 *       Dinner: 7:30 PM - 9:30 PM
 */
export function isMealTimeWindowOpen(mealType: MealType): { isOpen: boolean; message: string } {
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes();
  const timeVal = hours * 100 + mins; // e.g. 13:30 -> 1330

  let start = 0;
  let end = 0;
  let label = '';

  switch (mealType) {
    case 'breakfast':
      start = 730;
      end = 930;
      label = '7:30 AM - 9:30 AM';
      break;
    case 'lunch':
      start = 1200;
      end = 1430;
      label = '12:00 PM - 2:30 PM';
      break;
    case 'dinner':
      start = 1930;
      end = 2130;
      label = '7:30 PM - 9:30 PM';
      break;
  }

  const isOpen = timeVal >= start && timeVal <= end;
  return {
    isOpen,
    message: isOpen ? 'Open' : `Service runs during ${label}`
  };
}

export function generateTokenId(): string {
  return 'tok_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
