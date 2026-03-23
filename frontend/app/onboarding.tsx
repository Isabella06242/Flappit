import { useState } from 'react'
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'

import { profileApi, tripsApi } from '../lib/api'

type Step = 'destination' | 'age' | 'budget'

const AGE_OPTIONS = [
  { value: 'student', label: 'Student', emoji: '🎒', desc: 'Backpack life, budget adventures' },
  { value: '20s', label: '20s', emoji: '🌟', desc: 'Trendy spots, spontaneous plans' },
  { value: '30s', label: '30s', emoji: '✈️', desc: 'Quality stays, smooth experiences' },
  { value: '50+', label: '50+', emoji: '🌿', desc: 'Comfort, culture, take it slow' },
]

const BUDGET_OPTIONS = [
  { value: 'budget', label: 'Budget', emoji: '💰', desc: 'Street food & hostels' },
  { value: 'mid', label: 'Mid-range', emoji: '💰💰', desc: '3-star hotels & local gems' },
  { value: 'luxury', label: 'Luxury', emoji: '💰💰💰', desc: 'Fine dining & 5-star stays' },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('destination')
  const [destination, setDestination] = useState('')
  const [age, setAge] = useState('')
  const [budget, setBudget] = useState('')

  const createTrip = useMutation({ mutationFn: tripsApi.create })
  const updateProfile = useMutation({ mutationFn: profileApi.update })

  async function handleFinish() {
    // Save profile if selections made
    if (age || budget) {
      await updateProfile.mutateAsync({ age_group: age || undefined, budget: budget || undefined })
    }
    // Create trip from destination if provided
    if (destination.trim()) {
      const trip = await createTrip.mutateAsync({ title: destination.trim() })
      router.replace(`/trip/${trip.id}`)
    } else {
      router.replace('/')
    }
  }

  const loading = createTrip.isPending || updateProfile.isPending

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Progress dots */}
        <View style={styles.dots}>
          {(['destination', 'age', 'budget'] as Step[]).map((s, i) => (
            <View key={s} style={[styles.dot, step === s && styles.dotActive]} />
          ))}
        </View>

        {/* Step: Destination */}
        {step === 'destination' && (
          <View style={styles.stepContent}>
            <Text style={styles.question}>Where are you going?</Text>
            <Text style={styles.sub}>Enter your destination to create your first trip</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Tokyo, Japan"
              placeholderTextColor="#bbb"
              value={destination}
              onChangeText={setDestination}
              autoFocus
            />
            <View style={styles.actions}>
              <Pressable style={styles.skip} onPress={() => setStep('age')}>
                <Text style={styles.skipText}>Skip for now</Text>
              </Pressable>
              <Pressable
                style={[styles.next, !destination.trim() && styles.nextDisabled]}
                onPress={() => setStep('age')}
                disabled={!destination.trim()}
              >
                <Text style={styles.nextText}>Next</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step: Age group */}
        {step === 'age' && (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What's your travel style?</Text>
            <Text style={styles.sub}>We'll personalise recommendations for you</Text>
            <View style={styles.options}>
              {AGE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.option, age === opt.value && styles.optionSelected]}
                  onPress={() => setAge(opt.value)}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, age === opt.value && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.skip} onPress={() => setStep('budget')}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
              <Pressable
                style={[styles.next, !age && styles.nextDisabled]}
                onPress={() => setStep('budget')}
                disabled={!age}
              >
                <Text style={styles.nextText}>Next</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step: Budget */}
        {step === 'budget' && (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What's your budget?</Text>
            <Text style={styles.sub}>Helps the AI recommend the right places</Text>
            <View style={styles.options}>
              {BUDGET_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.option, budget === opt.value && styles.optionSelected]}
                  onPress={() => setBudget(opt.value)}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, budget === opt.value && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.skip} onPress={handleFinish} disabled={loading}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
              <Pressable
                style={[styles.next, (!budget || loading) && styles.nextDisabled]}
                onPress={handleFinish}
                disabled={!budget || loading}
              >
                <Text style={styles.nextText}>{loading ? '...' : "Let's go!"}</Text>
              </Pressable>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 40,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 48,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  stepContent: { flex: 1 },
  question: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 34,
    marginBottom: 8,
  },
  sub: {
    fontSize: 15,
    color: '#888',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  optionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#fff5f5',
  },
  optionEmoji: { fontSize: 28 },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  optionLabelSelected: { color: '#3B82F6' },
  optionDesc: { fontSize: 13, color: '#888', marginTop: 2 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
  },
  skip: { padding: 12 },
  skipText: { color: '#aaa', fontSize: 15 },
  next: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  nextDisabled: { opacity: 0.4 },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
