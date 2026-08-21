import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/cmmc-flowdown-lower-tier-subcontractors");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
