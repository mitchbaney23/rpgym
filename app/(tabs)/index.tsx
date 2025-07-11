import { collection, doc, getDocs, query, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../utils/firebaseConfig'; // Adjust path if needed

// Define the structure of a single skill
export interface Skill {
  id: string; // Document ID from Firestore (e.g., 'push-ups')
  name: string;
  level: number;
  progress: number; // Reps or seconds
}

// Define our five core skills with their default starting states
const DEFAULT_SKILLS: Skill[] = [
  { id: 'push-ups', name: 'Push-ups', level: 0, progress: 0 },
  { id: 'sit-ups', name: 'Sit-ups', level: 0, progress: 0 },
  { id: 'squats', name: 'Squats', level: 0, progress: 0 },
  { id: 'pull-ups', name: 'Pull-ups', level: 0, progress: 0 },
  { id: '5k-run', name: '5K Run', level: 0, progress: 3600 }, // Default progress is 60 mins (3600s)
];

const GymScreen = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  // Function to initialize default skills for a new user
  const initializeUserSkills = async (userId: string) => {
    try {
      const skillsCollectionRef = collection(db, 'users', userId, 'skills');
      // Use batch writes for efficiency
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
      return []; // Return empty on error
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSkills = async () => {
      setLoading(true);
      const skillsCollectionRef = collection(db, 'users', user.uid, 'skills');
      const q = query(skillsCollectionRef);
      
      try {
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // If no skills exist, initialize them
          console.log("No skills found for user. Initializing defaults.");
          const initializedSkills = await initializeUserSkills(user.uid);
          setSkills(initializedSkills);
        } else {
          // If skills exist, map them to our Skill interface
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
  }, [user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Skills</Text>
      <FlatList
        data={skills}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.skillItem}>
            <Text style={styles.skillName}>{item.name}</Text>
            <Text style={styles.skillLevel}>Level: {item.level}</Text>
          </View>
        )}
      />
    </View>
  );
};

// Simple styling to get started
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 50,
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

export default GymScreen;