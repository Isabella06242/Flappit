import { useRef, useEffect } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Note } from '@/lib/api'

interface NotesPanelProps {
  visible: boolean
  notes: Note[]
  onClose: () => void
  onSelectNote: (note: Note) => void
  onNewNote: () => void
  isCreating?: boolean
}

const PANEL_HEIGHT = Dimensions.get('window').height * 0.5

export default function NotesPanel({
  visible,
  notes,
  onClose,
  onSelectNote,
  onNewNote,
  isCreating,
}: NotesPanelProps) {
  const slideAnim = useRef(new Animated.Value(PANEL_HEIGHT)).current

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : PANEL_HEIGHT,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start()
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notes</Text>
          <Pressable style={styles.newBtn} onPress={onNewNote} disabled={isCreating}>
            <Text style={styles.newBtnText}>{isCreating ? '...' : '+ New'}</Text>
          </Pressable>
        </View>

        <FlatList
          data={notes}
          keyExtractor={(n) => n.id}
          contentContainerStyle={notes.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No notes yet.</Text>
              <Text style={styles.emptyHint}>Tap + New to start writing 📝</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.noteCard} onPress={() => onSelectNote(item)}>
              <Text style={styles.noteTitle} numberOfLines={1}>
                {item.title || 'Untitled'}
              </Text>
              <Text style={styles.noteDate}>
                {new Date(item.updated_at).toLocaleDateString()}
              </Text>
            </Pressable>
          )}
        />
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  newBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  listContent: { padding: 12, gap: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#999' },
  emptyHint: { fontSize: 13, color: '#bbb', marginTop: 6 },
  noteCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  noteDate: { fontSize: 12, color: '#aaa', marginLeft: 8 },
})
