import { Batch4ArticlePage } from "../components/Batch4ArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/davis-bacon-worker-classification");
export default function Page() { return <Batch4ArticlePage slug="davis-bacon-worker-classification" />; }
