import { Batch4ArticlePage } from "../components/Batch4ArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/audit-records-clauses-federal-subcontracts");
export default function Page() { return <Batch4ArticlePage slug="audit-records-clauses-federal-subcontracts" />; }
