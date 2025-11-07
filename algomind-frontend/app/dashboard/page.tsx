import { PageFlexContainer, SectionContainer } from "@/components/containers";
import { TypographyH1 } from "@/components/typography";
import SectionCard from "@/components/dashboard/card";
export default function DashboardPage() {
  return (
    <PageFlexContainer className="justify-start items-start">
      <TypographyH1>Dashboard</TypographyH1>
      <SectionCard />
    </PageFlexContainer>
  );
}
