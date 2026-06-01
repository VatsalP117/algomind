'use client'

import { useState } from 'react'
import {
	BookOpen,
	FolderInput,
	FolderMinus,
	FolderOpen,
	MoreHorizontal,
	Search,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
	ConceptFolder,
	ConceptFolderItem,
} from '@/features/edit-concepts/api/useConceptFolders'
import { Concept } from '@/features/edit-concepts/api/useConcepts'
import { ConceptBadge } from '@/features/edit-concepts/components/concept-badge'

function getFolderForConcept(
	conceptId: number,
	items: ConceptFolderItem[]
): number | null {
	const item = items.find(i => i.concept_id === conceptId)
	return item ? item.folder_id : null
}

interface ConceptGridProps {
	concepts: Concept[]
	folders: ConceptFolder[]
	items: ConceptFolderItem[]
	onSelect: (concept: Concept) => void
	onAssignToFolder: (conceptId: number, folderId: number) => void
	onRemoveFromFolder: (conceptId: number) => void
}

export function ConceptGrid({
	concepts,
	folders,
	items,
	onSelect,
	onAssignToFolder,
	onRemoveFromFolder,
}: ConceptGridProps) {
	const [search, setSearch] = useState('')

	const filtered = concepts.filter(
		c =>
			c.title.toLowerCase().includes(search.toLowerCase()) ||
			c.description?.toLowerCase().includes(search.toLowerCase())
	)

	return (
		<div className="space-y-6 animate-in fade-in duration-200">
			<div className="relative max-w-md">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search concepts..."
					value={search}
					onChange={e => setSearch(e.target.value)}
					className="pl-9"
				/>
			</div>

			{filtered.length === 0 ? (
				<div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed">
					<Search className="h-8 w-8 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">
						No concepts match &ldquo;{search}&rdquo;
					</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filtered.map(concept => {
						const currentFolderId = getFolderForConcept(
							concept.id,
							items
						)
						const currentFolder = folders.find(
							f => f.id === currentFolderId
						)

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
												<h3 className="font-semibold truncate">
													{concept.title}
												</h3>
												<div className="flex items-center gap-1.5 flex-wrap">
													<ConceptBadge concept={concept} />
													{currentFolder && (
														<Badge
															variant="outline"
															className="text-xs gap-1"
														>
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
													onClick={e => e.stopPropagation()}
													className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all mt-1"
												>
													<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
												</button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												onClick={e => e.stopPropagation()}
											>
												{folders.length > 0 && (
													<DropdownMenuSub>
														<DropdownMenuSubTrigger>
															<FolderInput className="mr-2 h-4 w-4" />
															Move to folder
														</DropdownMenuSubTrigger>
														<DropdownMenuSubContent>
															{folders.map(folder => (
																<DropdownMenuItem
																	key={folder.id}
																			onClick={() =>
																				onAssignToFolder(
																				concept.id,
																				folder.id
																			)
																		}
																		className={
																		currentFolderId ===
																		folder.id
																			? 'bg-primary/10'
																			: ''
																	}
																>
																	<FolderOpen className="mr-2 h-4 w-4" />
																	{folder.name}
																	{currentFolderId ===
																		folder.id && (
																		<span className="ml-auto text-xs text-primary">
																			current
																		</span>
																	)}
																</DropdownMenuItem>
															))}
														</DropdownMenuSubContent>
													</DropdownMenuSub>
												)}
												{currentFolderId && (
													<>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() =>
																onRemoveFromFolder(
																		concept.id
																	)
															}
														>
															<FolderMinus className="mr-2 h-4 w-4" />
															Remove from folder
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
