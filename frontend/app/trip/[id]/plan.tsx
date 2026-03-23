import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'

import { planApi, TravelPlan } from '../../../lib/api'

export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const [plan, setPlan] = useState<TravelPlan | null>(null)

  const generate = useMutation({
    mutationFn: () => planApi.generate(id),
    onSuccess: (data) => setPlan(data),
  })

  useEffect(() => {
    navigation.setOptions({ title: 'Travel Plan' })
  }, [])

  if (!plan && !generate.isPending) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>✨</Text>
        <Text style={styles.emptyTitle}>Generate your travel plan</Text>
        <Text style={styles.emptySub}>
          AI will build a day-by-day itinerary using your pinned places, suggest
          accommodation and extra gems that match your profile.
        </Text>
        {generate.isError && (
          <Text style={styles.error}>{(generate.error as Error).message}</Text>
        )}
        <Pressable style={styles.button} onPress={() => generate.mutate()}>
          <Text style={styles.buttonText}>Generate Plan</Text>
        </Pressable>
      </View>
    )
  }

  if (generate.isPending) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Building your perfect trip...</Text>
      </View>
    )
  }

  const { flights, accommodation, extras, days } = plan!.content

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* Flights */}
      {flights && flights.length > 0 && (
        <Section title="✈️ Getting There">
          {flights.map((f, i) => (
            <Card key={i}>
              <Text style={styles.cardTitle}>{f.from} → {f.to}</Text>
              {f.notes ? <Text style={styles.cardSub}>{f.notes}</Text> : null}
            </Card>
          ))}
        </Section>
      )}

      {/* Accommodation */}
      {accommodation && accommodation.length > 0 && (
        <Section title="🏨 Where to Stay">
          {accommodation.map((a, i) => (
            <Card key={i}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{a.name}</Text>
                <Text style={styles.badge}>{a.price_range}</Text>
              </View>
              <Text style={styles.cardMeta}>{a.type} · {a.area}</Text>
              {a.why ? <Text style={styles.cardSub}>{a.why}</Text> : null}
            </Card>
          ))}
        </Section>
      )}

      {/* Extras */}
      {extras && extras.length > 0 && (
        <Section title="💎 Don't Miss">
          {extras.map((e, i) => (
            <Card key={i}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{e.name}</Text>
                <Text style={[styles.badge, styles.badgeExtra]}>{e.type}</Text>
              </View>
              <Text style={styles.cardMeta}>{e.area}</Text>
              {e.why ? <Text style={styles.cardSub}>{e.why}</Text> : null}
            </Card>
          ))}
        </Section>
      )}

      {/* Day-by-day */}
      {days && days.length > 0 && (
        <Section title="🗓 Day by Day">
          {days.map((day) => (
            <View key={day.day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayNumber}>Day {day.day}</Text>
                <Text style={styles.dayTitle}>{day.title}</Text>
              </View>

              {day.stops.map((stop, i) => (
                <View key={i} style={styles.stop}>
                  <Text style={styles.stopTime}>{stop.time}</Text>
                  <View style={styles.stopBody}>
                    <Text style={styles.stopPlace}>{stop.place}</Text>
                    {stop.notes ? <Text style={styles.stopNotes}>{stop.notes}</Text> : null}
                  </View>
                </View>
              ))}

              <View style={styles.daySummary}>
                {day.cost_estimate ? (
                  <Text style={styles.summaryItem}>💰 {day.cost_estimate}</Text>
                ) : null}
                {day.steps_estimate ? (
                  <Text style={styles.summaryItem}>👟 ~{day.steps_estimate.toLocaleString()} steps</Text>
                ) : null}
                {day.transport_notes ? (
                  <Text style={styles.summaryItem}>🚶 {day.transport_notes}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </Section>
      )}

      {/* Re-run button */}
      <Pressable
        style={[styles.rerunButton, generate.isPending && styles.buttonDisabled]}
        onPress={() => generate.mutate()}
        disabled={generate.isPending}
      >
        <Text style={styles.rerunText}>
          {generate.isPending ? 'Regenerating...' : '↺ Regenerate Plan'}
        </Text>
      </Pressable>

    </ScrollView>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f9f9f9' },
  content: { padding: 16, paddingBottom: 40, gap: 8 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f9f9f9',
    gap: 16,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', textAlign: 'center' },
  emptySub: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 },
  error: { color: '#e53e3e', fontSize: 14, textAlign: 'center' },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadingText: { color: '#888', fontSize: 15, marginTop: 12 },
  section: { marginBottom: 8, gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a1a', marginBottom: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  cardMeta: { fontSize: 12, color: '#aaa' },
  cardSub: { fontSize: 13, color: '#666', lineHeight: 18 },
  badge: {
    backgroundColor: '#fff5f5',
    color: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  badgeExtra: { backgroundColor: '#f0f7ff', color: '#4A90E2' },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayNumber: {
    backgroundColor: '#3B82F6',
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  dayTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  stop: { flexDirection: 'row', gap: 10 },
  stopTime: { fontSize: 12, color: '#3B82F6', fontWeight: '700', width: 44, paddingTop: 2 },
  stopBody: { flex: 1 },
  stopPlace: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  stopNotes: { fontSize: 12, color: '#888', marginTop: 2 },
  daySummary: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  summaryItem: { fontSize: 13, color: '#555' },
  rerunButton: {
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  rerunText: { color: '#3B82F6', fontSize: 15, fontWeight: '700' },
})
