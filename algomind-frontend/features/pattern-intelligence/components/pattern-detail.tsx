'use client'

import { useMemo } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

import type { PatternEdge, PatternInsight } from '../types/pattern-intelligence'

import { PatternLabelBadge } from './pattern-label-badge'

interface StatCellProps {
    label: string
    value: number
    accent?: boolean
}

function StatCell({ label, value, accent }: StatCellProps) {
    return (
        <div
            className={cn(
                'rounded-md border p-3 text-center',
                accent && 'border-primary/30 bg-primary/5',
            )}
        >
            <p className="font-display text-xl font-bold tabular-nums text-foreground">
                {value}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
        </div>
    )
}

interface PatternDetailProps {
    pattern: PatternInsight
    patterns: PatternInsight[]
    edges: PatternEdge[]
    onClear: () => void
    onSelect: (patternId: number) => void
}

export function PatternDetail({
    pattern,
    patterns,
    edges,
    onClear,
    onSelect,
}: PatternDetailProps) {
    const score = pattern.mastery_score
    const connections = useMemo(() => {
        const byId = new Map(
            patterns.map((candidate) => [candidate.pattern_id, candidate]),
        )
        return edges
            .filter(
                (edge) =>
                    edge.source_pattern_id === pattern.pattern_id ||
                    edge.target_pattern_id === pattern.pattern_id,
            )
            .map((edge) => {
                const connectedId =
                    edge.source_pattern_id === pattern.pattern_id
                        ? edge.target_pattern_id
                        : edge.source_pattern_id
                return {
                    pattern: byId.get(connectedId),
                    sharedProblemCount: edge.shared_problem_count,
                }
            })
            .filter(
                (
                    connection,
                ): connection is {
                    pattern: PatternInsight
                    sharedProblemCount: number
                } => Boolean(connection.pattern),
            )
            .sort(
                (a, b) =>
                    b.sharedProblemCount - a.sharedProblemCount ||
                    a.pattern.name.localeCompare(b.pattern.name),
            )
    }, [edges, pattern.pattern_id, patterns])

    return (
        <section
            aria-label={`Details for pattern ${pattern.name}`}
            className="rounded-xl border bg-card p-5"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-bold text-foreground">
                        {pattern.name}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <PatternLabelBadge label={pattern.label} />
                        <span className="text-xs text-muted-foreground">
                            Pattern #{pattern.pattern_id}
                        </span>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClear}
                    aria-label="Clear pattern selection"
                    className="h-8 w-8 shrink-0 text-muted-foreground"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Mastery */}
            <div className="mt-4 space-y-1.5">
                <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-foreground">
                        Mastery
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                        {score !== null ? `${score}%` : 'No score yet'}
                    </span>
                </div>
                {score !== null ? (
                    <Progress value={score} className="h-2" />
                ) : (
                    <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                        No recognition evidence yet — complete pattern checks
                        during reviews to build a score.
                    </div>
                )}
            </div>

            {/* Counts */}
            <div className="mt-4 grid grid-cols-3 gap-2">
                <StatCell label="Confirmed" value={pattern.confirmed_count} />
                <StatCell
                    label="Due"
                    value={pattern.due_count}
                    accent={pattern.due_count > 0}
                />
                <StatCell label="Checks" value={pattern.attempts} />
                <StatCell label="Recognized" value={pattern.recognized_count} />
                <StatCell label="Partial" value={pattern.partial_count} />
                <StatCell label="Missed" value={pattern.missed_count} />
            </div>

            {/* Weak insight */}
            {pattern.insight && (
                <div className="mt-4 rounded-md border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-400">
                    {pattern.insight}
                </div>
            )}

            <div className="mt-4 border-t pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Connected patterns
                </p>
                {connections.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                        {connections.map((connection) => (
                            <li key={connection.pattern.pattern_id}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        onSelect(connection.pattern.pattern_id)
                                    }
                                    className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                                >
                                    <span className="font-medium text-foreground">
                                        {connection.pattern.name}
                                    </span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {connection.sharedProblemCount} shared
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                        This pattern has not appeared alongside another
                        confirmed pattern yet.
                    </p>
                )}
            </div>

            {/* Filtered-review CTA */}
            <div className="mt-4">
                {pattern.due_count > 0 ? (
                    <Link
                        href={`/dashboard/review?pattern_id=${pattern.pattern_id}`}
                        className="inline-flex w-full"
                    >
                        <Button className="w-full min-h-11">
                            Review {pattern.due_count} due problem
                            {pattern.due_count === 1 ? '' : 's'}
                        </Button>
                    </Link>
                ) : (
                    <p className="text-center text-xs text-muted-foreground">
                        No problems due for this pattern right now.
                    </p>
                )}
            </div>
        </section>
    )
}
