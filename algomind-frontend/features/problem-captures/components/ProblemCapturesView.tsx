'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import DifficultyBadge from '@/features/library/components/DifficultyBadge'

import {
    useArchiveProblemCapture,
    useProblemCaptures,
    useRetryProblemCapture,
} from '../api/useProblemCaptures'

const stateVariant: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    ready: 'default',
    imported: 'secondary',
    failed: 'destructive',
    pending_enrichment: 'outline',
    archived: 'outline',
}

const stateLabel: Record<string, string> = {
    ready: 'Ready to import',
    imported: 'Imported',
    failed: 'Needs retry',
    pending_enrichment: 'Pending enrichment',
    archived: 'Archived',
}

export function ProblemCapturesView() {
    const { data: captures = [], isLoading } = useProblemCaptures()
    const archiveCapture = useArchiveProblemCapture()
    const retryCapture = useRetryProblemCapture()

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="h-32 w-full animate-pulse rounded-lg bg-muted"
                    />
                ))}
            </div>
        )
    }

    if (captures.length === 0) {
        return (
            <div className="rounded-lg border border-dashed px-6 py-12 text-center">
                <h2 className="text-lg font-semibold">Your inbox is empty</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Save solved LeetCode problems from the Chrome extension and
                    they will show up here for final import.
                </p>
                <Button asChild className="mt-4">
                    <Link href="/dashboard/extension">Set up extension</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {captures.map((capture) => {
                const title =
                    capture.title ||
                    capture.fallback_title ||
                    capture.external_problem_key

                const showRetry = capture.capture_state === 'failed'
                const showOpenProblem = Boolean(capture.problem_id)

                return (
                    <Card key={capture.id}>
                        <CardContent className="flex flex-col gap-4 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-semibold">
                                            {title}
                                        </h3>
                                        {capture.difficulty && (
                                            <DifficultyBadge
                                                difficulty={capture.difficulty}
                                            />
                                        )}
                                        <Badge
                                            variant={
                                                stateVariant[
                                                    capture.capture_state
                                                ] || 'outline'
                                            }
                                        >
                                            {stateLabel[capture.capture_state] ||
                                                capture.capture_state}
                                        </Badge>
                                        <Badge variant="outline">
                                            {capture.source}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span>
                                            Captured{' '}
                                            {capture.captured_at.split('T')[0]}
                                        </span>
                                        <a
                                            href={capture.canonical_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline-offset-4 hover:underline"
                                        >
                                            Open original problem
                                        </a>
                                    </div>

                                    {capture.topic_tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {capture.topic_tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="secondary"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {capture.last_error_message && (
                                        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                            {capture.last_error_message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 lg:justify-end">
                                    {showRetry && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                retryCapture.mutate(capture.id)
                                            }
                                            disabled={retryCapture.isPending}
                                        >
                                            Retry fetch
                                        </Button>
                                    )}
                                    {showOpenProblem ? (
                                        <Button asChild>
                                            <Link
                                                href={`/dashboard/library/problem/${capture.problem_id}`}
                                            >
                                                Open existing problem
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button asChild>
                                            <Link
                                                href={`/dashboard/add-problem?captureId=${capture.id}`}
                                            >
                                                Finish import
                                            </Link>
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            archiveCapture.mutate(capture.id)
                                        }
                                        disabled={archiveCapture.isPending}
                                    >
                                        Archive
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
