import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/federal-subcontractor-not-paid-prime-contractor");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
