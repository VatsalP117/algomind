'use client'

import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import {
    useConcepts,
    useCreateConcept,
    useUpdateConcept,
    useDeleteConcept,
    useResetConcept,
    Concept,
} from '@/features/edit-concepts/api/useConcepts'
import {
    useConceptFolders,
    useCreateFolder,
    useDeleteFolder,
    useUpdateFolder,
    useAssignToFolder,
    useRemoveFromFolder,
    ConceptFolder,
    ConceptFolderItem,
} from '@/features/edit-concepts/api/useConceptFolders'
import {
    AlertCircle,
    BookOpen,
    ChevronRight,
    Search,
    GraduationCap,
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    Undo2,
    Save,
    FolderOpen,
    MoreHorizontal,
    X,
    FolderInput,
    FolderMinus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

type ViewMode = 'grid' | 'study' | 'edit' | 'create'
type FolderFilter = 'all' | 'unfiled' | number

// ─── Helpers ───

function ConceptBadge({ concept }: { concept: Concept }) {
    if (concept.user_id && concept.base_concept_id) {
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">Modified</Badge>
    }
    if (concept.user_id && !concept.base_concept_id) {
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">Custom</Badge>
    }
    return <Badge variant="secondary">System</Badge>
}

function getFolderForConcept(conceptId: number, items: ConceptFolderItem[]): number | null {
    const item = items.find(i => i.concept_id === conceptId)
    return item ? item.folder_id : null
}

function filterConcepts(
    concepts: Concept[],
    filter: FolderFilter,
    items: ConceptFolderItem[]
): Concept[] {
    if (filter === 'all') return concepts
    if (filter === 'unfiled') return concepts.filter(c => !items.find(i => i.concept_id === c.id))
    return concepts.filter(c => items.find(i => i.concept_id === c.id && i.folder_id === filter))
}

// ─── Folder Filter Bar ───

function FolderFilterBar({
    folders,
    items,
    concepts,
    activeFilter,
    onFilterChange,
    onCreateFolder,
    onDeleteFolder,
    onRenameFolder,
}: {
    folders: ConceptFolder[]
    items: ConceptFolderItem[]
    concepts: Concept[]
    activeFilter: FolderFilter
    onFilterChange: (filter: FolderFilter) => void
    onCreateFolder: (name: string) => void
    onDeleteFolder: (id: number) => void
    onRenameFolder: (id: number, name: string) => void
}) {
    const [isCreating, setIsCreating] = useState(false)
    const [newName, setNewName] = useState('')
    const [renamingId, setRenamingId] = useState<number | null>(null)
    const [renameValue, setRenameValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const unfiledCount = concepts.filter(c => !items.find(i => i.concept_id === c.id)).length

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()
        if (newName.trim()) {
            onCreateFolder(newName.trim())
            setNewName('')
            setIsCreating(false)
        }
    }

    const handleRename = (e: React.FormEvent, id: number) => {
        e.preventDefault()
        if (renameValue.trim()) {
            onRenameFolder(id, renameValue.trim())
            setRenamingId(null)
        }
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* All pill */}
            <button
                onClick={() => onFilterChange('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
            >
                All
                <span className="text-xs opacity-75">({concepts.length})</span>
            </button>

            {/* Folder pills */}
            {folders.map(folder => {
                const count = items.filter(i => i.folder_id === folder.id).length
                const isActive = activeFilter === folder.id

                if (renamingId === folder.id) {
                    return (
                        <form key={folder.id} onSubmit={(e) => handleRename(e, folder.id)} className="inline-flex">
                            <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                className="h-8 w-32 text-sm"
                                autoFocus
                                onBlur={(e) => handleRename(e, folder.id)}
                            />
                        </form>
                    )
                }

                return (
                    <div key={folder.id} className={`inline-flex items-center rounded-full text-sm font-medium transition-all ${isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}>
                        <button
                            onClick={() => onFilterChange(folder.id)}
                            className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1.5"
                        >
                            <FolderOpen className="h-3.5 w-3.5" />
                            {folder.name}
                            <span className="text-xs opacity-75">({count})</span>
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="px-1.5 py-1.5 pr-2 rounded-r-full hover:opacity-70 transition-opacity">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => { setRenamingId(folder.id); setRenameValue(folder.name) }}>
                                    <Pencil className="mr-2 h-4 w-4" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDeleteFolder(folder.id)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Folder
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            })}

            {/* Create folder */}
            {isCreating ? (
                <form onSubmit={handleCreate} className="inline-flex items-center gap-1">
                    <Input
                        ref={inputRef}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Folder name..."
                        className="h-8 w-32 text-sm"
                        autoFocus
                        onBlur={() => { if (!newName.trim()) setIsCreating(false) }}
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsCreating(false)}>
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </form>
            ) : (
                <button
                    onClick={() => setIsCreating(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground bg-muted/40 hover:bg-muted hover:text-foreground transition-all border border-dashed border-muted-foreground/30"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Folder
                </button>
            )}
        </div>
    )
}

// ─── Study View ───

function ConceptStudyView({
    concept,
    onBack,
    onEdit,
}: {
    concept: Concept
    onBack: () => void
    onEdit: () => void
}) {
    const isSystem = !concept.user_id

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Back to concepts
                </Button>
                <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
                    <Pencil className="h-4 w-4" />
                    {isSystem ? 'Customize' : 'Edit'}
                </Button>
            </div>
            <Card className="shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/30 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">{concept.title}</CardTitle>
                        <ConceptBadge concept={concept} />
                    </div>
                </CardHeader>
                <CardContent className="pt-8 pb-8 px-8 lg:px-12">
                    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:mb-2 prose-ul:my-2">
                        <ReactMarkdown>{concept.content}</ReactMarkdown>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ─── Edit View ───

function ConceptEditView({
    concept,
    onBack,
    onSaved,
    onDeleted,
}: {
    concept: Concept | null
    onBack: () => void
    onSaved: () => void
    onDeleted: () => void
}) {
    const [title, setTitle] = useState(concept?.title ?? '')
    const [description, setDescription] = useState(concept?.description ?? '')
    const [content, setContent] = useState(concept?.content ?? '')

    const { mutate: createConcept, isPending: creating } = useCreateConcept()
    const { mutate: updateConcept, isPending: updating } = useUpdateConcept()
    const { mutate: deleteConcept } = useDeleteConcept()
    const { mutate: resetConcept } = useResetConcept()

    const isNew = concept === null
    const isModified = concept?.user_id != null && concept?.base_concept_id != null
    const isCustom = concept?.user_id != null && !concept?.base_concept_id

    const handleSave = () => {
        if (!title.trim() || !content.trim()) return
        if (isNew) {
            createConcept({ title, description, content }, {
                onSuccess: () => { toast.success('Concept created'); onSaved() },
                onError: () => toast.error('Failed to create concept'),
            })
        } else {
            updateConcept({ id: concept!.id, data: { title, description, content } }, {
                onSuccess: () => { toast.success('Concept saved'); onSaved() },
                onError: () => toast.error('Failed to save concept'),
            })
        }
    }

    const handleDelete = () => {
        if (!concept) return
        if (confirm(`Delete "${concept.title}"? This cannot be undone.`)) {
            deleteConcept(concept.id, {
                onSuccess: () => { toast.success('Concept deleted'); onDeleted() },
                onError: () => toast.error('Failed to delete concept'),
            })
        }
    }

    const handleReset = () => {
        if (!concept) return
        if (confirm(`Reset "${concept.title}" to the system default? Your changes will be lost.`)) {
            resetConcept(concept.base_concept_id ?? concept.id, {
                onSuccess: () => { toast.success('Reset to default'); onSaved() },
                onError: () => toast.error('Failed to reset'),
            })
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Cancel
                </Button>
                <div className="flex items-center gap-2">
                    {isModified && (
                        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-amber-600 hover:text-amber-700">
                            <Undo2 className="h-4 w-4" /> Reset to Default
                        </Button>
                    )}
                    {(isCustom || isModified) && (
                        <Button variant="outline" size="sm" onClick={handleDelete} className="gap-1.5 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                    )}
                    <Button size="sm" onClick={handleSave} disabled={creating || updating || !title.trim() || !content.trim()} className="gap-1.5">
                        <Save className="h-4 w-4" />
                        {creating || updating ? 'Saving...' : isNew ? 'Create' : 'Save'}
                    </Button>
                </div>
            </div>
            <Card className="shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/30 space-y-4">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">Title</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Breadth-First Search" className="text-lg font-medium" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Description (optional)</label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief summary..." />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="edit">Markdown</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit" className="mt-0">
                            <Textarea value={content} onChange={(e) => setContent(e.target.value)}
                                placeholder="# My Concept Notes&#10;&#10;Write your notes here using Markdown..."
                                className="min-h-[450px] font-mono text-sm resize-y" />
                        </TabsContent>
                        <TabsContent value="preview" className="mt-0">
                            <div className="border rounded-md p-6 bg-card min-h-[450px]">
                                {content ? (
                                    <div className="prose prose-slate dark:prose-invert max-w-none"><ReactMarkdown>{content}</ReactMarkdown></div>
                                ) : (
                                    <p className="text-muted-foreground text-center pt-20">Nothing to preview</p>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

// ─── Concept Grid ───

function ConceptGrid({
    concepts,
    folders,
    items,
    onSelect,
    onAssignToFolder,
    onRemoveFromFolder,
}: {
    concepts: Concept[]
    folders: ConceptFolder[]
    items: ConceptFolderItem[]
    onSelect: (concept: Concept) => void
    onAssignToFolder: (conceptId: number, folderId: number) => void
    onRemoveFromFolder: (conceptId: number) => void
}) {
    const [search, setSearch] = useState('')

    const filtered = concepts.filter(
        (c) =>
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.description?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search concepts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {filtered.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No concepts match &ldquo;{search}&rdquo;</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((concept) => {
                        const currentFolderId = getFolderForConcept(concept.id, items)
                        const currentFolder = folders.find(f => f.id === currentFolderId)

                        return (
                            <Card
                                key={concept.id}
                                className="group cursor-pointer shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
                                onClick={() => onSelect(concept)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                                                <BookOpen className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="min-w-0 space-y-1.5">
                                                <h3 className="font-semibold truncate">{concept.title}</h3>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <ConceptBadge concept={concept} />
                                                    {currentFolder && (
                                                        <Badge variant="outline" className="text-xs gap-1">
                                                            <FolderOpen className="h-3 w-3" />
                                                            {currentFolder.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Folder action menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all mt-1"
                                                >
                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                {folders.length > 0 && (
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <FolderInput className="mr-2 h-4 w-4" /> Move to folder
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            {folders.map(folder => (
                                                                <DropdownMenuItem
                                                                    key={folder.id}
                                                                    onClick={() => onAssignToFolder(concept.id, folder.id)}
                                                                    className={currentFolderId === folder.id ? 'bg-primary/10' : ''}
                                                                >
                                                                    <FolderOpen className="mr-2 h-4 w-4" />
                                                                    {folder.name}
                                                                    {currentFolderId === folder.id && <span className="ml-auto text-xs text-primary">current</span>}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                )}
                                                {currentFolderId && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => onRemoveFromFolder(concept.id)}>
                                                            <FolderMinus className="mr-2 h-4 w-4" /> Remove from folder
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ─── Main Page ───

export default function StudyConceptsPage() {
    const { data: concepts, isLoading: loadingConcepts, isError } = useConcepts()
    const { data: folderData, isLoading: loadingFolders } = useConceptFolders()

    const { mutate: createFolder } = useCreateFolder()
    const { mutate: deleteFolder } = useDeleteFolder()
    const { mutate: updateFolder } = useUpdateFolder()
    const { mutate: assignToFolder } = useAssignToFolder()
    const { mutate: removeFromFolder } = useRemoveFromFolder()

    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
    const [folderFilter, setFolderFilter] = useState<FolderFilter>('all')

    const isLoading = loadingConcepts || loadingFolders
    const folders = folderData?.folders ?? []
    const items = folderData?.items ?? []

    const goToGrid = () => { setViewMode('grid'); setSelectedConcept(null) }

    const displayedConcepts = filterConcepts(concepts ?? [], folderFilter, items)

    return (
        <div className="min-h-screen">
            <div className="relative border-b">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Study Concepts</h1>
                        </div>
                        <p className="text-muted-foreground max-w-2xl">Browse, study, and customize your algorithm &amp; data structure notes.</p>
                    </div>

                    {!isLoading && concepts && viewMode === 'grid' && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
                                <span className="text-2xl font-bold">{concepts.length}</span>
                                <span className="text-sm text-muted-foreground">concepts available</span>
                            </div>
                            <Button onClick={() => setViewMode('create')} className="gap-1.5">
                                <Plus className="h-4 w-4" /> New Concept
                            </Button>
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
                            <p className="text-sm text-muted-foreground">Please check your connection and try again.</p>
                        </div>
                    </div>
                ) : viewMode === 'study' && selectedConcept ? (
                    <ConceptStudyView concept={selectedConcept} onBack={goToGrid} onEdit={() => setViewMode('edit')} />
                ) : viewMode === 'edit' && selectedConcept ? (
                    <ConceptEditView concept={selectedConcept} onBack={() => setViewMode('study')} onSaved={goToGrid} onDeleted={goToGrid} />
                ) : viewMode === 'create' ? (
                    <ConceptEditView concept={null} onBack={goToGrid} onSaved={goToGrid} onDeleted={goToGrid} />
                ) : (
                    <div className="space-y-6">
                        {/* Folder filter bar */}
                        <FolderFilterBar
                            folders={folders}
                            items={items}
                            concepts={concepts ?? []}
                            activeFilter={folderFilter}
                            onFilterChange={setFolderFilter}
                            onCreateFolder={(name) => createFolder({ name }, {
                                onSuccess: () => toast.success('Folder created'),
                                onError: () => toast.error('Failed to create folder'),
                            })}
                            onDeleteFolder={(id) => {
                                if (confirm('Delete this folder? Concepts inside will become unfiled.')) {
                                    deleteFolder(id, {
                                        onSuccess: () => {
                                            toast.success('Folder deleted')
                                            if (folderFilter === id) setFolderFilter('all')
                                        },
                                        onError: () => toast.error('Failed to delete folder'),
                                    })
                                }
                            }}
                            onRenameFolder={(id, name) => updateFolder({ id, data: { name } }, {
                                onSuccess: () => toast.success('Folder renamed'),
                                onError: () => toast.error('Failed to rename folder'),
                            })}
                        />

                        {/* Concept grid */}
                        {displayedConcepts.length === 0 && folderFilter !== 'all' ? (
                            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed">
                                <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">
                                    {folderFilter === 'unfiled' ? 'All concepts are organized into folders!' : 'This folder is empty. Use the ⋯ menu on a concept card to move it here.'}
                                </p>
                            </div>
                        ) : (
                            <ConceptGrid
                                concepts={displayedConcepts}
                                folders={folders}
                                items={items}
                                onSelect={(concept) => { setSelectedConcept(concept); setViewMode('study') }}
                                onAssignToFolder={(conceptId, folderId) => {
                                    assignToFolder({ concept_id: conceptId, folder_id: folderId }, {
                                        onSuccess: () => toast.success('Moved to folder'),
                                        onError: () => toast.error('Failed to move concept'),
                                    })
                                }}
                                onRemoveFromFolder={(conceptId) => {
                                    removeFromFolder(conceptId, {
                                        onSuccess: () => toast.success('Removed from folder'),
                                        onError: () => toast.error('Failed to remove from folder'),
                                    })
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
