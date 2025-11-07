import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographySmall,
  TypographyP,
} from "../typography";

export default function SectionCard() {
  return (
    <Card className="w-sm font-geist-sans">
      <CardHeader>
        <CardTitle>
          <TypographyH3>Due Today</TypographyH3>
          <TypographySmall>New + Pending</TypographySmall>
        </CardTitle>
        <CardAction>
          <Button>Start Review</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <TypographyH2>18</TypographyH2>
        <TypographySmall>Last Reviewed 16 hours ago</TypographySmall>
      </CardContent>
    </Card>
  );
}
