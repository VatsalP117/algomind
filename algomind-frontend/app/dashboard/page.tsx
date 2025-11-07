import {
  PageFlexContainer,
  SectionContainer,
  SectionFlexContainer,
} from "@/components/containers";
import { TypographyH1 } from "@/components/typography";
import { QueueCard } from "@/components/dashboard/QueueCard";
export default function DashboardPage() {
  return (
    <PageFlexContainer className="justify-start items-start">
      <TypographyH1>Dashboard</TypographyH1>
      <SectionContainer>
        <QueueCard />
      </SectionContainer>
    </PageFlexContainer>
  );
}
