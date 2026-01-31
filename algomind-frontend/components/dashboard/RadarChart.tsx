'use client'

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { Brain, Sparkles } from 'lucide-react'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'
import { useTopicMastery } from '@/features/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

const chartConfig = {
    mastery: {
        label: 'Mastery',
        color: 'hsl(var(--chart-2))',
    },
} satisfies ChartConfig

export function ChartRadarDefault() {
    const { data, isLoading, isError } = useTopicMastery()

    // Transform data for chart - limit to top 6 for readability
    const chartData = data?.slice(0, 6).map((topic) => ({
        topic: topic.concept_title.length > 12
            ? topic.concept_title.slice(0, 12) + '...'
            : topic.concept_title,
        mastery: topic.mastery_score,
        fullName: topic.concept_title,
        problemCount: topic.problem_count,
    })) ?? []

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
                    {!isLoading && !isError && chartData.length > 0 && (
                        <div className="text-right">
                            <p className="text-3xl font-bold tabular-nums">{avgMastery}%</p>
                            <p className="text-xs text-muted-foreground">avg mastery</p>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="relative pt-2">
                {isLoading ? (
                    <div className="flex aspect-square max-h-[250px] items-center justify-center">
                        <Skeleton className="h-[200px] w-[200px] rounded-full" />
                    </div>
                ) : isError ? (
                    <div className="flex aspect-square max-h-[250px] items-center justify-center">
                        <p className="text-destructive text-sm">Failed to load mastery data</p>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed">
                        <Brain className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground text-center px-4">
                            Add problems to see your mastery progress!
                        </p>
                    </div>
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[250px]"
                    >
                        <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                            <defs>
                                <linearGradient id="masteryGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        formatter={(value, name, item) => (
                                            <div className="min-w-[120px] space-y-1">
                                                <p className="font-semibold">{item.payload.fullName}</p>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Mastery</span>
                                                    <span className="font-medium">{value}%</span>
                                                </div>
                                            </div>
                                        )}
                                    />
                                }
                            />
                            <PolarAngleAxis
                                dataKey="topic"
                                tick={{
                                    fontSize: 11,
                                    fill: 'hsl(var(--muted-foreground))',
                                    fontWeight: 500
                                }}
                                tickLine={false}
                            />
                            <PolarGrid
                                stroke="hsl(var(--border))"
                                strokeDasharray="3 3"
                            />
                            <Radar
                                dataKey="mastery"
                                fill="url(#masteryGradient)"
                                stroke="hsl(var(--chart-2))"
                                strokeWidth={2}
                            />
                        </RadarChart>
                    </ChartContainer>
                )}

                {/* Topic pills for context */}
                {!isLoading && !isError && data && data.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                        {data.slice(0, 4).map((topic, i) => (
                            <div
                                key={topic.concept_id}
                                className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs"
                            >
                                <span className={`h-2 w-2 rounded-full ${topic.mastery_score >= 70
                                    ? 'bg-green-500'
                                    : topic.mastery_score >= 40
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`} />
                                <span className="font-medium truncate max-w-[80px]">
                                    {topic.concept_title}
                                </span>
                                <span className="text-muted-foreground">{topic.mastery_score}%</span>
                            </div>
                        ))}
                        {data.length > 4 && (
                            <div className="flex items-center gap-1 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                                +{data.length - 4} more
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
