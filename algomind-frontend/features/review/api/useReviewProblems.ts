import { api } from '@/lib/api-client'
import { useAuthQuery } from '@/features/useAuthQuery'
const getReviewProblems = async () => {
    const response = await api.get('/reviews/queue')
    return response.data
}

export const useReviewProblems = () => {
    return useAuthQuery({
        queryKey: ['review-problems'],
        queryFn: getReviewProblems,
    })
}
