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
