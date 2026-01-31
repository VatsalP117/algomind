'use client'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    TypographyH3,
    TypographyLarge,
    TypographySmall,
} from '@/components/shared/typography'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { useDashboardMetrics } from '@/features/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

export function QueueCard() {
    const { data, isLoading, isError } = useDashboardMetrics()

    const dueCount = data?.due_count ?? 0
    const reviewsToday = data?.reviews_today ?? 0
    const totalToReview = dueCount + reviewsToday
    const progressValue = totalToReview > 0
        ? Math.round((reviewsToday / totalToReview) * 100)
        : 0

    return (
        <Card className="w-full max-w-lg gap-6">
            <CardHeader>
                <CardTitle>
                    <TypographyH3>Today's Queue</TypographyH3>
                </CardTitle>
                <CardDescription className="text-base">
                    Concepts and problems scheduled for review today.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {isLoading ? (
                    <>
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </>
                ) : isError ? (
                    <p className="text-destructive">Failed to load queue data</p>
                ) : (
                    <>
                        <div className="flex w-full justify-between items-center">
                            <TypographyLarge>Progress</TypographyLarge>
                            <TypographySmall>
                                {reviewsToday}/{totalToReview}
                            </TypographySmall>
                        </div>
                        <Progress value={progressValue} />
                        <p className="text-sm text-muted-foreground mt-2">
                            {dueCount} problem{dueCount !== 1 ? 's' : ''} due for review
                        </p>
                    </>
                )}
            </CardContent>
            <CardFooter>
                <Link href="/dashboard/review" passHref>
                    <Button disabled={isLoading || dueCount === 0}>
                        {dueCount > 0 ? 'Start Review' : 'All Caught Up!'}
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}
