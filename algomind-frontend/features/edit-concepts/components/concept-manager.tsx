'use client'

import { useState } from 'react'
import { AlertCircle, FolderOpen, GraduationCap, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
	ConceptFolder,
	ConceptFolderItem,
} from '@/features/edit-concepts/api/useConceptFolders'
import { Concept } from '@/features/edit-concepts/api/useConcepts'

import { ConceptEditor } from './concept-editor'
import { ConceptGrid } from './concept-grid'
import { ConceptStudyView } from './concept-study-view'
import { FolderFilterBar } from './folder-filter-bar'

type ViewMode = 'grid' | 'study' | 'edit' | 'create'
type FolderFilter = 'all' | 'unfiled' | number

function filterConcepts(
	concepts: Concept[],
	filter: FolderFilter,
	items: ConceptFolderItem[]
): Concept[] {
	if (filter === 'all') return concepts
	if (filter === 'unfiled') {
		return concepts.filter(c => !items.find(i => i.concept_id === c.id))
	}
	return concepts.filter(c =>
		items.find(i => i.concept_id === c.id && i.folder_id === filter)
	)
}

export interface ConceptManagerProps {
	concepts: Concept[]
	folders: ConceptFolder[]
	folderItems: ConceptFolderItem[]
	isLoading: boolean
	isError: boolean
	onCreateConcept: (data: {
		title: string
		description: string
		content: string
	}) => void
	onUpdateConcept: (
		id: number,
		data: { title: string; description: string; content: string }
	) => void
	onDeleteConcept: (id: number) => void
	onResetConcept: (id: number) => void
	onCreateFolder: (name: string) => void
	onDeleteFolder: (id: number) => void
	onRenameFolder: (id: number, name: string) => void
	onAssignToFolder: (conceptId: number, folderId: number) => void
	onRemoveFromFolder: (conceptId: number) => void
	isSavingConcept: boolean
}

export function ConceptManager({
	concepts,
	folders,
	folderItems,
	isLoading,
	isError,
	onCreateConcept,
	onUpdateConcept,
	onDeleteConcept,
	onResetConcept,
	onCreateFolder,
	onDeleteFolder,
	onRenameFolder,
	onAssignToFolder,
	onRemoveFromFolder,
	isSavingConcept,
}: ConceptManagerProps) {
	const [viewMode, setViewMode] = useState<ViewMode>('grid')
	const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
	const [folderFilter, setFolderFilter] = useState<FolderFilter>('all')

	const goToGrid = () => {
		setViewMode('grid')
		setSelectedConcept(null)
	}

	const displayedConcepts = filterConcepts(concepts, folderFilter, folderItems)

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
							Browse, study, and customize your algorithm &amp; data
							structure notes.
						</p>
					</div>

					{!isLoading && concepts && viewMode === 'grid' && (
						<div className="mt-6 flex items-center justify-between">
							<div className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
								<span className="text-2xl font-bold">
									{concepts.length}
								</span>
								<span className="text-sm text-muted-foreground">
									concepts available
								</span>
							</div>
							<Button
								onClick={() => setViewMode('create')}
								className="gap-1.5"
							>
								<Plus className="h-4 w-4" /> New Concept
							</Button>
						</div>
					)}
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
				{isLoading ? (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3, 4, 5, 6].map(i => (
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
				) : viewMode === 'study' && selectedConcept ? (
					<ConceptStudyView
						concept={selectedConcept}
						onBack={goToGrid}
						onEdit={() => setViewMode('edit')}
					/>
				) : viewMode === 'edit' && selectedConcept ? (
					<ConceptEditor
						key={selectedConcept.id}
						concept={selectedConcept}
						onSave={(title, description, content) =>
							onUpdateConcept(selectedConcept.id, {
								title,
								description,
								content,
							})
						}
						onDelete={() => {
							if (
								confirm(
									`Delete "${selectedConcept.title}"? This cannot be undone.`
								)
							) {
								onDeleteConcept(selectedConcept.id)
								goToGrid()
							}
						}}
						onReset={() => {
							if (
								confirm(
									`Reset "${selectedConcept.title}" to the system default? Your changes will be lost.`
								)
							) {
								onResetConcept(
									selectedConcept.base_concept_id ??
										selectedConcept.id
								)
								goToGrid()
							}
						}}
						onCancel={() => setViewMode('study')}
						isSaving={isSavingConcept}
					/>
				) : viewMode === 'create' ? (
					<ConceptEditor
						key="create"
						concept={null}
						onSave={(title, description, content) =>
							onCreateConcept({ title, description, content })
						}
						onCancel={goToGrid}
						isSaving={isSavingConcept}
					/>
				) : (
					<div className="space-y-6">
						<FolderFilterBar
							folders={folders}
							items={folderItems}
							concepts={concepts}
							activeFilter={folderFilter}
							onFilterChange={setFolderFilter}
							onCreateFolder={onCreateFolder}
							onDeleteFolder={onDeleteFolder}
							onRenameFolder={onRenameFolder}
						/>

						{displayedConcepts.length === 0 &&
						folderFilter !== 'all' ? (
							<div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed">
								<FolderOpen className="h-8 w-8 text-muted-foreground/50" />
								<p className="text-sm text-muted-foreground">
									{folderFilter === 'unfiled'
										? 'All concepts are organized into folders!'
										: 'This folder is empty. Use the ⋯ menu on a concept card to move it here.'}
								</p>
							</div>
						) : (
							<ConceptGrid
								concepts={displayedConcepts}
								folders={folders}
								items={folderItems}
								onSelect={concept => {
									setSelectedConcept(concept)
									setViewMode('study')
								}}
								onAssignToFolder={onAssignToFolder}
								onRemoveFromFolder={onRemoveFromFolder}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
