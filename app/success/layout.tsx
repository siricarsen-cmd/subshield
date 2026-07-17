import type { ReactNode } from "react";
import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Transaction Complete");

export default function SuccessLayout({ children }: { children: ReactNode }) {
  return children;
}
