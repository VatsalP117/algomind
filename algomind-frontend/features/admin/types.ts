import { z } from 'zod'

export const createConceptSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
})

export type CreateConceptInput = z.infer<typeof createConceptSchema>
