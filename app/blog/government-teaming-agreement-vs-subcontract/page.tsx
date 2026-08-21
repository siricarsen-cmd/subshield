import { BatchArticlePage } from "../components/BatchArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/government-teaming-agreement-vs-subcontract");
export default function Page() { return <BatchArticlePage slug="government-teaming-agreement-vs-subcontract" />; }
