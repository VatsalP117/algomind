'use client'

import { useState } from 'react'
import {
    AlertCircle,
    Brain,
    Loader2,
    RefreshCcw,
    Sparkles,
    TriangleAlert,
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { usePatternInsights } from '../api/usePatternInsights'

import { PatternDetail } from './pattern-detail'
import { PatternList } from './pattern-list'
import { PatternMap } from './pattern-map'

function InsightsLoading() {
    return (
        <div
            className="space-y-4"
            aria-busy="true"
            aria-label="Loading pattern insights"
        >
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-[420px] w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
            </div>
        </div>
    )
}

export function PatternInsightsView() {
    const { data, isLoading, isError, refetch, isFetching } =
        usePatternInsights()
    const [selectedId, setSelectedId] = useState<number | null>(null)

    // Keep raw references stable so useMemo/derived lists stay stable.
    const patterns = data?.patterns ?? []
    const edges = data?.edges ?? []

    const selected =
        patterns.find((pattern) => pattern.pattern_id === selectedId) ?? null
    const hasEvidence = patterns.some((pattern) => pattern.attempts > 0)
    const weakInsights = patterns.filter((pattern) => pattern.insight !== null)

    if (isLoading) {
        return <InsightsLoading />
    }

    if (isError) {
        return (
            <div
                role="alert"
                className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-14 text-center"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">
                        Couldn&apos;t load pattern insights
                    </h2>
                    <p className="max-w-md text-sm text-muted-foreground">
                        Something went wrong while fetching your pattern
                        intelligence. Please try again.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => void refetch()}
                    disabled={isFetching}
                    className="min-h-11"
                >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Retry
                </Button>
            </div>
        )
    }

    // No confirmed pattern cards yet.
    if ((patterns ?? []).length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-xl border bg-card px-6 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Brain className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">
                        No confirmed patterns yet
                    </h2>
                    <p className="max-w-md text-sm text-muted-foreground">
                        Confirm a pattern card on any problem to start building
                        your pattern map. Insights appear here once you have at
                        least one confirmed pattern.
                    </p>
                </div>
                <Link href="/dashboard/library">
                    <Button className="min-h-11">Browse library</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Confirmed patterns exist but nothing reviewed with evidence. */}
            {!hasEvidence && (
                <div
                    role="status"
                    className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/30 p-4"
                >
                    <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="text-sm">
                        <p className="font-medium text-foreground">
                            No recognition evidence yet
                        </p>
                        <p className="mt-1 text-muted-foreground">
                            Your {(patterns ?? []).length} confirmed pattern
                            {(patterns ?? []).length === 1 ? '' : 's'} are
                            mapped below, but none have review data. Complete
                            the pattern check during reviews to unlock mastery
                            scores and guidance.
                        </p>
                    </div>
                </div>
            )}

            {/* Weak insights — patterns flagged for re-study. */}
            {hasEvidence && weakInsights.length > 0 && (
                <section
                    aria-labelledby="weak-insights-heading"
                    className="rounded-xl border bg-card p-5"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-rose-500" />
                        <h2
                            id="weak-insights-heading"
                            className="font-semibold text-foreground"
                        >
                            Needs attention
                        </h2>
                    </div>
                    <ul className="mt-3 space-y-2">
                        {weakInsights.map((pattern) => (
                            <li
                                key={pattern.pattern_id}
                                className="flex flex-col gap-1 rounded-md border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedId(pattern.pattern_id)
                                    }
                                    className="min-h-9 text-left text-sm font-medium text-rose-700 hover:underline dark:text-rose-400"
                                >
                                    {pattern.name}
                                </button>
                                <span className="text-sm text-rose-700/90 dark:text-rose-400/90 sm:flex-1">
                                    {pattern.insight}
                                </span>
                                {pattern.due_count > 0 && (
                                    <Link
                                        href={`/dashboard/review?pattern_id=${pattern.pattern_id}`}
                                        className="shrink-0 text-sm font-medium text-primary hover:underline"
                                    >
                                        Review {pattern.due_count} due
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Map + detail panel. */}
            <section aria-labelledby="pattern-map-heading">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 id="pattern-map-heading" className="section-label mb-0">
                        Pattern map
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Select a node or use the list below for details and
                        filtered review.
                    </p>
                </div>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <PatternMap
                        patterns={patterns ?? []}
                        edges={edges}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onClear={() => setSelectedId(null)}
                    />
                    <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                        {selected ? (
                            <PatternDetail
                                pattern={selected}
                                patterns={patterns}
                                edges={edges}
                                onClear={() => setSelectedId(null)}
                                onSelect={setSelectedId}
                            />
                        ) : (
                            <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
                                <p className="font-medium text-foreground">
                                    No pattern selected
                                </p>
                                <p className="mt-1">
                                    Select a node on the map (mouse or
                                    keyboard), or pick a pattern from the list
                                    below, to see mastery details and a filtered
                                    review session.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Accessible list — the non-visual path to every action. */}
            <section aria-labelledby="pattern-list-heading">
                <h2 id="pattern-list-heading" className="section-label mb-3">
                    All patterns
                </h2>
                <PatternList
                    patterns={patterns ?? []}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
            </section>
        </div>
    )
}
