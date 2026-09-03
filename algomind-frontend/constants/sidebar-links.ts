import {
    BookOpen,
    BookOpenText,
    ChartBar,
    ClipboardPenLine,
    GraduationCap,
    Inbox,
    Network,
    Puzzle,
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
        title: 'Inbox',
        url: `${URL_PREFIX}/inbox`,
        icon: Inbox,
    },
    {
        title: 'Study Concepts',
        url: `${URL_PREFIX}/edit-concepts`,
        icon: GraduationCap,
    },
    {
        title: 'Library',
        url: `${URL_PREFIX}/library`,
        icon: BookOpen,
    },
    {
        title: 'Patterns',
        url: `${URL_PREFIX}/patterns`,
        icon: Network,
    },
    {
        title: 'Extension',
        url: `${URL_PREFIX}/extension`,
        icon: Puzzle,
    },
]

export const FeaturePagesHeaderInfo = {
    add_problem: {
        title: 'Add Problem',
        description:
            'Link LeetCode problems to concepts for spaced repetition review.',
    },
    edit_concepts: {
        title: 'Study Concepts',
        description:
            'Browse and study core algorithms and data structures concepts.',
    },
    dashboard: {
        title: 'Dashboard',
        description:
            'Track your learning progress, maintain your streak, and master algorithms one problem at a time',
    },
    review: {
        title: 'Review',
        description: 'Review your problems.',
    },
    library: {
        title: 'Library',
        description: 'Browse and manage all your tracked problems.',
    },
    patterns: {
        title: 'Patterns',
        description:
            'Visualize the patterns you\u2019ve confirmed, track recognition mastery, and review by pattern.',
    },
    inbox: {
        title: 'Inbox',
        description:
            'Finish importing quick-saved LeetCode problems from the Chrome extension.',
    },
    extension: {
        title: 'Chrome Extension',
        description:
            'Pair your browser, manage connected installations, and quick-save solved LeetCode problems.',
    },
} as const
