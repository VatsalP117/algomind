'use client'

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'

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
import { TypographyH3 } from '../shared/typography'
import { useTopicMastery } from '@/features/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

const chartConfig = {
    mastery: {
        label: 'Mastery',
        color: 'var(--chart-1)',
    },
} satisfies ChartConfig

export function ChartRadarDefault() {
    const { data, isLoading, isError } = useTopicMastery()

    // Transform data for chart - limit to top 6 for readability
    const chartData = data?.slice(0, 6).map((topic) => ({
        topic: topic.concept_title.length > 15
            ? topic.concept_title.slice(0, 15) + '...'
            : topic.concept_title,
        mastery: topic.mastery_score,
        fullName: topic.concept_title,
    })) ?? []

    return (
        <Card className="w-full max-w-lg">
            <CardHeader className="items-center pb-4">
                <CardTitle>
                    <TypographyH3>Mastery By Topic</TypographyH3>
                </CardTitle>
                <CardDescription className="text-base">
                    How well you have retained each concept.
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
                {isLoading ? (
                    <Skeleton className="mx-auto aspect-square max-h-[250px] w-full" />
                ) : isError ? (
                    <p className="text-destructive text-center">Failed to load mastery data</p>
                ) : chartData.length === 0 ? (
                    <div className="flex aspect-square max-h-[250px] items-center justify-center text-muted-foreground text-center px-4">
                        No problems tracked yet. Add problems to see your mastery progress!
                    </div>
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[250px]"
                    >
                        <RadarChart data={chartData}>
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        formatter={(value, name, item) => (
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium">{item.payload.fullName}</span>
                                                <span>Mastery: {value}%</span>
                                            </div>
                                        )}
                                    />
                                }
                            />
                            <PolarAngleAxis
                                dataKey="topic"
                                tick={{ fontSize: 11 }}
                            />
                            <PolarGrid />
                            <Radar
                                dataKey="mastery"
                                fill="var(--color-mastery)"
                                fillOpacity={0.6}
                                stroke="var(--color-mastery)"
                            />
                        </RadarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    )
}
