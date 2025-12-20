'use client'

import { PageFlexContainer } from "@/components/shared/containers"
import { TypographyH1, TypographyH4 } from "@/components/shared/typography"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import SubmitProblemForm from "@/features/add-problem/components/form/submitProblemForm"
export default function AddProblemPage() {
    return (
        <PageFlexContainer className="items-center">
            <TypographyH1>Add New Problem</TypographyH1>
            <Card className="w-full max-w-5xl bg-card">
                <CardHeader>
                    <TypographyH4>Link your leetcode problems to core concepts</TypographyH4>
                </CardHeader>
                <CardContent>
                    <SubmitProblemForm />
                </CardContent>
            </Card>
        </PageFlexContainer>
    )
}