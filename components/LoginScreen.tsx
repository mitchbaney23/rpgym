import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
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
      Alert.alert("Enter Email", "Please enter your email address in the field above to reset your password.");
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert("Check Your Email", `A password reset link has been sent to ${email}.`);
      })
      .catch((error) => {
        console.error("Error sending password reset email:", error);
        setError("Failed to send reset email. Please try again.");
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleLogin} />
        <View style={styles.spacer} />
        <Button title="Forgot Password?" onPress={handleForgotPassword} color="#888" />
        <View style={styles.spacer} />
        <Button title="Sign Up" onPress={onShowSignup} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 10,
    borderRadius: 6,
  },
  error: { 
    color: 'red', 
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 10,
  },
  spacer: {
    height: 10,
  }
});
