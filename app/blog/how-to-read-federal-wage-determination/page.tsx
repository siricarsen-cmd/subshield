import { Batch4ArticlePage } from "../components/Batch4ArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/how-to-read-federal-wage-determination");
export default function Page() { return <Batch4ArticlePage slug="how-to-read-federal-wage-determination" />; }
