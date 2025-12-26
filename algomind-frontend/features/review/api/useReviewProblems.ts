import { api } from "@/lib/api-client"
import { useQuery } from "@tanstack/react-query"

const getReviewProblems = async () => {
    const response = await api.get("/reviews/queue")
    return response.data
}

export const useReviewProblems = () => {
    return useQuery({
        queryKey: ['review-problems'],
        queryFn: getReviewProblems
    })
}