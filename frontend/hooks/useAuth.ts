import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Platform } from 'react-native'

import { authApi, setToken } from '../lib/api'

const TOKEN_KEY = 'flappit_token'

/** Read token from localStorage (web) or return null (native – in-memory only). */
export function loadStoredToken(): string | null {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

function persistToken(token: string | null) {
  setToken(token)
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }
}

export function useLogin() {
  const router = useRouter()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      persistToken(data.access_token)
      router.replace('/')
    },
  })
}

export function useRegister() {
  const router = useRouter()
  return useMutation({
    mutationFn: ({
      email,
      username,
      password,
    }: {
      email: string
      username: string
      password: string
    }) => authApi.register(email, username, password),
    onSuccess: (_user, variables) => {
      // Auto-login then send to onboarding for new users
      authApi.login(variables.email, variables.password).then((data) => {
        persistToken(data.access_token)
        router.replace('/onboarding')
      })
    },
  })
}

export function logout() {
  persistToken(null)
}
