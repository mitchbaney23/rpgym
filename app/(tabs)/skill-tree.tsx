import { Link, useFocusEffect } from 'expo-router';
import { collection, doc, getDocs, query, setDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../utils/firebaseConfig';

export interface Skill {
  id: string; 
  name: string;
  level: number;
  progress: number;
}

// 1. Re-add the default skills array
const DEFAULT_SKILLS: Skill[] = [
  { id: 'push-ups', name: 'Push-ups', level: 0, progress: 0 },
  { id: 'sit-ups', name: 'Sit-ups', level: 0, progress: 0 },
  { id: 'squats', name: 'Squats', level: 0, progress: 0 },
  { id: 'pull-ups', name: 'Pull-ups', level: 0, progress: 0 },
  { id: '5k-run', name: '5K Run', level: 0, progress: 3600 },
];

const SkillTreeScreen = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  // 2. Re-add the function to create skills for a new user
  const initializeUserSkills = async (userId: string) => {
    try {
      const skillsCollectionRef = collection(db, 'users', userId, 'skills');
      for (const skill of DEFAULT_SKILLS) {
        const skillDocRef = doc(skillsCollectionRef, skill.id);
        await setDoc(skillDocRef, {
          name: skill.name,
          level: skill.level,
          progress: skill.progress,
        });
      }
      return DEFAULT_SKILLS;
    } catch (error) {
      console.error("Error initializing user skills:", error);
      return [];
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchSkills = async () => {
        if (!user) {
          setLoading(false);
          return;
        }
        try {
          const skillsCollectionRef = collection(db, 'users', user.uid, 'skills');
          const q = query(skillsCollectionRef);
          const querySnapshot = await getDocs(q);

          // 3. Add the logic to handle an empty query (a new user)
          if (querySnapshot.empty) {
            console.log("No skills found for user. Initializing defaults.");
            const initializedSkills = await initializeUserSkills(user.uid);
            setSkills(initializedSkills);
          } else {
            const userSkills = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as Skill[];
            setSkills(userSkills);
          }
        } catch (error) {
          console.error("Error fetching skills:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchSkills();
    }, [user])
  );

  if (loading && skills.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Skill Tree</Text>
      <FlatList
        data={skills}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/skill/${item.id}`} asChild>
            <Pressable style={styles.skillItem}>
              <Text style={styles.skillName}>{item.name}</Text>
              <Text style={styles.skillLevel}>Level: {item.level}</Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
};

// --- Styles remain the same ---
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
  skillItem: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: '#333',
    borderWidth: 1,
  },
  skillName: {
    fontSize: 18,
    color: '#ffffff',
  },
  skillLevel: {
    fontSize: 18,
    color: '#a9a9a9',
    fontWeight: '600',
  },
});

export default SkillTreeScreen;
