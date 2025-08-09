# Firestore Rules for Leaderboard Feature

To enable the leaderboard functionality in production, you'll need to update your Firestore security rules to allow reading limited user data for leaderboard purposes.

## Current Rules (Basic Security)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /skills/{skillId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /badges/{badgeId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Updated Rules for Leaderboard (Recommended)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Allow users to read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow authenticated users to read limited public data for leaderboards
      allow read: if request.auth != null && 
        resource.data.keys().hasOnly([
          'displayName', 
          'overallLevel', 
          'streakCount', 
          'lastUpdated'
        ]);
      
      match /skills/{skillId} {
        // Allow users to read/write their own skills
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Allow authenticated users to read other users' skills for profile viewing
        allow read: if request.auth != null;
      }
      
      match /badges/{badgeId} {
        // Allow users to read/write their own badges
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Allow authenticated users to read other users' badges for profile viewing
        allow read: if request.auth != null;
      }
    }
  }
}
```

## Alternative: Cloud Functions Approach (Most Secure)

For maximum security, consider implementing leaderboards via Cloud Functions:

```javascript
// Basic rules - keep data private
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /skills/{skillId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /badges/{badgeId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Public leaderboard collection managed by Cloud Functions
    match /leaderboard/{entry} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

Then create a Cloud Function that:
1. Runs periodically (e.g., every hour)
2. Calculates leaderboard from all user data
3. Updates the public `/leaderboard` collection
4. Provides an API endpoint for real-time user profile data

## Implementation Steps

1. **For Development**: The current app uses mock data, so no rule changes needed yet.

2. **For Production**: 
   - Choose your preferred security approach above
   - Update your `firestore.rules` file in the Firebase Console
   - Update the `fetchLeaderboard` function in `utils/leaderboard-example.ts` to use real Firestore queries
   - Test thoroughly to ensure privacy is maintained

## Security Considerations

- **Recommended Approach**: Use Cloud Functions for maximum security
- **Quick Approach**: Use the updated rules but be aware that some user data becomes readable by all authenticated users
- **Privacy**: Users' skills and badges become visible to others, but sensitive data (email, etc.) remains private
- **Performance**: Direct Firestore queries may be slower than Cloud Functions with cached data

## Current Status

✅ Leaderboard UI implemented  
✅ Mock data working  
⏳ Firestore rules need to be updated for real data  
⏳ Real Firestore queries commented out until rules are ready