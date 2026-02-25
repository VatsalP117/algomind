import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { toast } from 'react-hot-toast'

export type CreateProblemInput = {
    title: string
    problemLink: string
    conceptId: number | null
    difficulty: string
    summary: string
    description: string
    answer: string
    answerLanguage?: string
    hints: string
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
    if (trimmed.includes("```")) return trimmed

    const isMarkdown = markdownSignals.some((pattern) => pattern.test(trimmed))
    if (isMarkdown) return trimmed

    const isCode = codeSignals.some((pattern) => pattern.test(trimmed))
    if (!isCode && !answerLanguage) return trimmed

    const language = (answerLanguage || "").trim().toLowerCase()
    return `\`\`\`${language}\n${trimmed}\n\`\`\``
}

export const useCreateProblem = () => {
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation({
        mutationFn: async (data: CreateProblemInput) => {
            const payload: Payload = {
                concept_id: data.conceptId, // Default to 0 if null, as Go int64 is non-nullable
                title: data.title,
                link: data.problemLink || '',
                difficulty: data.difficulty ? data.difficulty.toUpperCase() : 'EASY',
                summary: data.summary,
                description: data.description || '',
                answer: formatAnswerAsMarkdown(data.answer, data.answerLanguage),
                answer_language: data.answerLanguage || null,
                hints: data.hints || '',
            }

            // 4. Send Request
            const res = await api.post('/problems', payload)
            return res.data
        },

        onSuccess: () => {
            // A new problem immediately enters the review queue and changes dashboard totals
            queryClient.invalidateQueries({ queryKey: ['review-problems'] })
            queryClient.invalidateQueries({ queryKey: ['metrics'] })
            toast.success('Problem added successfully')
        },

        onError: (error) => {
            console.error('Failed to add problem:', error)
            toast.error('Failed to add problem')
        },
    })
}
