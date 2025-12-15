import { cn } from "@/lib/utils";
export function PageContainer({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <main className={cn("mx-auto w-full max-w-7xl px-8 py-4", className)}>
      {children}
    </main>
  );
}

export function SectionContainer({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn("w-full py-2", className)}>{children}</section>;
}

export function PageFlexContainer({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <PageContainer className={cn("flex flex-col gap-8", className)}>
      {children}
    </PageContainer>
  );
}

export function SectionFlexContainer({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <SectionContainer
      className={cn("flex flex-row flex-wrap gap-12", className)}
    >
      {children}
    </SectionContainer>
  );
}
