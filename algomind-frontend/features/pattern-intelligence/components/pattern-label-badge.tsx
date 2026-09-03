'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import type { MasteryLabel } from '../types/pattern-intelligence'

const LABEL_BADGE_STYLES: Record<string, string> = {
    Strong: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    Developing:
        'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    Learning: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
    'Needs practice':
        'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
}

export function PatternLabelBadge({ label }: { label: MasteryLabel | null }) {
    if (!label) {
        return (
            <Badge
                variant="outline"
                className="border-dashed text-muted-foreground"
            >
                No mastery data
            </Badge>
        )
    }
    return (
        <Badge
            variant="outline"
            className={cn('shadow-none', LABEL_BADGE_STYLES[label])}
        >
            {label}
        </Badge>
    )
}
