import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

import type { PatternCard } from '../types/pattern-card'

export const useGeneratePatternCard = (problemId: string | number) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async () => {
            const response = await api.post<PatternCard>(
                `/problems/${problemId}/pattern-card/generate`,
            )
            return response.data
        },
        onSuccess: (card) => {
            queryClient.setQueryData(['pattern-card', problemId], card)
            // The queue now carries pattern names for this problem.
            queryClient.invalidateQueries({ queryKey: ['review-problems'] })
        },
    })
}
