import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tripsApi, Trip } from '@/lib/api'

export function useTrips() {
  return useQuery({ queryKey: ['trips'], queryFn: tripsApi.list })
}

export function useTrip(id: string) {
  return useQuery({ queryKey: ['trips', id], queryFn: () => tripsApi.get(id), enabled: !!id })
}

export function useCreateTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; description?: string }) => tripsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  })
}

export function useDeleteTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tripsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  })
}
