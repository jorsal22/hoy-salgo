import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ClubsListScreen from '../screens/ClubsListScreen';
import ClubDetailScreen from '../screens/ClubDetailScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClubsList" component={ClubsListScreen} />
      <Stack.Screen name="ClubDetail" component={ClubDetailScreen} />
    </Stack.Navigator>
  );
}