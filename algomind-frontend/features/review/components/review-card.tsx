'use client'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { Eye, Lightbulb, Loader2, Search } from 'lucide-react'
import remarkGfm from 'remark-gfm'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import {
    type PatternRecognition,
    useLogReview,
} from '../api/useReviewLog'
import { ReviewProblem, useReviewStore } from '../store/useReviewStore'

// Helper for color coding difficulty
const difficultyColor = (diff: string) => {
    switch (diff) {
        case 'EASY':
            return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
        case 'MEDIUM':
            return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
        case 'HARD':
            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
        default:
            return 'bg-secondary text-secondary-foreground'
    }
}

export default function ReviewCard({ problem }: { problem: ReviewProblem }) {
    const [revealed, setRevealed] = useState(false)
    const [showHint, setShowHint] = useState(false)
    // Recognition checkpoint state (only used for problems with patterns).
    const [patternGuess, setPatternGuess] = useState('')
    const [patternChecked, setPatternChecked] = useState(false)
    const [patternRecognition, setPatternRecognition] =
        useState<PatternRecognition | null>(null)

    // 1. Get Actions
    const nextCard = useReviewStore((state) => state.nextCard)
    const { mutate: logReview, isPending } = useLogReview()

    const hasPatterns = (problem.patterns?.length ?? 0) > 0
    const checkpointComplete = patternChecked && patternRecognition !== null
    const canReveal = !hasPatterns || checkpointComplete

    // 2. Handle Rating Submission
    const handleRate = useCallback(
        (rating: 1 | 2 | 3 | 4) => {
            logReview(
                hasPatterns
                    ? {
                          entityId: problem.entity_id,
                          rating,
                          patternGuess: patternGuess.trim(),
                          patternRecognition: patternRecognition ?? 'missed',
                      }
                    : { entityId: problem.entity_id, rating },
                {
                    onSuccess: () => {
                        nextCard()
                    },
                    onError: () => {
                        toast.error('Failed to save review. Please try again.')
                    },
                },
            )
        },
        [
            logReview,
            nextCard,
            problem.entity_id,
            hasPatterns,
            patternGuess,
            patternRecognition,
        ],
    )

    // Keyboard Shortcuts
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (isPending) return // Disable keys while saving
            // Never fire shortcuts while the user is typing in an input.
            const target = e.target as HTMLElement | null
            if (
                target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable)
            ) {
                return
            }

            if (e.code === 'Space') {
                // Space reveals the answer, but must never bypass an
                // unfinished recognition checkpoint.
                if (!revealed && canReveal) {
                    e.preventDefault()
                    setRevealed(true)
                }
                return
            }

            if (revealed) {
                if (e.key === '1') handleRate(1)
                if (e.key === '2') handleRate(2)
                if (e.key === '3') handleRate(3)
                if (e.key === '4') handleRate(4)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [revealed, canReveal, isPending, handleRate])

    return (
        <Card className="w-full shadow-lg border-border bg-card">
            <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{problem.title}</CardTitle>
                    {hasPatterns && (
                        <Badge variant="outline" className="font-normal">
                            {problem.patterns!.length} pattern
                            {problem.patterns!.length === 1 ? '' : 's'}
                        </Badge>
                    )}
                </div>
                <p className="text-muted-foreground">{problem.summary}</p>
            </CardHeader>

            <CardContent className="min-h-[200px] flex flex-col gap-4">
                {/* Problem Description */}
                {problem.description && (
                    <div
                        className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/30 p-4 max-h-[500px] overflow-y-auto"
                        dangerouslySetInnerHTML={{
                            __html: problem.description,
                        }}
                    />
                )}

                {/* Pattern Recognition Checkpoint */}
                {hasPatterns && !revealed && (
                    <div className="space-y-3 rounded-md border bg-muted/30 p-4">
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-primary" />
                            <div>
                                <p className="text-sm font-semibold">
                                    Pattern check
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Name the pattern(s) you think apply before
                                    revealing the answer.
                                </p>
                            </div>
                        </div>

                        {!patternChecked ? (
                            <>
                                <Input
                                    value={patternGuess}
                                    onChange={(e) =>
                                        setPatternGuess(e.target.value)
                                    }
                                    maxLength={200}
                                    placeholder="e.g. two pointers, sliding window"
                                    className="h-11"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setPatternChecked(true)}
                                        disabled={
                                            patternGuess.trim().length === 0
                                        }
                                        className="min-h-11"
                                    >
                                        Check my guess
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <p className="text-xs text-muted-foreground">
                                        Actual pattern(s):
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {problem.patterns?.map((pattern) => (
                                            <Badge
                                                key={pattern}
                                                variant="outline"
                                            >
                                                {pattern}
                                            </Badge>
                                        ))}
                                    </div>
                                    {patternGuess.trim() && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            Your guess:{' '}
                                            <span className="font-medium text-foreground">
                                                {patternGuess.trim()}
                                            </span>
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs text-muted-foreground">
                                        How close was your guess?
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <CheckpointButton
                                            active={
                                                patternRecognition ===
                                                'recognized'
                                            }
                                            onClick={() =>
                                                setPatternRecognition(
                                                    'recognized',
                                                )
                                            }
                                        >
                                            Recognized
                                        </CheckpointButton>
                                        <CheckpointButton
                                            active={
                                                patternRecognition ===
                                                'partial'
                                            }
                                            onClick={() =>
                                                setPatternRecognition(
                                                    'partial',
                                                )
                                            }
                                        >
                                            Close
                                        </CheckpointButton>
                                        <CheckpointButton
                                            active={
                                                patternRecognition === 'missed'
                                            }
                                            onClick={() =>
                                                setPatternRecognition(
                                                    'missed',
                                                )
                                            }
                                        >
                                            Missed
                                        </CheckpointButton>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {problem.hints && (!hasPatterns || checkpointComplete) && (
                    <div className="space-y-3">
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setShowHint((current) => !current)
                                }
                            >
                                <Lightbulb className="mr-2 h-4 w-4" />
                                {showHint ? 'Hide Hint' : 'Show Hint'}
                            </Button>
                        </div>

                        {showHint && (
                            <div className="whitespace-pre-line rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
                                {problem.hints}
                            </div>
                        )}
                    </div>
                )}

                {/* Answer Section */}
                <div className="flex-1 flex items-center justify-center relative">
                    {!revealed ? (
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="lg"
                                onClick={() => setRevealed(true)}
                                disabled={!canReveal}
                                className="min-h-11"
                            >
                                <Eye className="w-4 h-4 mr-2" /> Reveal Answer
                            </Button>
                            {hasPatterns && !checkpointComplete && (
                                <p className="text-xs text-muted-foreground">
                                    Finish the pattern check above to reveal
                                    the answer.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="w-full rounded-md border bg-card text-foreground p-4 max-h-[500px] overflow-y-auto">
                            {problem.answer_language ? (
                                <div className="mb-3 inline-flex rounded border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground not-prose">
                                    {problem.answer_language}
                                </div>
                            ) : null}
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p({ children }) {
                                        return (
                                            <p className="mb-3 leading-7 text-foreground">
                                                {children}
                                            </p>
                                        )
                                    },
                                    ul({ children }) {
                                        return (
                                            <ul className="mb-3 list-disc pl-6">
                                                {children}
                                            </ul>
                                        )
                                    },
                                    ol({ children }) {
                                        return (
                                            <ol className="mb-3 list-decimal pl-6">
                                                {children}
                                            </ol>
                                        )
                                    },
                                    li({ children }) {
                                        return (
                                            <li className="mb-1 text-foreground">
                                                {children}
                                            </li>
                                        )
                                    },
                                    code({ className, children, ...props }) {
                                        return (
                                            <code
                                                className={cn(
                                                    'rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground',
                                                    className,
                                                )}
                                                {...props}
                                            >
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

            <CardFooter
                className={cn(
                    'border-t p-6 transition-opacity duration-200',
                    revealed ? 'opacity-100' : 'opacity-0 pointer-events-none',
                )}
            >
                {isPending ? (
                    <div className="w-full flex justify-center py-4 text-muted-foreground">
                        <Loader2 className="animate-spin mr-2" /> Saving...
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-3 w-full">
                        <RatingButton
                            label="Again"
                            hint="1"
                            color="destructive"
                            onClick={() => handleRate(1)}
                            sub="< 10m"
                        />
                        <RatingButton
                            label="Hard"
                            hint="2"
                            color="warning"
                            onClick={() => handleRate(2)}
                            sub="2d"
                        />
                        <RatingButton
                            label="Good"
                            hint="3"
                            color="success"
                            onClick={() => handleRate(3)}
                            sub="4d"
                        />
                        <RatingButton
                            label="Easy"
                            hint="4"
                            color="default"
                            onClick={() => handleRate(4)}
                            sub="7d"
                        />
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}

function CheckpointButton({
    active,
    onClick,
    children,
}: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'min-h-11 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
            )}
        >
            {children}
        </button>
    )
}

// Sub-component for buttons
function RatingButton({
    label,
    hint,
    sub,
    color,
    onClick,
}: {
    label: string
    hint: string
    sub: string
    color: 'default' | 'destructive' | 'warning' | 'success'
    onClick: () => void
}) {
    // Dynamic color mapping
    const variantStyles = {
        default:
            'hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/40 dark:hover:text-blue-400 border-blue-200',
        destructive:
            'hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/40 dark:hover:text-red-400 border-red-200',
        warning:
            'hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/40 dark:hover:text-orange-400 border-orange-200',
        success:
            'hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/40 dark:hover:text-green-400 border-green-200',
    }

    return (
        <Button
            variant="outline"
            className={cn(
                'h-auto flex-col py-3 gap-1 relative transition-all active:scale-95',
                variantStyles[color],
            )}
            onClick={onClick}
        >
            <span className="font-bold text-base">{label}</span>
            <span className="text-xs font-normal text-muted-foreground">
                {sub}
            </span>
            <span className="absolute top-2 right-2 text-[10px] font-mono opacity-50 border rounded px-1 hidden md:block">
                {hint}
            </span>
        </Button>
    )
}
