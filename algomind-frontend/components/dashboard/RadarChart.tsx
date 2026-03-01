'use client'

import { Brain } from 'lucide-react'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { useTopicMastery } from '@/features/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

function getMasteryColor(score: number) {
    if (score >= 70) return { bar: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-500/10' }
    if (score >= 40) return { bar: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10' }
    return { bar: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/10' }
}

function getMasteryLabel(score: number) {
    if (score >= 80) return 'Strong'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Learning'
    if (score >= 20) return 'Weak'
    return 'New'
}

export function ChartRadarDefault() {
    const { data, isLoading, isError } = useTopicMastery()

    const avgMastery = data && data.length > 0
        ? Math.round(data.reduce((a, b) => a + b.mastery_score, 0) / data.length)
        : 0

    return (
        <Card className="group relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
            {/* Accent bar */}
            <div className="absolute left-0 top-0 h-1 w-full bg-purple-500/30" />

            <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                            <Brain className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Topic Mastery</CardTitle>
                            <CardDescription className="text-sm">
                                Your strength across concepts
                            </CardDescription>
                        </div>
                    </div>
                    {!isLoading && !isError && data && data.length > 0 && (
                        <div className="text-right">
                            <p className="text-3xl font-bold tabular-nums">{avgMastery}%</p>
                            <p className="text-xs text-muted-foreground">avg mastery</p>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="relative pt-2">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex h-[200px] items-center justify-center">
                        <p className="text-destructive text-sm">Failed to load mastery data</p>
                    </div>
                ) : !data || data.length === 0 ? (
                    <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed">
                        <Brain className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground text-center px-4">
                            Add problems to see your mastery progress!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                        {data.map((topic) => {
                            const colors = getMasteryColor(topic.mastery_score)
                            const label = getMasteryLabel(topic.mastery_score)
                            return (
                                <div key={topic.concept_id} className="group/row space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium truncate flex-1">
                                            {topic.concept_title}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                                {label}
                                            </span>
                                            <span className="text-sm font-bold tabular-nums w-10 text-right">
                                                {topic.mastery_score}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={`absolute inset-y-0 left-0 rounded-full ${colors.bar} transition-all duration-500 ease-out`}
                                            style={{ width: `${topic.mastery_score}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                        <span>{topic.problem_count} problem{topic.problem_count !== 1 ? 's' : ''}</span>
                                        <span>·</span>
                                        <span>{topic.retention_rate}% recall</span>
                                        <span>·</span>
                                        <span>{topic.avg_interval}d avg interval</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
