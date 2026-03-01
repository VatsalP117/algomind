'use client'

import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from 'recharts'

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
import { useRecallQuality } from '@/features/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

const chartConfig = {
    recall_rate: {
        label: 'Recall Rate',
        color: 'var(--color-chart-1)',
    },
} satisfies ChartConfig

export function ChartLineLinear() {
    const { data, isLoading, isError } = useRecallQuality(7)

    const chartData = data?.map((point) => ({
        date: new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' }),
        recall_rate: point.recall_rate,
        total_reviews: point.total_reviews,
    })) ?? []

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
    const avgRecall = data && data.length > 0
        ? Math.round(data.reduce((a, b) => a + b.recall_rate, 0) / data.length)
        : 0

    return (
        <Card className="group relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
            {/* Accent bar */}
            <div className="absolute left-0 top-0 h-1 w-full bg-blue-500/30" />

            <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                            <Activity className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Review Performance</CardTitle>
                            <CardDescription className="text-sm">
                                Recall quality over the last 7 days
                            </CardDescription>
                        </div>
                    </div>
                    {!isLoading && !isError && chartData.length > 0 && (
                        <div className="text-right">
                            <p className="text-3xl font-bold tabular-nums">{avgRecall}%</p>
                            <p className="text-xs text-muted-foreground">avg recall</p>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="relative pt-4">
                {isLoading ? (
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                ) : isError ? (
                    <div className="flex h-[200px] items-center justify-center">
                        <p className="text-destructive text-sm">Failed to load recall data</p>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed">
                        <Activity className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground text-center px-4">
                            No review data yet. Start reviewing to see your progress!
                        </p>
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <LineChart
                            accessibilityLayer
                            data={chartData}
                            margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="recallGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                stroke="var(--color-border)"
                            />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                fontSize={12}
                                stroke="var(--color-muted-foreground)"
                            />
                            <YAxis
                                domain={[0, 100]}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}%`}
                                width={45}
                                fontSize={12}
                                stroke="var(--color-muted-foreground)"
                            />
                            <ChartTooltip
                                cursor={{ stroke: 'var(--color-muted-foreground)', strokeWidth: 1 }}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Line
                                dataKey="recall_rate"
                                type="monotone"
                                stroke="var(--color-chart-1)"
                                strokeWidth={2.5}
                                dot={{ fill: 'var(--color-chart-1)', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--color-background)' }}
                            />
                        </LineChart>
                    </ChartContainer>
                )}
            </CardContent>

            {!isLoading && !isError && chartData.length > 0 && (
                <CardFooter className="relative flex items-center justify-between border-t pt-4">
                    <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${trend.direction === 'up'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : trend.direction === 'down'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                        {trend.direction === 'up' && <TrendingUp className="h-4 w-4" />}
                        {trend.direction === 'down' && <TrendingDown className="h-4 w-4" />}
                        {trend.direction === 'neutral' && <Minus className="h-4 w-4" />}
                        <span>
                            {trend.direction === 'up' && `+${trend.value}%`}
                            {trend.direction === 'down' && `-${trend.value}%`}
                            {trend.direction === 'neutral' && 'Steady'}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {data?.reduce((a, b) => a + b.total_reviews, 0)} reviews this week
                    </p>
                </CardFooter>
            )}
        </Card>
    )
}
