import { Batch4ArticlePage } from "../components/Batch4ArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/dod-technical-data-rights-subcontracts");
export default function Page() { return <Batch4ArticlePage slug="dod-technical-data-rights-subcontracts" />; }
