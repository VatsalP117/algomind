"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Rating = 1 | 2 | 3 | 4

export type ReviewProblem = {
    entity_id: number
    entity_type: string
    title: string
    summary: string
    difficulty: string
    answer: string
    hints: string
    next_review_at: string
}

export default function ReviewCard({ problem }: { problem?: ReviewProblem }) {
    const [revealed, setRevealed] = useState(false)
    const [rating, setRating] = useState<Rating | null>(null)

    // Reset state when problem changes
    useEffect(() => {
        setRevealed(false)
        setRating(null)
    }, [problem?.entity_id])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const map: Record<string, Rating> = { "1": 1, "2": 2, "3": 3, "4": 4 }
            if (e.key in map) setRating(map[e.key] as Rating)
            if (e.key.toLowerCase() === " ") setRevealed((v) => !v)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [])

    if (!problem) return <div>Loading...</div>

    return (
        <Card className="mx-auto w-full max-w-2xl border-border bg-card">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-balance">{problem.title}</CardTitle>
                    <span className="text-xs font-mono px-2 py-1 rounded-sm bg-secondary text-secondary-foreground">
                        {problem.difficulty}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">
                    {problem.summary}
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div
                    className={cn(
                        "rounded-md border border-border bg-secondary/60 p-4 font-mono text-sm leading-6 whitespace-pre-wrap",
                        revealed ? "opacity-100" : "opacity-50 blur-[2px]",
                    )}
                >
                    {problem.answer}
                </div>
                <Button onClick={() => setRevealed((v) => !v)} aria-keyshortcuts="Space">
                    {revealed ? "Hide Answer" : "Reveal Answer"} <span className="sr-only">(Space)</span>
                </Button>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <div className="flex w-full gap-2">
                    <RatingButton label="Again" hint="1" active={rating === 1} onClick={() => setRating(1)} interval="in 10m" />
                    <RatingButton label="Hard" hint="2" active={rating === 2} onClick={() => setRating(2)} interval="in 8h" />
                    <RatingButton label="Good" hint="3" active={rating === 3} onClick={() => setRating(3)} interval="in 2d" />
                    <RatingButton label="Easy" hint="4" active={rating === 4} onClick={() => setRating(4)} interval="in 5d" />
                </div>
                <p className="text-xs text-muted-foreground">
                    Hotkeys: <span className="kbd">1</span> <span className="kbd">2</span> <span className="kbd">3</span>{" "}
                    <span className="kbd">4</span> · <span className="kbd">Space</span> reveal
                </p>
            </CardFooter>
        </Card>
    )
}

function RatingButton({
    label,
    hint,
    interval,
    active,
    onClick,
}: { label: string; hint: string; interval: string; active?: boolean; onClick: () => void }) {
    return (
        <Button
            variant={active ? "default" : "secondary"}
            className={cn("flex-1 justify-between", active && "bg-primary text-primary-foreground")}
            onClick={onClick}
            aria-pressed={active}
        >
            <span>{label}</span>
            <span className="text-xs text-primary-foreground/80">{interval}</span>
            <span aria-hidden className="kbd">
                {hint}
            </span>
        </Button>
    )
}
