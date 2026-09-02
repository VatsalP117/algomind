'use client'

import { AlertCircle, Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PatternCardEmptyStateProps {
    isGenerating: boolean
    error: string | null
    onGenerate: () => void
}

export function PatternCardEmptyState({
    isGenerating,
    error,
    onGenerate,
}: PatternCardEmptyStateProps) {
    if (isGenerating) {
        return (
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                    <div className="space-y-1">
                        <p className="font-semibold">Generating pattern card</p>
                        <p className="text-sm text-muted-foreground">
                            Analyzing the problem and your saved solution. This
                            usually takes under a minute — keep this page open.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Pattern Card</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                No pattern card yet. AlgoMind analyzes the saved problem and
                your solution to surface the underlying pattern — what to
                recognize, the first move, and the common mistakes to avoid.
            </p>
            <Button
                type="button"
                className="mt-4 min-h-11"
                onClick={onGenerate}
                disabled={isGenerating}
            >
                <Sparkles />
                Generate pattern card
            </Button>
            {error && (
                <div
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{error}</p>
                </div>
            )}
        </div>
    )
}
