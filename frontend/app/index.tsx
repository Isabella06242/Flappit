import { useState, useEffect } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useNavigation } from 'expo-router'
import { useTrips, useCreateTrip, useDeleteTrip } from '@/hooks/useTrips'
import { Trip } from '@/lib/api'
import { ProfileIcon } from '@/components/tabicons'

export default function HomeScreen() {
  const router = useRouter()
  const navigation = useNavigation()

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => router.push('/profile')} style={{ marginRight: 16 }}>
          <ProfileIcon size={24} />
        </Pressable>
      ),
    })
  }, [])
  const { data: trips, isLoading } = useTrips()
  const createTrip = useCreateTrip()
  const deleteTrip = useDeleteTrip()

  const [modalVisible, setModalVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  function handleCreate() {
    if (!title.trim()) return
    createTrip.mutate(
      { title: title.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setTitle('')
          setDescription('')
          setModalVisible(false)
        },
      }
    )
  }

  function handleDelete(trip: Trip) {
    Alert.alert('Delete trip', `Delete "${trip.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTrip.mutate(trip.id) },
    ])
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trips ?? []}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No trips yet.</Text>
            <Text style={styles.emptyHint}>Tap + to start your first adventure 🌍</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/trip/${item.id}`)}
            onLongPress={() => handleDelete(item)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
            ) : null}
          </Pressable>
        )}
      />

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>

      {/* New trip modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New Trip 🐦</Text>
            <TextInput
              style={styles.input}
              placeholder="Trip title"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <View style={styles.row}>
              <Pressable style={styles.btnSecondary} onPress={() => setModalVisible(false)}>
                <Text>Cancel</Text>
              </Pressable>
              <Pressable style={styles.btnPrimary} onPress={handleCreate}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {createTrip.isPending ? '...' : 'Create'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#999' },
  emptyHint: { fontSize: 14, color: '#bbb', marginTop: 6 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  cardDesc: { fontSize: 13, color: '#888', marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  btnSecondary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  btnPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
  },
})
