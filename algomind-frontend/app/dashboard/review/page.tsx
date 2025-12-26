"use client"
import { PageFlexContainer } from '@/components/shared/containers'
import { TypographyH1 } from '@/components/shared/typography'
import ReviewCard from '@/features/review/components/review-card'
import { useReviewProblems } from '@/features/review/api/useReviewProblems'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function ReviewPage() {
    const [currentProblem, setCurrentProblem] = useState(0)
    const { data, isLoading, error } = useReviewProblems()
    console.log(data)
    return (
        <PageFlexContainer className="items-center">
            <TypographyH1>Review</TypographyH1>
            <ReviewCard problem={data?.[currentProblem]} />
            <Button onClick={() => setCurrentProblem((currentProblem + 1) % data?.length)}>Next</Button>
        </PageFlexContainer>
    )
}
