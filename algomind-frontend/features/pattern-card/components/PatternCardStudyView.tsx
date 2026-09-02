'use client'

import { Pencil, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type {
    PatternCard,
    ProblemDifficulty,
    RelatedProblem,
} from '../types/pattern-card'

const difficultyBadgeStyles: Record<ProblemDifficulty, string> = {
    EASY: 'bg-emerald-500/10 text-emerald-500 border-0',
    MEDIUM: 'bg-amber-500/10 text-amber-500 border-0',
    HARD: 'bg-rose-500/10 text-rose-500 border-0',
}

function DifficultyBadge({ difficulty }: { difficulty: ProblemDifficulty }) {
    return (
        <Badge
            className={cn(
                'shrink-0 shadow-none',
                difficultyBadgeStyles[difficulty],
            )}
        >
            {difficulty}
        </Badge>
    )
}

function StudySection({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-2">
            <h4 className="section-label">{label}</h4>
            <div className="text-sm leading-6">{children}</div>
        </div>
    )
}

interface PatternCardStudyViewProps {
    card: PatternCard
    onEdit: () => void
}

export function PatternCardStudyView({
    card,
    onEdit,
}: PatternCardStudyViewProps) {
    return (
        <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Pattern Card</h3>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="min-h-11"
                >
                    <Pencil />
                    Edit
                </Button>
            </div>

            {/* Patterns */}
            <div className="mt-5 space-y-3">
                {card.patterns.map((pattern) => (
                    <div
                        key={pattern.name}
                        className="rounded-lg border bg-elevated p-4"
                    >
                        <div className="flex items-center gap-2">
                            <Badge
                                className={cn(
                                    'border-0',
                                    pattern.role === 'primary'
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-secondary text-muted-foreground',
                                )}
                            >
                                {pattern.role}
                            </Badge>
                            <h4 className="font-semibold">{pattern.name}</h4>
                        </div>
                        {pattern.rationale && (
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {pattern.rationale}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Recognition cues */}
            {card.recognition_cues.length > 0 && (
                <div className="mt-5 space-y-2">
                    <h4 className="section-label">Recognition Cues</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {card.recognition_cues.map((cue, index) => (
                            <span
                                key={`${cue}-${index}`}
                                className="rounded-md border bg-muted/30 px-2.5 py-1.5 text-sm"
                            >
                                {cue}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Structured insights */}
            <div className="mt-5 space-y-4">
                {card.invariant && (
                    <StudySection label="Invariant">
                        {card.invariant}
                    </StudySection>
                )}
                {card.first_move && (
                    <StudySection label="First Move">
                        {card.first_move}
                    </StudySection>
                )}
                {card.common_mistake && (
                    <StudySection label="Common Mistake">
                        {card.common_mistake}
                    </StudySection>
                )}
                {card.contrasting_pattern && (
                    <StudySection label="Contrasting Pattern">
                        {card.contrasting_pattern}
                    </StudySection>
                )}
                {card.explanation && (
                    <StudySection label="Explanation">
                        {card.explanation}
                    </StudySection>
                )}
            </div>

            {/* Related problems */}
            {card.related_problems.length > 0 && (
                <div className="mt-5 space-y-2">
                    <h4 className="section-label">Related Problems</h4>
                    <div className="space-y-2">
                        {card.related_problems.map((related) => (
                            <RelatedProblemRow
                                key={related.id}
                                related={related}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function RelatedProblemRow({ related }: { related: RelatedProblem }) {
    return (
        <Link
            href={`/dashboard/library/problem/${related.id}`}
            className="group flex min-h-11 items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
        >
            <div className="min-w-0">
                <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                    {related.title}
                </p>
                {related.shared_patterns.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        {related.shared_patterns.map((pattern) => (
                            <Badge key={pattern} variant="outline">
                                {pattern}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
            <DifficultyBadge difficulty={related.difficulty} />
        </Link>
    )
}
