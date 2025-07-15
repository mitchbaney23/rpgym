import { useEffect, useState } from 'react';
// 1. Import the Dimensions and Image components
import { doc, getDoc } from 'firebase/firestore';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../utils/firebaseConfig';

// 2. Get the width of the screen
const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    // ...this logic remains the same...
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUsername(docSnap.data().username);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
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
      <Image
        source={require('../../assets/images/guide-character.gif')}
        style={styles.characterImage}
      />
      <Text style={styles.welcomeText}>
        Welcome to the RPGym, {username}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  characterImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  welcomeText: {
    fontFamily: 'PressStart2P',
    // 3. Set a dynamic font size based on screen width, but cap it at 32
    fontSize: Math.min(screenWidth * 0.08, 24),
    // 4. Set a proportional line height
    lineHeight: Math.min(screenWidth * 0.08, 24) * 1.3,
    color: '#E0E0E0',
    textAlign: 'center',
  },
});

export default HomeScreen;