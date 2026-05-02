import { useAuthQuery } from '@/features/useAuthQuery'
import { api } from '@/lib/api-client'
const getMostUsedLanguage = async () => {
    const response = await api.get('/metrics/most-used-language')
    return response.data.language
}

export const useMostUsedLanguage = () => {
    return useAuthQuery({
        queryKey: ['most-used-language'],
        queryFn: getMostUsedLanguage,
    })
}