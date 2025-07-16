import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { auth, db } from '../utils/firebaseConfig';

export default function SignupScreen({ onSignupSuccess }: { onSignupSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');
    if (!username.trim() || !email || !password) {
      setError('All fields are required');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username,
        email,
        overallLevel: 0, // Initialize overallLevel for the leaderboard
      });
      Alert.alert("Account Created", "Your account has been successfully created. Please log in.");
      onSignupSuccess();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
      } else {
        setError(`Signup failed: ${err.message}`);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        placeholder="Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <Pressable style={styles.buttonPrimary} onPress={handleSignup}>
        <Text style={styles.buttonTextPrimary}>Sign Up</Text>
      </Pressable>

      <Pressable style={styles.buttonSecondary} onPress={onSignupSuccess}>
        <Text style={styles.buttonTextSecondary}>Already have an account? Login</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  title: { 
    fontFamily: 'PressStart2P',
    fontSize: 24, 
    marginBottom: 30, 
    textAlign: 'center',
    color: '#E0E0E0',
  },
  input: {
    fontFamily: 'Roboto',
    backgroundColor: '#2C2C2C',
    color: '#E0E0E0',
    borderWidth: 1, 
    borderColor: '#2C2C2C',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    fontSize: 16,
  },
  error: { 
    fontFamily: 'Roboto',
    color: '#ff4757', 
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#FFA726',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonTextPrimary: {
    fontFamily: 'Roboto',
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonSecondary: {
    padding: 15,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    fontFamily: 'Roboto',
    color: '#FFA726',
    fontSize: 14,
  }
});
