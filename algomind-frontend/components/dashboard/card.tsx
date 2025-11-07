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
import { TypographyH2, TypographyH3, TypographyH4, TypographySmall } from "../typography";

export default function SectionCard() {
  return (
    <Card className="w-sm">
      <CardHeader>
        <TypographyH3>Due Today</TypographyH3>
        <TypographySmall>New + Pending</TypographySmall>
      </CardHeader>
      <CardContent>
        <TypographyH2>21</TypographyH2>
      </CardContent>
    </Card>
  );
}
