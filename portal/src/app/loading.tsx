import { Skeleton, SkeletonHeader, SkeletonList, SkeletonPage } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHeader />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <SkeletonList rows={3} />
    </SkeletonPage>
  );
}
