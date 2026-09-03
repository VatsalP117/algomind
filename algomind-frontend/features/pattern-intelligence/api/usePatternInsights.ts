import { useAuthQuery } from '@/features/useAuthQuery'
import { api } from '@/lib/api-client'

import type { PatternInsightsResponse } from '../types/pattern-intelligence'

const getPatternInsights = async (): Promise<PatternInsightsResponse> => {
    const response = await api.get('/patterns/insights')
    return response.data
}

export const usePatternInsights = (enabled = true) => {
    return useAuthQuery<PatternInsightsResponse>({
        queryKey: ['pattern-insights'],
        queryFn: getPatternInsights,
        staleTime: 60 * 1000, // 1 minute
        enabled,
    })
}
