import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useNote, useUpdateNote } from '@/hooks/useNotes'
import { streamAiChat } from '@/lib/api'
import Editor from '@/components/Editor'

const DEBOUNCE_MS = 800

export default function NoteScreen() {
  const { id: tripId, noteId } = useLocalSearchParams<{ id: string; noteId: string }>()
  const navigation = useNavigation()

  const { data: note, isLoading } = useNote(tripId, noteId)
  const updateNote = useUpdateNote(tripId, noteId)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState<any>(null)
  const [initialized, setInitialized] = useState(false)

  // AI assist state
  const [aiOpen, setAiOpen] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiStreaming, setAiStreaming] = useState(false)
  const aiScrollRef = useRef<ScrollView>(null)

  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (note && !initialized) {
      setTitle(note.title)
      setContent(note.content)
      setInitialized(true)
      navigation.setOptions({
        title: note.title || 'Note',
        headerRight: () => (
          <Pressable onPress={() => setAiOpen(true)} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 22 }}>✨</Text>
          </Pressable>
        ),
      })
    }
  }, [note, initialized])

  function handleTitleChange(text: string) {
    setTitle(text)
    navigation.setOptions({ title: text || 'Note' })
    if (titleTimer.current) clearTimeout(titleTimer.current)
    titleTimer.current = setTimeout(() => {
      updateNote.mutate({ title: text })
    }, DEBOUNCE_MS)
  }

  function handleContentChange(json: any) {
    setContent(json)
    if (contentTimer.current) clearTimeout(contentTimer.current)
    contentTimer.current = setTimeout(() => {
      updateNote.mutate({ content: json })
    }, DEBOUNCE_MS)
  }

  async function handleAiSend() {
    if (!aiInput.trim() || aiStreaming) return
    Keyboard.dismiss()
    setAiResponse('')
    setAiStreaming(true)
    try {
      let accumulated = ''
      for await (const chunk of streamAiChat(aiInput.trim(), 'notes', tripId)) {
        accumulated += chunk
        setAiResponse(accumulated)
        aiScrollRef.current?.scrollToEnd({ animated: false })
      }
    } catch {
      setAiResponse('Something went wrong. Please try again.')
    } finally {
      setAiStreaming(false)
    }
  }

  if (isLoading || !initialized) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={handleTitleChange}
        placeholder="Note title"
        placeholderTextColor="#ccc"
      />
      <View style={styles.divider} />
      <Editor initialContent={content} onChange={handleContentChange} />

      {/* AI assist modal */}
      <Modal visible={aiOpen} transparent animationType="slide">
        <View style={styles.aiOverlay}>
          <View style={styles.aiSheet}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiTitle}>✨ AI Writing Assistant</Text>
              <Pressable onPress={() => { setAiOpen(false); setAiResponse(''); setAiInput('') }}>
                <Text style={styles.aiClose}>✕</Text>
              </Pressable>
            </View>

            {/* Quick prompts */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
              {[
                'Expand this note',
                'Summarise in bullet points',
                'Translate to English',
                'Make it more vivid',
                'Suggest what to add',
              ].map((prompt) => (
                <Pressable
                  key={prompt}
                  style={styles.quickChip}
                  onPress={() => setAiInput(prompt)}
                >
                  <Text style={styles.quickChipText}>{prompt}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Response */}
            <ScrollView
              ref={aiScrollRef}
              style={styles.aiResponseArea}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {aiStreaming && !aiResponse && (
                <ActivityIndicator color="#3B82F6" style={{ marginTop: 12 }} />
              )}
              {aiResponse ? (
                <Text style={styles.aiResponseText}>{aiResponse}</Text>
              ) : !aiStreaming ? (
                <Text style={styles.aiPlaceholder}>
                  Pick a quick prompt or type your own below.
                </Text>
              ) : null}
            </ScrollView>

            {/* Input */}
            <View style={styles.aiInputBar}>
              <TextInput
                style={styles.aiInput}
                value={aiInput}
                onChangeText={setAiInput}
                placeholder="Ask AI to help with this note…"
                placeholderTextColor="#bbb"
                returnKeyType="send"
                onSubmitEditing={handleAiSend}
                editable={!aiStreaming}
              />
              <Pressable
                style={[styles.aiSendBtn, (aiStreaming || !aiInput.trim()) && styles.aiSendBtnDisabled]}
                onPress={handleAiSend}
                disabled={aiStreaming || !aiInput.trim()}
              >
                <Text style={styles.aiSendBtnText}>↑</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    padding: 20,
    paddingBottom: 12,
  },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 20 },

  // AI sheet
  aiOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  aiSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
  },
  aiTitle: { fontSize: 17, fontWeight: '800' },
  aiClose: { fontSize: 18, color: '#aaa' },
  quickRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f4f4f4',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  quickChipText: { fontSize: 13, color: '#555', fontWeight: '600' },
  aiResponseArea: { flex: 1, marginHorizontal: 16, maxHeight: 200 },
  aiResponseText: { fontSize: 15, color: '#1a1a1a', lineHeight: 23 },
  aiPlaceholder: { fontSize: 13, color: '#ccc', textAlign: 'center', marginTop: 16 },
  aiInputBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  aiInput: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
  },
  aiSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSendBtnDisabled: { backgroundColor: '#f0f0f0' },
  aiSendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
})
