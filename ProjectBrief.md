# RPGym — Project Brief

## 🎯 Purpose
RPGym is a gamified fitness application designed to motivate users by blending workout tracking with RPG-style character progression. Users improve real-world fitness skills, which directly translates to "leveling up" their in-app character.

## 🕹️ Core Gameplay Loop
The user's journey is focused on tangible progression:
1.  **Select a Skill:** Users choose from one of five core fitness skills.
2.  **Log a New Best:** Instead of tracking individual workouts, users update their "personal best" for a skill (e.g., new max reps, faster time).
3.  **Level Up:** The app calculates a new level based on this updated progress.
4.  **View Progress:** The user's character, skill levels, and leaderboard ranking are updated to reflect their real-world improvement.

## 🧰 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React Native + Expo** | Core mobile and web application framework. |
| **Expo Router** | File-based routing for navigation between screens. |
| **Firebase Auth** | User authentication (email/password, session management). |
| **Firestore** | NoSQL database for storing user data (username, skills, levels).|
| **TypeScript** | Ensures type safety and code quality. |
| **Netlify** | Hosting for the web-based version of the app for testing. |

## 🚀 Features Completed
- **Full Authentication Flow:** Secure user signup, login, and session persistence. Includes password reset functionality.
- **Tab-Based Navigation:** A clean UI with three main sections: Home, Skill Tree, and Profile.
- **Skill Progression System:**
    - A **Skill Tree** screen lists all five skills and their current levels.
    - Dynamic **Skill Detail** pages for users to update their progress.
    - Custom UI for both rep-based (Push-ups) and time-based (5K Run) skills.
    - Automatic "Level Up!" notifications.
- **Leaderboard:**
    - An `overallLevel` is calculated by averaging all skill levels (rounded to the nearest whole number).
    - A real-time leaderboard, accessible from the profile, ranks users by their `overallLevel`.
- **Cross-Platform Deployment:** The app is configured to be deployed as a static website on Netlify, allowing for easy testing and sharing.
- **Themed UI:** A custom "Forged Steel & Ember" color palette and RPG-style fonts (`Press Start 2P`, `Roboto`) have been applied across the app for a consistent look and feel.

## 📝 Next Steps
- **Dynamic Character Model:** Implement the planned feature for the Home screen where a pixelated character's appearance (armor, weapons) upgrades dynamically based on the user's skill levels.
