import { Batch4ArticlePage } from "../components/Batch4ArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/government-purpose-rights-vs-unlimited-rights");
export default function Page() { return <Batch4ArticlePage slug="government-purpose-rights-vs-unlimited-rights" />; }
