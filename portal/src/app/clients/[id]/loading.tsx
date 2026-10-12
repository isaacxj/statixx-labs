import { Skeleton, SkeletonHeader, SkeletonList, SkeletonPage } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHeader />
      <Skeleton className="h-28" />
      <SkeletonList rows={3} rowClassName="h-14" />
    </SkeletonPage>
  );
}
