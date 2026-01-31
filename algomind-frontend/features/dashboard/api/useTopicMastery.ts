import { api } from '@/lib/api-client'
import { useAuthQuery } from '@/features/useAuthQuery'
import type { TopicMastery } from '../types/metrics'

const getTopicMastery = async (): Promise<TopicMastery[]> => {
    const response = await api.get('/metrics/mastery')
    return response.data
}

export const useTopicMastery = () => {
    return useAuthQuery<TopicMastery[]>({
        queryKey: ['metrics', 'mastery'],
        queryFn: getTopicMastery,
        staleTime: 60 * 1000, // 1 minute
    })
}
