import type { ReactNode } from "react";
import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Contractor Login");

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
