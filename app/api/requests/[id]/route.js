/*
  /api/requests/[id]      for example /api/requests/7
  PATCH = change one request's status. This is what the status dropdown
          in each table row calls.
*/

import { NextResponse } from "next/server";
import { findStatusProblem, updateRequestStatus } from "../../../../lib/requests";

export async function PATCH(request, context) {
  try {
    // The id is the last part of the address.
    const { id } = await context.params;

    // Read what the page sent. If it is not readable, say so plainly.
    let input;
    try {
      input = await request.json();
    } catch (error) {
      input = null;
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json(
        { error: "The status change could not be read. Please try again." },
        { status: 400 }
      );
    }

    const problem = findStatusProblem(input.status);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const updated = await updateRequestStatus(id, input.status);
    if (!updated) {
      return NextResponse.json(
        { error: "That request could not be found. It may have been removed." },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("PATCH /api/requests/[id] failed:", error);
    return NextResponse.json(
      { error: "Could not update the status. Please try again." },
      { status: 500 }
    );
  }
}
