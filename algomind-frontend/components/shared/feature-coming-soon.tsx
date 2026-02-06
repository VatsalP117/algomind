import { Wrench } from "lucide-react";

export default function FeatureComingSoon() {
    return (
        <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Wrench className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-medium">Coming Soon</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        The edit concepts feature is under development.
                    </p>
                </div>
            </div>
        </div>
    )
}