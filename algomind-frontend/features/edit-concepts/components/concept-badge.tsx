import { Badge } from '@/components/ui/badge'
import { Concept } from '@/features/edit-concepts/api/useConcepts'

export function ConceptBadge({ concept }: { concept: Concept }) {
	if (concept.user_id && concept.base_concept_id) {
		return (
			<Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">
				Modified
			</Badge>
		)
	}
	if (concept.user_id && !concept.base_concept_id) {
		return (
			<Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">
				Custom
			</Badge>
		)
	}
	return <Badge variant="secondary">System</Badge>
}
