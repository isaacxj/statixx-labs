import { Skeleton, SkeletonHeader, SkeletonList, SkeletonPage } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHeader />
      <Skeleton className="h-20" />
      <SkeletonList rows={4} rowClassName="h-14" />
    </SkeletonPage>
  );
}
