'use client'

import { ArrowRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

import type { PatternInsight } from '../types/pattern-intelligence'

import { PatternLabelBadge } from './pattern-label-badge'

interface PatternListProps {
    patterns: PatternInsight[]
    selectedId: number | null
    onSelect: (patternId: number) => void
}

/**
 * Non-visual counterpart to the SVG map: every pattern and its review
 * CTA is reachable here as a plain, focusable control.
 */
export function PatternList({
    patterns,
    selectedId,
    onSelect,
}: PatternListProps) {
    return (
        <ul aria-label="All confirmed patterns" className="space-y-2">
            {patterns.map((pattern) => {
                const selected = pattern.pattern_id === selectedId
                return (
                    <li
                        key={pattern.pattern_id}
                        className={cn(
                            'flex flex-col gap-2 rounded-lg border bg-card p-3 transition-colors sm:flex-row sm:items-center',
                            selected && 'border-primary/40 bg-primary/5',
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => onSelect(pattern.pattern_id)}
                            aria-pressed={selected}
                            className="min-h-11 flex-1 rounded-md px-1 text-left hover:bg-muted/40"
                        >
                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <ChevronRight
                                    className={cn(
                                        'h-3.5 w-3.5 shrink-0 text-muted-foreground',
                                        selected && 'text-primary',
                                    )}
                                />
                                <span className="font-medium text-foreground">
                                    {pattern.name}
                                </span>
                                <PatternLabelBadge label={pattern.label} />
                            </span>
                            <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                                <span>{pattern.confirmed_count} confirmed</span>
                                <span>{pattern.due_count} due</span>
                                <span>{pattern.attempts} checks</span>
                                <span>
                                    {pattern.mastery_score !== null
                                        ? `${pattern.mastery_score}% mastery`
                                        : 'no recognition evidence'}
                                </span>
                            </span>
                        </button>

                        {pattern.due_count > 0 ? (
                            <Link
                                href={`/dashboard/review?pattern_id=${pattern.pattern_id}`}
                                className={cn(
                                    'inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15',
                                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                )}
                            >
                                Review {pattern.due_count}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        ) : (
                            <span className="shrink-0 px-1 text-xs text-muted-foreground">
                                Nothing due
                            </span>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}
