import { z } from "zod";

const concepts = ["two-pointers", "graphs", "constants"] as const;
const difficulty = ["easy", "medium", "hard"] as const;


export const submitProblemSchema = z.object({
    name: z.string().min(1, "Name is required"),
    leetcodeUrl: z.string(),
    description: z.string(),
    difficulty: z.enum(difficulty),
    concept: z.array(z.enum(concepts)).min(1, "Concept is required"),
})

export type SubmitProblemValues = typeof submitProblemSchema
