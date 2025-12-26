import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'



export const useConcepts = () => {
    return useQuery({
        queryKey: ['concepts'],
        queryFn: async () => {
            const res = await api.get('/concepts')
            return res.data
        },
    })
}
