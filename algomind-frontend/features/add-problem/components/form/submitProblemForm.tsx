
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useCreateItem } from "@/features/add-problem/api/useCreateItem"

import { useForm } from "react-hook-form"

const mockConcepts = [
    { id: 1, title: "Binary Search" },
    { id: 2, title: "Two Pointers" },
    { id: 3, title: "Sliding Window" },
    { id: 4, title: "Dynamic Programming" },
    { id: 5, title: "Backtracking" },
]



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
export default function SubmitProblemForm() {


    const form = useForm<FormFields>();
    const { register, handleSubmit, formState } = form;
    const { errors, isSubmitting } = formState;
    const { mutateAsync } = useCreateItem();
    const onSubmit = (data: FormFields) => {
        mutateAsync({ ...data, conceptId: 1 });
    }
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardContent className="space-y-6">
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

                    <div className="space-y-2">
                        <Label htmlFor="problemLink">
                            Problem Link
                        </Label>
                        <Input
                            {...register("problemLink")}
                            type="url"
                        />
                        <p className="text-xs text-muted-foreground">
                            Paste the full URL from LeetCode, HackerRank, or any other platform
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="summary">
                            Problem Summary
                        </Label>
                        <Input
                            {...register("summary", {
                                required: "Summary is required",
                            })}
                        />
                        <p className="text-xs text-red-500">
                            {form.formState.errors.summary?.message}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Problem Description
                        </Label>
                        <Textarea
                            {...register("description")}
                            rows={8}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="conceptId">Associated Concept (Optional)</Label>
                        <Select
                            {...register("concept")}
                        >
                            <SelectTrigger id="conceptId">
                                <SelectValue placeholder="Select a concept to link this problem" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {mockConcepts.map((concept) => (
                                    <SelectItem key={concept.id} value={concept.id.toString()}>
                                        {concept.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Link this problem to a concept for spaced repetition grouping
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="hints">Hints (Optional)</Label>
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
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Problem"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}