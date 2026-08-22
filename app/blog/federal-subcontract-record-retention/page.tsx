import { Batch4ArticlePage } from "../components/Batch4ArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/federal-subcontract-record-retention");
export default function Page() { return <Batch4ArticlePage slug="federal-subcontract-record-retention" />; }
