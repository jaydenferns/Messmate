# Implementation Plan - MessMate

MessMate is a Smart Mess Food Management and Demand Prediction System for college hostels designed to reduce food waste, accurately predict demand, track attendance via unique QR codes, and engage students with rewards and consistency streaks.

## User Review Required

> [!IMPORTANT]
> **Authentication & Firebase Setup:** To make the application immediately runnable and reviewable, we will build a **Dual-Mode Adapter System**.
> - **Mock/Demo Mode:** Uses client-side state / LocalStorage and mock backend APIs. It comes pre-populated with realistic historic data (attendance, bookings, waste logs) so you can immediately see the prediction model, statistics, and graphs work.
> - **Firebase Production Mode:** Uses Firebase Auth & Firestore. Activated simply by placing standard Firebase configuration keys in a `.env.local` file.
> Let us know if you prefer to enforce Firebase-only from the start, or if this dual-mode fits your testing and review workflow.

## Proposed Changes

We will scaffold a Next.js 14+ (App Router) project with Tailwind CSS, TypeScript, and ESLint.

### Project Architecture & Folders

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── student/
│   │   ├── page.tsx
│   │   ├── scan/           # Student QR ticket screen
│   │   └── stats/          # Streak, rewards & history
│   ├── admin/
│   │   ├── page.tsx        # Dashboard
│   │   ├── scan/           # Staff scanning terminal
│   │   ├── analytics/      # Demands & waste charts
│   │   └── menu/           # Menu editor / upload
│   └── api/
│       ├── booking/        # Book/cancel meal
│       ├── scan/           # Scans QR and registers attendance
│       ├── prediction/     # Calculates meal prediction
│       ├── waste/          # Leftover log submission
│       └── db/             # Optional administrative triggers
├── components/
│   ├── ui/                 # Buttons, modals, cards
│   ├── Layout/             # Navbars, PWA installation prompts
│   ├── Charts/             # Chart.js components
│   └── Scanner/            # QR Code Scanner wrapper
├── context/
│   └── AppContext.tsx      # Dual-mode DB controller (Mock vs Firebase)
├── lib/
│   ├── db.ts               # Core database adapter (Mock vs Firebase)
│   ├── prediction.ts       # Simple ML & statistical model
│   └── utils.ts            # Date formatting, cutoff calculators
```

---

### Database Schemas

We will define structures compatible with both MongoDB/Firestore documents:

#### 1. Users
- `uid`: String (Unique ID)
- `email`: String (College email validation)
- `name`: String
- `role`: `'student' | 'admin'`
- `streak`: Number (Current daily consecutive attended meals)
- `rewardPoints`: Number
- `mealsAttended`: Number
- `noShows`: Number
- `foodSavedKg`: Number

#### 2. Meals (Daily Menu Config)
- `id`: String (e.g., `2026-06-04`)
- `date`: String (YYYY-MM-DD)
- `breakfast`: `{ menu: string, bookedCount: number, attendedCount: number }`
- `lunch`: `{ menu: string, bookedCount: number, attendedCount: number }`
- `dinner`: `{ menu: string, bookedCount: number, attendedCount: number }`

#### 3. Bookings
- `id`: String (`userId_date_mealType`)
- `userId`: String
- `userName`: String
- `date`: String (YYYY-MM-DD)
- `mealType`: `'breakfast' | 'lunch' | 'dinner'`
- `status`: `'booked' | 'cancelled'`
- `createdAt`: Timestamp

#### 4. Tokens (Meal QR Tickets)
- `id`: String (Unique Hash / Cryptographic string)
- `bookingId`: String
- `userId`: String
- `userName`: String
- `mealType`: `'breakfast' | 'lunch' | 'dinner'`
- `date`: String (YYYY-MM-DD)
- `status`: `'unused' | 'used' | 'expired'`
- `expiresAt`: Timestamp

#### 5. WasteLogs
- `id`: String
- `date`: String (YYYY-MM-DD)
- `mealType`: `'breakfast' | 'lunch' | 'dinner'`
- `leftoverKg`: Number (Leftover food in kilograms)
- `portionsWasted`: Number
- `recordedBy`: String (Admin ID)
- `createdAt`: Timestamp

---

### UI/UX Design System (Aesthetics)
- **Primary Theme:** Clean Green & Pure White (Eco-Sustainability motif).
- **Colors:**
  - Background: Crisp Slate-50 / pure White (#FFFFFF)
  - Primary Eco-Green: Emerald (#059669 / #10B981)
  - Secondary Accent: Mint Green (#A7F3D0)
  - Dark Slate (Text): Slate-900 (#0F172A)
  - Warning/Cutoff: Amber-500 (#F59E0B) for countdown indicators
- **Typography:** Google Fonts: **Outfit** or **Inter** (clean, geometric, highly legible).
- **Visual Features:** Glassmorphism headers, smooth hover translations, elegant scale micro-animations for meal booking cards.

---

### Core Module Implementation

#### 1. Student App (Mobile-First)
- **Auth Page:** Quick email simulation (with validation for college domain `@hostel.edu` or similar) or Google Auth if Firebase is linked.
- **Booking Interface (2 Taps):**
  - **Tap 1:** Toggle booking state (Book/Cancel) for Breakfast, Lunch, or Dinner.
  - **Tap 2:** View and confirm. Shows countdown until cutoff time (e.g., Breakfast cutoff is 10:00 PM previous day; Lunch cutoff is 9:00 AM same day; Dinner cutoff is 4:00 PM same day).
- **QR Token Modal:** Opens a high-contrast modal displaying a large QR code. QR code contains:
  - Cryptographic token ID.
  - Valid window (date and time interval).
- **Stats Dashboard:** Shows cards with visual rings:
  - Meals Attended (Green)
  - Streak (Flame indicator 🔥)
  - No-Shows (Orange warning index)
  - Estimated Food Saved (kg) based on cancelled bookings.
  - Reward Points balance.

#### 2. Admin / Mess Dashboard (Tablet Friendly)
- **Live Counter:** Real-time counters showing Booking status:
  - Booked plates: `totalBooked`
  - Served plates: `checkedIn`
  - Missing/Remaining expected: `totalBooked - checkedIn`
- **Fast Scanner (HTML5 Camera scan):**
  - Instant camera viewfinder scan.
  - Validates token against database.
  - Returns positive feedback (Green check + Student name) or warning (Red - "Already Used", "Expired", or "Invalid Token").
- **Waste Logger:** Simple slider or input form to record meal-specific waste in kg at the end of service.
- **Retention & Waste Reports:**
  - Chart.js graphs showing:
    - Weekly booking vs actual attendance.
    - Day-by-day food waste metrics.
    - Money saved ($ per kg saved).

#### 3. Prediction Engine (Demand Calculation)
- **Phase 1 Model (Historical Average + Active Bookings):**
  - We calculate baseline historical attendance for each weekday (e.g., historical attendance on past 4 Wednesdays).
  - Let $H_{day, meal}$ be the average historical attendance rate.
  - Adjusted prediction formula:
    $$P = (B \times (1 - N_{historical})) + (S_{unbooked} \times H_{day, meal})$$
    where:
    - $B$ = Current confirmed bookings for the meal.
    - $N_{historical}$ = Historic no-show rate for this weekday.
    - $S_{unbooked}$ = Total registered students who have NOT booked or cancelled (still undecided).
  - Translates prediction directly to **Ingredient Quantities** (e.g. Rice: 100g/student, Vegetables: 150g/student, Dal: 80ml/student).
- **Phase 2 Enhancement (Simple Linear Regression / Special Events):**
  - Modifies $P$ using weights for:
    - Exams (+/- adjustment based on student load)
    - Weekends (usually massive dip in attendance)
    - Rainy/Sunny weather factor simulation.

---

## Verification Plan

### Automated & Manual Verification
1. **PWA & Responsiveness Testing:** Use Chrome DevTools Device Emulator to verify mobile layout for student route (`/student`) and tablet layout for admin route (`/admin`).
2. **Scanner Verification:** Support loading raw token values manually via input field as a fallback in case webcam access is restricted in the browser, ensuring full testability.
3. **Data Integrity Test:**
   - Book meal -> Verify booking database entry.
   - Scan QR code -> Verify token updates to `'used'`, attendance increments, and live count responds instantly.
   - Enter waste log -> Check that charts update with the newly registered waste.
4. **Prediction Simulation Test:**
   - Alter history records via a quick mock controls panel to see predicted quantities shift in real time.
