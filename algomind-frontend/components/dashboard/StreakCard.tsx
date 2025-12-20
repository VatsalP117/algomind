import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    TypographyH3,
    TypographyLarge,
    TypographySmall,
} from '@/components/shared/typography'

export default function StreakCard() {
    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>
                    <TypographyH3>Streak Tracker</TypographyH3>
                </CardTitle>
                <CardDescription className="text-base">
                    Days you have stayed consistent.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Current Streak : 12 days</p>
                <p className="text-muted-foreground">
                    Longest Streak : 23 days
                </p>
            </CardContent>
        </Card>
    )
}
