import type { ReactNode } from "react";
import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Client Intake");

export default function IntakeLayout({ children }: { children: ReactNode }) {
  return children;
}
