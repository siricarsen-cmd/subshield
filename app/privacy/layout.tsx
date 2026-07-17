import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/privacy");

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
