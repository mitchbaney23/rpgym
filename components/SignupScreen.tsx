import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'; // Import ScrollView
import { auth, db } from '../utils/firebaseConfig';

export default function SignupScreen({ onSignupSuccess }: { onSignupSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username,
        email,
      });
      onSignupSuccess(); // go back to login
    } catch (err) {
      setError(`Signup failed: ${(err as Error).message}`);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
        />
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

        <View style={styles.buttons}>
          <Button title="Sign Up" onPress={handleSignup} />
          <View style={{ marginTop: 10 }} />
          <Button title="Cancel" color="#888" onPress={onSignupSuccess} />
        </View>
      </View>
    </ScrollView>
  );
}

// Updated styles for the ScrollView
const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Allows the container to grow to fill space
    justifyContent: 'center', // Centers the content vertically
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttons: {
    marginTop: 10,
  },
});
