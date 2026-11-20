/*
  /api/export
  GET = every request, newest first, as a CSV file the browser downloads.
        This is the Export CSV link above the table.
*/

import { NextResponse } from "next/server";
import { buildCsvExport } from "../../../lib/requests";

// Always export the current data. Never serve a saved copy of an old file.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const csv = await buildCsvExport();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        // "attachment" makes the browser download the file instead of showing it.
        "Content-Disposition": 'attachment; filename="morrowlane-requests.csv"',
      },
    });
  } catch (error) {
    console.error("GET /api/export failed:", error);
    return NextResponse.json(
      { error: "Could not create the export. Please try again." },
      { status: 500 }
    );
  }
}
