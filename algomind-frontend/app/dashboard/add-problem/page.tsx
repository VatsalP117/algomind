'use client'

import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import SubmitProblemForm from "@/features/add-problem/components/form/submitProblemForm"
import { PlusCircle, Link as LinkIcon } from "lucide-react"

export default function AddProblemPage() {
    return (
        <div className="min-h-screen">
            <div className="relative border-b">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                                <PlusCircle className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                                Add Problem
                            </h1>
                        </div>
                        <p className="text-muted-foreground max-w-2xl">
                            Link LeetCode problems to concepts for spaced repetition review.
                        </p>
                    </div>
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
                                <CardTitle className="text-lg">Problem Details</CardTitle>
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