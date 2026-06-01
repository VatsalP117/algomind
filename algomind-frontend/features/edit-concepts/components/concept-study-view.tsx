'use client'

import ReactMarkdown from 'react-markdown'
import { ArrowLeft, BookOpen, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Concept } from '@/features/edit-concepts/api/useConcepts'
import { ConceptBadge } from '@/features/edit-concepts/components/concept-badge'

interface ConceptStudyViewProps {
	concept: Concept
	onBack: () => void
	onEdit: () => void
}

export function ConceptStudyView({
	concept,
	onBack,
	onEdit,
}: ConceptStudyViewProps) {
	const isSystem = !concept.user_id

	return (
		<div className="animate-in fade-in slide-in-from-right-4 duration-300">
			<div className="flex items-center justify-between mb-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={onBack}
					className="gap-1.5 text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to concepts
				</Button>
				<Button
					size="sm"
					variant="outline"
					onClick={onEdit}
					className="gap-1.5"
				>
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
