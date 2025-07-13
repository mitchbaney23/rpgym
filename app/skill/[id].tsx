import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from '../../utils/firebaseConfig';

const skillImageMap = {
  'push-ups': require('../../assets/images/push-ups.png'),
  'sit-ups': require('../../assets/images/sit-ups.png'),
  'squats': require('../../assets/images/squats.png'),
  'pull-ups': require('../../assets/images/pull-ups.png'),
  '5k-run': require('../../assets/images/5k-run.png'),
};

const SkillDetailPage = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [skillName, setSkillName] = useState('');
  const [initialLevel, setInitialLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentReps, setCurrentReps] = useState(0);
  const [minutes, setMinutes] = useState('0');
  const [seconds, setSeconds] = useState('0');

  useEffect(() => {
    if (!id) return;
    const skillId = Array.isArray(id) ? id[0] : id;

    const fetchSkillData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const skillDocRef = doc(db, 'users', user.uid, 'skills', skillId);
      const docSnap = await getDoc(skillDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSkillName(data.name);
        setInitialLevel(data.level);
        if (skillId === '5k-run') {
          setMinutes(String(Math.floor(data.progress / 60)));
          setSeconds(String(data.progress % 60));
        } else {
          setCurrentReps(data.progress);
        }
      }
      setLoading(false);
    };
    fetchSkillData();
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    const skillId = Array.isArray(id) ? id[0] : id;
    const user = auth.currentUser;
    if (!user) return;

    let newLevel = 0;
    let newProgress = 0;

    if (skillId === '5k-run') {
        const totalSeconds = (Number(minutes) * 60) + Number(seconds);
        if (totalSeconds < 1500 || totalSeconds > 3600) {
            Alert.alert("Invalid Time", "Please enter a time between 25:00 and 60:00.");
            return;
        }
        newProgress = totalSeconds;
        newLevel = Math.min(Math.floor((3600 - newProgress) / 21), 99);
    } else if (skillId === 'pull-ups') {
        newProgress = currentReps;
        newLevel = Math.min(Math.floor(newProgress * 5), 99);
    } else {
        newProgress = currentReps;
        newLevel = Math.min(newProgress, 99);
    }
    
    const skillDocRef = doc(db, 'users', user.uid, 'skills', skillId);
    
    try {
        await updateDoc(skillDocRef, { progress: newProgress, level: newLevel });

        const skillsQuery = query(collection(db, 'users', user.uid, 'skills'));
        const querySnapshot = await getDocs(skillsQuery);
        let totalLevel = 0;
        let skillCount = 0;
        querySnapshot.forEach(doc => {
            totalLevel += doc.data().level;
            skillCount++;
        });
        const overallLevel = skillCount > 0 ? totalLevel / skillCount : 0;
        
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { overallLevel: overallLevel });

        if (newLevel > initialLevel) {
            Alert.alert('🎉 Level Up! 🎉', `Congratulations! You're now level ${newLevel}!`);
        } else {
            Alert.alert('Progress Saved!', `${skillName} progress has been updated.`);
        }
        router.back();

    } catch (error) {
        console.error("Error updating skill:", error);
        Alert.alert('Error', 'Could not update your skill.');
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  const skillId = (Array.isArray(id) ? id[0] : id) as keyof typeof skillImageMap;
  const imageSource = skillImageMap[skillId];

  const renderInputUI = () => {
    if (skillId === '5k-run') {
      return (
        <>
          <Text style={styles.skillName}>{skillName}</Text>
          <View style={styles.timeInputContainer}>
            <TextInput style={styles.textInput} value={minutes} onChangeText={(text) => setMinutes(text.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={2} />
            <Text style={styles.timeSeparator}>:</Text>
            <TextInput style={styles.textInput} value={seconds} onChangeText={(text) => setSeconds(text.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={2} />
          </View>
        </>
      );
    }
    return (
      <>
        <Text style={styles.skillName}>{skillName}</Text>
        <View style={styles.inputContainer}>
          <Pressable style={styles.button} onPress={() => setCurrentReps(Math.max(0, currentReps - 1))}>
            <Text style={styles.buttonText}>-</Text>
          </Pressable>
          <TextInput style={styles.textInput} value={String(currentReps)} onChangeText={(text) => setCurrentReps(Number(text.replace(/[^0-9]/g, '')) || 0)} keyboardType="number-pad" />
          <Pressable style={styles.button} onPress={() => setCurrentReps(currentReps + 1)}>
            <Text style={styles.buttonText}>+</Text>
          </Pressable>
        </View>
      </>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.skillImage} resizeMode="contain" />
      </View>
      {renderInputUI()}
      <Pressable style={styles.saveButton} onPress={handleUpdate}>
        <Text style={styles.saveButtonText}>Update</Text>
      </Pressable>
    </View>
  );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        alignItems: 'center',
        padding: 20,
    },
    imageContainer: {
        height: '33%',
        width: '100%',
        backgroundColor: '#1e1e1e',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 30,
        overflow: 'hidden',
    },
    skillImage: {
        width: '80%',
        height: '80%',
    },
    skillName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 30,
    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    timeSeparator: {
        color: '#fff',
        fontSize: 32,
        marginHorizontal: 10,
    },
    button: {
        width: 60,
        height: 60,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
    },
    buttonText: {
        color: '#fff',
        fontSize: 30,
    },
    textInput: {
        width: 80,
        height: 60,
        borderColor: '#555',
        borderWidth: 2,
        borderRadius: 10,
        textAlign: 'center',
        color: '#fff',
        fontSize: 24,
        marginHorizontal: 10,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default SkillDetailPage;
