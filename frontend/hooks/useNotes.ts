import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notesApi, Note } from '@/lib/api'

export function useNotes(tripId: string) {
  return useQuery({
    queryKey: ['notes', tripId],
    queryFn: () => notesApi.list(tripId),
    enabled: !!tripId,
  })
}

export function useNote(tripId: string, noteId: string) {
  return useQuery({
    queryKey: ['notes', tripId, noteId],
    queryFn: () => notesApi.get(tripId, noteId),
    enabled: !!tripId && !!noteId,
  })
}

export function useCreateNote(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; content?: any }) => notesApi.create(tripId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', tripId] }),
  })
}

export function useUpdateNote(tripId: string, noteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title?: string; content?: any }) =>
      notesApi.update(tripId, noteId, data),
    onSuccess: (updated) => {
      qc.setQueryData(['notes', tripId, noteId], updated)
      qc.invalidateQueries({ queryKey: ['notes', tripId] })
    },
  })
}

export function useDeleteNote(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => notesApi.delete(tripId, noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', tripId] }),
  })
}
