'use client'

import { useEffect } from 'react'
import { useReviewProblems } from '@/features/review/api/useReviewProblems'
import { useReviewStore } from '@/features/review/store/useReviewStore'
import ReviewCard from '@/features/review/components/review-card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, RotateCcw, ArrowLeft, Sparkles } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export default function ReviewPage() {
    const router = useRouter()
    const { data: problems, isLoading } = useReviewProblems()

    const { queue, currentIndex, isSessionComplete, initSession } =
        useReviewStore()

    useEffect(() => {
        if (problems) {
            initSession(problems)
        }
    }, [problems, initSession])

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <div className="text-center">
                    <p className="font-medium">Loading your review queue</p>
                    <p className="text-sm text-muted-foreground">
                        Preparing problems for review...
                    </p>
                </div>
            </div>
        )
    }

    // 2. Zero State (No reviews for today)
    if (!isLoading && problems?.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <div className="text-center max-w-md">
                    <h1 className="text-3xl font-bold tracking-tight">All Caught Up!</h1>
                    <p className="text-muted-foreground mt-2">
                        You have no problems due for review right now. Take a break or add new problems to learn.
                    </p>
                </div>
                <Button
                    size="lg"
                    onClick={() => router.push('/dashboard')}
                    className="mt-2"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </div>
        )
    }

    // 3. Session Complete State
    if (isSessionComplete) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center max-w-md">
                    <h1 className="text-3xl font-bold tracking-tight">Session Complete! 🎉</h1>
                    <p className="text-muted-foreground mt-2">
                        You reviewed <span className="font-semibold text-foreground">{queue.length}</span> problems. Great work keeping up with your practice!
                    </p>
                </div>
                <div className="flex gap-3 mt-2">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.location.reload()}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Review More
                    </Button>
                    <Button
                        size="lg"
                        onClick={() => router.push('/dashboard')}
                    >
                        Finish
                    </Button>
                </div>
            </div>
        )
    }

    // 4. Active Review State
    const currentProblem = queue[currentIndex]
    const progressPercent = Math.round((currentIndex / queue.length) * 100)

    return (
        <div className="min-h-screen">
            {/* Compact Header */}
            <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto max-w-3xl px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <RotateCcw className="h-4 w-4" />
                            </div>
                            <h1 className="text-xl font-bold">Review Session</h1>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-mono font-medium">{currentIndex + 1}</span>
                            <span className="text-muted-foreground">of</span>
                            <span className="font-mono font-medium">{queue.length}</span>
                        </div>
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                </div>
            </div>

            {/* Review Card */}
            <div className="mx-auto max-w-3xl px-6 py-8">
                {currentProblem && <ReviewCard problem={currentProblem} />}
            </div>
        </div>
    )
}
