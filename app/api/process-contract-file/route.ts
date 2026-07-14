import { NextResponse } from "next/server";

// Retired: file and pasted-text reviews share /api/analyze-contract so no
// alternate endpoint can bypass ownership or credit enforcement.
export async function POST() {
  return NextResponse.json(
    { error: "This legacy processing endpoint is no longer available." },
    { status: 410 }
  );
}
