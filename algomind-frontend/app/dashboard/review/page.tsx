'use client'

import { useEffect } from 'react'
import { PageFlexContainer } from '@/components/shared/containers'
import { TypographyH1 } from '@/components/shared/typography'
import { useReviewProblems } from '@/features/review/api/useReviewProblems'
import { useReviewStore } from '@/features/review/store/useReviewStore'
import ReviewCard from '@/features/review/components/review-card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function ReviewPage() {
    const router = useRouter()
    const { data: problems, isLoading } = useReviewProblems()

    // Connect to our store
    const { queue, currentIndex, isSessionComplete, initSession } =
        useReviewStore()

    // Initialize session when data arrives
    useEffect(() => {
        if (problems) {
            initSession(problems)
        }
    }, [problems, initSession])

    // 1. Loading State
    if (isLoading) {
        return (
            <PageFlexContainer className="items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground mt-2">
                    Loading your review queue...
                </p>
            </PageFlexContainer>
        )
    }

    // 2. Zero State (No reviews for today)
    if (!isLoading && problems?.length === 0) {
        return (
            <PageFlexContainer className="items-center justify-center h-[60vh] text-center">
                <div className="bg-secondary/50 p-8 rounded-full mb-4">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <TypographyH1>All Caught Up!</TypographyH1>
                <p className="text-muted-foreground mt-2 max-w-md">
                    You have no cards due for review right now. Go learn
                    something new or rest up.
                </p>
                <Button
                    className="mt-6"
                    onClick={() => router.push('/dashboard')}
                >
                    Back to Dashboard
                </Button>
            </PageFlexContainer>
        )
    }

    // 3. Session Complete State
    if (isSessionComplete) {
        return (
            <PageFlexContainer className="items-center justify-center h-[60vh] text-center">
                <TypographyH1>Session Complete 🎉</TypographyH1>
                <p className="text-muted-foreground mt-2">
                    You reviewed {queue.length} items. Syncing progress...
                </p>
                {/* TODO: Trigger the sync mutation here automatically */}
                <Button
                    className="mt-6"
                    onClick={() => router.push('/dashboard')}
                >
                    Finish
                </Button>
            </PageFlexContainer>
        )
    }

    // 4. Active Review State
    const currentProblem = queue[currentIndex]

    return (
        <PageFlexContainer className="items-center max-w-3xl mx-auto w-full py-8">
            <div className="w-full flex justify-between items-end mb-6 px-1">
                <TypographyH1>Review</TypographyH1>
                <span className="font-mono text-sm text-muted-foreground">
                    {currentIndex + 1} / {queue.length}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-secondary rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${(currentIndex / queue.length) * 100}%` }}
                />
            </div>

            {currentProblem && <ReviewCard problem={currentProblem} />}
        </PageFlexContainer>
    )
}
