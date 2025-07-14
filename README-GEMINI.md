# RPGym - Gemini README

## Project Goal
To build RPGym, a gamified fitness app where users level up five core skills by logging their personal bests.

## Current Status (as of July 14, 2025)
The application is fully functional with a complete authentication and skill-tracking loop. Users can sign up, log in, view their skills, update their progress, see their overall level, and view their rank on a real-time leaderboard. The app has a consistent, themed UI and is deployed as a web app on Netlify for testing.

## Key Architectural Decisions & Logic

### 1. Leveling System:
- **Rep-Based Skills (Push-ups, Sit-ups, Squats):** `level = progress` (where progress is max reps).
- **Pull-ups:** `level = progress * 5`.
- **5K Run:**
    - `progress` is stored in total seconds.
    - Level 0 = 3600s (60:00). Level 99 = 1500s (25:00).
    - Formula: `level = Math.floor((3600 - progress) / 21)`.
- **Overall Level:**
    - Stored in the root user document (`/users/{uid}`) as `overallLevel`.
    - Calculated as `Math.round(sum_of_all_skill_levels / number_of_skills)`.
    - This calculation is triggered and updated every time any single skill is updated in `app/skill/[id].tsx`.

### 2. Data Flow & State Management:
- **Skill Initialization:** A `DEFAULT_SKILLS` constant exists in `app/(tabs)/skill-tree.tsx`. This list is created in Firestore for a new user the first time they visit the Skill Tree screen.
- **Screen Refreshing:** The Skill Tree (`skill-tree.tsx`) uses `useFocusEffect` to re-fetch data whenever the screen is focused.
- **Leaderboard:** The Leaderboard (`app/leaderboard.tsx`) uses a real-time `onSnapshot` listener to automatically update when user data changes in Firestore. It queries the `users` collection, ordered by `overallLevel` descending, with a limit of 20.

### 3. Navigation (Expo Router):
- The app uses a tab-based layout for the main screens (`(tabs)` folder).
- The leaderboard is a separate screen at `app/leaderboard.tsx`, accessible via a button on the Profile page.
- The skill detail pages are dynamic modal screens at `app/skill/[id].tsx`.

### 4. Deployment & Platform-Specific Code:
- The app is deployed as a static web app via `npx expo export` to Netlify.
- The Firebase config (`utils/firebaseConfig.ts`) uses `Platform.OS` to conditionally select the correct persistence layer:
    - **Mobile:** `getReactNativePersistence`
    - **Web:** `browserLocalPersistence`

## Design System
- **Palette ("Forged Steel & Ember"):**
    - Primary BG: `#1A1A1A`
    - Secondary BG: `#2C2C2C`
    - Text: `#E0E0E0`
    - Accent: `#FFA726`
- **Fonts:**
    - Headers: `PressStart2P`
    - Body/UI: `Roboto`
    