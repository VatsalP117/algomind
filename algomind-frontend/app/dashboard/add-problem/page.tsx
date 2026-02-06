'use client'

import HeadingSection from '@/components/shared/heading-section'
import {
    Card,
    CardHeader,
    CardContent,
    CardDescription,
    CardTitle,
} from '@/components/ui/card'
import SubmitProblemForm from '@/features/add-problem/components/form/submitProblemForm'
import { PlusCircle, Link as LinkIcon, Heading } from 'lucide-react'

export default function AddProblemPage() {
    return (
        <div className="min-h-screen">
            <div className="relative border-b">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <HeadingSection
                        title="Add Problem"
                        description="Link LeetCode problems to concepts for spaced repetition review."
                    />
                </div>
            </div>

            <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
                <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                                <LinkIcon className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">
                                    Problem Details
                                </CardTitle>
                                <CardDescription>
                                    Enter the problem title and link to track it
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <SubmitProblemForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
