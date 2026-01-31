import { api } from '@/lib/api-client'
import { useAuthQuery } from '@/features/useAuthQuery'
import type { RecallDataPoint } from '../types/metrics'

const getRecallQuality = async (days: number = 7): Promise<RecallDataPoint[]> => {
    const response = await api.get(`/metrics/recall?days=${days}`)
    return response.data
}

export const useRecallQuality = (days: number = 7) => {
    return useAuthQuery<RecallDataPoint[]>({
        queryKey: ['metrics', 'recall', days],
        queryFn: () => getRecallQuality(days),
        staleTime: 60 * 1000, // 1 minute
    })
}
