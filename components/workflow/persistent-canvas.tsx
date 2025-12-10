"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkflowCanvas } from "./workflow-canvas";

export function PersistentCanvas() {
  const pathname = usePathname();
  // Defer rendering until after hydration to avoid Radix UI ID mismatches
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show canvas on homepage and workflow pages
  const showCanvas = pathname === "/" || pathname.startsWith("/workflows/");

  if (!(showCanvas && mounted)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0">
      <WorkflowCanvas />
    </div>
  );
}
