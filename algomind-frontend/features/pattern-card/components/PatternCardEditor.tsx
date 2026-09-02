'use client'

import { useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { AlertCircle, Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { useUpdatePatternCard } from '../api/useUpdatePatternCard'
import type { PatternCard } from '../types/pattern-card'

// Client-side bounds mirroring the backend validation. The backend stays
// the source of truth — these only keep the form honest.
const PATTERN_NAME_MAX = 100
const PATTERN_RATIONALE_MAX = 1000
const MAX_PATTERNS = 3
const MAX_CUES = 10
const CUE_MAX = 200
const TEXT_MAX = 5000

const patternSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Pattern name is required')
        .max(PATTERN_NAME_MAX, 'Keep pattern names under 100 characters'),
    role: z.enum(['primary', 'supporting']),
    rationale: z
        .string()
        .trim()
        .max(PATTERN_RATIONALE_MAX, 'Keep rationale under 1,000 characters'),
})

const formSchema = z
    .object({
        patterns: z
            .array(patternSchema)
            .min(1, 'Add at least one pattern')
            .max(MAX_PATTERNS, 'A card supports up to 3 patterns'),
        recognition_cues: z
            .array(
                z.object({
                    value: z
                        .string()
                        .max(CUE_MAX, 'Keep cues under 200 characters'),
                }),
            )
            .max(MAX_CUES, 'A card supports up to 10 cues'),
        invariant: z.string().max(TEXT_MAX),
        first_move: z.string().max(TEXT_MAX),
        common_mistake: z.string().max(TEXT_MAX),
        contrasting_pattern: z.string().max(TEXT_MAX),
        explanation: z.string().max(TEXT_MAX),
    })
    .superRefine((data, ctx) => {
        const primaryCount = data.patterns.filter(
            (pattern) => pattern.role === 'primary',
        ).length
        if (primaryCount !== 1) {
            ctx.addIssue({
                code: 'custom',
                message: 'Exactly one pattern must be marked primary',
                path: ['patterns'],
            })
        }
    })

type FormValues = z.infer<typeof formSchema>

function toFormValues(card: PatternCard): FormValues {
    return {
        patterns: card.patterns.map((pattern) => ({
            name: pattern.name,
            role: pattern.role,
            rationale: pattern.rationale,
        })),
        recognition_cues: card.recognition_cues.map((cue) => ({ value: cue })),
        invariant: card.invariant,
        first_move: card.first_move,
        common_mistake: card.common_mistake,
        contrasting_pattern: card.contrasting_pattern,
        explanation: card.explanation,
    }
}

interface PatternCardEditorProps {
    card: PatternCard
    /** When set, the editor is editing a confirmed card and can be cancelled. */
    onCancel?: () => void
    onSaved: () => void
}

export function PatternCardEditor({
    card,
    onCancel,
    onSaved,
}: PatternCardEditorProps) {
    const isDraft = card.status === 'draft'
    const { mutate: updateCard, isPending: isSaving } = useUpdatePatternCard(
        card.problem_id,
    )
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: toFormValues(card),
    })

    const patternsFieldArray = useFieldArray({ control, name: 'patterns' })
    const cuesFieldArray = useFieldArray({ control, name: 'recognition_cues' })
    const patterns = useWatch({ control, name: 'patterns' })

    const patternsError =
        typeof errors.patterns?.message === 'string'
            ? errors.patterns.message
            : errors.patterns?.root?.message

    const promotePrimary = (index: number) => {
        patterns.forEach((_, i) => {
            setValue(
                `patterns.${i}.role`,
                i === index ? 'primary' : 'supporting',
            )
        })
    }

    const removePattern = (index: number) => {
        // Keep the exactly-one-primary invariant when the primary goes away.
        if (patterns.length > 1 && patterns[index]?.role === 'primary') {
            const promoteIndex = index === 0 ? 1 : 0
            setValue(`patterns.${promoteIndex}.role`, 'primary')
        }
        patternsFieldArray.remove(index)
    }

    const onSubmit = handleSubmit((values) => {
        setServerError(null)
        updateCard(
            {
                patterns: values.patterns.map((pattern) => ({
                    name: pattern.name,
                    role: pattern.role,
                    rationale: pattern.rationale,
                })),
                recognition_cues: values.recognition_cues
                    .map((cue) => cue.value.trim())
                    .filter((cue) => cue.length > 0),
                invariant: values.invariant,
                first_move: values.first_move,
                common_mistake: values.common_mistake,
                contrasting_pattern: values.contrasting_pattern,
                explanation: values.explanation,
            },
            {
                onSuccess: () => {
                    toast.success(
                        isDraft
                            ? 'Pattern card confirmed'
                            : 'Pattern card updated',
                    )
                    onSaved()
                },
                onError: (error) => {
                    const serverMessage = axios.isAxiosError<{
                        message?: string
                    }>(error)
                        ? error.response?.data?.message
                        : undefined
                    setServerError(
                        serverMessage ??
                            'Something went wrong saving the pattern card. Please try again.',
                    )
                },
            },
        )
    })

    return (
        <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Pattern Card</h3>
                    {isDraft && (
                        <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            AI draft
                        </Badge>
                    )}
                </div>
                {onCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="min-h-11"
                    >
                        Cancel
                    </Button>
                )}
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
                {isDraft
                    ? 'Drafted by AI from your problem and solution. Review and adjust, then confirm — you can still edit it later.'
                    : 'Update the confirmed card. It stays visible in study mode until you save.'}
            </p>

            {serverError && (
                <div
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{serverError}</p>
                </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-6" noValidate>
                {/* Patterns */}
                <section className="space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                        <h4 className="section-label">Patterns</h4>
                        <span className="text-xs text-muted-foreground">
                            1–3, exactly one primary
                        </span>
                    </div>

                    {patternsError && (
                        <p role="alert" className="text-sm text-destructive">
                            {patternsError}
                        </p>
                    )}

                    <div className="space-y-3">
                        {patternsFieldArray.fields.map((field, index) => (
                            <PatternRow
                                key={field.id}
                                index={index}
                                fieldId={field.id}
                                register={register}
                                errors={errors}
                                role={patterns[index]?.role ?? 'supporting'}
                                canRemove={patternsFieldArray.fields.length > 1}
                                onSetRole={(i, role) =>
                                    role === 'primary'
                                        ? promotePrimary(i)
                                        : setValue(
                                              `patterns.${i}.role`,
                                              'supporting',
                                          )
                                }
                                onRemove={removePattern}
                            />
                        ))}
                    </div>

                    {patternsFieldArray.fields.length < MAX_PATTERNS && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                patternsFieldArray.append({
                                    name: '',
                                    role: 'supporting',
                                    rationale: '',
                                })
                            }
                            className="min-h-11"
                        >
                            <Plus />
                            Add pattern
                        </Button>
                    )}
                </section>

                {/* Recognition cues */}
                <section className="space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                        <h4 className="section-label">Recognition Cues</h4>
                        <span className="text-xs text-muted-foreground">
                            Up to {MAX_CUES}
                        </span>
                    </div>

                    <div className="space-y-2">
                        {cuesFieldArray.fields.map((field, index) => (
                            <div key={field.id} className="space-y-1.5">
                                <div className="flex items-start gap-2">
                                    <Input
                                        {...register(
                                            `recognition_cues.${index}.value`,
                                        )}
                                        maxLength={CUE_MAX}
                                        placeholder="e.g. sorted array + target → binary search"
                                        className="h-11"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            cuesFieldArray.remove(index)
                                        }
                                        aria-label={`Remove cue ${index + 1}`}
                                        className="h-11 w-11 shrink-0"
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                                {errors.recognition_cues?.[index]?.value && (
                                    <p
                                        role="alert"
                                        className="text-sm text-destructive"
                                    >
                                        {
                                            errors.recognition_cues[index].value
                                                .message
                                        }
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {cuesFieldArray.fields.length < MAX_CUES && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    cuesFieldArray.append({ value: '' })
                                }
                                className="min-h-11"
                            >
                                <Plus />
                                Add cue
                            </Button>
                        )}
                        {typeof errors.recognition_cues?.message ===
                            'string' && (
                            <p className="text-sm text-destructive">
                                {errors.recognition_cues.message}
                            </p>
                        )}
                    </div>
                </section>

                {/* Structured insights */}
                <section className="space-y-4">
                    <h4 className="section-label">Structured Insights</h4>
                    <FieldBlock
                        label="Invariant"
                        error={errors.invariant?.message}
                    >
                        <Textarea
                            rows={2}
                            maxLength={TEXT_MAX}
                            placeholder="What stays true across every instance of this pattern?"
                            {...register('invariant')}
                        />
                    </FieldBlock>
                    <FieldBlock
                        label="First Move"
                        error={errors.first_move?.message}
                    >
                        <Textarea
                            rows={2}
                            maxLength={TEXT_MAX}
                            placeholder="The first step to try when you recognize it"
                            {...register('first_move')}
                        />
                    </FieldBlock>
                    <FieldBlock
                        label="Common Mistake"
                        error={errors.common_mistake?.message}
                    >
                        <Textarea
                            rows={2}
                            maxLength={TEXT_MAX}
                            placeholder="Where people usually go wrong"
                            {...register('common_mistake')}
                        />
                    </FieldBlock>
                    <FieldBlock
                        label="Contrasting Pattern"
                        error={errors.contrasting_pattern?.message}
                    >
                        <Textarea
                            rows={2}
                            maxLength={TEXT_MAX}
                            placeholder="A pattern that looks similar but means something different"
                            {...register('contrasting_pattern')}
                        />
                    </FieldBlock>
                    <FieldBlock
                        label="Explanation"
                        error={errors.explanation?.message}
                    >
                        <Textarea
                            rows={3}
                            maxLength={TEXT_MAX}
                            placeholder="Why the pattern produces the right approach"
                            {...register('explanation')}
                        />
                    </FieldBlock>
                </section>

                <div className="flex items-center justify-end gap-2 border-t pt-4">
                    <Button
                        type="submit"
                        className="min-h-11"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <Check />
                        )}
                        {isDraft ? 'Confirm card' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </div>
    )
}

function RoleToggle({
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
            className={cn(
                'min-h-11 rounded px-3 text-sm font-medium transition-colors',
                active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
            )}
        >
            {children}
        </button>
    )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            {children}
        </span>
    )
}

function FieldBlock({
    label,
    error,
    children,
}: {
    label: string
    error?: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-2">
            <FieldLabel>{label}</FieldLabel>
            {children}
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    )
}
function PatternRow({
    index,
    fieldId,
    register,
    errors,
    role,
    canRemove,
    onSetRole,
    onRemove,
}: {
    index: number
    fieldId: string
    register: ReturnType<typeof useForm<FormValues>>['register']
    errors: ReturnType<typeof useForm<FormValues>>['formState']['errors']
    role: 'primary' | 'supporting'
    canRemove: boolean
    onSetRole: (index: number, role: 'primary' | 'supporting') => void
    onRemove: (index: number) => void
}) {
    const nameError = errors.patterns?.[index]?.name?.message
    const rationaleError = errors.patterns?.[index]?.rationale?.message

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
                <h5 className="section-label">Pattern {index + 1}</h5>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(index)}
                    disabled={!canRemove}
                    aria-label={`Remove pattern ${index + 1}`}
                    className="h-11 w-11"
                >
                    <Trash2 />
                </Button>
            </div>

            <div className="space-y-2">
                <FieldLabel>Name</FieldLabel>
                <Input
                    id={`pattern-name-${fieldId}`}
                    {...register(`patterns.${index}.name`)}
                    maxLength={PATTERN_NAME_MAX}
                    placeholder="e.g. Two Pointers"
                    className="h-11"
                />
                {nameError && (
                    <p role="alert" className="text-sm text-destructive">
                        {nameError}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <FieldLabel>Role</FieldLabel>
                <div className="inline-flex rounded-md border p-0.5">
                    <RoleToggle
                        active={role === 'primary'}
                        onClick={() => onSetRole(index, 'primary')}
                    >
                        Primary
                    </RoleToggle>
                    <RoleToggle
                        active={role === 'supporting'}
                        onClick={() => onSetRole(index, 'supporting')}
                    >
                        Supporting
                    </RoleToggle>
                </div>
            </div>

            <div className="space-y-2">
                <FieldLabel>Rationale</FieldLabel>
                <Textarea
                    rows={2}
                    maxLength={PATTERN_RATIONALE_MAX}
                    placeholder="Why does this pattern apply here?"
                    {...register(`patterns.${index}.rationale`)}
                />
                {rationaleError && (
                    <p role="alert" className="text-sm text-destructive">
                        {rationaleError}
                    </p>
                )}
            </div>
        </div>
    )
}
