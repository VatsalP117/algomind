import { api } from '@/lib/api-client'
import { useAuthQuery } from '@/features/useAuthQuery'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export type ConceptFolder = {
    id: number
    user_id: string
    name: string
    parent_folder_id: number | null
    sort_order: number
    created_at: string
}

export type ConceptFolderItem = {
    id: number
    user_id: string
    folder_id: number
    concept_id: number
    sort_order: number
}

export type ConceptFolderData = {
    folders: ConceptFolder[]
    items: ConceptFolderItem[]
}

type CreateFolderDto = {
    name: string
    parent_folder_id?: number | null
}

type AssignConceptDto = {
    concept_id: number
    folder_id: number
}

export const useConceptFolders = () => {
    return useAuthQuery<ConceptFolderData>({
        queryKey: ['concept-folders'],
        queryFn: async () => {
            const res = await api.get('/concept-folders')
            return res.data
        },
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })
}

export const useCreateFolder = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: CreateFolderDto) => {
            const res = await api.post('/concept-folders', data)
            return res.data as ConceptFolder
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concept-folders'] })
        },
    })
}

export const useUpdateFolder = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: CreateFolderDto }) => {
            const res = await api.put(`/concept-folders/${id}`, data)
            return res.data as ConceptFolder
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concept-folders'] })
        },
    })
}

export const useDeleteFolder = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await api.delete(`/concept-folders/${id}`)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concept-folders'] })
        },
    })
}

export const useAssignToFolder = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: AssignConceptDto) => {
            const res = await api.put('/concept-folder-items', data)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concept-folders'] })
        },
    })
}

export const useRemoveFromFolder = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (conceptId: number) => {
            const res = await api.delete(`/concept-folder-items/${conceptId}`)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concept-folders'] })
        },
    })
}
