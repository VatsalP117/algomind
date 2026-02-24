
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useCreateProblem } from "@/features/add-problem/api/useCreateProblem"
import { useFetchLeetCode } from "@/features/add-problem/api/useFetchLeetCode"
import { Loader2, Sparkles, CheckCircle, ChevronDown, ChevronUp, Eye } from "lucide-react"
import { toast } from "react-hot-toast"

import { useForm, Controller } from "react-hook-form"
import { useConcepts } from "@/features/edit-concepts/api/useConcepts"


type FormFields = {
    title: string;
    problemLink: string;
    concept: string;
    difficulty: string;
    summary: string;
    description: string;
    answer: string;
    hints: string;
}

function isLeetCodeUrl(url: string): boolean {
    return url.includes('leetcode.com/problems/')
}

function cleanLeetCodeUrl(url: string): string {
    try {
        const parsed = new URL(url)
        return `${parsed.origin}${parsed.pathname}`
    } catch {
        return url
    }
}

export default function SubmitProblemForm() {
    const form = useForm<FormFields>()
    const { data: concepts } = useConcepts()
    const { register, handleSubmit, formState, setValue, watch, reset: resetFormState } = form
    const { isSubmitting } = formState
    const { mutateAsync } = useCreateProblem()
    const { mutate: fetchLeetCode, isPending: isFetching, isSuccess: isFetched } = useFetchLeetCode()

    const problemLink = watch("problemLink")

    useEffect(() => {
        if (problemLink && isLeetCodeUrl(problemLink)) {
            const timer = setTimeout(() => {
                const cleanUrl = cleanLeetCodeUrl(problemLink)
                fetchLeetCode(cleanUrl, {
                    onSuccess: (data) => {
                        setValue("title", data.title)
                        setValue("description", data.description)
                        setValue("difficulty", data.difficulty)
                        const summaryText = data.title
                        setValue("summary", summaryText)
                        toast.success(`Fetched details for "${data.title}"`)
                    }
                })
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [problemLink, fetchLeetCode, setValue])

    const onSubmit = (data: FormFields) => {
        const conceptId = data.concept && data.concept !== "none" ? parseInt(data.concept) : null
        mutateAsync({ ...data, conceptId: conceptId, difficulty: data.difficulty || 'EASY' })
        resetFormState()
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="problemLink">
                            Problem Link
                        </Label>
                        <div className="relative">
                            <Input
                                {...register("problemLink")}
                                type="url"
                                placeholder="https://leetcode.com/problems/two-sum/"
                                className="pr-10"
                            />
                            {isFetching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {isFetched && !isFetching && problemLink && isLeetCodeUrl(problemLink) && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Sparkles className="h-3 w-3 text-yellow-500" />
                            <span>Paste a LeetCode URL to auto-fill problem details</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Problem Title
                        </Label>
                        <Input
                            {...register("title", {
                                required: "Problem title is required",
                            })}
                            placeholder="e.g., Two Sum, Longest Substring Without Repeating Characters"
                        />
                        <p className="text-xs text-red-500">
                            {form.formState.errors.title?.message}
                        </p>
                    </div>

                    {/* <div className="space-y-2">
                        <Label htmlFor="summary">
                            Problem Summary
                        </Label>
                        <Input
                            {...register("summary", {
                                required: "Summary is required",
                            })}
                            placeholder="Brief summary of the problem"
                        />
                        <p className="text-xs text-red-500">
                            {form.formState.errors.summary?.message}
                        </p>
                    </div> */}

                    <DescriptionField
                        register={register}
                        description={watch("description")}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="difficulty">Difficulty</Label>
                            <Controller
                                control={form.control}
                                name="difficulty"
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <SelectTrigger id="difficulty">
                                            <SelectValue placeholder="Select difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Easy">Easy</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="conceptId">Associated Concept</Label>
                            <Controller
                                control={form.control}
                                name="concept"
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <SelectTrigger id="conceptId">
                                            <SelectValue placeholder="Select a concept" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {concepts?.map((concept) => (
                                                <SelectItem key={concept.id} value={concept.id.toString()}>
                                                    {concept.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="hints">Notes/Hints (Optional)</Label>
                        <Textarea
                            {...register("hints")}
                            placeholder="Add any additional notes, hints, or key insights about this problem..."
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="answer">Answer</Label>
                        <Textarea
                            {...register("answer", {
                                required: "Answer is required",
                            })}
                            placeholder="Add the answer to this problem."
                            rows={8}
                        />
                        <p className="text-xs text-red-500">
                            {form.formState.errors.answer?.message}
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-3 justify-end border-t pt-6">
                    <Button type="button" variant="destructive">
                        Reset
                    </Button>
                    <Button type="submit" disabled={isSubmitting || isFetching}>
                        {isSubmitting ? "Saving..." : "Save Problem"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}

function DescriptionField({
    register,
    description
}: {
    register: any;
    description: string;
}) {
    const [showPreview, setShowPreview] = useState(true)
    const hasContent = description && description.trim().length > 0

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="description">
                    Problem Description
                </Label>
                {hasContent && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-xs h-7 gap-1"
                    >
                        <Eye className="h-3 w-3" />
                        {showPreview ? "Edit" : "Preview"}
                        {showPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                )}
            </div>

            {showPreview && hasContent ? (
                <div
                    className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/30 p-4 max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: description }}
                />
            ) : (
                <Textarea
                    {...register("description")}
                    rows={8}
                    placeholder="Full problem description..."
                />
            )}
        </div>
    )
}