import { api } from '@/lib/api-client'
import { useAuthQuery } from '@/features/useAuthQuery'

export const useConcepts = () => {
    return useAuthQuery({
        queryKey: ['concepts'],
        queryFn: async () => {
            const res = await api.get('/concepts')
            return res.data
        },
    })
}
