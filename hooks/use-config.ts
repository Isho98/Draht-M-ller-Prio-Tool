'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAreas, fetchSelection, saveSelection } from '@/lib/api/areas'

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: fetchAreas,
  })
}

export function useSelection() {
  return useQuery({
    queryKey: ['selection'],
    queryFn: fetchSelection,
  })
}

export function useSaveSelection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveSelection,
    onSuccess: (functionIds) => {
      queryClient.setQueryData(['selection'], functionIds)
    },
  })
}

export function useToggleSelection() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: saveSelection,
    onMutate: async (functionIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['selection'] })
      const previous = queryClient.getQueryData<string[]>(['selection'])
      queryClient.setQueryData(['selection'], functionIds)
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['selection'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['selection'] })
    },
  })

  return {
    ...mutation,
    isPending: mutation.isPending,
    toggle: (functionId: string) => {
      const current = queryClient.getQueryData<string[]>(['selection']) ?? []
      const next = current.includes(functionId)
        ? current.filter((id) => id !== functionId)
        : [...current, functionId]
      return mutation.mutateAsync(next)
    },
  }
}
