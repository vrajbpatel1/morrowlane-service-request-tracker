/*
  REQUESTS
  ========
  Everything the server knows about service requests lives in this file:
  how they are read, the rules for saving them, and how the summary
  numbers are counted. The files in app/api/ are thin wrappers that call
  these functions and send the answer back to the page.

  The requests are stored in a Supabase database, in a table called
  service_requests. (They used to be kept in a file in the data folder.
  That worked on one computer but not on the live site, where the server
  is not allowed to change its own files.)

  data/seed-requests.csv is the list the database was first filled from.
  The app no longer reads it.
*/

import { getSupabase } from "./supabase";

// The table in the database, and the columns the app uses from it.
const TABLE = "service_requests";
const COLUMNS = [
  "id",
  "created_at",
  "requester_name",
  "location",
  "description",
  "priority",
  "status",
];

// Turns a row from the database into the shape the page expects. Dates are
// written the same way every time, for example 2026-08-28T17:45:00Z.
function toRequest(row) {
  return {
    id: row.id,
    created_at: new Date(row.created_at).toISOString().replace(/\.\d{3}Z$/, "Z"),
    requester_name: row.requester_name,
    location: row.location,
    description: row.description,
    priority: row.priority,
    status: row.status,
  };
}

// Cleans up one value from the form: anything that is not text becomes
// empty, and spaces at the start and end are removed.
function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/* ---------- Reading ---------- */

// Every request, newest first. Two requests at the same moment: higher id first.
export async function listRequests() {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select(COLUMNS.join(", "))
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw new Error("Could not read the requests from the database: " + error.message);
  }
  return data.map(toRequest);
}

// The year and month of a date, such as "2026-08", read in UTC (the same
// clock the dates are stored in), so the answer does not depend on where
// the server happens to be.
function yearAndMonth(dateText) {
  const date = new Date(dateText);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return date.getUTCFullYear() + "-" + month;
}

/*
  The three numbers for the tiles at the top of the page.

    open_requests        requests whose status is not Complete
    urgent_open          open requests whose priority is Urgent
    completed_this_month Complete requests created in the same month as
                         the most recent request in the data (not the
                         month it happens to be today)
*/
export async function getSummary() {
  const requests = await listRequests();

  const open = requests.filter(function (request) {
    return request.status !== "Complete";
  });

  const urgentOpen = open.filter(function (request) {
    return request.priority === "Urgent";
  });

  // listRequests returns newest first, so the first one is the most recent.
  let completedThisMonth = 0;
  if (requests.length > 0) {
    const latestMonth = yearAndMonth(requests[0].created_at);
    completedThisMonth = requests.filter(function (request) {
      return (
        request.status === "Complete" &&
        yearAndMonth(request.created_at) === latestMonth
      );
    }).length;
  }

  return {
    open_requests: open.length,
    urgent_open: urgentOpen.length,
    completed_this_month: completedThisMonth,
  };
}

/* ---------- The rules for a new request ---------- */

// The only values allowed in the dropdown fields. Spelling and capital
// letters must match exactly.
export const LOCATIONS = ["Minneapolis", "Chicago", "Denver", "Austin"];
export const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

// The longest a description or a name may be, in characters.
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_NAME_LENGTH = 100;

// Turns ["Low", "Medium", "High", "Urgent"] into "Low, Medium, High, or Urgent".
function listInWords(values) {
  return values.slice(0, -1).join(", ") + ", or " + values[values.length - 1];
}

/*
  Checks a new request against the rules and returns a list of problems,
  each one a sentence a coordinator can act on. An empty list means the
  request is fine to save.

  These checks run on the server on purpose. The dropdowns on the page are
  a convenience: someone can always send a request without using the form.
  The database repeats the same rules as a second line of defence.

  The rules:
    - all four fields are required (spaces alone do not count)
    - location must be one of LOCATIONS
    - priority must be one of PRIORITIES
    - description must be 500 characters or fewer
    - requester name must be 100 characters or fewer
*/
export function findProblems(input) {
  const problems = [];

  const requesterName = cleanText(input.requester_name);
  const location = cleanText(input.location);
  const description = cleanText(input.description);
  const priority = cleanText(input.priority);

  if (requesterName === "") {
    problems.push("Requester name is required.");
  } else if (requesterName.length > MAX_NAME_LENGTH) {
    problems.push(
      "Requester name must be " + MAX_NAME_LENGTH + " characters or fewer."
    );
  }

  if (location === "") {
    problems.push("Location is required.");
  } else if (!LOCATIONS.includes(location)) {
    problems.push("Location must be " + listInWords(LOCATIONS) + ".");
  }

  if (description === "") {
    problems.push("Description is required.");
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    problems.push(
      "Description must be " + MAX_DESCRIPTION_LENGTH + " characters or fewer " +
      "(it is " + description.length + ")."
    );
  }

  if (priority === "") {
    problems.push("Priority is required.");
  } else if (!PRIORITIES.includes(priority)) {
    problems.push("Priority must be " + listInWords(PRIORITIES) + ".");
  }

  return problems;
}

/* ---------- Duplicates ---------- */

// Makes two pieces of text comparable: capital letters and extra spaces
// are ignored, so "Printer  jam" and "printer jam" count as the same.
function comparable(value) {
  return cleanText(value).replace(/\s+/g, " ").toLowerCase();
}

/*
  Looks for a request that is still open (not Complete) and matches the
  new one exactly: same requester, location, description and priority.
  Returns that request, or null if there is none.

  A request that was completed and then comes up again is not a duplicate,
  so Complete requests are ignored.

  This is a check before saving, not a lock: two identical requests sent
  at the very same instant could both get through.
*/
export async function findOpenDuplicate(input) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select(COLUMNS.join(", "))
    .eq("location", cleanText(input.location))
    .eq("priority", cleanText(input.priority))
    .neq("status", "Complete")
    .order("id", { ascending: true });

  if (error) {
    throw new Error("Could not check the database for duplicates: " + error.message);
  }

  const match = data.find(function (row) {
    return (
      comparable(row.requester_name) === comparable(input.requester_name) &&
      comparable(row.description) === comparable(input.description)
    );
  });
  return match ? toRequest(match) : null;
}

/* ---------- Saving ---------- */

/*
  Saves a new request and returns it, including its new id.
  Call findProblems first: this function sends what it is given.

  "input" is what the form sent:
    { requester_name, location, description, priority }

  The database fills in the rest: the id, the current time, and the
  starting status "New".
*/
export async function createRequest(input) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert({
      requester_name: cleanText(input.requester_name),
      location: cleanText(input.location),
      description: cleanText(input.description),
      priority: cleanText(input.priority),
    })
    .select(COLUMNS.join(", "))
    .single();

  if (error) {
    throw new Error("Could not save the request to the database: " + error.message);
  }
  return toRequest(data);
}

/* ---------- Changing a request's status ---------- */

// The only statuses a request can have.
export const STATUSES = ["New", "In Progress", "Complete"];

// Returns a sentence describing what is wrong with a status, or "" if it is fine.
export function findStatusProblem(status) {
  if (!STATUSES.includes(cleanText(status))) {
    return "Status must be " + listInWords(STATUSES) + ".";
  }
  return "";
}

/*
  Changes the status of one request and returns the updated request.
  Returns null if there is no request with that id.

  "id" arrives as text from the page address (for example "7").
*/
export async function updateRequestStatus(id, status) {
  // An id is a whole number, 1 or higher. Anything else cannot match a request.
  if (!/^[1-9]\d{0,14}$/.test(String(id))) {
    return null;
  }

  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({ status: cleanText(status) })
    .eq("id", Number(id))
    .select(COLUMNS.join(", "));

  if (error) {
    throw new Error("Could not update the request in the database: " + error.message);
  }
  if (data.length === 0) {
    return null;   // no request has that id
  }
  return toRequest(data[0]);
}

/* ---------- Export ---------- */

// Writes one value the way CSV expects. A value containing a comma, a
// double quote, or a line break is wrapped in quotes, and any quotes
// inside it are doubled.
function toCsvValue(value) {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

/*
  Spreadsheet programs treat a cell that starts with = + - or @ as a
  formula and run it. A request description is typed by anyone, so a value
  that starts with one of those characters gets an apostrophe in front,
  which tells the spreadsheet "this is plain text".
*/
function safeForSpreadsheet(value) {
  const text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) {
    return "'" + text;
  }
  return text;
}

/*
  Every request, newest first, as the text of a CSV file: a header row,
  then one row per request. This is what the Export CSV link downloads.
*/
export async function buildCsvExport() {
  const requests = await listRequests();

  const lines = [COLUMNS.join(",")];
  requests.forEach(function (request) {
    const cells = COLUMNS.map(function (column) {
      return toCsvValue(safeForSpreadsheet(request[column]));
    });
    lines.push(cells.join(","));
  });

  // "﻿" is an invisible marker that tells Excel the file uses UTF-8,
  // so characters such as long dashes and accents show correctly.
  // "\r\n" is the line ending the CSV standard asks for.
  return "﻿" + lines.join("\r\n") + "\r\n";
}
