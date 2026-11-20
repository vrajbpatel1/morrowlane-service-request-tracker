/*
  /api/summary
  GET = the three numbers for the tiles at the top of the page.
*/

import { NextResponse } from "next/server";
import { getSummary } from "../../../lib/requests";

// Always count from the current data. Never serve a saved copy of an old answer.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("GET /api/summary failed:", error);
    return NextResponse.json(
      { error: "Could not load the summary. Please try again." },
      { status: 500 }
    );
  }
}
