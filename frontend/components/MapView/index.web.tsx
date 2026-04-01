/**
 * Web map — Leaflet + OpenStreetMap.
 * Self-contained: place search, reverse geocoding, pin create/edit/delete, nearby POI browsing.
 * Uses HTML overlays instead of React Native Modals for reliable web behaviour.
 */
import 'leaflet/dist/leaflet.css'
import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import { Pin } from '@/lib/api'

// ── Constants ─────────────────────────────────────────────────────────────────
const PIN_COLORS = ['#3B82F6', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF', '#FF9F43']

const PLATFORMS = [
  { name: '小红书',    emoji: '📕', url: (q: string) => `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(q)}` },
  { name: '大众点评',  emoji: '🍜', url: (q: string) => `https://www.dianping.com/search/keyword/0/0/${encodeURIComponent(q)}` },
  { name: '抖音',     emoji: '🎵', url: (q: string) => `https://www.douyin.com/search/${encodeURIComponent(q)}` },
  { name: 'TikTok',   emoji: '🎬', url: (q: string) => `https://www.tiktok.com/search?q=${encodeURIComponent(q)}` },
  { name: 'Instagram', emoji: '📸', url: (q: string) => `https://www.instagram.com/explore/tags/${encodeURIComponent(q.replace(/\s+/g, ''))}` },
  { name: 'Google Maps', emoji: '🗺️', url: (q: string) => `https://www.google.com/maps/search/${encodeURIComponent(q)}` },
  { name: 'Yelp',     emoji: '⭐', url: (q: string) => `https://www.yelp.com/search?find_desc=${encodeURIComponent(q)}` },
  { name: 'Tabelog',  emoji: '🍱', url: (q: string) => `https://tabelog.com/en/search/?vs=1&sa=${encodeURIComponent(q)}&sw=${encodeURIComponent(q)}` },
  { name: '马蜂窝',   emoji: '🐝', url: (q: string) => `https://www.mafengwo.cn/search/q.php?q=${encodeURIComponent(q)}` },
]

const NEARBY_COLOR: Record<string, string> = {
  restaurant: '#FF6B35', cafe: '#8B6914', bar: '#9B59B6',
  fast_food: '#E74C3C', pub: '#8E44AD', bakery: '#D35400',
  ice_cream: '#F1C40F', attraction: '#3498DB', museum: '#2980B9', viewpoint: '#27AE60',
}

// ── Icons ─────────────────────────────────────────────────────────────────────
// Bigger pin with drop-shadow + a colored label tag above it showing the place name
const makeUserIcon = (color: string, title: string) => {
  const label = title
    ? `<div style="position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:5px;background:${color};color:#fff;font-size:11px;font-weight:700;padding:3px 9px;border-radius:12px;white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 6px rgba(0,0,0,0.25);letter-spacing:0.2px">${title}</div>`
    : ''
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;display:inline-block">
        ${label}
        <svg width="36" height="48" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.45))">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 24 14 24S28 23.625 28 14C28 6.27 21.73 0 14 0z"
            fill="${color}" stroke="#fff" stroke-width="2.5"/>
          <circle cx="14" cy="14" r="5.5" fill="#fff"/>
        </svg>
      </div>`,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -48],
  })
}

const makeNearbyIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })

// ── Types ─────────────────────────────────────────────────────────────────────
interface CardState {
  lat: number
  lng: number
  name: string
  address: string
  color: string
  geocoding: boolean
  pin: Pin | null   // null = new pin, non-null = editing existing
}

interface NearbyPoi {
  id: number
  lat: number
  lng: number
  name: string
  type: string
}

interface SearchResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  name: string
}

interface Props {
  pins: Pin[]
  onMapTap: (lat: number, lng: number) => void   // kept for native compat, unused on web
  onSavePin?: (lat: number, lng: number, title: string, color: string) => void
  onUpdatePin?: (pinId: string, title: string, color: string) => void
  onDeletePin?: (pinId: string) => void
}

// ── Leaflet helpers ───────────────────────────────────────────────────────────
function InvalidateSize() {
  const map = useMap()
  useEffect(() => { setTimeout(() => map.invalidateSize(), 0) }, [map])
  return null
}

function MapController({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap()
  useEffect(() => { mapRef.current = map }, [map])
  return null
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng) } })
  return null
}

// ── Nominatim helpers ─────────────────────────────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; address: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'Flappit/1.0', 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8' } },
    )
    const d = await res.json()
    const name =
      d.name ||
      d.address?.amenity ||
      d.address?.shop ||
      d.address?.road ||
      d.address?.suburb ||
      d.address?.city ||
      ''
    return { name, address: d.display_name ?? '' }
  } catch {
    return { name: '', address: '' }
  }
}

async function searchPlaces(q: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
      { headers: { 'User-Agent': 'Flappit/1.0', 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8' } },
    )
    return await res.json()
  } catch {
    return []
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FlappitMap({ pins, onSavePin, onUpdatePin, onDeletePin }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [card, setCard] = useState<CardState | null>(null)
  const [nearbyPois, setNearbyPois] = useState<NearbyPoi[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchOpen, setSearchOpen] = useState(false)

  async function handleMapClick(lat: number, lng: number) {
    setSearchOpen(false)
    setCard({ lat, lng, name: '', address: '', color: PIN_COLORS[0], geocoding: true, pin: null })
    const { name, address } = await reverseGeocode(lat, lng)
    setCard((prev) => prev ? { ...prev, name, address, geocoding: false } : null)
  }

  function handlePinClick(pin: Pin) {
    setSearchOpen(false)
    setCard({ lat: pin.lat, lng: pin.lng, name: pin.title, address: '', color: pin.color, geocoding: false, pin })
  }

  function handleNearbyClick(poi: NearbyPoi) {
    const label = poi.type.replace(/_/g, ' ')
    const capitalized = label.charAt(0).toUpperCase() + label.slice(1)
    setCard({ lat: poi.lat, lng: poi.lng, name: poi.name, address: capitalized, color: PIN_COLORS[0], geocoding: false, pin: null })
  }

  function handleSearchInput(val: string) {
    setSearchQuery(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!val.trim()) { setSearchResults([]); setSearchOpen(false); return }
    searchTimeout.current = setTimeout(async () => {
      const results = await searchPlaces(val)
      setSearchResults(results)
      setSearchOpen(results.length > 0)
    }, 400)
  }

  function handleSearchSelect(result: SearchResult) {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    const name = result.name || result.display_name.split(',')[0].trim()
    setSearchQuery('')
    setSearchResults([])
    setSearchOpen(false)
    mapRef.current?.flyTo([lat, lng], 15, { animate: true, duration: 1 })
    setCard({ lat, lng, name, address: result.display_name, color: PIN_COLORS[0], geocoding: false, pin: null })
  }

  async function handleBrowseNearby() {
    if (!mapRef.current) return
    setLoadingNearby(true)
    const { lat, lng } = mapRef.current.getCenter()
    try {
      const q = `[out:json][timeout:10];(node[amenity~"restaurant|cafe|bar|fast_food|pub|bakery|ice_cream"](around:500,${lat},${lng});node[tourism~"attraction|museum|viewpoint"](around:500,${lat},${lng}););out body 30;`
      const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: q })
      const data = await res.json()
      const pois: NearbyPoi[] = (data.elements as any[])
        .filter((el) => el.tags?.name)
        .slice(0, 30)
        .map((el) => ({
          id: el.id, lat: el.lat, lng: el.lon,
          name: el.tags.name,
          type: el.tags.amenity || el.tags.tourism || 'place',
        }))
      setNearbyPois(pois)
    } catch { /* silently fail */ } finally {
      setLoadingNearby(false)
    }
  }

  function handleSave() {
    if (!card || !card.name.trim()) return
    if (card.pin) {
      onUpdatePin?.(card.pin.id, card.name.trim(), card.color)
    } else {
      onSavePin?.(card.lat, card.lng, card.name.trim(), card.color)
    }
    setCard(null)
  }

  function handleDelete() {
    if (!card?.pin) return
    onDeletePin?.(card.pin.id)
    setCard(null)
  }

  const nameForSearch = card?.name.trim() ?? ''

  return (
    <div style={{ height: '100%', width: '100%', minHeight: 400, position: 'relative' }}>
      <MapContainer center={[35, 105]} zoom={4} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${process.env.EXPO_PUBLIC_MAPBOX_TOKEN}`}
          maxZoom={22}
          tileSize={256}
        />
        <InvalidateSize />
        <MapController mapRef={mapRef} />
        <ClickHandler onMapClick={handleMapClick} />
        <ZoomControl position="bottomright" />

        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={makeUserIcon(pin.color, pin.title)}
            eventHandlers={{ click: (e) => { e.originalEvent.stopPropagation(); handlePinClick(pin) } }}
          />
        ))}

        {nearbyPois.map((poi) => (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={makeNearbyIcon(NEARBY_COLOR[poi.type] ?? '#FF9F43')}
            eventHandlers={{ click: (e) => { e.originalEvent.stopPropagation(); handleNearbyClick(poi) } }}
          />
        ))}
      </MapContainer>

      {/* Search bar */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2000, width: 280 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.2)', padding: '9px 14px', gap: 8 }}>
          <span style={{ fontSize: 15 }}>🔍</span>
          <input
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            placeholder="Search places…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: '#1a1a1a' }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false) }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, padding: 0, color: '#bbb', lineHeight: 1 }}
            >✕</button>
          )}
        </div>
        {searchOpen && searchResults.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', marginTop: 6, overflow: 'hidden' }}>
            {searchResults.map((r, i) => (
              <button
                key={r.place_id}
                onClick={() => handleSearchSelect(r)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer',
                  borderBottom: i < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
              >
                <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: 13, marginBottom: 2 }}>
                  {r.name || r.display_name.split(',')[0].trim()}
                </div>
                <div style={{ color: '#aaa', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.display_name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Browse Nearby button */}
      <div style={{ position: 'absolute', top: 80, right: 10, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          onClick={handleBrowseNearby}
          style={{ background: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {loadingNearby ? '⏳' : '📍'} Nearby
        </button>
        {nearbyPois.length > 0 && (
          <button
            onClick={() => setNearbyPois([])}
            style={{ background: '#fff', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#888', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Backdrop — closes card and search dropdown */}
      {(card || searchOpen) && (
        <div onClick={() => { setCard(null); setSearchOpen(false) }} style={{ position: 'absolute', inset: 0, zIndex: 1500 }} />
      )}

      {/* Place card */}
      {card && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2000,
            background: '#fff', borderRadius: '20px 20px 0 0',
            padding: '16px 20px 32px', boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
            maxHeight: '60%', overflowY: 'auto',
          }}
        >
          {/* Handle */}
          <div style={{ width: 36, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 16px' }} />

          {/* Name input */}
          {card.geocoding ? (
            <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 16px' }}>Identifying location…</p>
          ) : (
            <input
              autoFocus
              value={card.name}
              onChange={(e) => setCard((prev) => prev ? { ...prev, name: e.target.value } : null)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              placeholder="Place name"
              style={{
                width: '100%', fontSize: 18, fontWeight: 700,
                border: 'none', borderBottom: '2px solid #e8e8e8',
                outline: 'none', padding: '4px 0 6px', marginBottom: 4,
                background: 'transparent', color: '#1a1a1a', boxSizing: 'border-box',
              }}
            />
          )}

          {card.address && !card.geocoding && (
            <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 14px', lineHeight: 1.4 }}>{card.address}</p>
          )}

          {/* Search buttons */}
          {!card.geocoding && nameForSearch && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px', fontWeight: 600 }}>Search on</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {PLATFORMS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => window.open(p.url(nameForSearch), '_blank')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 20,
                      background: '#f4f4f4', border: '1px solid #e8e8e8',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#444',
                    }}
                  >
                    <span>{p.emoji}</span><span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color picker */}
          {!card.geocoding && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px', fontWeight: 600 }}>Pin color</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {PIN_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCard((prev) => prev ? { ...prev, color: c } : null)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', background: c,
                      border: card.color === c ? '3px solid #1a1a1a' : '2px solid transparent',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)', cursor: 'pointer', padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!card.geocoding && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {card.pin && (
                <button
                  onClick={handleDelete}
                  style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #fcc', background: '#fff5f5', color: '#e53e3e', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                >
                  Delete
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!nameForSearch}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none',
                  background: nameForSearch ? '#3B82F6' : '#ddd',
                  color: '#fff', fontWeight: 700,
                  cursor: nameForSearch ? 'pointer' : 'not-allowed', fontSize: 14,
                }}
              >
                {card.pin ? 'Save changes' : 'Save as Pin'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
