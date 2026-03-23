import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'

import { loadStoredToken } from '../hooks/useAuth'
import { setToken } from '../lib/api'

const queryClient = new QueryClient()

const PUBLIC_ROUTES = ['login', 'onboarding']

export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()
  const [loaded, setLoaded] = useState(false)

  // Initialize token from persistent storage on startup
  useEffect(() => {
    const token = loadStoredToken()
    if (token) setToken(token)
    setLoaded(true)
  }, [])

  // Auth guard: re-reads storage each navigation so login/logout updates work
  useEffect(() => {
    if (!loaded) return
    const isPublic = PUBLIC_ROUTES.includes(segments[0] as string)
    const token = loadStoredToken()
    if (!token && !isPublic) {
      router.replace('/login')
    } else if (token && segments[0] === 'login') {
      router.replace('/')
    }
  }, [loaded, segments])

  if (!loaded) return null

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#1a1a1a',
          headerTitleStyle: { fontWeight: '700' },
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ title: 'Flappit' }} />
        <Stack.Screen name="trip/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'Travel Profile', presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  )
}
