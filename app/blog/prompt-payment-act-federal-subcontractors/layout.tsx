import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/prompt-payment-act-federal-subcontractors");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
