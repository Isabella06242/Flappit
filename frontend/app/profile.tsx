import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/lib/api'

const AGE_OPTIONS = [
  { value: 'student', label: '🎒 Student' },
  { value: '20s', label: '🌟 20s' },
  { value: '30s', label: '✈️ 30s' },
  { value: '50s_plus', label: '🌿 50+' },
]

const BUDGET_OPTIONS = [
  { value: 'budget', label: '💰 Budget', sub: 'Hostels, street food, free sights' },
  { value: 'mid', label: '💰💰 Mid-range', sub: 'Comfortable stays, local restaurants' },
  { value: 'luxury', label: '💰💰💰 Luxury', sub: 'Boutique hotels, fine dining' },
]

export default function ProfileScreen() {
  const router = useRouter()
  const qc = useQueryClient()

  const [ageGroup, setAgeGroup] = useState<string | null>(null)
  const [budget, setBudget] = useState<string | null>(null)

  const updateProfile = useMutation({
    mutationFn: () =>
      profileApi.update({
        age_group: ageGroup ?? undefined,
        budget: budget ?? undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      router.back()
    },
  })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Your travel style</Text>
      <Text style={styles.sub}>
        Tell us a bit about yourself so our AI can give you spot-on recommendations.
      </Text>

      {/* Age group */}
      <Text style={styles.sectionLabel}>I am a…</Text>
      <View style={styles.optionRow}>
        {AGE_OPTIONS.map((o) => (
          <Pressable
            key={o.value}
            style={[styles.chip, ageGroup === o.value && styles.chipSelected]}
            onPress={() => setAgeGroup(o.value)}
          >
            <Text style={[styles.chipText, ageGroup === o.value && styles.chipTextSelected]}>
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Budget */}
      <Text style={styles.sectionLabel}>My travel budget</Text>
      <View style={styles.budgetList}>
        {BUDGET_OPTIONS.map((o) => (
          <Pressable
            key={o.value}
            style={[styles.budgetCard, budget === o.value && styles.budgetCardSelected]}
            onPress={() => setBudget(o.value)}
          >
            <Text style={[styles.budgetLabel, budget === o.value && styles.budgetLabelSelected]}>
              {o.label}
            </Text>
            <Text style={styles.budgetSub}>{o.sub}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.saveBtn, (!ageGroup || !budget) && styles.saveBtnDisabled]}
        onPress={() => updateProfile.mutate()}
        disabled={!ageGroup || !budget || updateProfile.isPending}
      >
        {updateProfile.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save profile</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, gap: 16 },
  heading: { fontSize: 26, fontWeight: '800', color: '#1a1a1a' },
  sub: { fontSize: 15, color: '#888', lineHeight: 22 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#555', marginTop: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f4f4f4',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: { borderColor: '#3B82F6', backgroundColor: '#fff5f5' },
  chipText: { fontSize: 15, color: '#444', fontWeight: '600' },
  chipTextSelected: { color: '#3B82F6' },
  budgetList: { gap: 10 },
  budgetCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  budgetCardSelected: { borderColor: '#3B82F6', backgroundColor: '#fff5f5' },
  budgetLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  budgetLabelSelected: { color: '#3B82F6' },
  budgetSub: { fontSize: 13, color: '#888', marginTop: 3 },
  saveBtn: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: '#aaa', fontSize: 14 },
})
