import axios from 'axios'

import { useAuthQuery } from '@/features/useAuthQuery'
import { api } from '@/lib/api-client'

import type { PatternCard } from '../types/pattern-card'

/**
 * Fetches the pattern card for a problem. A 404 means the problem has no
 * card yet, which is a normal state (empty state), not an error.
 */
export const useGetPatternCard = (problemId: string | number) => {
    return useAuthQuery<PatternCard | null>({
        queryKey: ['pattern-card', problemId],
        queryFn: async () => {
            try {
                const response = await api.get<PatternCard>(
                    `/problems/${problemId}/pattern-card`,
                )
                return response.data
            } catch (error) {
                if (
                    axios.isAxiosError(error) &&
                    error.response?.status === 404
                ) {
                    return null
                }
                throw error
            }
        },
    })
}
