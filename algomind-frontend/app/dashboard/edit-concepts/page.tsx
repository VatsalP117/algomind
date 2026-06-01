'use client'

import { toast } from 'react-hot-toast'

import {
	useAssignToFolder,
	useConceptFolders,
	useCreateFolder,
	useDeleteFolder,
	useRemoveFromFolder,
	useUpdateFolder,
} from '@/features/edit-concepts/api/useConceptFolders'
import {
	useConcepts,
	useCreateConcept,
	useDeleteConcept,
	useResetConcept,
	useUpdateConcept,
} from '@/features/edit-concepts/api/useConcepts'
import { ConceptManager } from '@/features/edit-concepts/components/concept-manager'

export default function StudyConceptsPage() {
	const { data: concepts, isLoading: loadingConcepts, isError } =
		useConcepts()
	const { data: folderData, isLoading: loadingFolders } =
		useConceptFolders()

	const { mutate: createConcept, isPending: isCreatingConcept } =
		useCreateConcept()
	const { mutate: updateConcept, isPending: isUpdatingConcept } =
		useUpdateConcept()
	const { mutate: deleteConcept } = useDeleteConcept()
	const { mutate: resetConcept } = useResetConcept()

	const { mutate: createFolder } = useCreateFolder()
	const { mutate: deleteFolder } = useDeleteFolder()
	const { mutate: updateFolder } = useUpdateFolder()
	const { mutate: assignToFolder } = useAssignToFolder()
	const { mutate: removeFromFolder } = useRemoveFromFolder()

	return (
		<ConceptManager
			concepts={concepts ?? []}
			folders={folderData?.folders ?? []}
			folderItems={folderData?.items ?? []}
			isLoading={loadingConcepts || loadingFolders}
			isError={isError}
			onCreateConcept={data =>
				createConcept(data, {
					onSuccess: () => toast.success('Concept created'),
					onError: () => toast.error('Failed to create concept'),
				})
			}
			onUpdateConcept={(id, data) =>
				updateConcept({ id, data }, {
					onSuccess: () => toast.success('Concept saved'),
					onError: () => toast.error('Failed to save concept'),
				})
			}
			onDeleteConcept={id =>
				deleteConcept(id, {
					onSuccess: () => toast.success('Concept deleted'),
					onError: () => toast.error('Failed to delete concept'),
				})
			}
			onResetConcept={id =>
				resetConcept(id, {
					onSuccess: () => toast.success('Reset to default'),
					onError: () => toast.error('Failed to reset'),
				})
			}
			onCreateFolder={name =>
				createFolder({ name }, {
					onSuccess: () => toast.success('Folder created'),
					onError: () => toast.error('Failed to create folder'),
				})
			}
			onDeleteFolder={id => {
				if (
					confirm(
						'Delete this folder? Concepts inside will become unfiled.'
					)
				) {
					deleteFolder(id, {
						onSuccess: () => toast.success('Folder deleted'),
						onError: () => toast.error('Failed to delete folder'),
					})
				}
			}}
			onRenameFolder={(id, name) =>
				updateFolder({ id, data: { name } }, {
					onSuccess: () => toast.success('Folder renamed'),
					onError: () => toast.error('Failed to rename folder'),
				})
			}
			onAssignToFolder={(conceptId, folderId) =>
				assignToFolder(
					{ concept_id: conceptId, folder_id: folderId },
					{
						onSuccess: () => toast.success('Moved to folder'),
						onError: () => toast.error('Failed to move concept'),
					}
				)
			}
			onRemoveFromFolder={conceptId =>
				removeFromFolder(conceptId, {
					onSuccess: () => toast.success('Removed from folder'),
					onError: () => toast.error('Failed to remove from folder'),
				})
			}
			isSavingConcept={isCreatingConcept || isUpdatingConcept}
		/>
	)
}
