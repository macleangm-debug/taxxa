import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F172A' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="create-password" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
