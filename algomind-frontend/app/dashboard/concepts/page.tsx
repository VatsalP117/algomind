'use client'

import ReactMarkdown from 'react-markdown'
import { useConcepts } from '@/features/edit-concepts/api/useConcepts'
import { Loader2, AlertCircle, BookOpen, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ConceptsListPage() {
    const { data: concepts, isLoading, isError } = useConcepts()

    return (
        <div className="min-h-screen">
            <div className="relative border-b">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                                Core Concepts
                            </h1>
                        </div>
                        <p className="text-muted-foreground max-w-2xl">
                            Your knowledge base of algorithms and data structures.
                        </p>
                    </div>

                    {!isLoading && concepts && (
                        <div className="mt-6">
                            <div className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
                                <span className="text-2xl font-bold">{concepts.length}</span>
                                <span className="text-sm text-muted-foreground">concepts in your library</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
                {isLoading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="shadow-sm">
                                <CardHeader>
                                    <Skeleton className="h-6 w-48" />
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">Failed to load concepts</p>
                            <p className="text-sm text-muted-foreground">
                                Is the backend running?
                            </p>
                        </div>
                    </div>
                ) : concepts?.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">No concepts yet</p>
                            <p className="text-sm text-muted-foreground">
                                Use the Admin page to add your first concept.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {concepts?.map((concept) => (
                            <Card key={concept.id} className="group shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden">
                                <CardHeader className="border-b bg-muted/30 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                                <BookOpen className="h-4 w-4 text-primary" />
                                            </div>
                                            <CardTitle className="text-xl">{concept.title}</CardTitle>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:mb-2 prose-ul:my-2">
                                        <ReactMarkdown>
                                            {concept.content}
                                        </ReactMarkdown>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
