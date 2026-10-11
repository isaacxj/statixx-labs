function Bar({ className }: { className: string }) {
  return <div className={`bg-muted motion-safe:animate-pulse rounded-input ${className}`} />;
}

/** Skeleton shown while any page's data loads; same width and rhythm as the real pages to avoid layout shift. */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6" role="status" aria-label="Loading">
      <Bar className="h-8 w-40" />
      <div className="grid gap-2 sm:grid-cols-2">
        <Bar className="h-14" />
        <Bar className="h-14" />
      </div>
      <div className="bg-card rounded-card divide-border divide-y border">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4">
            <Bar className="size-2.5 rounded-full" />
            <Bar className="h-4 flex-1" />
            <Bar className="h-4 w-12" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
