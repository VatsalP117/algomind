import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { toast } from 'react-hot-toast'

export type CreateItemInput = {
    title: string
    problemLink: string
    conceptId: number | null
    difficulty: string
    summary: string
    description: string
    answer: string
    hints: string
}

type BackendPayload = {
    concept_id: number | null
    title: string
    link: string
    difficulty: string
    summary: string
    description: string
    answer: string
    hints: string
}

export const useCreateItem = () => {
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation({
        mutationFn: async (data: CreateItemInput) => {
            const payload: BackendPayload = {
                concept_id: data.conceptId, // Default to 0 if null, as Go int64 is non-nullable
                title: data.title,
                link: data.problemLink || '',
                difficulty: 'EASY',
                summary: data.summary,
                description: data.description || '',
                answer: data.answer,
                hints: data.hints || '',
            }

            // 4. Send Request
            const res = await api.post('/problems', payload)
            return res.data
        },

        onSuccess: () => {
            // 5. Cleanup & Redirect
            // Invalidate the library list so the new item appears immediately
            queryClient.invalidateQueries({ queryKey: ['items'] })
            toast.success('Problem added successfully')
        },

        onError: (error) => {
            console.error('Failed to add problem:', error)
            toast.error('Failed to add problem')
        },
    })
}
