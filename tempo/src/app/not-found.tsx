import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-3 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground text-sm">That page doesn’t exist, or the project or client was removed.</p>
      <Link href="/today" className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-input px-4 font-medium max-md:h-11">
        Back to Today
      </Link>
    </div>
  );
}
