import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/pricing");

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
