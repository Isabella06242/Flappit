/**
 * Thin fetch wrapper. All requests go to EXPO_PUBLIC_API_URL.
 * Auth token is read from module-level storage (set on login).
 */

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'

let _token: string | null = null

export function setToken(token: string | null) {
  _token = token
}

/** Always returns the best available token — module cache, then localStorage. */
function getToken(): string | null {
  if (_token) return _token
  // Fallback for page refresh / HMR: read directly from localStorage
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('flappit_token')
    if (stored) {
      _token = stored  // warm the in-memory cache for subsequent calls
      return stored
    }
  }
  return null
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    if (res.status === 401) {
      // Token expired or invalid — clear it so the auth guard redirects to login
      _token = null
      if (typeof localStorage !== 'undefined') localStorage.removeItem('flappit_token')
    }
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    // FastAPI OAuth2PasswordRequestForm requires form-encoded body
    const body = new URLSearchParams({ username: email, password })
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail ?? 'Login failed')
    }
    return res.json() as Promise<{ access_token: string; token_type: string }>
  },
  register: async (email: string, username: string, password: string) => {
    const res = await fetch(`${BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail ?? 'Registration failed')
    }
    return res.json() as Promise<User>
  },
}

// ── Trips ─────────────────────────────────────────────────────────────────────
export const tripsApi = {
  list: () => request<Trip[]>('/api/v1/trips'),
  get: (id: string) => request<Trip>(`/api/v1/trips/${id}`),
  create: (data: { title: string; description?: string }) =>
    request<Trip>('/api/v1/trips', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Trip>) =>
    request<Trip>(`/api/v1/trips/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/v1/trips/${id}`, { method: 'DELETE' }),
}

// ── Pins ──────────────────────────────────────────────────────────────────────
export const pinsApi = {
  list: (tripId: string) => request<Pin[]>(`/api/v1/trips/${tripId}/pins`),
  create: (tripId: string, data: CreatePinPayload) =>
    request<Pin>(`/api/v1/trips/${tripId}/pins`, { method: 'POST', body: JSON.stringify(data) }),
  update: (tripId: string, pinId: string, data: Partial<Pin>) =>
    request<Pin>(`/api/v1/trips/${tripId}/pins/${pinId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (tripId: string, pinId: string) =>
    request<void>(`/api/v1/trips/${tripId}/pins/${pinId}`, { method: 'DELETE' }),
}

// ── Notes ─────────────────────────────────────────────────────────────────────
export const notesApi = {
  list: (tripId: string) => request<Note[]>(`/api/v1/trips/${tripId}/notes`),
  get: (tripId: string, noteId: string) =>
    request<Note>(`/api/v1/trips/${tripId}/notes/${noteId}`),
  create: (tripId: string, data: { title: string; content?: any }) =>
    request<Note>(`/api/v1/trips/${tripId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (tripId: string, noteId: string, data: { title?: string; content?: any }) =>
    request<Note>(`/api/v1/trips/${tripId}/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (tripId: string, noteId: string) =>
    request<void>(`/api/v1/trips/${tripId}/notes/${noteId}`, { method: 'DELETE' }),
}

// ── Types ─────────────────────────────────────────────────────────────────────
// ── AI ────────────────────────────────────────────────────────────────────────
export async function* streamAiChat(
  message: string,
  mode: string = 'chat',
  tripId?: string,
): AsyncGenerator<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}/api/v1/ai/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, mode, trip_id: tripId ?? null }),
  })

  if (!res.ok || !res.body) throw new Error(`AI request failed: ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') return
      // Unescape newlines encoded by the backend
      yield data.replace(/\\n/g, '\n')
    }
  }
}

// ── AI Plan ───────────────────────────────────────────────────────────────────
export const planApi = {
  generate: (tripId: string) =>
    request<TravelPlan>('/api/v1/ai/plan', {
      method: 'POST',
      body: JSON.stringify({ trip_id: tripId }),
    }),
}

// ── Profile ───────────────────────────────────────────────────────────────────
export const profileApi = {
  update: (data: { age_group?: string; budget?: string }) =>
    request<User>('/api/v1/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  username: string
  age_group: string | null
  budget: string | null
  created_at: string
}

export interface Trip {
  id: string
  owner_id: string
  title: string
  description: string | null
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

export interface Pin {
  id: string
  trip_id: string
  note_id: string | null
  title: string
  lat: number
  lng: number
  place_id: string | null
  color: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  trip_id: string
  title: string
  content: any
  created_at: string
  updated_at: string
}

export interface TravelPlan {
  id: string
  trip_id: string
  content: {
    flights?: Array<{ from: string; to: string; notes: string }>
    accommodation?: Array<{ name: string; type: string; area: string; price_range: string; why: string }>
    extras?: Array<{ name: string; type: string; area: string; why: string }>
    days?: Array<{
      day: number
      title: string
      stops: Array<{ time: string; place: string; notes: string }>
      cost_estimate: string
      transport_notes: string
      steps_estimate: number
    }>
    raw?: string
  }
}

export interface CreatePinPayload {
  title: string
  lat: number
  lng: number
  color?: string
  note_id?: string
}
