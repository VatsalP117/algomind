'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Ban, Save, Trash2, Undo2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Concept } from '@/features/edit-concepts/api/useConcepts'

interface ConceptEditorProps {
	concept: Concept | null
	onSave: (title: string, description: string, content: string) => void
	onDelete?: () => void
	onReset?: () => void
	onCancel: () => void
	isSaving: boolean
}

export function ConceptEditor({
	concept,
	onSave,
	onDelete,
	onReset,
	onCancel,
	isSaving,
}: ConceptEditorProps) {
	const [title, setTitle] = useState(concept?.title ?? '')
	const [description, setDescription] = useState(
		concept?.description ?? ''
	)
	const [content, setContent] = useState(concept?.content ?? '')

	const isSystem = concept && concept.user_id === null
	const isModified =
		concept && concept.user_id !== null && concept.base_concept_id !== null
	const isCustom =
		concept && concept.user_id !== null && concept.base_concept_id === null

	return (
		<div className="animate-in fade-in slide-in-from-right-4 duration-300">
			<div className="flex items-center justify-between mb-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={onCancel}
					className="gap-1.5 text-muted-foreground hover:text-foreground"
				>
					<Ban className="h-4 w-4" />
					Cancel
				</Button>
				<div className="flex items-center gap-2">
					{isModified && onReset && (
						<Button
							variant="outline"
							size="sm"
							onClick={onReset}
							className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
						>
							<Undo2 className="h-4 w-4" />
							Reset to Default
						</Button>
					)}
					{(isCustom || isModified) && onDelete && (
						<Button
							variant="outline"
							size="sm"
							onClick={onDelete}
							className="gap-1.5 text-destructive hover:bg-destructive/10"
						>
							<Trash2 className="h-4 w-4" />
							Delete
						</Button>
					)}
					<Button
						size="sm"
						onClick={() => onSave(title, description, content)}
						disabled={isSaving || !title.trim() || !content.trim()}
						className="gap-1.5"
					>
						<Save className="h-4 w-4" />
						{isSaving ? 'Saving...' : concept ? 'Save' : 'Create'}
					</Button>
				</div>
			</div>
			<Card className="shadow-sm overflow-hidden">
				<CardHeader className="border-b bg-muted/30 space-y-4">
					<div className="space-y-3">
						<label className="text-sm font-medium text-muted-foreground">
							Title
						</label>
						<Input
							value={title}
							onChange={e => setTitle(e.target.value)}
							placeholder="e.g. Breadth-First Search"
							className="text-lg font-medium"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-muted-foreground">
							Description (optional)
						</label>
						<Input
							value={description}
							onChange={e => setDescription(e.target.value)}
							placeholder="A brief summary..."
						/>
					</div>
				</CardHeader>
				<CardContent className="pt-6">
					<Tabs defaultValue="edit" className="w-full">
						<TabsList className="mb-4">
							<TabsTrigger value="edit">Markdown</TabsTrigger>
							<TabsTrigger value="preview">Preview</TabsTrigger>
						</TabsList>
						<TabsContent value="edit" className="mt-0">
							<Textarea
								value={content}
								onChange={e => setContent(e.target.value)}
								placeholder="# My Concept Notes&#10;&#10;Write your notes here using Markdown..."
								className="min-h-[450px] font-mono text-sm resize-y"
							/>
						</TabsContent>
						<TabsContent value="preview" className="mt-0">
							<div className="border rounded-md p-6 bg-card min-h-[450px]">
								{content ? (
									<div className="prose prose-slate dark:prose-invert max-w-none">
										<ReactMarkdown>{content}</ReactMarkdown>
									</div>
								) : (
									<p className="text-muted-foreground text-center pt-20">
										Nothing to preview
									</p>
								)}
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	)
}
