import { toast } from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export type CreateProblemInput = {
    captureId?: number | null
    title: string
    problemLink: string
    conceptId: number | null
    difficulty: string
    summary: string
    description: string
    answer: string
    answerLanguage?: string
    hints: string
    generateHints: boolean
}

type Payload = {
    concept_id: number | null
    title: string
    link: string
    difficulty: string
    summary: string
    description: string
    answer: string
    answer_language: string | null
    hints: string
    generate_hints: boolean
}

type CreateProblemResponse = {
    id: number
    hint_generation_queued: boolean
    capture_id?: number
    already_imported?: boolean
}

const markdownSignals = [
    /^#{1,6}\s/m,
    /^\s*[-*+]\s/m,
    /^\s*\d+\.\s/m,
    /\[[^\]]+\]\([^)]+\)/,
    /`[^`]+`/,
]

const codeSignals = [
    /;\s*$/,
    /{[\s\S]*}/,
    /^\s*(def|func|function|class|public|private|const|let|var|if|for|while|switch|package|import)\b/m,
    /^\s*(#include|using namespace|fn |SELECT |WITH )/m,
]

const formatAnswerAsMarkdown = (answer: string, answerLanguage?: string) => {
    const trimmed = answer.trim()
    if (!trimmed) return trimmed
    if (trimmed.includes('```')) return trimmed

    const isMarkdown = markdownSignals.some((pattern) => pattern.test(trimmed))
    if (isMarkdown) return trimmed

    const isCode = codeSignals.some((pattern) => pattern.test(trimmed))
    if (!isCode && !answerLanguage) return trimmed

    const language = (answerLanguage || '').trim().toLowerCase()
    return `\`\`\`${language}\n${trimmed}\n\`\`\``
}

export const useCreateProblem = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: CreateProblemInput) => {
            const payload: Payload = {
                concept_id: data.conceptId, // Default to 0 if null, as Go int64 is non-nullable
                title: data.title,
                link: data.problemLink || '',
                difficulty: data.difficulty
                    ? data.difficulty.toUpperCase()
                    : 'EASY',
                summary: data.summary,
                description: data.description || '',
                answer: formatAnswerAsMarkdown(
                    data.answer,
                    data.answerLanguage,
                ),
                answer_language: data.answerLanguage || null,
                hints: data.hints || '',
                generate_hints: data.generateHints,
            }

            const endpoint = data.captureId
                ? `/problem-captures/${data.captureId}/convert`
                : '/problems'
            const res = await api.post(endpoint, payload)
            return res.data as CreateProblemResponse
        },

        onSuccess: (data, variables) => {
            // A new problem immediately enters the review queue and changes dashboard totals
            queryClient.invalidateQueries({ queryKey: ['review-problems'] })
            queryClient.invalidateQueries({ queryKey: ['metrics'] })
            queryClient.invalidateQueries({ queryKey: ['problems'] })
            queryClient.invalidateQueries({ queryKey: ['problem-captures'] })
            if (data.hint_generation_queued) {
                toast.success(
                    variables.captureId
                        ? 'Problem imported. Hints will be generated in the background.'
                        : 'Problem added. Hints will be generated in the background.',
                )
                return
            }

            if (variables.generateHints) {
                toast.success(
                    variables.captureId
                        ? 'Problem imported. Automatic hint generation is currently unavailable.'
                        : 'Problem added. Automatic hint generation is currently unavailable.',
                )
                return
            }

            if (data.already_imported) {
                toast.success('Problem already existed in your library')
                return
            }

            toast.success(
                variables.captureId
                    ? 'Problem imported successfully'
                    : 'Problem added successfully',
            )
        },

        onError: (error: any) => {
            console.error('Failed to add problem:', error)
            toast.error(error.response?.data?.message || 'Failed to add problem')
        },
    })
}
