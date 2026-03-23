import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useTrip } from '@/hooks/useTrips'
import { usePins, useCreatePin } from '@/hooks/usePins'
import FlappitMap from '@/components/MapView'
import PinDropModal from '@/components/PinDropModal'
import AiPanel from '@/components/AiPanel'
import { CalendarIcon, AiIcon, NotesIcon } from '@/components/tabicons'

const PHRASES = [
  "We're going to {dest}!",
  "Wait for me, {dest}!",
  "{dest}, here we come!",
  "Adventure awaits in {dest}!",
  "Hello, {dest}!",
  "Off to {dest} we go!",
  "{dest} is calling!",
  "Can't wait for {dest}!",
]

function tripPhrase(trip: { id: string; title: string }) {
  const idx = trip.id.charCodeAt(0) % PHRASES.length
  return PHRASES[idx].replace('{dest}', trip.title)
}

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const router = useRouter()

  const { data: trip, isLoading: tripLoading } = useTrip(id)
  const { data: pins = [], isLoading: pinsLoading } = usePins(id)
  const createPin = useCreatePin(id)

  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [aiOpen, setAiOpen] = useState(false)

  useEffect(() => {
    if (!trip) return
    navigation.setOptions({
      title: tripPhrase(trip),
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16, marginRight: 16, alignItems: 'center' }}>
          <Pressable onPress={() => router.push(`/trip/${id}/plan` as any)}>
            <CalendarIcon size={24} />
          </Pressable>
          <Pressable onPress={() => setAiOpen(true)}>
            <AiIcon size={24} />
          </Pressable>
          <Pressable onPress={() => router.push(`/trip/${id}/notes` as any)}>
            <NotesIcon size={24} />
          </Pressable>
        </View>
      ),
    })
  }, [trip])

  function handleMapTap(lat: number, lng: number) {
    setPendingCoords({ lat, lng })
  }

  function handlePinConfirm(title: string, color: string) {
    if (!pendingCoords) return
    createPin.mutate({ title, lat: pendingCoords.lat, lng: pendingCoords.lng, color })
    setPendingCoords(null)
  }

  if (tripLoading || pinsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlappitMap pins={pins} onMapTap={handleMapTap} />

      <PinDropModal
        visible={!!pendingCoords}
        onConfirm={handlePinConfirm}
        onCancel={() => setPendingCoords(null)}
        isLoading={createPin.isPending}
      />

      <AiPanel
        visible={aiOpen}
        tripId={id}
        onClose={() => setAiOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
