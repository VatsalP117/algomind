'use client'

import { useId } from 'react'

import { cn } from '@/lib/utils'

import type {
    MasteryLabel,
    PatternEdge,
    PatternInsight,
} from '../types/pattern-intelligence'

const RING_BASE = 150
const RING_STEP = 150
const PER_RING = 7
const MIN_SIZE = 640

// Node styling keyed by mastery label. Color is never the only signal:
// every node also renders its name and counts as text.
const LABEL_STYLES: Record<
    string,
    { fill: string; stroke: string; text: string }
> = {
    Strong: {
        fill: 'fill-emerald-500/15',
        stroke: 'stroke-emerald-500',
        text: 'fill-emerald-700 dark:fill-emerald-400',
    },
    Developing: {
        fill: 'fill-amber-500/15',
        stroke: 'stroke-amber-500',
        text: 'fill-amber-700 dark:fill-amber-400',
    },
    Learning: {
        fill: 'fill-sky-500/15',
        stroke: 'stroke-sky-500',
        text: 'fill-sky-700 dark:fill-sky-400',
    },
    'Needs practice': {
        fill: 'fill-rose-500/15',
        stroke: 'stroke-rose-500',
        text: 'fill-rose-700 dark:fill-rose-400',
    },
}

const NO_LABEL_STYLES = {
    fill: 'fill-muted/40',
    stroke: 'stroke-muted-foreground/40',
    text: 'fill-muted-foreground',
}

export interface MapNode {
    id: number
    x: number
    y: number
    r: number
    pattern: PatternInsight
}

/**
 * Deterministic concentric/radial layout. The most-confirmed pattern sits
 * in the center; the remainder fill rings of up to PER_RING nodes each,
 * with an alternating angle offset per ring so nodes never line up. No
 * randomness or physics — identical input always yields identical output.
 */
export function computeMapLayout(patterns: PatternInsight[]): {
    nodes: MapNode[]
    size: number
} {
    if (patterns.length === 0) {
        return { nodes: [], size: MIN_SIZE }
    }

    const maxConfirmed = Math.max(
        1,
        ...patterns.map((pattern) => pattern.confirmed_count),
    )
    const radiusFor = (confirmed: number) =>
        26 + (confirmed / maxConfirmed) * 18

    // Build ring capacities (last ring takes the remainder).
    const ringCounts: number[] = []
    let remaining = patterns.length - 1
    while (remaining > 0) {
        const capacity = Math.min(PER_RING, remaining)
        ringCounts.push(capacity)
        remaining -= capacity
    }
    const maxRing = ringCounts.length
    const maxRadius = maxRing > 0 ? RING_BASE + (maxRing - 1) * RING_STEP : 0
    const size = Math.max(MIN_SIZE, Math.ceil((maxRadius + RING_BASE) * 2))
    const cx = size / 2
    const cy = size / 2

    const nodes: MapNode[] = []
    const first = patterns[0]
    nodes.push({
        id: first.pattern_id,
        x: cx,
        y: cy,
        r: radiusFor(first.confirmed_count),
        pattern: first,
    })

    let cursor = 1
    for (
        let ring = 0;
        ring < ringCounts.length && cursor < patterns.length;
        ring++
    ) {
        const count = ringCounts[ring]
        const radius = RING_BASE + ring * RING_STEP
        const start =
            ring % 2 === 0 ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / count
        for (let i = 0; i < count && cursor < patterns.length; i++, cursor++) {
            const angle = start + (i * 2 * Math.PI) / count
            const pattern = patterns[cursor]
            nodes.push({
                id: pattern.pattern_id,
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle),
                r: radiusFor(pattern.confirmed_count),
                pattern,
            })
        }
    }
    return { nodes, size }
}

function nodeStyles(pattern: PatternInsight) {
    return pattern.label ? LABEL_STYLES[pattern.label] : NO_LABEL_STYLES
}

function nameForLabel(name: string) {
    return name.length > 16 ? `${name.slice(0, 15)}…` : name
}

function nodeLabel(pattern: PatternInsight) {
    const score =
        pattern.mastery_score !== null
            ? `${pattern.mastery_score}%`
            : 'no score yet'
    return [
        pattern.name,
        `${pattern.confirmed_count} confirmed problem${pattern.confirmed_count === 1 ? '' : 's'}`,
        `${pattern.due_count} due · ${score}`,
        pattern.label ?? 'no mastery label yet',
    ].join(', ')
}

interface PatternMapProps {
    patterns: PatternInsight[]
    edges: PatternEdge[]
    selectedId: number | null
    onSelect: (patternId: number) => void
    onClear: () => void
    className?: string
}

export function PatternMap({
    patterns,
    edges,
    selectedId,
    onSelect,
    onClear,
    className,
}: PatternMapProps) {
    const titleId = useId()
    const { nodes, size } = computeMapLayout(patterns)

    const nodeById = new Map(nodes.map((node) => [node.id, node]))

    const handleKeyDown = (event: React.KeyboardEvent, patternId: number) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect(patternId)
        }
        if (event.key === 'Escape') {
            onClear()
        }
    }

    return (
        <div
            className={cn(
                'overflow-x-auto rounded-xl border bg-card p-4',
                className,
            )}
        >
            <svg
                viewBox={`0 0 ${size} ${size}`}
                role="group"
                aria-labelledby={titleId}
                className={cn(
                    'h-auto w-full min-w-[560px]',
                    patterns.length === 1 && 'min-w-0',
                )}
            >
                <title id={titleId}>
                    Pattern map of {patterns.length} confirmed pattern
                    {patterns.length === 1 ? '' : 's'}
                </title>
                <desc>
                    Each circle is a confirmed pattern. Size reflects the number
                    of confirmed problems, color reflects mastery label, and
                    lines connect patterns that co-occur on the same problems.
                    Use the list below the map for an equivalent text interface.
                </desc>

                {/* Edges are decorative; all edge information is repeated
                    in the accessible list and detail panel. */}
                <g aria-hidden="true">
                    {edges.map((edge) => {
                        const source = nodeById.get(edge.source_pattern_id)
                        const target = nodeById.get(edge.target_pattern_id)
                        if (!source || !target) {
                            return null
                        }
                        const dx = target.x - source.x
                        const dy = target.y - source.y
                        const distance = Math.sqrt(dx * dx + dy * dy) || 1
                        const ux = dx / distance
                        const uy = dy / distance
                        const x1 = source.x + ux * source.r
                        const y1 = source.y + uy * source.r
                        const x2 = target.x - ux * target.r
                        const y2 = target.y - uy * target.r
                        return (
                            <line
                                key={`${edge.source_pattern_id}-${edge.target_pattern_id}`}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                strokeWidth={
                                    1 +
                                    Math.min(3, edge.shared_problem_count / 2)
                                }
                                className="stroke-muted-foreground/40"
                            >
                                <title>
                                    Shared by {edge.shared_problem_count}{' '}
                                    confirmed problem
                                    {edge.shared_problem_count === 1 ? '' : 's'}
                                </title>
                            </line>
                        )
                    })}
                </g>

                {nodes.map((node) => {
                    const selected = node.id === selectedId
                    const styles = nodeStyles(node.pattern)
                    return (
                        <g
                            key={node.id}
                            tabIndex={0}
                            role="button"
                            aria-pressed={selected}
                            aria-label={`Pattern ${node.pattern.name}. ${nodeLabel(node.pattern)}. Press Enter to select, Escape to clear.`}
                            onClick={() => onSelect(node.id)}
                            onKeyDown={(event) => handleKeyDown(event, node.id)}
                            className={cn(
                                'group cursor-pointer outline-none',
                                selected && 'opacity-100',
                            )}
                        >
                            {/* Focus ring — visible for keyboard users. */}
                            <circle
                                cx={node.x}
                                cy={node.y}
                                r={node.r + 4}
                                className="fill-transparent stroke-transparent opacity-0 transition-opacity group-focus-within:opacity-100 group-focus-within:stroke-primary"
                            />
                            <circle
                                cx={node.x}
                                cy={node.y}
                                r={node.r}
                                className={cn(
                                    styles.fill,
                                    selected
                                        ? 'stroke-primary stroke-2'
                                        : cn(styles.stroke, 'stroke-[1.5]'),
                                )}
                            />
                            <text
                                x={node.x}
                                y={node.y - 2}
                                textAnchor="middle"
                                className={cn('font-semibold', styles.text)}
                                style={{ fontSize: 11 }}
                            >
                                {nameForLabel(node.pattern.name)}
                            </text>
                            <text
                                x={node.x}
                                y={node.y + 12}
                                textAnchor="middle"
                                className="fill-muted-foreground"
                                style={{ fontSize: 8 }}
                            >
                                {node.pattern.confirmed_count} confirmed
                            </text>
                            <text
                                x={node.x}
                                y={node.y + 22}
                                textAnchor="middle"
                                className="fill-muted-foreground"
                                style={{ fontSize: 8 }}
                            >
                                {node.pattern.due_count} due ·{' '}
                                {node.pattern.mastery_score !== null
                                    ? `${node.pattern.mastery_score}%`
                                    : 'no scores'}
                            </text>
                        </g>
                    )
                })}
            </svg>

            {/* Legend — text explains the color coding. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3">
                <span className="text-xs font-medium text-muted-foreground">
                    Mastery:
                </span>
                {(
                    [
                        ['Strong', 'bg-emerald-500'],
                        ['Developing', 'bg-amber-500'],
                        ['Learning', 'bg-sky-500'],
                        ['Needs practice', 'bg-rose-500'],
                    ] as [MasteryLabel, string][]
                ).map(([label, color]) => (
                    <span
                        key={label}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                        <span
                            className={cn('h-2.5 w-2.5 rounded-full', color)}
                        />
                        {label}
                    </span>
                ))}
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                    No evidence
                </span>
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    Lines connect patterns shared across problems
                </span>
            </div>
        </div>
    )
}
