'use client'

import { useRef, useState } from 'react'
import {
	FolderOpen,
	MoreHorizontal,
	Pencil,
	Plus,
	Trash2,
	X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
	ConceptFolder,
	ConceptFolderItem,
} from '@/features/edit-concepts/api/useConceptFolders'

interface FolderFilterBarProps {
	folders: ConceptFolder[]
	items: ConceptFolderItem[]
	concepts: { id: number }[]
	activeFilter: 'all' | 'unfiled' | number
	onFilterChange: (filter: 'all' | 'unfiled' | number) => void
	onCreateFolder: (name: string) => void
	onDeleteFolder: (id: number) => void
	onRenameFolder: (id: number, name: string) => void
}

export function FolderFilterBar({
	folders,
	items,
	concepts,
	activeFilter,
	onFilterChange,
	onCreateFolder,
	onDeleteFolder,
	onRenameFolder,
}: FolderFilterBarProps) {
	const [isCreating, setIsCreating] = useState(false)
	const [newName, setNewName] = useState('')
	const [renamingId, setRenamingId] = useState<number | null>(null)
	const [renameValue, setRenameValue] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

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
				className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
					activeFilter === 'all'
						? 'bg-primary text-primary-foreground shadow-sm'
						: 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
				}`}
			>
				All
				<span className="text-xs opacity-75">({concepts.length})</span>
			</button>

			{/* Folder pills */}
			{folders.map(folder => {
				const count = items.filter(
					i => i.folder_id === folder.id
				).length
				const isActive = activeFilter === folder.id

				if (renamingId === folder.id) {
					return (
						<form
							key={folder.id}
							onSubmit={e => handleRename(e, folder.id)}
							className="inline-flex"
						>
							<Input
								value={renameValue}
								onChange={e => setRenameValue(e.target.value)}
								className="h-8 w-32 text-sm"
								autoFocus
								onBlur={e => handleRename(e, folder.id)}
							/>
						</form>
					)
				}

				return (
					<div
						key={folder.id}
						className={`inline-flex items-center rounded-full text-sm font-medium transition-all ${
							isActive
								? 'bg-primary text-primary-foreground shadow-sm'
								: 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
						}`}
					>
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
								<DropdownMenuItem
									onClick={() => {
										setRenamingId(folder.id)
										setRenameValue(folder.name)
									}}
								>
									<Pencil className="mr-2 h-4 w-4" /> Rename
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => onDeleteFolder(folder.id)}
									className="text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" /> Delete Folder
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)
			})}

			{/* Create folder */}
			{isCreating ? (
				<form
					onSubmit={handleCreate}
					className="inline-flex items-center gap-1"
				>
					<Input
						ref={inputRef}
						value={newName}
						onChange={e => setNewName(e.target.value)}
						placeholder="Folder name..."
						className="h-8 w-32 text-sm"
						autoFocus
						onBlur={() => {
							if (!newName.trim()) setIsCreating(false)
						}}
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setIsCreating(false)}
					>
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
