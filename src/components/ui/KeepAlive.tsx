"use client";

import { useKeepAlive } from "@/hooks/useKeepAlive";

export default function KeepAlive({ children }: { children: React.ReactNode }) {
  useKeepAlive();
  return <>{children}</>;
}
