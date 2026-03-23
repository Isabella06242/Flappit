/**
 * Trip Notes — single full-page document.
 * Shows: pinned places (live) + AI-generated travel narrative + free-form editor.
 */
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { usePins } from '../../../hooks/usePins'
import { useNotes, useCreateNote, useUpdateNote } from '../../../hooks/useNotes'
import { streamAiChat } from '../../../lib/api'

export default function TripNotesScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()

  const { data: pins = [] } = usePins(tripId)
  const { data: notes = [], isLoading: notesLoading } = useNotes(tripId)
  const createNote = useCreateNote(tripId)

  // The "trip overview" note — always the first note titled "Trip Notes"
  const overviewNote = notes.find((n) => n.title === 'Trip Notes') ?? notes[0] ?? null

  const [content, setContent] = useState('')
  const [aiText, setAiText] = useState('')
  const [aiStreaming, setAiStreaming] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentNoteId = overviewNote?.id ?? ''
  const updateNote = useUpdateNote(tripId, currentNoteId)

  // Load content when overview note is found; auto-create if missing
  useEffect(() => {
    if (notesLoading) return
    if (overviewNote) {
      const stored = overviewNote.content
      if (typeof stored === 'string') setContent(stored)
      else if (stored?.text) setContent(stored.text)
      else if (stored?.type === 'doc') setContent(extractText(stored))
    } else {
      createNote.mutate({ title: 'Trip Notes', content: { text: '' } })
    }
  }, [notesLoading, overviewNote?.id])

  useEffect(() => {
    navigation.setOptions({ title: 'Trip Notes' })
  }, [])

  function handleContentChange(text: string) {
    setContent(text)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (currentNoteId) updateNote.mutate({ content: { text } })
    }, 800)
  }

  async function handleGenerateAiNotes() {
    if (aiStreaming) return
    setAiText('')
    setAiStreaming(true)
    const pinList = pins.map((p) => p.title).join(', ')
    const prompt = pinList
      ? `Write a vivid, helpful travel narrative for a trip that includes these places: ${pinList}. Include what makes each place special, the best time to visit, local tips, and how to move between them. Keep it personal and exciting.`
      : 'Write a general travel planning note with tips for a great adventure.'

    try {
      let accumulated = ''
      for await (const chunk of streamAiChat(prompt, 'notes', tripId)) {
        accumulated += chunk
        setAiText(accumulated)
      }
    } catch {
      setAiText('Could not generate notes. Make sure the backend is running.')
    } finally {
      setAiStreaming(false)
    }
  }

  function handleApproveAi() {
    const combined = content ? `${content}\n\n---\n\n${aiText}` : aiText
    setContent(combined)
    setAiText('')
    if (currentNoteId) updateNote.mutate({ content: { text: combined } })
  }

  if (notesLoading && !overviewNote) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* Pinned Places */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>📍 Pinned Places</Text>
        {pins.length === 0 ? (
          <Text style={styles.emptyHint}>No pins yet — tap the map to add places.</Text>
        ) : (
          <View style={styles.pinList}>
            {pins.map((pin) => (
              <View key={pin.id} style={styles.pinRow}>
                <View style={[styles.pinDot, { backgroundColor: pin.color }]} />
                <Text style={styles.pinName}>{pin.title}</Text>
                <Text style={styles.pinCoords}>
                  {pin.lat.toFixed(3)}, {pin.lng.toFixed(3)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* AI Travel Narrative */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>✨ AI Travel Notes</Text>
          <Pressable
            style={[styles.generateBtn, aiStreaming && styles.generateBtnDisabled]}
            onPress={handleGenerateAiNotes}
            disabled={aiStreaming}
          >
            {aiStreaming
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.generateBtnText}>Generate</Text>
            }
          </Pressable>
        </View>

        {aiText ? (
          <View style={styles.aiBox}>
            <Text style={styles.aiText}>{aiText}</Text>
            {!aiStreaming && (
              <Pressable style={styles.approveBtn} onPress={handleApproveAi}>
                <Text style={styles.approveBtnText}>✓ Add to my notes</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <Text style={styles.emptyHint}>
            Tap Generate to create a travel narrative based on your pins.
          </Text>
        )}
      </View>

      {/* Free-form notes */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>📝 Your Notes</Text>
        <TextInput
          style={styles.noteInput}
          multiline
          placeholder="Start writing... jot down ideas, packing lists, things to try, people to visit..."
          placeholderTextColor="#bbb"
          value={content}
          onChangeText={handleContentChange}
          textAlignVertical="top"
        />
      </View>

    </ScrollView>
  )
}

/** Extract plain text from a TipTap JSON doc */
function extractText(node: any): string {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  if (node.content) return node.content.map(extractText).join('')
  return ''
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f9f9f9' },
  content: { padding: 16, paddingBottom: 60, gap: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptyHint: { fontSize: 13, color: '#bbb', fontStyle: 'italic' },
  pinList: { gap: 8 },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pinName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  pinCoords: { fontSize: 11, color: '#bbb' },
  generateBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 80,
    alignItems: 'center',
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  aiBox: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  aiText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  approveBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  noteInput: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 24,
    minHeight: 200,
    paddingTop: 4,
  },
})
