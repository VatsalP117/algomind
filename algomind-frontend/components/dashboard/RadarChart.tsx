'use client'

import { TrendingUp } from 'lucide-react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts'

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

export const description = 'A radar chart'

const chartData = [
    { month: 'Graphs', desktop: 186 },
    { month: 'Dynamic Programming', desktop: 305 },
    { month: 'Trees', desktop: 237 },
    { month: 'Strings', desktop: 273 },
    { month: 'Others', desktop: 209 },
    { month: 'June', desktop: 214 },
]

const chartConfig = {
    desktop: {
        label: 'Desktop',
        color: 'var(--chart-1)',
    },
} satisfies ChartConfig

export function ChartRadarDefault() {
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
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <RadarChart data={chartData}>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                        />
                        <PolarAngleAxis dataKey="month" />
                        <PolarGrid />
                        <Radar
                            dataKey="desktop"
                            fill="var(--color-desktop)"
                            fillOpacity={0.6}
                        />
                    </RadarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
