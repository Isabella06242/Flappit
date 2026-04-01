/**
 * Bottom sheet that appears after the user taps the map.
 * Lets them name the pin, pick a color, and search the place on travel platforms.
 */
import { useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

const PIN_COLORS = ['#3B82F6', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF', '#FF9F43']

const PLATFORMS = [
  {
    name: '小红书',
    emoji: '📕',
    url: (q: string) =>
      `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(q)}`,
  },
  {
    name: '大众点评',
    emoji: '🍜',
    url: (q: string) =>
      `https://www.dianping.com/search/keyword/0/0/${encodeURIComponent(q)}`,
  },
  {
    name: '抖音',
    emoji: '🎵',
    url: (q: string) =>
      `https://www.douyin.com/search/${encodeURIComponent(q)}`,
  },
  {
    name: 'TikTok',
    emoji: '🎬',
    url: (q: string) =>
      `https://www.tiktok.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    name: 'Instagram',
    emoji: '📸',
    url: (q: string) =>
      `https://www.instagram.com/explore/tags/${encodeURIComponent(q.replace(/\s+/g, ''))}`,
  },
  {
    name: 'Google Maps',
    emoji: '🗺️',
    url: (q: string) =>
      `https://www.google.com/maps/search/${encodeURIComponent(q)}`,
  },
  {
    name: 'Yelp',
    emoji: '⭐',
    url: (q: string) =>
      `https://www.yelp.com/search?find_desc=${encodeURIComponent(q)}`,
  },
  {
    name: 'Tabelog',
    emoji: '🍱',
    url: (q: string) =>
      `https://tabelog.com/en/search/?vs=1&sa=${encodeURIComponent(q)}&sw=${encodeURIComponent(q)}`,
  },
  {
    name: '马蜂窝',
    emoji: '🐝',
    url: (q: string) =>
      `https://www.mafengwo.cn/search/q.php?q=${encodeURIComponent(q)}`,
  },
]

interface Props {
  visible: boolean
  onConfirm: (title: string, color: string) => void
  onCancel: () => void
  isLoading: boolean
}

export default function PinDropModal({ visible, onConfirm, onCancel, isLoading }: Props) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(PIN_COLORS[0])

  function handleConfirm() {
    if (!title.trim()) return
    onConfirm(title.trim(), color)
    setTitle('')
    setColor(PIN_COLORS[0])
  }

  function handleCancel() {
    setTitle('')
    setColor(PIN_COLORS[0])
    onCancel()
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Drop a pin 📌</Text>

          <TextInput
            style={styles.input}
            placeholder="What's here? (e.g. best ramen spot)"
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />

          {/* Platform search — only visible once user has typed something */}
          {title.trim().length > 0 && (
            <View style={styles.platformSection}>
              <Text style={styles.label}>Search on</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.platformRow}
              >
                {PLATFORMS.map((p) => (
                  <Pressable
                    key={p.name}
                    style={styles.platformPill}
                    onPress={() => Linking.openURL(p.url(title.trim()))}
                  >
                    <Text style={styles.platformEmoji}>{p.emoji}</Text>
                    <Text style={styles.platformName}>{p.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Color picker */}
          <Text style={styles.label}>Pin color</Text>
          <View style={styles.colorRow}>
            {PIN_COLORS.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorDotSelected,
                ]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          <View style={styles.btnRow}>
            <Pressable style={styles.btnCancel} onPress={handleCancel}>
              <Text>Cancel</Text>
            </Pressable>
            <Pressable style={styles.btnSave} onPress={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnSaveText}>Save pin</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 14,
  },
  title: { fontSize: 20, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  platformSection: { gap: 8 },
  label: { fontSize: 13, color: '#888' },
  platformRow: { gap: 8, paddingVertical: 2 },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f4f4f4',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  platformEmoji: { fontSize: 14 },
  platformName: { fontSize: 13, fontWeight: '600', color: '#444' },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  btnRow: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  btnCancel: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  btnSave: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    minWidth: 90,
    alignItems: 'center',
  },
  btnSaveText: { color: '#fff', fontWeight: '700' },
})
