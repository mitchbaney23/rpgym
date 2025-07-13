import { Link } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../utils/firebaseConfig';

interface Quest {
  id: string;
  title: string;
  completed: boolean;
}

const placeholderQuests: Quest[] = [
  { id: '1', title: 'Logged in successfully 3 days in a row', completed: false },
  { id: '2', title: 'Complete your first workout', completed: true },
  { id: '3', title: 'Reach Level 10 in any skill', completed: false },
  { id: '4', title: 'Log a workout for all five skills', completed: false },
  { id: '5', title: 'Achieve a new personal best in the 5K Run', completed: false },
];

const ProfileScreen = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUsername(docSnap.data().username);
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [user]);

  if (loading) {
    return <ActivityIndicator style={styles.container} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.username}>{username}</Text>
      
      {/* This is the button that was missing */}
      <Link href="/leaderboard" asChild>
        <Pressable style={styles.leaderboardButton}>
          <Text style={styles.leaderboardButtonText}>🏆 View Leaderboard</Text>
        </Pressable>
      </Link>

      <View style={styles.questsContainer}>
        <Text style={styles.sectionTitle}>Quests</Text>
        <FlatList
          data={placeholderQuests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.questItem}>
              <Text style={[styles.questTitle, item.completed && styles.completedQuest]}>
                {item.title}
              </Text>
              <Text style={styles.questStatus}>
                {item.completed ? '✅' : '🔳'}
              </Text>
            </View>
          )}
        />
      </View>

      <View style={styles.signOutButtonContainer}>
        <Button title="Sign Out" onPress={handleSignOut} color="#ff4757" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 20,
        paddingTop: 60,
    },
    username: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 20,
    },
    leaderboardButton: {
        backgroundColor: '#007BFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 30,
    },
    leaderboardButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    questsContainer: {
        flex: 1,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 15,
    },
    questItem: {
        backgroundColor: '#1e1e1e',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    questTitle: {
        fontSize: 16,
        color: '#ffffff',
        flex: 1,
    },
    completedQuest: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    questStatus: {
        fontSize: 20,
        marginLeft: 10,
    },
    signOutButtonContainer: {
        paddingTop: 20,
        borderTopColor: '#333',
        borderTopWidth: 1,
    },
});

export default ProfileScreen;
