import { toast } from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuthQuery } from '@/features/useAuthQuery'
import { api } from '@/lib/api-client'

export type ProblemCapture = {
    id: number
    source: 'leetcode'
    external_problem_key: string
    canonical_url: string
    title?: string | null
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | null
    description_html?: string | null
    topic_tags: string[]
    capture_state:
        | 'ready'
        | 'pending_enrichment'
        | 'imported'
        | 'archived'
        | 'failed'
    fallback_title?: string | null
    fallback_difficulty?: string | null
    problem_id?: number | null
    last_error_code?: string | null
    last_error_message?: string | null
    captured_at: string
    updated_at: string
    imported_at?: string | null
}

export const useProblemCaptures = () => {
    return useAuthQuery<ProblemCapture[]>({
        queryKey: ['problem-captures'],
        queryFn: async () => {
            const response = await api.get<ProblemCapture[]>('/problem-captures')
            return response.data ?? []
        },
    })
}

export const useProblemCapture = (captureId?: number | null) => {
    return useAuthQuery<ProblemCapture>({
        queryKey: ['problem-captures', captureId],
        enabled: Boolean(captureId),
        queryFn: async () => {
            const response = await api.get<ProblemCapture>(
                `/problem-captures/${captureId}`,
            )
            return response.data
        },
    })
}

export const useArchiveProblemCapture = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (captureId: number) => {
            await api.post(`/problem-captures/${captureId}/archive`)
            return captureId
        },
        onSuccess: (captureId) => {
            queryClient.invalidateQueries({ queryKey: ['problem-captures'] })
            queryClient.removeQueries({ queryKey: ['problem-captures', captureId] })
            toast.success('Capture archived')
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message || 'Failed to archive capture',
            )
        },
    })
}

export const useRetryProblemCapture = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (captureId: number) => {
            const response = await api.post<ProblemCapture>(
                `/problem-captures/${captureId}/retry-enrichment`,
            )
            return response.data
        },
        onSuccess: (capture) => {
            queryClient.invalidateQueries({ queryKey: ['problem-captures'] })
            queryClient.setQueryData(
                ['problem-captures', capture.id],
                capture,
            )
            toast.success('Capture refreshed')
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message || 'Failed to refresh capture',
            )
        },
    })
}
