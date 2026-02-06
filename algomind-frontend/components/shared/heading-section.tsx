import { PlusCircle } from 'lucide-react'
export default function HeadingSection({
    title,
    description,
}: {
    title: string
    description: string
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                    <PlusCircle className="h-5 w-5" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                    {title}
                </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">{description}</p>
        </div>
    )
}
