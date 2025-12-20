import { Button } from '@/components/ui/button'
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
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

export function QueueCard() {
    return (
        <Card className="w-full max-w-lg gap-6">
            <CardHeader>
                <CardTitle>
                    <TypographyH3>Today's Queue</TypographyH3>
                </CardTitle>
                <CardDescription className="text-base">
                    Concepts and problems scheduled for review today.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <div className="flex w-full justify-between items-center">
                    <TypographyLarge>Progress</TypographyLarge>
                    <TypographySmall>5/20</TypographySmall>
                </div>
                <Progress value={25} />
            </CardContent>
            <CardFooter>
                <Link href="/review" passHref>
                    <Button>Start Review</Button>
                </Link>
            </CardFooter>
        </Card>
    )
}
