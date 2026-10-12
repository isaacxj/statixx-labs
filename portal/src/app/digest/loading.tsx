import { Skeleton, SkeletonHeader, SkeletonPage } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHeader />
      <Skeleton className="h-16" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </SkeletonPage>
  );
}
