import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import LoginScreen from '../components/LoginScreen';
import SignupScreen from '../components/SignupScreen'; // Import SignupScreen
import { auth } from '../utils/firebaseConfig';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [user, setUser] = useState<null | object>(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false); // State to manage which screen to show

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  // If the user is not logged in, decide which screen to show
  if (!user) {
    if (showSignup) {
      // Show SignupScreen and pass a function to switch back to login
      return <SignupScreen onSignupSuccess={() => setShowSignup(false)} />;
    }
    // Show LoginScreen and pass a function to switch to signup
    return <LoginScreen onShowSignup={() => setShowSignup(true)} />;
  }

  // If the user is logged in, show the main app
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
