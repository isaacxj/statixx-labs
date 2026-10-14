"use client";

import { useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Opens the browser's print dialog; the page is always printed with the light theme. */
export function PrintButton() {
  useEffect(() => {
    let wasDark = false;
    const before = () => {
      wasDark = document.documentElement.classList.contains("dark");
      document.documentElement.classList.remove("dark");
    };
    const after = () => {
      if (wasDark) document.documentElement.classList.add("dark");
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  return (
    <Button type="button" variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
      <Download />Download PDF
    </Button>
  );
}
