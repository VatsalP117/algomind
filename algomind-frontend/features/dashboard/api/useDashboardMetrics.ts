import { api } from '@/lib/api-client'
import { useAuthQuery } from '@/features/useAuthQuery'
import type { DashboardSummary } from '../types/metrics'

const getDashboardMetrics = async (): Promise<DashboardSummary> => {
    const response = await api.get('/metrics/dashboard')
    return response.data
}

export const useDashboardMetrics = () => {
    return useAuthQuery<DashboardSummary>({
        queryKey: ['metrics', 'dashboard'],
        queryFn: getDashboardMetrics,
        staleTime: 2 * 60 * 1000, // 2 min
    })
}
