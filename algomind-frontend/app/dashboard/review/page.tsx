'use client'

import { Suspense, useEffect } from 'react'
import {
    ArrowLeft,
    CheckCircle2,
    FilterX,
    Loader2,
    RotateCcw,
    Sparkles,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { usePatternInsights } from '@/features/pattern-intelligence'
import { useReviewProblems } from '@/features/review/api/useReviewProblems'
import ReviewCard from '@/features/review/components/review-card'
import { useReviewStore } from '@/features/review/store/useReviewStore'

function ReviewSession() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const patternId = searchParams.get('pattern_id')
    const {
        data: problems,
        isLoading,
        isError,
        refetch,
        isFetching,
    } = useReviewProblems(patternId)

    // Resolve the pattern's name only when a filter is active.
    const { data: insights } = usePatternInsights(Boolean(patternId))
    const filteredPattern = insights?.patterns.find(
        (pattern) => String(pattern.pattern_id) === patternId,
    )

    const { queue, currentIndex, isSessionComplete, initSession } =
        useReviewStore()

    useEffect(() => {
        if (problems) {
            initSession(problems)
        }
    }, [problems, initSession])

    const isFiltered = Boolean(patternId)
    const clearFilter = () => router.push('/dashboard/review')

    // 0. Loading State (keeps the filter banner visible)
    if (isLoading) {
        return (
            <div className="min-h-screen">
                {isFiltered ? (
                    <FilterBanner
                        patternName={filteredPattern?.name}
                        patternId={patternId}
                        onClear={clearFilter}
                    />
                ) : null}
                <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="font-medium">Loading your review queue</p>
                        <p className="text-sm text-muted-foreground">
                            Preparing problems for review...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="min-h-screen">
                {isFiltered ? (
                    <FilterBanner
                        patternName={filteredPattern?.name}
                        patternId={patternId}
                        onClear={clearFilter}
                    />
                ) : null}
                <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Couldn&apos;t load this review session
                        </h1>
                        <p className="max-w-md text-sm text-muted-foreground">
                            The pattern filter may be invalid, or the review
                            service may be temporarily unavailable.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void refetch()}
                            disabled={isFetching}
                        >
                            {isFetching ? 'Retrying…' : 'Try again'}
                        </Button>
                        {isFiltered && (
                            <Button type="button" onClick={clearFilter}>
                                Review all due problems
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // 1. Zero State (No reviews for today)
    if (!isLoading && problems?.length === 0) {
        return (
            <div className="min-h-screen">
                {isFiltered ? (
                    <FilterBanner
                        patternName={filteredPattern?.name}
                        patternId={patternId}
                        onClear={clearFilter}
                    />
                ) : null}
                <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                    </div>
                    <div className="text-center max-w-md">
                        <h1 className="text-3xl font-bold tracking-tight">
                            All Caught Up!
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {isFiltered ? (
                                <>
                                    No problems tagged with{' '}
                                    <span className="font-semibold text-foreground">
                                        {filteredPattern?.name ??
                                            `pattern #${patternId}`}
                                    </span>{' '}
                                    are due for review right now.
                                </>
                            ) : (
                                'You have no problems due for review right now. Take a break or add new problems to learn.'
                            )}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {isFiltered ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() =>
                                        router.push('/dashboard/review')
                                    }
                                >
                                    Review all due problems
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={() =>
                                        router.push('/dashboard/patterns')
                                    }
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Patterns
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="lg"
                                onClick={() => router.push('/dashboard')}
                                className="mt-2"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // 2. Session Complete State
    if (isSessionComplete) {
        return (
            <div className="min-h-screen">
                {isFiltered ? (
                    <FilterBanner
                        patternName={filteredPattern?.name}
                        patternId={patternId}
                        onClear={clearFilter}
                    />
                ) : null}
                <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                    <div className="text-center max-w-md">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Session Complete! 🎉
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {isFiltered ? (
                                <>
                                    You reviewed{' '}
                                    <span className="font-semibold text-foreground">
                                        {queue.length}
                                    </span>{' '}
                                    problem
                                    {queue.length === 1 ? '' : 's'} tagged with{' '}
                                    <span className="font-semibold text-foreground">
                                        {filteredPattern?.name ??
                                            `pattern #${patternId}`}
                                    </span>
                                    . Great work keeping up with your practice!
                                </>
                            ) : (
                                <>
                                    You reviewed{' '}
                                    <span className="font-semibold text-foreground">
                                        {queue.length}
                                    </span>{' '}
                                    problems. Great work keeping up with your
                                    practice!
                                </>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => window.location.reload()}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Review More
                        </Button>
                        <Button
                            size="lg"
                            onClick={() =>
                                isFiltered
                                    ? router.push('/dashboard/patterns')
                                    : router.push('/dashboard')
                            }
                        >
                            Finish
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // 3. Active Review State
    const currentProblem = queue[currentIndex]
    const progressPercent = Math.round((currentIndex / queue.length) * 100)

    return (
        <div className="min-h-screen">
            {isFiltered ? (
                <FilterBanner
                    patternName={filteredPattern?.name}
                    patternId={patternId}
                    onClear={clearFilter}
                />
            ) : null}

            {/* Compact Header */}
            <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto max-w-3xl px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <RotateCcw className="h-4 w-4" />
                            </div>
                            <h1 className="text-xl font-bold">
                                {isFiltered
                                    ? 'Pattern Review'
                                    : 'Review Session'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-mono font-medium">
                                {currentIndex + 1}
                            </span>
                            <span className="text-muted-foreground">of</span>
                            <span className="font-mono font-medium">
                                {queue.length}
                            </span>
                        </div>
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                </div>
            </div>

            {/* Review Card — remount per problem so local state resets */}
            <div className="mx-auto max-w-3xl px-6 py-8">
                {currentProblem && (
                    <ReviewCard
                        key={currentProblem.entity_id}
                        problem={currentProblem}
                    />
                )}
            </div>
        </div>
    )
}

function FilterBanner({
    patternName,
    patternId,
    onClear,
}: {
    patternName?: string
    patternId: string | null
    onClear: () => void
}) {
    return (
        <div className="border-b border-primary/20 bg-primary/5">
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-3">
                <FilterX className="h-4 w-4 shrink-0 text-primary" />
                <p className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-medium text-foreground">
                        Pattern-filtered review
                    </span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-muted-foreground">
                        {patternName ?? `pattern #${patternId ?? ''}`}
                    </span>
                </p>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                    Clear filter
                </Button>
            </div>
        </div>
    )
}

export default function ReviewPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="font-medium">Loading your review queue</p>
                        <p className="text-sm text-muted-foreground">
                            Preparing problems for review...
                        </p>
                    </div>
                </div>
            }
        >
            <ReviewSession />
        </Suspense>
    )
}
