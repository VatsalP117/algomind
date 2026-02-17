'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useConcepts, Concept } from '@/features/edit-concepts/api/useConcepts'
import {
    AlertCircle,
    BookOpen,
    ChevronRight,
    Search,
    GraduationCap,
    ArrowLeft,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function ConceptStudyView({ concept, onBack }: { concept: Concept; onBack: () => void }) {
    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to concepts
            </Button>

            <Card className="shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/30 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">{concept.title}</CardTitle>
                            {concept.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {concept.description}
                                </p>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-8 pb-8 px-8 lg:px-12">
                    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:mb-2 prose-ul:my-2">
                        <ReactMarkdown>
                            {concept.content}
                        </ReactMarkdown>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function ConceptGrid({
    concepts,
    onSelect
}: {
    concepts: Concept[];
    onSelect: (concept: Concept) => void
}) {
    const [search, setSearch] = useState('')

    const filtered = concepts.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search concepts..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                        No concepts match &ldquo;{search}&rdquo;
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((concept) => (
                        <Card
                            key={concept.id}
                            className="group cursor-pointer shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
                            onClick={() => onSelect(concept)}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                                            <BookOpen className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold truncate">
                                                {concept.title}
                                            </h3>
                                            {concept.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                    {concept.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary mt-2.5" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function StudyConceptsPage() {
    const { data: concepts, isLoading, isError } = useConcepts()
    const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)

    return (
        <div className="min-h-screen">
            <div className="relative border-b">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                                Study Concepts
                            </h1>
                        </div>
                        <p className="text-muted-foreground max-w-2xl">
                            Browse and study core algorithms and data structures concepts.
                        </p>
                    </div>

                    {!isLoading && concepts && !selectedConcept && (
                        <div className="mt-6">
                            <div className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
                                <span className="text-2xl font-bold">{concepts.length}</span>
                                <span className="text-sm text-muted-foreground">concepts available</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="shadow-sm">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-9 w-9 rounded-lg" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
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
                                Please check your connection and try again.
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
                                Concepts will appear here once they are added.
                            </p>
                        </div>
                    </div>
                ) : selectedConcept ? (
                    <ConceptStudyView
                        concept={selectedConcept}
                        onBack={() => setSelectedConcept(null)}
                    />
                ) : (
                    <ConceptGrid
                        concepts={concepts ?? []}
                        onSelect={setSelectedConcept}
                    />
                )}
            </div>
        </div>
    )
}
