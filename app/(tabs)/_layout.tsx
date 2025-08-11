import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import { colors, shadows } from '../../theme/tokens';
import { typography } from '../../theme/typography';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused?: boolean;
}) {
  return (
    <FontAwesome 
      size={24} 
      style={{ 
        marginBottom: 0,
        textShadowColor: props.focused ? props.color : 'transparent',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: props.focused ? 8 : 0,
      }} 
      {...props} 
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accentAlt,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.accentAlt,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
          shadowColor: colors.accentAlt,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '600',
          marginTop: 4,
          textShadowColor: colors.bg,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        // Hide headers completely - use bottom tab highlighting instead
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="plus" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="skill-tree"
        options={{
          title: 'Skills',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="tree" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="trophy" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="user" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
