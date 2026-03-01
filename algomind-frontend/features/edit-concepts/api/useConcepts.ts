import { api } from '@/lib/api-client'
import { useAuthQuery } from '@/features/useAuthQuery'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export type Concept = {
    id: number
    user_id?: string | null
    base_concept_id?: number | null
    title: string
    description: string | null
    content: string
    created_at: string
}

type CreateConceptDto = {
    title: string
    description: string
    content: string
}

type UpdateConceptDto = CreateConceptDto

export const useConcepts = () => {
    return useAuthQuery<Concept[]>({
        queryKey: ['concepts'],
        queryFn: async () => {
            const res = await api.get('/concepts')
            return res.data
        },
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })
}

export const useCreateConcept = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: CreateConceptDto) => {
            const res = await api.post('/concepts', data)
            return res.data as Concept
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concepts'] })
        },
    })
}

export const useUpdateConcept = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateConceptDto }) => {
            const res = await api.put(`/concepts/${id}`, data)
            return res.data as Concept
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concepts'] })
        },
    })
}

export const useDeleteConcept = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await api.delete(`/concepts/${id}`)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concepts'] })
            queryClient.invalidateQueries({ queryKey: ['concept-folders'] })
        },
    })
}

export const useResetConcept = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await api.post(`/concepts/${id}/reset`)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concepts'] })
        },
    })
}
