import { Link } from 'expo-router';
import { collection, getDocs, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../utils/firebaseConfig';

// We can reuse the Skill interface
export interface Skill {
  id: string; 
  name: string;
  level: number;
  progress: number;
}

const SkillTreeScreen = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    // This function fetches the skills from Firestore.
    // We can reuse the logic from our previous home screen.
    const fetchSkills = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const skillsCollectionRef = collection(db, 'users', user.uid, 'skills');
        const q = query(skillsCollectionRef);
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
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

// We'll use a similar style to our old home screen, but you can customize it.
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