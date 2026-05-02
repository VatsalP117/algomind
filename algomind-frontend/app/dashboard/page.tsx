'use client'

import { BookOpen,Sparkles, Target, TrendingUp } from 'lucide-react'

import { ChartLineLinear } from '@/components/dashboard/LineChart'
import { QueueCard } from '@/components/dashboard/QueueCard'
import { ChartRadarDefault } from '@/components/dashboard/RadarChart'
import StreakCard from '@/components/dashboard/StreakCard'
import { useDashboardMetrics } from '@/features/dashboard'

export default function DashboardPage() {
    const { data } = useDashboardMetrics()
    const totalProblems = data?.total_problems ?? 0

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative border-b border-border">
                <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    {/* Eyebrow */}
                    <div className="font-mono text-xs uppercase tracking-[0.1em] text-primary mb-4">
                        Welcome back
                    </div>

                    {/* Title */}
                    <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                        Your learning journey
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed mb-8">
                        Track your progress, maintain your streak, and master algorithms
                        through spaced repetition practice.
                    </p>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <QuickStat
                            icon={<Target className="h-4 w-4" />}
                            label="Due Today"
                            value={data?.due_count ?? 0}
                            accent="secondary"
                        />
                        <QuickStat
                            icon={<TrendingUp className="h-4 w-4" />}
                            label="Reviewed Today"
                            value={data?.reviews_today ?? 0}
                            accent="success"
                        />
                        <QuickStat
                            icon={<Sparkles className="h-4 w-4" />}
                            label="Current Streak"
                            value={`${data?.current_streak ?? 0}d`}
                            accent="primary"
                        />
                        <QuickStat
                            icon={<BookOpen className="h-4 w-4" />}
                            label="Total Problems"
                            value={totalProblems}
                            accent="default"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                {/* Primary Cards Row */}
                <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
                    <QueueCard />
                    <StreakCard />
                </div>

                {/* Analytics Row */}
                <div className="mt-8">
                    <div className="section-label mb-4">Analytics</div>
                    <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
                        <ChartLineLinear />
                        <ChartRadarDefault />
                    </div>
                </div>
            </div>
        </div>
    )
}

function QuickStat({
    icon,
    label,
    value,
    accent
}: {
    icon: React.ReactNode
    label: string
    value: string | number
    accent: 'primary' | 'secondary' | 'success' | 'default'
}) {
    const accentStyles = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-[#fbbf24]/10 text-[#d97706] dark:text-[#fbbf24]',
        success: 'bg-[#4ade80]/10 text-[#16a34a] dark:text-[#4ade80]',
        default: 'bg-muted text-muted-foreground'
    }

    return (
        <div className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all duration-100 ease-out hover:-translate-y-0.5 hover:border-primary/20">
            <div className="relative flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-md ${accentStyles[accent]}`}>
                    {icon}
                </div>
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        {label}
                    </p>
                    <p className="font-display text-2xl font-bold tracking-tight text-foreground">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    )
}
