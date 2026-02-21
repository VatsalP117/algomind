import { api } from '@/lib/api-client'
import { useAuthQuery } from '@/features/useAuthQuery'

export type Concept = {
    id: number
    title: string
    description: string | null
    content: string
    created_at: string
}

const getConcepts = async (): Promise<Concept[]> => {
    const res = await api.get('/concepts')
    return res.data
}

export const useConcepts = () => {
    return useAuthQuery<Concept[]>({
        queryKey: ['concepts'],
        queryFn: getConcepts,
        staleTime: 10 * 60 * 1000, // 10 min — concepts are global & rarely change
        gcTime: 30 * 60 * 1000,   // keep in memory for 30 min
    })
}
