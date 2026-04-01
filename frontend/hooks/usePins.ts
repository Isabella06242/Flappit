import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pinsApi, CreatePinPayload } from '@/lib/api'

export function usePins(tripId: string) {
  return useQuery({
    queryKey: ['pins', tripId],
    queryFn: () => pinsApi.list(tripId),
    enabled: !!tripId,
  })
}

export function useCreatePin(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePinPayload) => pinsApi.create(tripId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pins', tripId] }),
  })
}

export function useUpdatePin(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pinId, data }: { pinId: string; data: { title?: string; color?: string } }) =>
      pinsApi.update(tripId, pinId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pins', tripId] }),
  })
}

export function useDeletePin(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pinId: string) => pinsApi.delete(tripId, pinId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pins', tripId] }),
  })
}
