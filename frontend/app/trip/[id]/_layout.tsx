import { Stack } from 'expo-router'

export default function TripLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#1a1a1a',
        headerTitleStyle: { fontWeight: '700' },
        headerTitleAlign: 'center',
      }}
    />
  )
}
