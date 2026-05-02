'use client'

import { ArrowRight, CheckCircle2, Clock, Zap } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardMetrics } from '@/features/dashboard'

export function QueueCard() {
    const { data, isLoading, isError } = useDashboardMetrics()

    const dueCount = data?.due_count ?? 0
    const reviewsToday = data?.reviews_today ?? 0
    const totalToReview = dueCount + reviewsToday
    const progressValue = totalToReview > 0
        ? Math.round((reviewsToday / totalToReview) * 100)
        : 100

    const isComplete = dueCount === 0 && !isLoading

    return (
        <Card className="group relative overflow-hidden border transition-all duration-100 ease-out hover:-translate-y-0.5">
            {/* Decorative accent */}
            <div className="absolute left-0 top-0 h-1 w-full bg-primary/20" />

            <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${isComplete ? 'bg-[#4ade80]/10' : 'bg-primary/10'}`}>
                            {isComplete ? (
                                <CheckCircle2 className="h-5 w-5 text-[#16a34a] dark:text-[#4ade80]" />
                            ) : (
                                <Clock className="h-5 w-5 text-primary" />
                            )}
                        </div>
                        <div>
                            <CardTitle className="font-display text-xl font-bold">Today&rsquo;s Queue</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Problems scheduled for review
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative space-y-4 pt-4">
                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-full rounded-full" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                ) : isError ? (
                    <p className="text-destructive text-sm">Failed to load queue data</p>
                ) : (
                    <>
                        {/* Progress Section */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Daily Progress</span>
                                <span className="font-semibold tabular-nums font-mono text-sm">
                                    {reviewsToday} / {totalToReview}
                                </span>
                            </div>
                            <div className="relative">
                                <Progress
                                    value={progressValue}
                                    className="h-2 bg-muted"
                                />
                                {progressValue === 100 && (
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#4ade80]/20 to-[#4ade80]/30 animate-pulse" />
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-[#d97706] dark:text-[#fbbf24]" />
                                <span className="font-display text-2xl font-bold">{dueCount}</span>
                                <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">due</span>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>

            <CardFooter className="relative pt-2">
                <Link href="/dashboard/review" passHref className="w-full">
                    <Button
                        disabled={isLoading || dueCount === 0}
                        className={`w-full group/btn transition-all duration-100 ease-out ${isComplete
                            ? 'bg-[#16a34a] hover:bg-[#16a34a]/90 dark:bg-[#4ade80] dark:text-[#0a0a0a]'
                            : 'bg-primary hover:bg-primary/90'
                            }`}
                        size="lg"
                    >
                        {isComplete ? (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                All Caught Up!
                            </>
                        ) : (
                            <>
                                Start Review
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-100 ease-out group-hover/btn:translate-x-1" />
                            </>
                        )}
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}
