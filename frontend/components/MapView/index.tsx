/**
 * Native map — react-native-maps with OpenStreetMap tiles.
 * Uses Apple Maps on iOS (free, no key) with OSM tile overlay.
 * Android note: requires Google Maps API key — see FANTASIES.md for Android strategy.
 */
import { StyleSheet } from 'react-native'
import MapView, { Marker, UrlTile, MapPressEvent } from 'react-native-maps'
import { Pin } from '@/lib/api'

interface Props {
  pins: Pin[]
  onMapTap: (lat: number, lng: number) => void
  onSavePin?: (lat: number, lng: number, title: string, color: string) => void
  onUpdatePin?: (pinId: string, title: string, color: string) => void
  onDeletePin?: (pinId: string) => void
}

export default function FlappitMap({ pins, onMapTap }: Props) {
  function handlePress(e: MapPressEvent) {
    const { latitude, longitude } = e.nativeEvent.coordinate
    onMapTap(latitude, longitude)
  }

  return (
    <MapView
      style={styles.map}
      mapType="none"              // hide default tiles — we use OSM below
      initialRegion={{
        latitude: 35,
        longitude: 105,
        latitudeDelta: 40,
        longitudeDelta: 40,
      }}
      onPress={handlePress}
    >
      {/* OpenStreetMap tile overlay — free, no key needed */}
      <UrlTile
        urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
        flipY={false}
      />

      {pins.map((pin) => (
        <Marker
          key={pin.id}
          coordinate={{ latitude: pin.lat, longitude: pin.lng }}
          title={pin.title}
          pinColor={pin.color}
        />
      ))}
    </MapView>
  )
}

const styles = StyleSheet.create({
  map: { flex: 1 },
})
