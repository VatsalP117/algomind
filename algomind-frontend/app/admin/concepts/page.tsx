'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'


import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { useAuth } from '@clerk/nextjs'

const formSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    content: z.string().min(10, 'Content must be at least 10 chars'),
})

export default function AdminCreateConceptPage() {
    const [status, setStatus] = useState<
        'idle' | 'loading' | 'success' | 'error'
    >('idle')
    const [responseMsg, setResponseMsg] = useState('')
    const { getToken } = useAuth()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            content: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setStatus('loading')
        setResponseMsg('')

        try {
            const token = await getToken()

            await axios.post(
                'http://localhost:8080/internal/concepts',
                values,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            )

            setStatus('success')
            setResponseMsg('Concept created successfully!')
            form.reset()
        } catch (error: any) {
            console.error(error)
            setStatus('error')
            setResponseMsg(
                error.response?.data?.error || 'Failed to create concept',
            )
        }
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Admin: Create Concept</h1>
                <p className="text-gray-500">
                    Add base knowledge to the system (BFS, Arrays, etc.)
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border shadow-sm">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Concept Title</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Array & Strings"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Short Description</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="One liner summary..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content (Markdown)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="# Markdown supported..."
                                            className="min-h-[300px] font-mono text-sm" // Taller and monospace for code
                                            {...field}
                                        />
                                    </FormControl>
                                    <p className="text-xs text-gray-500 text-right">
                                        Supports Markdown (Use **bold**, -
                                        lists, etc.)
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {status === 'success' && (
                            <div className="p-3 bg-green-100 text-green-700 rounded-md border border-green-200">
                                {responseMsg}
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="p-3 bg-red-100 text-red-700 rounded-md border border-red-200">
                                {responseMsg}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={status === 'loading'}
                        >
                            {status === 'loading'
                                ? 'Saving...'
                                : 'Create Concept'}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    )
}
