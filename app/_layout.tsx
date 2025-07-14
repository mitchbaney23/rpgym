import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import LoginScreen from '../components/LoginScreen';
import SignupScreen from '../components/SignupScreen';
import { auth } from '../utils/firebaseConfig';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<null | object>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  // Load the fonts
  const [fontsLoaded, fontError] = useFonts({
    'PressStart2P': require('../assets/fonts/PressStart2P-Regular.ttf'),
    'Roboto': require('../assets/fonts/Roboto-Regular.ttf'),
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Show a loading screen while fonts or auth state are loading
  if (!fontsLoaded || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  if (fontError) {
    // You can add better error handling here
    return <Text>Error loading fonts</Text>;
  }

  if (!user) {
    if (showSignup) {
      return <SignupScreen onSignupSuccess={() => setShowSignup(false)} />;
    }
    return <LoginScreen onShowSignup={() => setShowSignup(true)} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="leaderboard" options={{ presentation: 'modal', title: 'Leaderboard' }} />
        <Stack.Screen name="skill/[id]" options={{ presentation: 'modal', title: 'Update Skill' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
