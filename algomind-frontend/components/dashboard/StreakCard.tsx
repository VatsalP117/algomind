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
import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react'

export default function StreakCard() {
    const { data, isLoading, isError } = useDashboardMetrics()

    const currentStreak = data?.current_streak ?? 0
    const longestStreak = data?.longest_streak ?? 0
    const isOnFire = currentStreak >= 7

    return (
        <Card className="group relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
            {/* Accent bar */}
            <div className="absolute left-0 top-0 h-1 w-full bg-orange-500/30" />

            <CardHeader className="relative pb-2">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isOnFire ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-orange-500/10'
                        }`}>
                        <Flame className={`h-5 w-5 ${isOnFire ? 'text-white' : 'text-orange-500'}`} />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold">Streak Tracker</CardTitle>
                        <CardDescription className="text-sm">
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
                            <span className="text-6xl font-black tabular-nums tracking-tight">
                                {currentStreak}
                            </span>
                            <div className="mb-2 flex flex-col">
                                <span className="text-lg font-semibold">days</span>
                                <span className="text-xs text-muted-foreground">current streak</span>
                            </div>
                            {isOnFire && (
                                <div className="mb-2 ml-2 flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1">
                                    <Flame className="h-3 w-3 text-orange-500" />
                                    <span className="text-xs font-semibold text-orange-500">On Fire!</span>
                                </div>
                            )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-6 border-t pt-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Best</p>
                                    <p className="font-bold tabular-nums">{longestStreak} days</p>
                                </div>
                            </div>

                            {currentStreak > 0 && longestStreak > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Progress</p>
                                        <p className="font-bold tabular-nums">
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
                                    ? "🎉 You're at your personal best!"
                                    : `${longestStreak - currentStreak} more days to beat your record!`
                            }
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
