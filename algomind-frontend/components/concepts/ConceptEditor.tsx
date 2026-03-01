import { useState, useEffect } from 'react'
import { Concept } from '@/features/edit-concepts/api/useConcepts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Save, Trash2, Undo2, Ban } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ConceptEditorProps {
    concept: Concept | null // null means creating a new concept
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
    isSaving
}: ConceptEditorProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [content, setContent] = useState('')

    useEffect(() => {
        if (concept) {
            setTitle(concept.title)
            setDescription(concept.description || '')
            setContent(concept.content)
        } else {
            setTitle('')
            setDescription('')
            setContent('')
        }
    }, [concept])

    const isSystem = concept && concept.user_id === null
    const isModified = concept && concept.user_id !== null && concept.base_concept_id !== null
    const isCustom = concept && concept.user_id !== null && concept.base_concept_id === null

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-background">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {concept ? 'Edit Concept' : 'Create New Concept'}
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            {isSystem && <Badge variant="secondary">System Preset</Badge>}
                            {isModified && <Badge className="bg-amber-500 hover:bg-amber-600">Modified Preset</Badge>}
                            {isCustom && <Badge className="bg-green-500 hover:bg-green-600">Custom Concept</Badge>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isModified && onReset && (
                            <Button variant="outline" size="sm" onClick={onReset} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                                <Undo2 className="h-4 w-4 mr-2" />
                                Reset to Default
                            </Button>
                        )}
                        {(isCustom || isModified) && onDelete && (
                            <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={onCancel}>
                            <Ban className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => onSave(title, description, content)}
                            disabled={isSaving || !title.trim() || !content.trim()}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Concept'}
                        </Button>
                    </div>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Title</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Breadth-First Search"
                                className="text-lg font-medium"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Short Description (Optional)</label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="A brief one-liner summarizing the concept..."
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="edit" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="edit">Markdown Editor</TabsTrigger>
                                <TabsTrigger value="preview">Preview</TabsTrigger>
                            </TabsList>
                            <TabsContent value="edit" className="mt-0">
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="# My Concept Note\n\nWrite your algorithm notes here..."
                                    className="min-h-[500px] font-mono text-sm resize-y"
                                />
                            </TabsContent>
                            <TabsContent value="preview" className="mt-0 border rounded-md p-6 bg-card min-h-[500px] overflow-y-auto">
                                {content ? (
                                    <div className="prose prose-slate dark:prose-invert max-w-none">
                                        <ReactMarkdown>{content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        Nothing to preview
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
