/**
 * Web map — Leaflet + OpenStreetMap tiles.
 * No API key required. Completely free.
 */
import 'leaflet/dist/leaflet.css'
import { useMap, MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import { Pin } from '@/lib/api'

// ── Fix default marker icon (Leaflet + bundlers break the default URL) ────────
const makeIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `
      <svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 24 14 24S28 23.625 28 14C28 6.27 21.73 0 14 0z"
          fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="14" cy="14" r="5" fill="#fff"/>
      </svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  })

// ── Forces layout recalculation after mount (fixes grey/broken tiles) ────────
function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 0)
  }, [map])
  return null
}

// ── Click handler component (must live inside MapContainer) ───────────────────
function ClickHandler({ onMapTap }: { onMapTap: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapTap(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Props {
  pins: Pin[]
  onMapTap: (lat: number, lng: number) => void
}

export default function FlappitMap({ pins, onMapTap }: Props) {
  return (
    <div style={{ height: '100%', width: '100%', minHeight: 400 }}>
      <MapContainer
        center={[35, 105]}   // default center: China
        zoom={4}
        style={{ height: '100%', width: '100%' }}
      >
        {/* OpenStreetMap tiles — free, no key needed */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <InvalidateSize />
        <ClickHandler onMapTap={onMapTap} />

        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={makeIcon(pin.color)}>
            <Popup>
              <strong>{pin.title}</strong>
              <br />
              <span style={{ fontSize: 12, color: '#888' }}>
                {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
