import { BatchArticlePage } from "../components/BatchArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/teaming-agreement-exclusivity");
export default function Page() { return <BatchArticlePage slug="teaming-agreement-exclusivity" />; }
