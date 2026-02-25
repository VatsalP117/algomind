"use client"
import { useEffect, useState } from "react"
import { useReviewStore, ReviewProblem } from "../store/useReviewStore"
import { useLogReview } from "../api/useReviewLog" // <--- Import the hook
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Eye, Lightbulb, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// Helper for color coding difficulty
const difficultyColor = (diff: string) => {
    switch (diff) {
        case "EASY": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
        case "MEDIUM": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
        case "HARD": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
        default: return "bg-secondary text-secondary-foreground";
    }
}

export default function ReviewCard({ problem }: { problem: ReviewProblem }) {
    const [revealed, setRevealed] = useState(false)
    const [showHint, setShowHint] = useState(false)

    // 1. Get Actions
    const nextCard = useReviewStore(state => state.nextCard)
    const { mutate: logReview, isPending } = useLogReview()

    // 2. Handle Rating Submission
    const handleRate = (rating: 1 | 2 | 3 | 4) => {
        logReview(
            { entityId: problem.entity_id, rating },
            {
                onSuccess: () => {
                    // Only move to next card if server accepted the log
                    nextCard();
                },
                onError: () => {
                    alert("Failed to save review. Please try again.");
                }
            }
        );
    }

    // Reset local state when problem changes
    useEffect(() => {
        setRevealed(false)
        setShowHint(false)
    }, [problem.entity_id])

    // Keyboard Shortcuts
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (isPending) return; // Disable keys while saving

            if (e.code === "Space") {
                e.preventDefault();
                if (!revealed) setRevealed(true);
            }

            if (revealed) {
                if (e.key === "1") handleRate(1);
                if (e.key === "2") handleRate(2);
                if (e.key === "3") handleRate(3);
                if (e.key === "4") handleRate(4);
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [revealed, isPending, handleRate]) // Added dependencies

    return (
        <Card className="w-full shadow-lg border-border bg-card">
            {/* Header ... (Same as before) ... */}
            <CardHeader>
                <CardTitle>{problem.title}</CardTitle>
                <p className="text-muted-foreground">{problem.summary}</p>
            </CardHeader>

            <CardContent className="min-h-[200px] flex flex-col gap-4">
                {/* Problem Description */}
                {problem.description && (
                    <div
                        className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/30 p-4 max-h-64 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: problem.description }}
                    />
                )}

                {/* Answer Section */}
                <div className="flex-1 flex items-center justify-center relative">
                    {!revealed ? (
                        <Button size="lg" onClick={() => setRevealed(true)}>
                            <Eye className="w-4 h-4 mr-2" /> Reveal Answer
                        </Button>
                    ) : (
                        <div className="w-full rounded-md border bg-card text-foreground p-4 max-h-72 overflow-y-auto">
                            {problem.answer_language ? (
                                <div className="mb-3 inline-flex rounded border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground not-prose">
                                    {problem.answer_language}
                                </div>
                            ) : null}
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p({ children }) {
                                        return <p className="mb-3 leading-7 text-foreground">{children}</p>
                                    },
                                    ul({ children }) {
                                        return <ul className="mb-3 list-disc pl-6">{children}</ul>
                                    },
                                    ol({ children }) {
                                        return <ol className="mb-3 list-decimal pl-6">{children}</ol>
                                    },
                                    li({ children }) {
                                        return <li className="mb-1 text-foreground">{children}</li>
                                    },
                                    code({ className, children, ...props }) {
                                        return (
                                            <code className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground", className)} {...props}>
                                                {children}
                                            </code>
                                        )
                                    },
                                    pre({ children }) {
                                        return (
                                            <pre className="rounded-md border bg-muted/40 text-foreground p-4 overflow-x-auto text-sm leading-6">
                                                {children}
                                            </pre>
                                        )
                                    },
                                }}
                            >
                                {problem.answer}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className={cn(
                "border-t p-6 transition-opacity duration-200",
                revealed ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
                {isPending ? (
                    <div className="w-full flex justify-center py-4 text-muted-foreground">
                        <Loader2 className="animate-spin mr-2" /> Saving...
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-3 w-full">
                        <RatingButton label="Again" hint="1" color="destructive" onClick={() => handleRate(1)} sub="< 10m" />
                        <RatingButton label="Hard" hint="2" color="warning" onClick={() => handleRate(2)} sub="2d" />
                        <RatingButton label="Good" hint="3" color="success" onClick={() => handleRate(3)} sub="4d" />
                        <RatingButton label="Easy" hint="4" color="default" onClick={() => handleRate(4)} sub="7d" />
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}

// Sub-component for buttons
function RatingButton({
    label, hint, sub, color, onClick
}: {
    label: string;
    hint: string;
    sub: string;
    color: 'default' | 'destructive' | 'warning' | 'success';
    onClick: () => void
}) {
    // Dynamic color mapping
    const variantStyles = {
        default: "hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/40 dark:hover:text-blue-400 border-blue-200",
        destructive: "hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/40 dark:hover:text-red-400 border-red-200",
        warning: "hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/40 dark:hover:text-orange-400 border-orange-200",
        success: "hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/40 dark:hover:text-green-400 border-green-200",
    }

    return (
        <Button
            variant="outline"
            className={cn("h-auto flex-col py-3 gap-1 relative transition-all active:scale-95", variantStyles[color])}
            onClick={onClick}
        >
            <span className="font-bold text-base">{label}</span>
            <span className="text-xs font-normal text-muted-foreground">{sub}</span>
            <span className="absolute top-2 right-2 text-[10px] font-mono opacity-50 border rounded px-1 hidden md:block">
                {hint}
            </span>
        </Button>
    )
}
