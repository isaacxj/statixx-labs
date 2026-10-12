export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-4">
      <div className="bg-muted h-8 w-48 animate-pulse rounded-md" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-muted h-16 animate-pulse rounded-md" />
      ))}
    </div>
  );
}
