import { BatchArticlePage } from "../components/BatchArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/ostensible-subcontractor-rule");
export default function Page() { return <BatchArticlePage slug="ostensible-subcontractor-rule" />; }
