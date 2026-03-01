import { useState } from 'react'
import {
    Folder,
    FolderOpen,
    FileText,
    MoreVertical,
    Plus,
    Edit2,
    Trash2,
    FolderPlus,
    BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConceptFolder, ConceptFolderItem } from '@/features/edit-concepts/api/useConceptFolders'
import { Concept } from '@/features/edit-concepts/api/useConcepts'
import { cn } from '@/lib/utils'

interface ConceptSidebarProps {
    folders: ConceptFolder[]
    items: ConceptFolderItem[]
    concepts: Concept[]
    selectedFolderId: number | null | 'unfiled'
    selectedConceptId: number | null
    onSelectFolder: (id: number | null | 'unfiled') => void
    onSelectConcept: (concept: Concept) => void
    onCreateFolder: (name: string, parentId?: number) => void
    onUpdateFolder: (id: number, name: string) => void
    onDeleteFolder: (id: number) => void
    onCreateConcept: () => void
}

export function ConceptSidebar({
    folders,
    items,
    concepts,
    selectedFolderId,
    selectedConceptId,
    onSelectFolder,
    onSelectConcept,
    onCreateFolder,
    onUpdateFolder,
    onDeleteFolder,
    onCreateConcept
}: ConceptSidebarProps) {
    const [isCreatingFolder, setIsCreatingFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [editingFolderId, setEditingFolderId] = useState<number | null>(null)
    const [editFolderName, setEditFolderName] = useState('')
    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set())

    const toggleFolder = (folderId: number) => {
        const newExpanded = new Set(expandedFolders)
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId)
        } else {
            newExpanded.add(folderId)
        }
        setExpandedFolders(newExpanded)
    }

    const handleCreateFolder = (e: React.FormEvent) => {
        e.preventDefault()
        if (newFolderName.trim()) {
            onCreateFolder(newFolderName.trim())
            setNewFolderName('')
            setIsCreatingFolder(false)
        }
    }

    const handleUpdateFolder = (e: React.FormEvent, id: number) => {
        e.preventDefault()
        if (editFolderName.trim()) {
            onUpdateFolder(id, editFolderName.trim())
            setEditingFolderId(null)
        }
    }

    const getConceptsInFolder = (folderId: number) => {
        const conceptIds = items.filter(i => i.folder_id === folderId).map(i => i.concept_id)
        return concepts.filter(c => conceptIds.includes(c.id))
    }

    const unfiledConcepts = concepts.filter(c => !items.find(i => i.concept_id === c.id))

    return (
        <div className="w-64 border-r bg-muted/10 h-[calc(100vh-4rem)] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Library</h2>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsCreatingFolder(true)} title="New Folder">
                        <FolderPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreateConcept} title="New Concept">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                <Button
                    variant={selectedFolderId === null ? "secondary" : "ghost"}
                    className="w-full justify-start mb-1 h-9 px-2"
                    onClick={() => onSelectFolder(null)}
                >
                    <BookOpen className="h-4 w-4 mr-2 text-primary" />
                    All Concepts
                </Button>

                <div className="space-y-1 mt-2">
                    {folders.map(folder => (
                        <div key={folder.id}>
                            <div className="flex items-center group">
                                <Button
                                    variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
                                    className="flex-1 justify-start h-8 px-2"
                                    onClick={() => onSelectFolder(folder.id)}
                                >
                                    {expandedFolders.has(folder.id) ? (
                                        <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                                    ) : (
                                        <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                    )}
                                    <span className="truncate">{folder.name}</span>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                            setEditingFolderId(folder.id)
                                            setEditFolderName(folder.name)
                                        }}>
                                            <Edit2 className="mr-2 h-4 w-4" /> Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDeleteFolder(folder.id)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {editingFolderId === folder.id && (
                                <form onSubmit={(e) => handleUpdateFolder(e, folder.id)} className="px-2 py-1">
                                    <Input
                                        value={editFolderName}
                                        onChange={(e) => setEditFolderName(e.target.value)}
                                        className="h-7 text-sm"
                                        autoFocus
                                        onBlur={(e) => handleUpdateFolder(e, folder.id)}
                                    />
                                </form>
                            )}

                            {selectedFolderId === folder.id && (
                                <div className="ml-6 mt-1 space-y-1">
                                    {getConceptsInFolder(folder.id).map(concept => (
                                        <button
                                            key={concept.id}
                                            onClick={() => onSelectConcept(concept)}
                                            className={cn(
                                                "w-full text-left px-2 py-1.5 text-sm rounded-md flex items-center gap-2 transition-colors",
                                                selectedConceptId === concept.id
                                                    ? "bg-primary/10 text-primary font-medium"
                                                    : "text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            <FileText className="h-4 w-4 shrink-0" />
                                            <span className="truncate">{concept.title}</span>
                                        </button>
                                    ))}
                                    {getConceptsInFolder(folder.id).length === 0 && (
                                        <div className="px-2 py-1 text-xs text-muted-foreground italic">Empty folder</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {isCreatingFolder && (
                        <form onSubmit={handleCreateFolder} className="px-2 py-1">
                            <Input
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Folder name..."
                                className="h-7 text-sm"
                                autoFocus
                                onBlur={() => {
                                    if (!newFolderName.trim()) setIsCreatingFolder(false)
                                }}
                            />
                        </form>
                    )}
                </div>

                {unfiledConcepts.length > 0 && (
                    <div className="mt-4">
                        <Button
                            variant={selectedFolderId === 'unfiled' ? "secondary" : "ghost"}
                            className="w-full justify-start h-8 px-2"
                            onClick={() => onSelectFolder('unfiled')}
                        >
                            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                            Unfiled ({unfiledConcepts.length})
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
