import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

import type { PatternCard, PatternCardUpdate } from '../types/pattern-card'

export const useUpdatePatternCard = (problemId: string | number) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: PatternCardUpdate) => {
            const response = await api.put<PatternCard>(
                `/problems/${problemId}/pattern-card`,
                payload,
            )
            return response.data
        },
        onSuccess: (card) => {
            queryClient.setQueryData(['pattern-card', problemId], card)
            queryClient.invalidateQueries({ queryKey: ['review-problems'] })
        },
    })
}
