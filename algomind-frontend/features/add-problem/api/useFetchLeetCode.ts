import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'react-hot-toast'

export type LeetCodeProblemData = {
    title: string
    difficulty: string
    description: string
    tags: string[]
}

export const useFetchLeetCode = () => {
    return useMutation({
        mutationFn: async (url: string): Promise<LeetCodeProblemData> => {
            const res = await api.get('/leetcode/fetch', {
                params: { url }
            })
            return res.data
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to fetch LeetCode problem'
            toast.error(message)
        }
    })
}
