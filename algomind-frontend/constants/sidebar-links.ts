import {
    ChartBar,
    BookOpen,
    ClipboardPenLine,
    PencilLine,
    BookOpenText,
} from 'lucide-react'

const URL_PREFIX = '/dashboard'
export const sidebarItems = [
    {
        title: 'Dashboard',
        url: `${URL_PREFIX}`,
        icon: ChartBar,
    },
    {
        title: 'Review',
        url: `${URL_PREFIX}/review`,
        icon: BookOpenText,
    },
    {
        title: 'Add Problem',
        url: `${URL_PREFIX}/add-problem`,
        icon: ClipboardPenLine,
    },
    {
        title: 'Edit Concepts',
        url: `${URL_PREFIX}/edit-concepts`,
        icon: PencilLine,
    },
    {
        title: 'Library',
        url: `${URL_PREFIX}/library`,
        icon: BookOpen,
    },
]

export const FeaturePagesHeaderInfo = {
    add_problem: {
        title: 'Add Problem',
        description:
            'Link LeetCode problems to concepts for spaced repetition review.',
    },
    edit_concepts: {
        title: 'Edit Concepts',
        description: 'Manage and update your concept definitions.'
    },
    dashboard: {
        title: 'Dashboard',
        description: 'Track your learning progress, maintain your streak, and master algorithms one problem at a time',
    },
    review: {
        title: 'Review',
        description: 'Review your problems.',
    },
    library: {
        title: 'Library',
        description: 'Browse and manage all your tracked problems.',
    },
} as const;
