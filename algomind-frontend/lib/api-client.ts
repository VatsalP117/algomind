import axios from "axios";
import { toast } from "react-hot-toast";

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    async (config) => {
        if (typeof window !== "undefined") {
            // @ts-ignore - Clerk attaches itself to the window object
            const clerk = window.Clerk;
            if (clerk && clerk.session) {
                // Get the active token. This handles refreshing automatically!
                const token = await clerk.session.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            toast.error("Unauthorized. Please sign in again.");
            
        }
        return Promise.reject(error);
    }
);
