'use client'

import { useState } from 'react'
import axios from 'axios'
import { AlertCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useGeneratePatternCard } from '../api/useGeneratePatternCard'
import { useGetPatternCard } from '../api/useGetPatternCard'

import { PatternCardEditor } from './PatternCardEditor'
import { PatternCardEmptyState } from './PatternCardEmptyState'
import { PatternCardStudyView } from './PatternCardStudyView'

function generationErrorMessage(error: unknown): string | null {
    if (!axios.isAxiosError(error))
        return error
            ? 'Something went wrong while generating the pattern card. Please try again.'
            : null

    if (error.response?.status === 503) {
        return 'Pattern generation is not configured on this instance. Ask an admin to enable the AI provider, then try again.'
    }
    if (error.response?.status === 502) {
        return 'The AI could not produce a valid pattern card this time. Please try again.'
    }
    if (error.response?.status === 404) {
        return 'This problem could not be found. It may have been deleted.'
    }
    return 'Something went wrong while generating the pattern card. Please try again.'
}

interface PatternCardPanelProps {
    problemId: string | number
}

export function PatternCardPanel({ problemId }: PatternCardPanelProps) {
    const {
        data: card,
        isLoading,
        isError,
        refetch,
    } = useGetPatternCard(problemId)
    const {
        mutate: generate,
        isPending: isGenerating,
        error: generateError,
    } = useGeneratePatternCard(problemId)
    const [editing, setEditing] = useState(false)

    if (isLoading) {
        return (
            <div className="space-y-4 rounded-xl border bg-card p-6">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="rounded-xl border bg-card p-6">
                <div
                    role="alert"
                    className="flex items-start gap-2 text-sm text-destructive"
                >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-3">
                        <p>
                            Couldn&apos;t load the pattern card for this
                            problem.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="min-h-11"
                        >
                            <RefreshCw />
                            Try again
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (!card) {
        return (
            <PatternCardEmptyState
                isGenerating={isGenerating}
                error={generationErrorMessage(generateError)}
                onGenerate={() => generate()}
            />
        )
    }

    if (card.status === 'draft') {
        return (
            <PatternCardEditor card={card} onSaved={() => setEditing(false)} />
        )
    }

    return editing ? (
        <PatternCardEditor
            card={card}
            onCancel={() => setEditing(false)}
            onSaved={() => setEditing(false)}
        />
    ) : (
        <PatternCardStudyView card={card} onEdit={() => setEditing(true)} />
    )
}
