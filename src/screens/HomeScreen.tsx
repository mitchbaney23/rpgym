import React from 'react';
import { Button, Text, View } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>🏠 Home Screen</Text>
      <Button title="Log Workout" onPress={() => navigation.navigate('Log Workout')} />
      <Button title="Skill Tree" onPress={() => navigation.navigate('Skill Tree')} />
      <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
    </View>
  );
};

export default HomeScreen;
