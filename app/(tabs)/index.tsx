import { Link } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>🏠 Home Screen</Text>

      <Link href="/log-workout" asChild>
        <Button title="Log Workout" />
      </Link>

      <Link href="/skill-tree" asChild>
        <Button title="Skill Tree" />
      </Link>

      <Link href="/profile" asChild>
        <Button title="Profile" />
      </Link>
    </View>
  );
}
