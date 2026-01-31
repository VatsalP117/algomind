'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import { useRecallQuality } from '@/features/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

const chartConfig = {
    recall_rate: {
        label: 'Recall Rate',
        color: 'var(--chart-1)',
    },
} satisfies ChartConfig

export function ChartLineLinear() {
    const { data, isLoading, isError } = useRecallQuality(7)

    // Transform data for chart - format date for display
    const chartData = data?.map((point) => ({
        date: new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' }),
        recall_rate: point.recall_rate,
        total_reviews: point.total_reviews,
    })) ?? []

    // Calculate trend
    const getTrend = () => {
        if (!data || data.length < 2) return { direction: 'neutral', value: 0 }
        const recent = data.slice(-3)
        const older = data.slice(0, -3)
        if (recent.length === 0 || older.length === 0) return { direction: 'neutral', value: 0 }

        const recentAvg = recent.reduce((a, b) => a + b.recall_rate, 0) / recent.length
        const olderAvg = older.reduce((a, b) => a + b.recall_rate, 0) / older.length
        const diff = recentAvg - olderAvg

        return {
            direction: diff > 2 ? 'up' : diff < -2 ? 'down' : 'neutral',
            value: Math.abs(diff).toFixed(1),
        }
    }

    const trend = getTrend()

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>
                    <TypographyH3>Recent Review Performance</TypographyH3>
                </CardTitle>
                <CardDescription className="text-base">
                    Recall quality over last 7 days.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-[200px] w-full" />
                ) : isError ? (
                    <p className="text-destructive">Failed to load recall data</p>
                ) : chartData.length === 0 ? (
                    <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                        No review data yet. Start reviewing to see your progress!
                    </div>
                ) : (
                    <ChartContainer config={chartConfig}>
                        <LineChart
                            accessibilityLayer
                            data={chartData}
                            margin={{
                                left: 12,
                                right: 12,
                            }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}%`}
                                width={45}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Line
                                dataKey="recall_rate"
                                type="monotone"
                                stroke="var(--color-recall_rate)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--color-recall_rate)' }}
                            />
                        </LineChart>
                    </ChartContainer>
                )}
            </CardContent>
            {!isLoading && !isError && chartData.length > 0 && (
                <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="flex gap-2 leading-none font-medium">
                        {trend.direction === 'up' && (
                            <>
                                Trending up by {trend.value}%
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </>
                        )}
                        {trend.direction === 'down' && (
                            <>
                                Trending down by {trend.value}%
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            </>
                        )}
                        {trend.direction === 'neutral' && (
                            <>
                                Staying consistent
                                <Minus className="h-4 w-4 text-muted-foreground" />
                            </>
                        )}
                    </div>
                    <div className="text-muted-foreground leading-none">
                        {data?.reduce((a, b) => a + b.total_reviews, 0)} total reviews this week
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}
