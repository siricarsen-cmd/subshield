import { NextResponse } from "next/server";
import { getProductionHealthStatus } from "@/lib/production-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

export async function GET() {
  const status = getProductionHealthStatus();

  return NextResponse.json(
    { status },
    {
      status: status === "ok" ? 200 : 503,
      headers: RESPONSE_HEADERS,
    },
  );
}
