-- The 44 starting requests from data/seed-requests.csv, in the same order,
-- so each request keeps the number it had before the move to the database.
insert into public.service_requests
  (id, created_at, requester_name, location, description, priority, status)
overriding system value
values
  (1, '2026-07-16T14:20:00Z', 'Dana Whitfield', 'Minneapolis', 'HVAC making noise in suite 400', 'High', 'Complete'),
  (2, '2026-07-17T16:05:00Z', 'Marcus Ellery', 'Chicago', 'Replace lobby badge printer', 'Medium', 'Complete'),
  (3, '2026-07-20T13:38:00Z', 'Priya Raghunathan', 'Denver', 'Standing desk request — new hire starts Aug 3', 'Medium', 'Complete'),
  (4, '2026-07-22T18:47:00Z', 'Tomas Beckley', 'Austin', 'Conference room B projector will not connect to laptops', 'High', 'Complete'),
  (5, '2026-07-24T15:11:00Z', 'Alison Vo', 'Minneapolis', 'Schedule quarterly fire-safety inspection', 'Medium', 'Complete'),
  (6, '2026-07-27T21:02:00Z', 'Devon Ruiz', 'Chicago', 'Water leak under the breakroom sink, floor 6', 'Urgent', 'Complete'),
  (7, '2026-07-29T14:55:00Z', 'Hannah Sorensen', 'Denver', 'Order two ergonomic chairs for the finance team', 'Low', 'Complete'),
  (8, '2026-07-31T17:26:00Z', 'Curtis Nakamura', 'Austin', 'Badge access not working for the fourth floor stairwell', 'High', 'Complete'),
  (9, '2026-08-03T13:15:00Z', 'Renata Oyelaran', 'Minneapolis', 'Coffee machine in the north kitchen keeps shutting off', 'Low', 'Complete'),
  (10, '2026-08-04T19:40:00Z', 'Grant Pemberton', 'Chicago', 'Move six workstations from 12A to 12C before Friday', 'Medium', 'Complete'),
  (11, '2026-08-06T14:08:00Z', 'Sofia Marchetti', 'Denver', 'Elevator 2 stopped between floors, riders freed by building staff', 'Urgent', 'Complete'),
  (12, '2026-08-07T16:33:00Z', 'Isaac Fontaine', 'Austin', 'Restock the first aid cabinets on all three floors', 'Low', 'Complete'),
  (13, '2026-08-10T15:47:00Z', 'Dana Whitfield', 'Minneapolis', 'Replace burned out lights above the reception desk', 'Low', 'Complete'),
  (14, '2026-08-12T13:52:00Z', 'Marcus Ellery', 'Chicago', 'Quote needed for repainting the 8th floor corridor', 'Medium', 'In Progress'),
  (15, '2026-08-14T20:19:00Z', 'Priya Raghunathan', 'Denver', 'Server room temperature alarm went off twice overnight', 'Urgent', 'In Progress'),
  (16, '2026-08-17T14:41:00Z', 'Tomas Beckley', 'Austin', 'Set up two extra monitors in the training room', 'Medium', 'In Progress'),
  (17, '2026-08-19T18:07:00Z', 'Nadia Kowalski', 'Minneapolis', 'Loading dock door closes only halfway', 'High', 'In Progress'),
  (18, '2026-08-21T15:24:00Z', 'Curtis Nakamura', 'Austin', 'Add visitor parking signage at the south entrance', 'Low', 'In Progress'),
  (19, '2026-08-24T13:36:00Z', 'Renata Oyelaran', 'Minneapolis', 'Quarterly deep clean for the client meeting suites', 'Medium', 'In Progress'),
  (20, '2026-08-26T16:58:00Z', 'Grant Pemberton', 'Chicago', 'Front entrance card reader is slow to respond, sometimes needs three taps', 'High', 'New'),
  (21, '2026-08-27T14:12:00Z', 'Sofia Marchetti', 'Denver', 'Request a second recycling pickup each week', 'Low', 'New'),
  (22, '2026-08-28T17:45:00Z', 'Alison Vo', 'Minneapolis', 'Air conditioning in suite 220 is not cooling, staff moved to the open area', 'Urgent', 'New'),
  (23, '2026-10-07T15:00:00Z', 'Workplace Coordinator', 'Minneapolis', 'MSP-01 site visit follow-up: Recheck the east wing temperature on the next visit (owner: Workplace Coordinator)', 'Medium', 'Complete'),
  (24, '2026-10-27T15:00:00Z', 'Workplace Coordinator', 'Denver', 'DEN-01 site visit follow-up: Replace the rear stairwell emergency light battery (owner: Maintenance Technician)', 'Medium', 'Complete'),
  (25, '2026-10-27T15:00:00Z', 'Priya Raman', 'Minneapolis', 'Send the redlined contract to Corvid Analytics legal (from meeting: Weekly leadership sync)', 'Medium', 'New'),
  (26, '2026-10-27T15:00:00Z', 'Marcus Hale', 'Minneapolis', 'Review the security questionnaire (from meeting: Weekly leadership sync; waiting on: Send the redlined contract to Corvid Analytics legal)', 'Medium', 'New'),
  (27, '2026-10-27T15:00:00Z', 'Tomás Vega', 'Minneapolis', 'Share the customer survey results with the team (from meeting: Weekly leadership sync)', 'Medium', 'Complete'),
  (28, '2026-10-30T15:00:00Z', 'Dana Okafor', 'Minneapolis', 'Finalize the Q1 headcount plan (from meeting: Q1 planning kickoff)', 'Medium', 'New'),
  (29, '2026-10-30T15:00:00Z', 'Marcus Hale', 'Minneapolis', 'Schedule the pricing project kickoff (from meeting: Q1 planning kickoff; waiting on: Finalize the Q1 headcount plan)', 'Medium', 'New'),
  (30, '2026-10-30T15:00:00Z', 'Elena Brandt', 'Minneapolis', 'Draft the Q1 budget summary for the board (from meeting: Q1 planning kickoff)', 'Medium', 'New'),
  (31, '2026-10-30T15:00:00Z', 'Unassigned', 'Minneapolis', 'Confirm the offsite venue (from meeting: Q1 planning kickoff)', 'Medium', 'New'),
  (32, '2026-11-02T15:00:00Z', 'Tomás Vega', 'Minneapolis', 'Request updated pricing from Corvid Analytics (from meeting: Vendor review: Corvid Analytics)', 'Medium', 'New'),
  (33, '2026-11-02T15:00:00Z', 'Priya Raman', 'Minneapolis', 'Compare the renewal terms with last year''s contract (from meeting: Vendor review: Corvid Analytics; waiting on: Request updated pricing from Corvid Analytics)', 'Medium', 'New'),
  (34, '2026-11-02T15:00:00Z', 'Elena Brandt', 'Minneapolis', 'Book the renewal decision call (from meeting: Vendor review: Corvid Analytics; waiting on: Send the redlined contract to Corvid Analytics legal)', 'Medium', 'New'),
  (35, '2026-11-04T15:00:00Z', 'Workplace Coordinator', 'Chicago', 'CHI-02 site visit follow-up: Plumbing vendor to replace the kitchenette sink trap (owner: Vendor)', 'Medium', 'New'),
  (36, '2026-11-04T15:00:00Z', 'Dana Okafor', 'Minneapolis', 'Compile the pipeline numbers for the deck (from meeting: Board deck prep)', 'Medium', 'New'),
  (37, '2026-11-04T15:00:00Z', 'Priya Raman', 'Minneapolis', 'Write the product update slide (from meeting: Board deck prep)', 'Medium', 'New'),
  (38, '2026-11-04T15:00:00Z', 'Elena Brandt', 'Minneapolis', 'Send the draft deck to the board chair (from meeting: Board deck prep; waiting on: Compile the pipeline numbers for the deck)', 'Medium', 'New'),
  (39, '2026-11-04T15:00:00Z', 'Dana Okafor', 'Minneapolis', 'Update the hiring slide (from meeting: Board deck prep)', 'Medium', 'Complete'),
  (40, '2026-11-06T15:00:00Z', 'Workplace Coordinator', 'Austin', 'AUS-01 site visit follow-up: Electrician to assess the server closet circuit (owner: Vendor)', 'High', 'New'),
  (41, '2026-11-10T15:00:00Z', 'Workplace Coordinator', 'Minneapolis', 'MSP-02 site visit follow-up: Replace or recertify the loading dock fire extinguisher (owner: Safety Inspector)', 'High', 'New'),
  (42, '2026-11-13T15:00:00Z', 'Workplace Coordinator', 'Denver', 'DEN-01 site visit follow-up: Restock wet floor signs (owner: Workplace Coordinator)', 'Low', 'New'),
  (43, '2026-11-14T15:00:00Z', 'Workplace Coordinator', 'Minneapolis', 'MSP-01 site visit follow-up: Schedule the HVAC vendor to inspect the east wing rooftop unit (owner: Vendor)', 'High', 'New'),
  (44, '2026-11-15T15:00:00Z', 'Workplace Coordinator', 'Chicago', 'CHI-01 site visit follow-up: Repair or swap the two sit-stand desks on the second floor (owner: Maintenance Technician)', 'Medium', 'New');

-- Tell the database to continue numbering after the last imported request.
select setval(
  pg_get_serial_sequence('public.service_requests', 'id'),
  (select max(id) from public.service_requests)
);
