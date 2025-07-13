import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { db } from '../utils/firebaseConfig'; // Corrected the import path

interface LeaderboardEntry {
  id: string;
  username: string;
  overallLevel: number;
}

const LeaderboardScreen = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
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
            <Text style={styles.level}>Lv. {item.overallLevel.toFixed(2)}</Text>
          </View>
        )}
      />
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
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  entryItem: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a9a9a9',
    width: 40,
  },
  username: {
    fontSize: 18,
    color: '#ffffff',
    flex: 1,
  },
  level: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
});

export default LeaderboardScreen;
