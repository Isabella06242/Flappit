/**
 * AI assistant panel — slides up from the bottom of the trip screen.
 * Supports streaming responses from the backend Claude endpoint.
 */
import { useRef, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { streamAiChat } from '@/lib/api'

interface AiPanelProps {
  visible: boolean
  tripId: string
  onClose: () => void
}

type Mode = 'restaurant' | 'hotel' | 'itinerary' | 'chat'

const MODES: { value: Mode; emoji: string; label: string; prompt: string }[] = [
  {
    value: 'restaurant',
    emoji: '🍜',
    label: 'Restaurants',
    prompt: 'Recommend restaurants near my pinned places.',
  },
  {
    value: 'hotel',
    emoji: '🏨',
    label: 'Hotels',
    prompt: 'Suggest hotels based on where I am spending time.',
  },
  {
    value: 'itinerary',
    emoji: '🗓',
    label: 'Itinerary',
    prompt: 'Build a day-by-day itinerary from my pins.',
  },
  {
    value: 'chat',
    emoji: '💬',
    label: 'Ask anything',
    prompt: '',
  },
]

const PANEL_HEIGHT = Dimensions.get('window').height * 0.72

export default function AiPanel({ visible, tripId, onClose }: AiPanelProps) {
  const slideAnim = useRef(new Animated.Value(PANEL_HEIGHT)).current
  const scrollRef = useRef<ScrollView>(null)

  const [mode, setMode] = useState<Mode>('restaurant')
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [streaming, setStreaming] = useState(false)

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : PANEL_HEIGHT,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start()
    if (!visible) {
      setResponse('')
      setInput('')
    }
  }, [visible])

  async function handleSend(overrideMessage?: string) {
    const message = overrideMessage ?? input.trim()
    if (!message || streaming) return
    Keyboard.dismiss()
    setInput('')
    setResponse('')
    setStreaming(true)

    try {
      let accumulated = ''
      for await (const chunk of streamAiChat(message, mode, tripId)) {
        accumulated += chunk
        setResponse(accumulated)
        scrollRef.current?.scrollToEnd({ animated: false })
      }
    } catch (e) {
      setResponse('Something went wrong. Please try again.')
    } finally {
      setStreaming(false)
    }
  }

  const selectedMode = MODES.find((m) => m.value === mode)!

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✨ AI Assistant</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </Pressable>
        </View>

        {/* Mode tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeRow}
        >
          {MODES.map((m) => (
            <Pressable
              key={m.value}
              style={[styles.modeTab, mode === m.value && styles.modeTabActive]}
              onPress={() => {
                setMode(m.value)
                setResponse('')
              }}
            >
              <Text style={styles.modeEmoji}>{m.emoji}</Text>
              <Text style={[styles.modeLabel, mode === m.value && styles.modeLabelActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Quick-send button for non-chat modes */}
        {mode !== 'chat' && !response && !streaming && (
          <Pressable
            style={styles.quickSendBtn}
            onPress={() => handleSend(selectedMode.prompt)}
          >
            <Text style={styles.quickSendText}>
              {selectedMode.emoji} {selectedMode.label} near my pins
            </Text>
          </Pressable>
        )}

        {/* Response area */}
        <ScrollView
          ref={scrollRef}
          style={styles.responseArea}
          contentContainerStyle={styles.responseContent}
        >
          {streaming && !response && (
            <ActivityIndicator color="#3B82F6" style={{ marginTop: 16 }} />
          )}
          {response ? (
            <Text style={styles.responseText}>{response}</Text>
          ) : !streaming ? (
            <Text style={styles.placeholder}>
              {mode === 'chat'
                ? 'Ask anything about your trip…'
                : `Tap the button above or type a custom question.`}
            </Text>
          ) : null}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask something…"
            placeholderTextColor="#bbb"
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            editable={!streaming}
          />
          <Pressable
            style={[styles.sendBtn, (streaming || !input.trim()) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={streaming || !input.trim()}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a1a' },
  closeBtn: { fontSize: 18, color: '#aaa', paddingHorizontal: 4 },
  modeRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f4f4f4',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeTabActive: { borderColor: '#3B82F6', backgroundColor: '#fff5f5' },
  modeEmoji: { fontSize: 15 },
  modeLabel: { fontSize: 13, fontWeight: '600', color: '#666' },
  modeLabelActive: { color: '#3B82F6' },
  quickSendBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickSendText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  responseArea: { flex: 1, marginHorizontal: 16 },
  responseContent: { paddingBottom: 8 },
  responseText: { fontSize: 15, color: '#1a1a1a', lineHeight: 23 },
  placeholder: { fontSize: 14, color: '#ccc', textAlign: 'center', marginTop: 24 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#f0f0f0' },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
})
