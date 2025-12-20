
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"

// Mock concepts - replace with actual API call
const mockConcepts = [
    { id: 1, title: "Binary Search" },
    { id: 2, title: "Two Pointers" },
    { id: 3, title: "Sliding Window" },
    { id: 4, title: "Dynamic Programming" },
    { id: 5, title: "Backtracking" },
]
export default function SubmitProblemForm() {
    const [formData, setFormData] = useState({
        problemTitle: "",
        problemLink: "",
        conceptId: null,
        notes: "",
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(formData);
    }
    return (
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="problemTitle">
                        Problem Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="problemTitle"
                        placeholder="e.g., Two Sum, Longest Substring Without Repeating Characters"
                        value={formData.problemTitle}
                        onChange={(e) => setFormData({ ...formData, problemTitle: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="problemLink">
                        Problem Link <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="problemLink"
                        type="url"
                        placeholder="https://leetcode.com/problems/two-sum/"
                        value={formData.problemLink}
                        onChange={(e) => setFormData({ ...formData, problemLink: e.target.value })}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Paste the full URL from LeetCode, HackerRank, or any other platform
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="conceptId">Associated Concept (Optional)</Label>
                    <Select
                        value={formData.conceptId?.toString() || "none"}
                        onValueChange={(value) =>
                            setFormData({ ...formData, conceptId: value === "none" ? null : Number.parseInt(value) })
                        }
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
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                        id="notes"
                        placeholder="Add any additional notes, hints, or key insights about this problem..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={4}
                    />
                </div>
            </CardContent>
            <CardFooter className="flex gap-3 justify-end border-t pt-6">
                <Button type="button" variant="outline" asChild>
                    <Link href="/library">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        "Adding..."
                    ) : (
                        <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Problem
                        </>
                    )}
                </Button>
            </CardFooter>
        </form>
    )
}