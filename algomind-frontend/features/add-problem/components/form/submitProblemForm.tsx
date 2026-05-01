'use client'

import { useEffect, useState } from 'react'
import { Controller,useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import {
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Eye,
    Loader2,
    Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateProblem } from '@/features/add-problem/api/useCreateProblem'
import { useFetchLeetCode } from '@/features/add-problem/api/useFetchLeetCode'
import { useConcepts } from '@/features/edit-concepts/api/useConcepts'
import { useProblemCapture } from '@/features/problem-captures/api/useProblemCaptures'

import { useMostUsedLanguage } from '../../api/useGetMostUsedLanguage'

type FormFields = {
    title: string
    problemLink: string
    concept: string
    difficulty: string
    summary: string
    description: string
    answer: string
    answerLanguage: string
    hints: string
    generateHints: boolean
}

const answerLanguageOptions = [
    { value: 'python', label: 'Python' },
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'c', label: 'C' },
    { value: 'csharp', label: 'C#' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'swift', label: 'Swift' },
    { value: 'sql', label: 'SQL' },
    { value: 'bash', label: 'Bash' },
    { value: 'other', label: 'Other' },
]

// Check if URL is a LeetCode problem URL
function isLeetCodeUrl(url: string): boolean {
    return url.includes('leetcode.com/problems/')
}

// Strip query params and hash from URL
function cleanLeetCodeUrl(url: string): string {
    try {
        const parsed = new URL(url)
        return `${parsed.origin}${parsed.pathname}`
    } catch {
        return url
    }
}

export default function SubmitProblemForm({
    captureId,
}: {
    captureId?: number | null
}) {
    const router = useRouter()
    const { data: mostUsedLanguage } = useMostUsedLanguage()
    const { data: capture, isLoading: isCaptureLoading } = useProblemCapture(
        captureId,
    )
    const form = useForm<FormFields>({
        defaultValues: {
            title: '',
            problemLink: '',
            concept: '',
            difficulty: '',
            summary: '',
            description: '',
            answer: '',
            hints: '',
            answerLanguage: 'python',
            generateHints: false,
        },
    })
    const { data: concepts } = useConcepts()
    const {
        register,
        handleSubmit,
        formState,
        setValue,
        watch,
        reset: resetFormState,
    } = form
    const { isSubmitting } = formState
    const { mutateAsync } = useCreateProblem()
    const {
        mutate: fetchLeetCode,
        isPending: isFetching,
        isSuccess: isFetched,
    } = useFetchLeetCode()

    // Update answerLanguage once the most-used language is fetched
    useEffect(() => {
        if (mostUsedLanguage) {
            setValue('answerLanguage', mostUsedLanguage)
        }
    }, [mostUsedLanguage, setValue])

    // Watch the problem link field
    const problemLink = watch('problemLink')
    const generateHints = watch('generateHints')

    // Auto-fetch when a LeetCode URL is pasted
    useEffect(() => {
        if (problemLink && isLeetCodeUrl(problemLink)) {
            // Debounce the fetch slightly to avoid multiple calls while typing
            const timer = setTimeout(() => {
                // Clean the URL before fetching (strip query params)
                const cleanUrl = cleanLeetCodeUrl(problemLink)
                fetchLeetCode(cleanUrl, {
                    onSuccess: (data) => {
                        // Auto-fill the form fields
                        setValue('title', data.title)
                        setValue('description', data.description)
                        setValue('difficulty', data.difficulty)
                        // Set summary to the first line of description or problem title
                        const summaryText = data.title
                        setValue('summary', summaryText)
                        toast.success(`Fetched details for "${data.title}"`)
                    },
                })
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [problemLink, fetchLeetCode, setValue])

    useEffect(() => {
        if (generateHints) {
            setValue('hints', '')
        }
    }, [generateHints, setValue])

    useEffect(() => {
        if (!capture || !captureId) return

        resetFormState({
            title:
                capture.title ||
                capture.fallback_title ||
                capture.external_problem_key,
            problemLink: capture.canonical_url,
            concept: '',
            difficulty:
                capture.difficulty ||
                capture.fallback_difficulty ||
                '',
            summary:
                capture.title ||
                capture.fallback_title ||
                capture.external_problem_key,
            description: capture.description_html || '',
            answer: '',
            answerLanguage: mostUsedLanguage || 'python',
            hints: '',
            generateHints: false,
        })
    }, [capture, captureId, mostUsedLanguage, resetFormState])

    const onSubmit = async (data: FormFields) => {
        const conceptId =
            data.concept && data.concept !== 'none'
                ? parseInt(data.concept)
                : null
        const answerLanguage =
            data.answerLanguage === 'other' ? undefined : data.answerLanguage

        const result = await mutateAsync({
            ...data,
            captureId,
            hints: data.generateHints ? '' : data.hints,
            answerLanguage,
            conceptId: conceptId,
            difficulty: data.difficulty || 'EASY',
        })

        if (captureId) {
            router.replace(`/dashboard/library/problem/${result.id}`)
            return
        }

        resetFormState({
            title: '',
            problemLink: '',
            concept: '',
            difficulty: '',
            summary: '',
            description: '',
            answer: '',
            answerLanguage: mostUsedLanguage || 'python',
            hints: '',
            generateHints: false,
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardContent className="space-y-6">
                    {captureId && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                            You are importing a quick-saved extension capture.
                            Finish the missing review details below to add it to
                            your library.
                        </div>
                    )}

                    {/* Problem Link Field - Now at the top */}
                    <div className="space-y-2">
                        <Label htmlFor="problemLink">Problem Link</Label>
                        <div className="relative">
                            <Input
                                {...register('problemLink')}
                                type="url"
                                placeholder="https://leetcode.com/problems/two-sum/"
                                className="pr-10"
                            />
                            {isFetching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {isCaptureLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {isFetched &&
                                !isFetching &&
                                problemLink &&
                                isLeetCodeUrl(problemLink) && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    </div>
                                )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Sparkles className="h-3 w-3 text-yellow-500" />
                            <span>
                                Paste a LeetCode URL to auto-fill problem
                                details
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Problem Title{' '}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            {...register('title', {
                                required: 'Problem title is required',
                            })}
                            placeholder="e.g., Two Sum, Longest Substring Without Repeating Characters"
                        />
                        <p className="text-xs text-red-500">
                            {form.formState.errors.title?.message}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="summary">
                            Problem Summary{' '}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            {...register('summary', {
                                required: 'Summary is required',
                            })}
                            placeholder="Brief summary of the problem"
                        />
                        <p className="text-xs text-red-500">
                            {form.formState.errors.summary?.message}
                        </p>
                    </div>

                    <DescriptionField
                        register={register}
                        description={watch('description')}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="difficulty">
                                Difficulty{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Controller
                                control={form.control}
                                name="difficulty"
                                rules={{ required: 'Difficulty is required' }}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <SelectTrigger id="difficulty">
                                            <SelectValue placeholder="Select difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Easy">
                                                Easy
                                            </SelectItem>
                                            <SelectItem value="Medium">
                                                Medium
                                            </SelectItem>
                                            <SelectItem value="Hard">
                                                Hard
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <p className="text-xs text-red-500">
                                {form.formState.errors.difficulty?.message}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="conceptId">
                                Associated Concept{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Controller
                                control={form.control}
                                name="concept"
                                rules={{ required: 'Concept is required' }}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <SelectTrigger id="conceptId">
                                            <SelectValue placeholder="Select a concept" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {concepts?.map((concept) => (
                                                <SelectItem
                                                    key={concept.id}
                                                    value={concept.id.toString()}
                                                >
                                                    {concept.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <p className="text-xs text-red-500">
                                {form.formState.errors.concept?.message}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-lg border bg-amber-50/60 p-4 dark:bg-amber-950/20">
                        <div className="flex items-start gap-3">
                            <Controller
                                control={form.control}
                                name="generateHints"
                                render={({ field }) => (
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={(checked) =>
                                            field.onChange(Boolean(checked))
                                        }
                                        id="generateHints"
                                        className="mt-0.5"
                                    />
                                )}
                            />
                            <div className="space-y-1">
                                <Label
                                    htmlFor="generateHints"
                                    className="cursor-pointer"
                                >
                                    Generate hints automatically
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    We send the hint job to Kimi in the
                                    background after save. The problem is
                                    created immediately, and hints will be added
                                    shortly without any extra step from you.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="hints">Hints (Optional)</Label>
                        <Textarea
                            {...register('hints')}
                            disabled={generateHints}
                            placeholder={
                                generateHints
                                    ? 'Automatic hints are enabled for this problem.'
                                    : 'Add any additional notes, hints, or key insights about this problem...'
                            }
                            rows={4}
                            className={generateHints ? 'opacity-60' : ''}
                        />
                        {generateHints && (
                            <p className="text-xs text-muted-foreground">
                                Manual hints are disabled while automatic hint
                                generation is enabled.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="answer">
                            Answer <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            {...register('answer', {
                                required: 'Answer is required',
                            })}
                            placeholder="Write explanation in markdown, or paste code directly."
                            rows={8}
                        />
                        <p className="text-xs text-red-500">
                            {form.formState.errors.answer?.message}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="answerLanguage">
                            Answer Language (Optional)
                        </Label>
                        <Controller
                            control={form.control}
                            name="answerLanguage"
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <SelectTrigger id="answerLanguage">
                                        <SelectValue placeholder="Select answer language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {answerLanguageOptions.map(
                                            (language) => (
                                                <SelectItem
                                                    key={language.value}
                                                    value={language.value}
                                                >
                                                    {language.label}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Sparkles className="h-3 w-3 text-yellow-500" />
                            <span>
                                Auto-set to your most used language. Pick a
                                different one or choose Other for default
                                behavior.
                            </span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-3 justify-end border-t pt-6">
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() =>
                            resetFormState({
                                title: '',
                                problemLink: '',
                                concept: '',
                                difficulty: '',
                                summary: '',
                                description: '',
                                answer: '',
                                answerLanguage: mostUsedLanguage || 'python',
                                hints: '',
                                generateHints: false,
                            })
                        }
                    >
                        Reset
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || isFetching || isCaptureLoading}
                    >
                        {isSubmitting
                            ? 'Saving...'
                            : captureId
                              ? 'Import Problem'
                              : 'Save Problem'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}

// Component for description field with HTML preview
function DescriptionField({
    register,
    description,
}: {
    register: any
    description: string
}) {
    const [showPreview, setShowPreview] = useState(true)
    const hasContent = description && description.trim().length > 0

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="description">Problem Description</Label>
                {hasContent && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-xs h-7 gap-1"
                    >
                        <Eye className="h-3 w-3" />
                        {showPreview ? 'Edit' : 'Preview'}
                        {showPreview ? (
                            <ChevronUp className="h-3 w-3" />
                        ) : (
                            <ChevronDown className="h-3 w-3" />
                        )}
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
                    {...register('description')}
                    rows={8}
                    placeholder="Full problem description..."
                />
            )}
        </div>
    )
}
