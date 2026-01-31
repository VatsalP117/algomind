'use client'

import { QueueCard } from '@/components/dashboard/QueueCard'
import StreakCard from '@/components/dashboard/StreakCard'
import { ChartLineLinear } from '@/components/dashboard/LineChart'
import { ChartRadarDefault } from '@/components/dashboard/RadarChart'
import { useDashboardMetrics } from '@/features/dashboard'
import { Sparkles, Target, TrendingUp, BookOpen } from 'lucide-react'

export default function DashboardPage() {
    const { data } = useDashboardMetrics()
    const totalProblems = data?.total_problems ?? 0

    return (
        <div className="min-h-screen">
            <div className="relative border-b">
                <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                                Dashboard
                            </h1>
                        </div>
                        <p className="text-muted-foreground max-w-2xl">
                            Track your learning progress, maintain your streak, and master algorithms one problem at a time.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <QuickStat
                            icon={<Target className="h-4 w-4" />}
                            label="Due Today"
                            value={data?.due_count ?? 0}
                            color="text-orange-500"
                        />
                        <QuickStat
                            icon={<TrendingUp className="h-4 w-4" />}
                            label="Reviewed Today"
                            value={data?.reviews_today ?? 0}
                            color="text-green-500"
                        />
                        <QuickStat
                            icon={<Sparkles className="h-4 w-4" />}
                            label="Current Streak"
                            value={`${data?.current_streak ?? 0} days`}
                            color="text-amber-500"
                        />
                        <QuickStat
                            icon={<BookOpen className="h-4 w-4" />}
                            label="Total Problems"
                            value={totalProblems}
                            color="text-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
                    <QueueCard />
                    <StreakCard />
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:gap-8">
                    <ChartLineLinear />
                    <ChartRadarDefault />
                </div>
            </div>
        </div>
    )
}

function QuickStat({
    icon,
    label,
    value,
    color
}: {
    icon: React.ReactNode
    label: string
    value: string | number
    color: string
}) {
    return (
        <div className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all duration-300 hover:shadow-md hover:border-primary/20">
            <div className="relative flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-muted ${color}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                    </p>
                    <p className="text-xl font-bold tracking-tight">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    )
}
