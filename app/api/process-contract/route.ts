import { NextResponse } from "next/server";

// Retired: all paid analysis must use /api/analyze-contract, which enforces
// verified authentication, review ownership, and atomic credit reservation.
export async function POST() {
  return NextResponse.json(
    { error: "This legacy analysis endpoint is no longer available." },
    { status: 410 }
  );
}
