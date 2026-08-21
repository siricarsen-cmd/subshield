import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/miller-act-payment-bond-claims");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
