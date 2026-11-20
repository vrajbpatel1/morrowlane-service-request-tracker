# Module 3 Playbook Submission — Service Request Portal

**Name:** Vraj Patel
**Live URL:** https://morrowlane-service-request-tracker.netlify.app
**Repo:** https://github.com/vrajbpatel1/morrowlane-service-request-tracker

## What I built

*3–5 plain-English sentences about what you built and who it's for. No jargon — write it the way you'd explain it to a coworker who doesn't code.*

[DRAFT FOR YOU TO REWRITE IN YOUR OWN WORDS] The Service Request Portal is one page where a Morrowlane Workplace Coordinator can log a service request, see every request in a single shared table, and change a request's status as work moves along. Three tiles at the top show how many requests are open, how many of those are urgent, and how many were completed in the latest month. The form refuses incomplete or invalid entries and says exactly what to fix. Operations leaders can download everything as a spreadsheet file with one click. Requests are stored in an online database, so they stay put after a refresh and everyone sees the same list.

## Debug Log

*Document the bug you hit when your deployed site stopped behaving like your laptop. Fill in all five fields below. Keep it factual — what you saw, what you asked, what turned out to be true.*

**Symptom:** On the live Netlify site, the table and the three tiles loaded normally, but submitting the form failed. Filling in a valid request (Test Coordinator, Denver, "Test: printer jam on floor 3", Low) and clicking Submit request showed a red message, "Could not save the request. Please try again." No row was added and the tiles did not change. The browser console showed a 500 error on `POST /api/requests`. Changing a status in the table failed the same way. On my laptop the same steps showed "Request submitted." and the new row appeared and survived a refresh.

**What I asked Claude:**

> [YOUR PROMPT — paste the actual prompt you used. For the record, the message sent at this point in the session was: "you can verify everything on my computer", and Claude then ran the live test and investigated.]

**Root cause:** The first version saved new requests by writing them into a file inside the project (`data/requests.csv`). My laptop allows a program to change its own files. Netlify does not: the live code runs on servers whose files are read-only. Netlify's function log showed the exact error, `EROFS: read-only file system, open '/var/task/data/requests.csv'`. Reading still worked because the starter data file is shipped with the code; only writing was refused. So the app was never broken on the laptop. It was relying on something the live environment does not offer.

**Fix:** Moved the data out of the file and into a Supabase database.
1. Created a `service_requests` table in Supabase with the same columns as the data file, plus an id. The table repeats the form's rules (allowed locations, priorities and statuses, and length limits) and has row-level security turned on.
2. Imported the 44 existing requests, keeping their original numbers.
3. Changed `lib/requests.js` to read from and write to the database, through one connection file, `lib/supabase.js`.
4. Added the two settings the connection needs (`SUPABASE_URL` and `SUPABASE_ANON_KEY`) to Netlify's environment variables. They are not in the code or on GitHub.
5. Pushed to GitHub, and Netlify redeployed automatically.

**Verification:** On the live site, after the redeploy: submitted the same test request through the form and saw "Request submitted."; the table went from 44 to 45 rows and the Open requests tile from 27 to 28. Refreshed the page and the request was still there. Looked directly in the Supabase table and found the new row with its own id. Netlify's function log showed no new errors. The test rows were deleted afterwards.

## Test pass results

*Run all five checks against your live site and record what happened. "Result" is pass or fail plus what you actually saw. "Fix made" is what you changed, or "None needed."*

Run against the live site on 20 November 2026, after the move to Supabase.

| # | Check | What I did | Result | Fix made |
|---|---|---|---|---|
| 1 | Valid entry | Submitted Test Coordinator / Denver / "Test: printer jam on floor 3" / Low through the form, then refreshed. | Pass. "Request submitted.", row appeared at the top with status New, tiles updated, and it was still there after the refresh and in the Supabase table. | The first attempt, before Supabase, failed with "Could not save the request." See the debug log. |
| 2 | Empty form | Clicked Submit request with every field blank. | Pass. Rejected with "Requester name is required. Location is required. Description is required. Priority is required." Nothing was saved. | None needed. |
| 3 | Duplicate-ish | Sent the identical request twice, one second apart. After the fix, repeated it, and also tried the same request with different capital letters and spacing, and with a different priority. | First run: fail. Both copies were saved as separate rows (ids 47 and 48). After the fix: pass. The second copy was refused with "This request has already been logged and is still open (request #56, status New). It was not saved again." The capitals-and-spacing version was refused too. A different priority was accepted as a new request. | Added a duplicate check: a new request is refused when an open request already has the same requester, location, description and priority. Once the earlier one is marked Complete, the same request can be logged again. |
| 4 | Absurd values | Sent a 10,000-character name, a 501-character description, location "Atlantis", priority "Apocalyptic", numbers in place of text, a status of "Whenever", a status change for request 999999, and a description containing a script tag and database commands. | Pass. All the invalid ones were rejected with a message naming the field (the unknown request returned "could not be found"). The script-tag text was saved and displayed as plain text; nothing ran and the table was unharmed. | Added a 100-character limit on requester name during the build, because without it a name of any length was accepted. |
| 5 | Hand-checked tile math | With 48 rows in the table (44 plus 4 test rows), counted the rows not marked Complete, the open ones marked Urgent, and the Complete ones dated in November 2026, and ran the same counts directly in the database. | Pass. Hand count and database count both gave 31 open, 2 urgent open, 1 completed this month, matching the tiles. | None needed. |

## Known limitations

*Be honest. List 3–5 things your app can't do or doesn't protect against, one bullet each — the things you'd want a real user to know before trusting it.*

- There is no login. Anyone with the link can read every request, add one, and change any request's status. It must hold sample data only.
- The duplicate check only catches exact copies of an open request. The same problem described in different words, or logged by a different person, is saved as a separate request. Two identical requests sent at the very same instant could also both get through.
- A request cannot be edited or deleted from the app. Only its status can change, so a typo stays until someone fixes it in the database.
- "Completed this month" counts requests created in the same month as the newest request, not completed in the current calendar month, and it does not record when a request was actually completed.
- The page loads every request at once and has only been tested with a few dozen. The database returns at most 1,000 rows per request by default, so a larger list would be cut off without warning.
- 14 of the sample requests came from meeting notes that had no location or priority. Those were filled in as Minneapolis and Medium by assumption.

## Assessment

*Around 250 words, first person. Where did AI move fast for you? Describe one genuine almost-right moment — something that looked correct and wasn't — and how you caught it. What would you prompt differently next time?*

[YOUR ASSESSMENT — this needs to be your own reflection. Facts from this build you could draw on:
- Fast: the five endpoints, validation and export were built and tested in a few short steps.
- Almost-right moments that really happened: (1) the first build plan went straight to Supabase and would have skipped the deployment bug the assignment is built around, until the starter's README was read; (2) the app saved correctly on the laptop and then failed on the live site, because it wrote to a file; (3) the first Netlify address given was the old Site Visit Log project, which loaded a page but had none of the tracker's routes; (4) the new Netlify project was private by default, so the link worked for the owner and showed a login page to everyone else; (5) "Completed this month" dropped to 0 after the first saved request, which looked like a bug but was the README's rule working as written.]
