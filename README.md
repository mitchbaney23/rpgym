# RPGym - Gamified Fitness Tracking App

RPGym is a gamified fitness tracking mobile application built with Expo and React Native that transforms your workout journey into an RPG-style experience. Track your progress across 5 core exercises, level up your skills, unlock badges, and maintain streaks to stay motivated!

## 🎮 Features

### Core Functionality
- **5 Skills System**: Track progress in pushups, situps, squats, pullups, and 5K runs
- **Level-Based Progression**: Each skill has levels 0-99 with deterministic calculations
- **Personal Record Logging**: Record your best performances to level up
- **Daily Streaks**: Maintain motivation with streak tracking
- **Badge System**: Unlock milestone badges at levels 10, 20, 30, 40, 50, 60, 70, 80, 90, and the golden L99 badge

### User Experience
- **Clean, Intuitive UI**: Modern design with progress rings and visual feedback
- **Haptic Feedback**: Enhanced user experience with tactile responses
- **Level-Up Celebrations**: Animated banners when you reach new levels
- **Achievement Sharing**: Share your progress card with friends
- **Cross-Platform**: Works on iOS, Android (via Expo Go), and Web

## 🛠 Tech Stack

- **Framework**: Expo with React Native + TypeScript
- **Navigation**: Expo Router with tab-based navigation
- **Authentication**: Firebase Auth with email/password
- **Database**: Cloud Firestore with real-time updates
- **State Management**: Zustand for app state
- **Styling**: React Native StyleSheet with custom theme system
- **Graphics**: react-native-svg for progress rings and visual elements
- **Haptics**: expo-haptics for tactile feedback

## 📱 App Structure

### Screens
- **Home**: Progress rings for all skills, streak flame, and "Log PR" CTA
- **Skill Tree**: List view of all skills with detailed progress info
- **Skill Detail**: Individual skill view with PR logging form
- **Profile**: User stats, badge grid, and sharing options
- **Authentication**: Login, signup, and password reset flows
- **Share Card**: Screenshot-friendly achievement card

### Core Components
- `ProgressRing`: Circular progress indicator for skill levels
- `StreakFlame`: Animated flame that grows with streak count
- `Badge`: Milestone achievement badges with lock states
- `LevelUpBanner`: Celebration animation for level increases
- `Button`: Consistent button component with multiple variants
- `TextInput`: Form input with validation and error states

## 🧮 Level Calculation Logic

The app uses deterministic level calculations:

- **Pushups/Situps/Squats**: `level = min(99, reps)`
- **Pullups**: `level = min(99, reps × 5)` (harder exercise, bonus multiplier)
- **5K Run**: `level = clamp(floor((3600 - seconds) / 21), 0, 99)` (60 min = L0, each 21s improvement = +1 level)

## 🔥 Streak System

- Streaks increment when logging a PR or completing daily quests on a new calendar day
- Streak flame height scales logarithmically: 1 day = 20%, 7 days = 50%, 30 days = 80%, 100+ days = 100%
- Breaks if no activity for 48+ hours

## 🏆 Badge System

Users unlock milestone badges at specific levels:
- **Bronze tier**: Levels 10, 20, 30, 40
- **Silver tier**: Levels 50, 60, 70, 80
- **Gold tier**: Level 90
- **Golden badge**: Level 99 (ultimate achievement)

## 🚀 Getting Started

### Prerequisites
- Node.js (14 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project with Auth and Firestore enabled

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd rpgym
   npm install
   ```

2. **Set up Firebase**:
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication with Email/Password provider
   - Create a Firestore database
   - Copy your Firebase config

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase configuration values in `.env`:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Deploy Firestore security rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Start the development server**:
   ```bash
   npx expo start
   ```

### Running the App

- **iOS Simulator**: Press `i` in the terminal or scan QR code with iOS Camera
- **Android Emulator**: Press `a` in the terminal or scan QR code with Expo Go app
- **Web Browser**: Press `w` in the terminal

## 📁 Project Structure

```
rpgym/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Home screen
│   │   ├── skill-tree.tsx       # Skills list
│   │   └── profile.tsx          # Profile & badges
│   ├── auth/                    # Authentication screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── reset.tsx
│   ├── skill/[id].tsx           # Dynamic skill detail
│   └── share-card.tsx           # Modal share screen
├── components/                   # Reusable UI components
│   ├── ProgressRing.tsx
│   ├── StreakFlame.tsx
│   ├── Badge.tsx
│   ├── LevelUpBanner.tsx
│   ├── Button.tsx
│   └── TextInput.tsx
├── lib/                         # Business logic & services
│   ├── firebase.ts              # Firebase configuration
│   ├── auth.ts                  # Authentication helpers
│   ├── firestore.ts             # Database operations
│   └── store.ts                 # Zustand state management
├── utils/                       # Utility functions
│   ├── levels.ts                # Level calculations
│   ├── streak.ts                # Streak logic
│   └── dates.ts                 # Date utilities
├── types/                       # TypeScript definitions
│   └── domain.ts                # App domain types
├── theme/                       # Design system
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── index.ts
└── firestore.rules              # Database security rules
```

## 🔒 Security

- **Authentication**: Firebase Auth handles secure user authentication
- **Database**: Firestore security rules ensure users can only access their own data
- **Validation**: Client-side input validation with server-side security rules
- **Environment**: Sensitive configuration stored in environment variables

## 🚀 Deployment

### Mobile Apps
- **iOS**: Use EAS Build to create iOS builds for App Store
- **Android**: Use EAS Build to create APK/AAB for Google Play Store

### Web App
- **Netlify**: The app is configured for web deployment
  ```bash
  npx expo export -p web
  # Deploy the dist/ folder to Netlify
  ```

## 🔮 Future Enhancements

### Planned Features
- **Daily Quests**: Small daily challenges for each skill
- **Social Features**: Friend lists, leaderboards, and challenges
- **Workout Programs**: Structured training plans with RPG progressions
- **Custom Workouts**: Track additional exercises beyond the core 5
- **Analytics Dashboard**: Detailed progress charts and insights
- **Push Notifications**: Streak reminders and achievement celebrations
- **Offline Mode**: Track workouts without internet connection
- **Apple Health/Google Fit**: Integration with health platforms

### Technical Improvements
- **Performance**: Implement React.memo and useMemo for optimization
- **Testing**: Add unit tests with Jest and integration tests with Detox
- **Monitoring**: Add crash reporting with Sentry
- **Analytics**: Implement user analytics (respecting privacy)
- **Accessibility**: Enhanced screen reader support and larger text options

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

For support, email [support@rpgym.app](mailto:support@rpgym.app) or open an issue on GitHub.

---

**Ready to level up your fitness journey? Download RPGym and start your quest today!** 🏋️‍♂️💪🎮