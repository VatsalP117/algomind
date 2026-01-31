'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { TypographyH3 } from '@/components/shared/typography'
import { useDashboardMetrics } from '@/features/dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { Flame, Trophy } from 'lucide-react'

export default function StreakCard() {
    const { data, isLoading, isError } = useDashboardMetrics()

    const currentStreak = data?.current_streak ?? 0
    const longestStreak = data?.longest_streak ?? 0

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>
                    <TypographyH3>Streak Tracker</TypographyH3>
                </CardTitle>
                <CardDescription className="text-base">
                    Days you have stayed consistent.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-6 w-40" />
                    </div>
                ) : isError ? (
                    <p className="text-destructive">Failed to load streak data</p>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Flame className="h-6 w-6 text-orange-500" />
                            <span className="text-2xl font-bold">
                                {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                            </span>
                            <span className="text-muted-foreground">current streak</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span>Best: {longestStreak} day{longestStreak !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
