import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from '../utils/firebaseConfig';

export default function LoginScreen({ onShowSignup }: { onShowSignup: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
        setError('Please enter both email and password.');
        return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('Invalid email or password');
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert("Enter Email", "Please enter your email address to reset your password.");
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert("Check Your Email", `A password reset link has been sent to ${email}.`);
      })
      .catch(() => {
        setError("Failed to send reset email. Please try again.");
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RPGym</Text>
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
      
      <Pressable style={styles.buttonPrimary} onPress={handleLogin}>
        <Text style={styles.buttonTextPrimary}>Login</Text>
      </Pressable>

      <Pressable style={styles.buttonSecondary} onPress={handleForgotPassword}>
        <Text style={styles.buttonTextSecondary}>Forgot Password?</Text>
      </Pressable>
      
      <Pressable style={styles.buttonSecondary} onPress={onShowSignup}>
        <Text style={styles.buttonTextSecondary}>Don't have an account? Sign Up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  title: { 
    fontFamily: 'PressStart2P',
    fontSize: 32, 
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
