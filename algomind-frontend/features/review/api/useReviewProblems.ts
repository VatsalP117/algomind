import { useAuthQuery } from '@/features/useAuthQuery'
import { api } from '@/lib/api-client'

const getReviewProblems = (patternId?: string | null) => async () => {
    const response = patternId
        ? await api.get('/reviews/queue', {
              params: { pattern_id: patternId },
          })
        : await api.get('/reviews/queue')
    return response.data
}

// The pattern filter is part of the query key so filtered and unfiltered
// queues never share a cache entry.
export const useReviewProblems = (patternId?: string | null) => {
    return useAuthQuery({
        queryKey: ['review-problems', patternId || 'all'],
        queryFn: getReviewProblems(patternId),
    })
}
