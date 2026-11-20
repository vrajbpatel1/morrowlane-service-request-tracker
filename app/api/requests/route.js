/*
  /api/requests
  GET  = every request, newest first. This fills the table on the page.
  POST = save a new request. This is what the "Submit request" button calls.
*/

import { NextResponse } from "next/server";
import {
  createRequest,
  findOpenDuplicate,
  findProblems,
  listRequests,
} from "../../../lib/requests";

// Always read the data fresh. Never serve a saved copy of an old answer.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const requests = await listRequests();
    return NextResponse.json({ requests: requests });
  } catch (error) {
    console.error("GET /api/requests failed:", error);
    return NextResponse.json(
      { error: "Could not load the requests. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Read what the form sent. If it is not readable, say so plainly.
    let input;
    try {
      input = await request.json();
    } catch (error) {
      input = null;
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json(
        { error: "The request could not be read. Please try again." },
        { status: 400 }
      );
    }

    // Check the rules before saving anything. If there are problems, list
    // every one of them so the coordinator can fix them in one go.
    const problems = findProblems(input);
    if (problems.length > 0) {
      return NextResponse.json({ error: problems.join(" ") }, { status: 400 });
    }

    // Refuse an exact copy of a request that is still open, so the same
    // problem is not logged twice.
    const duplicate = await findOpenDuplicate(input);
    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "This request has already been logged and is still open (request #" +
            duplicate.id + ", status " + duplicate.status + "). It was not saved again.",
        },
        { status: 409 }
      );
    }

    const saved = await createRequest(input);
    return NextResponse.json({ request: saved }, { status: 201 });
  } catch (error) {
    console.error("POST /api/requests failed:", error);
    return NextResponse.json(
      { error: "Could not save the request. Please try again." },
      { status: 500 }
    );
  }
}
