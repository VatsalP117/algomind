import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client"; // Your Axios wrapper

// 1. The Input Type (Matches your FormFields exactly)
export type CreateItemInput = {
    title: string;
    problemLink: string;
    conceptId: number | null;
    difficulty: string; // "EASY" | "MEDIUM" | "HARD"
    summary: string;
    description: string;
    answer: string;
    hints: string;
};

// 2. The Backend Payload Type (Matches Go struct JSON tags)
type BackendPayload = {
    item_type: "PROBLEM" | "CONCEPT";
    concept_id: number | null;
    problem_title: string;
    problem_link: string;
    difficulty: string;
    summary: string;
    description: string;
    answer: string;
    hints: string;
};

export const useCreateItem = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (data: CreateItemInput) => {
            // 3. Transform Data: Frontend (camelCase) -> Backend (snake_case)
            const payload: BackendPayload = {
                item_type: "PROBLEM", // We are adding a problem
                concept_id: data.conceptId || null, // Ensure it's a number

                problem_title: data.title,
                problem_link: data.problemLink || "", // Handle potential undefined

                difficulty: data.difficulty,
                summary: data.summary,
                description: data.description || "",
                answer: data.answer,
                hints: data.hints || "",
            };

            // 4. Send Request
            const res = await api.post("/items", payload);
            return res.data;
        },

        onSuccess: () => {
            // 5. Cleanup & Redirect
            // Invalidate the library list so the new item appears immediately
            queryClient.invalidateQueries({ queryKey: ["items"] });

            // Redirect to the Dashboard or Library page
            router.push("/dashboard");
        },

        onError: (error) => {
            console.error("Failed to add problem:", error);
            // Optional: Add toast notification here
        },
    });
};