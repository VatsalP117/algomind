'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { useDashboardMetrics } from '@/features/dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { Flame, Trophy, TrendingUp } from 'lucide-react'

export default function StreakCard() {
    const { data, isLoading, isError } = useDashboardMetrics()

    const currentStreak = data?.current_streak ?? 0
    const longestStreak = data?.longest_streak ?? 0
    const isOnFire = currentStreak >= 7

    return (
        <Card className="group relative overflow-hidden border transition-all duration-100 ease-out hover:-translate-y-0.5">
            {/* Accent bar */}
            <div className="absolute left-0 top-0 h-1 w-full bg-[#fbbf24]/30" />

            <CardHeader className="relative pb-2">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors ${isOnFire ? 'bg-gradient-to-br from-[#fbbf24] to-[#f59e0b]' : 'bg-[#fbbf24]/10'
                        }`}>
                        <Flame className={`h-5 w-5 ${isOnFire ? 'text-[#0a0a0a]' : 'text-[#d97706] dark:text-[#fbbf24]'}`} />
                    </div>
                    <div>
                        <CardTitle className="font-display text-xl font-bold">Streak Tracker</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Keep the momentum going
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative space-y-6 pt-4">
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-32" />
                        <Skeleton className="h-6 w-40" />
                    </div>
                ) : isError ? (
                    <p className="text-destructive text-sm">Failed to load streak data</p>
                ) : (
                    <>
                        {/* Current Streak - Hero Number */}
                        <div className="flex items-end gap-3">
                            <span className="font-display text-6xl font-black tabular-nums tracking-tight text-foreground">
                                {currentStreak}
                            </span>
                            <div className="mb-2 flex flex-col">
                                <span className="text-lg font-semibold text-foreground">days</span>
                                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">current streak</span>
                            </div>
                            {isOnFire && (
                                <div className="mb-2 ml-2 flex items-center gap-1 rounded-full bg-[#fbbf24]/10 px-3 py-1">
                                    <Flame className="h-3 w-3 text-[#d97706] dark:text-[#fbbf24]" />
                                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-[#d97706] dark:text-[#fbbf24]">On Fire!</span>
                                </div>
                            )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-6 border-t border-border pt-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#fbbf24]/10">
                                    <Trophy className="h-4 w-4 text-[#d97706] dark:text-[#fbbf24]" />
                                </div>
                                <div>
                                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Best</p>
                                    <p className="font-display font-bold tabular-nums">{longestStreak} days</p>
                                </div>
                            </div>

                            {currentStreak > 0 && longestStreak > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#4ade80]/10">
                                        <TrendingUp className="h-4 w-4 text-[#16a34a] dark:text-[#4ade80]" />
                                    </div>
                                    <div>
                                        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Progress</p>
                                        <p className="font-display font-bold tabular-nums">
                                            {Math.round((currentStreak / longestStreak) * 100)}%
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Streak message */}
                        <p className="text-sm text-muted-foreground">
                            {currentStreak === 0
                                ? "Start reviewing to begin your streak!"
                                : currentStreak === longestStreak
                                    ? "You're at your personal best!"
                                    : `${longestStreak - currentStreak} more days to beat your record!`
                            }
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
