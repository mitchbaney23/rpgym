import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { db } from '../utils/firebaseConfig';

interface LeaderboardEntry {
  id: string;
  username: string;
  overallLevel: number;
}

const LeaderboardScreen = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('overallLevel', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: LeaderboardEntry[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        data.push({
          id: doc.id,
          username: userData.username,
          overallLevel: userData.overallLevel || 0,
        });
      });
      setLeaderboardData(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leaderboard in real-time: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.container} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Leaderboard</Text>
      <FlatList
        data={leaderboardData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.entryItem}>
            <Text style={styles.rank}>{index + 1}</Text>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.level}>Lv. {item.overallLevel}</Text>
          </View>
        )}
      />
    </View>
  );
};

// --- Updated Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A', // New background color
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontFamily: 'PressStart2P', // New header font
    fontSize: 24,
    color: '#E0E0E0', // New text color
    marginBottom: 20,
    textAlign: 'center',
  },
  entryItem: {
    backgroundColor: '#2C2C2C', // New secondary background
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    fontFamily: 'Roboto', // New body font
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E0E0',
    width: 40,
  },
  username: {
    fontFamily: 'Roboto', // New body font
    fontSize: 18,
    color: '#E0E0E0',
    flex: 1,
  },
  level: {
    fontFamily: 'Roboto', // New body font
    fontSize: 18,
    fontWeight: '600',
    color: '#FFA726', // New accent color
  },
});

export default LeaderboardScreen;
