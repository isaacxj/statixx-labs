export default function InvoiceNotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-xl font-semibold">Invoice not found</h1>
      <p className="text-muted-foreground text-13">This link is not valid. Check it with the person who sent it.</p>
    </div>
  );
}
