import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { useLogin, useRegister } from '../hooks/useAuth'

type Tab = 'login' | 'register'

export default function LoginScreen() {
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const login = useLogin()
  const register = useRegister()

  const loading = login.isPending || register.isPending
  const error = login.error?.message ?? register.error?.message

  function handleSubmit() {
    if (tab === 'login') {
      login.mutate({ email, password })
    } else {
      register.mutate({ email, username, password })
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <Text style={styles.logo}>Flappit</Text>
          <Text style={styles.tagline}>plan your next adventure</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'login' && styles.tabActive]}
            onPress={() => setTab('login')}
          >
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
              Log in
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'register' && styles.tabActive]}
            onPress={() => setTab('register')}
          >
            <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>
              Sign up
            </Text>
          </Pressable>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {tab === 'register' && (
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '...' : tab === 'login' ? 'Log in' : 'Create account'}
            </Text>
          </Pressable>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 48,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  error: {
    color: '#e53e3e',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
