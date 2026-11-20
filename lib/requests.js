/*
  REQUESTS
  ========
  Everything the server knows about service requests lives in this file:
  where they are stored, how they are read, and how the summary numbers
  are counted. The files in app/api/ are thin wrappers that call these
  functions and send the answer back to the page.

  Two files are involved:
    data/seed-requests.csv  the 22 starter requests. Never changed.
    data/requests.csv       the working copy. It is created the first time
                            someone saves a request: a copy of the starter
                            file with the new request added at the end.
  Until the working copy exists, the page shows the starter file.
*/

import { promises as fs } from "fs";
import path from "path";

// The starter requests that come with the project.
const SEED_FILE = path.join(process.cwd(), "data", "seed-requests.csv");

// Where saved requests are kept.
const DATA_FILE = path.join(process.cwd(), "data", "requests.csv");

// The columns in the file, in order. There is no id column on purpose.
const COLUMNS = [
  "created_at",
  "requester_name",
  "location",
  "description",
  "priority",
  "status",
];

/*
  Turns the text of a CSV file into a list of rows, where each row is a
  list of values. It follows the standard CSV rules:
    - a value wrapped in "double quotes" may contain commas and line breaks
    - two double quotes in a row inside a quoted value mean one real quote
  Splitting on commas alone would break rows such as
    "Water leak under the breakroom sink, floor 6"
*/
function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  // Some programs put an invisible marker at the very start of a file.
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (insideQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      insideQuotes = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n" || char === "\r") {
      // Windows files end lines with two characters (\r\n). Treat as one.
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  // The last line, if the file does not end with a line break.
  if (value !== "" || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  // Drop completely blank lines.
  return rows.filter(function (cells) {
    return cells.some(function (cell) {
      return cell.trim() !== "";
    });
  });
}

// The text of the working copy, or of the starter file if nothing has been
// saved yet. Any other problem reading the file is passed on as an error.
async function readDataText() {
  try {
    return await fs.readFile(DATA_FILE, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;   // ENOENT means "no such file"; anything else is a real problem
    }
    return await fs.readFile(SEED_FILE, "utf8");
  }
}

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

// One request as a single line of CSV, in the same column order as the file.
function toCsvLine(request) {
  return COLUMNS.map(function (column) {
    return toCsvValue(request[column]);
  }).join(",");
}

// Cleans up one value from the form: anything that is not text becomes
// empty, and spaces at the start and end are removed.
function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
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

/*
  Saves a new request and returns it, including its new id.
  Call findProblems first: this function saves whatever it is given.
  Every new request starts with the status "New" and the current time.

  "input" is what the form sent:
    { requester_name, location, description, priority }
*/
export async function createRequest(input) {
  const newRequest = {
    // The current time in the same style as the starter file: 2026-08-28T17:45:00Z
    created_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    requester_name: cleanText(input.requester_name),
    location: cleanText(input.location),
    description: cleanText(input.description),
    priority: cleanText(input.priority),
    status: "New",
  };

  // Start from what is already saved (or the starter file the first time),
  // and make sure it ends with a line break before adding the new line.
  let text = await readDataText();
  if (text !== "" && !text.endsWith("\n")) {
    text += "\n";
  }
  const existingCount = parseCsv(text).length - 1;   // minus the header row

  await fs.writeFile(DATA_FILE, text + toCsvLine(newRequest) + "\n", "utf8");

  return { id: existingCount + 1, ...newRequest };
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
  if (!/^\d+$/.test(String(id))) {
    return null;
  }
  const wantedId = Number(id);

  const requests = await readAllRequests();
  const match = requests.find(function (request) {
    return request.id === wantedId;
  });
  if (!match) {
    return null;
  }

  match.status = cleanText(status);

  // Write every request back to the working copy, in the same order, so
  // each one keeps its position and therefore its id.
  const lines = [COLUMNS.join(",")].concat(requests.map(toCsvLine));
  await fs.writeFile(DATA_FILE, lines.join("\n") + "\n", "utf8");

  return match;
}

/* ---------- Export ---------- */

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
  const exportColumns = ["id"].concat(COLUMNS);
  const requests = await listRequests();

  const lines = [exportColumns.join(",")];
  requests.forEach(function (request) {
    const cells = exportColumns.map(function (column) {
      return toCsvValue(safeForSpreadsheet(request[column]));
    });
    lines.push(cells.join(","));
  });

  // "﻿" is an invisible marker that tells Excel the file uses UTF-8,
  // so characters such as long dashes and accents show correctly.
  // "\r\n" is the line ending the CSV standard asks for.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/*
  Reads every request from the file, in the order they appear in it
  (oldest first). Each request gets an id from its position in the file:
  the first row is 1, the second is 2, and so on.
*/
async function readAllRequests() {
  const text = await readDataText();
  const rows = parseCsv(text);

  const header = rows[0] || [];
  const headerMatches = COLUMNS.every(function (column, index) {
    return (header[index] || "").trim() === column;
  });
  if (!headerMatches) {
    throw new Error(
      "The data file does not have the expected columns: " + COLUMNS.join(", ")
    );
  }

  return rows.slice(1).map(function (cells, index) {
    const request = { id: index + 1 };
    COLUMNS.forEach(function (column, columnIndex) {
      request[column] = (cells[columnIndex] || "").trim();
    });
    return request;
  });
}

// Every request, newest first. Two requests at the same moment: higher id first.
export async function listRequests() {
  const requests = await readAllRequests();
  return requests.sort(function (a, b) {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    if (timeA !== timeB) {
      return timeB - timeA;
    }
    return b.id - a.id;
  });
}

// The year and month of a date, such as "2026-08", read in UTC (the same
// clock the file's dates are written in), so the answer does not depend on
// where the server happens to be.
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
