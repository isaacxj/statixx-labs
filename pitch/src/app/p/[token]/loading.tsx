import { Skeleton } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4 md:p-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </main>
  );
}
