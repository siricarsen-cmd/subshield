import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/contact");

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
