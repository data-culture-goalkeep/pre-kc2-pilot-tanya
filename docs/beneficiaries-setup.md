# Beneficiaries test setup

## Apply after reviewing the SQL

The PR includes `supabase/migrations/20261004132727_beneficiaries_test_access.sql`. It has not been applied to the connected project. Tani may paste its complete contents into the Supabase SQL Editor for `pre-kc2-happy-feet-test` and run it once after review.

The migration grants SELECT and INSERT on beneficiaries to anon and authenticated. RLS stays enabled. SELECT allows all dummy beneficiary rows; INSERT requires the dashboard/manual-entry provenance and a positive source_row. No UPDATE, DELETE, or other-table permissions are added. These unauthenticated policies are TEST ONLY and must be tightened before real data.

## Vercel environment variables

Add both variables under Project Settings → Environment Variables, for Preview and Production. Redeploy after adding them.

| Variable | Value |
| --- | --- |
| SUPABASE_URL | Copy the project API URL from Supabase Project Settings → API/Data API. |
| SUPABASE_PUBLISHABLE_KEY | Copy the project's modern publishable key; the legacy anon key also works. |

Use neither a service_role key nor a secret key. No NEXT_PUBLIC variables are used. This test app has no user authentication; the policies intentionally allow dummy-data reads and inserts by the anon role.

## Staff view and export

Table and form: beneficiary_id, name_of_child, program, date_of_birth, status, primary_mobile_no, location. ID, name, program, and status are required. Existing nullable fields display a dash.

Search matches ID, name, primary phone, or location; program and status filters combine with search. The count card is the total registered count. The table shows 20 rows per page. CSV export includes every database column, including source tracking and notes, for every matching record across pagination. CSV fields are quoted and formula-like text is escaped.

Reads fetch database batches of 500 so the API row cap cannot truncate the count or export. The route and cached query revalidate every 60 seconds. Successful inserts immediately invalidate the beneficiary cache and refresh the view. Permission, connection, validation, duplicate-ID, and export errors are displayed.

## Manual-entry numbering

The server reads MAX(source_row) for source_file="Happy Feet Dashboard" and source_sheet="Manual Entry" in beneficiaries, then inserts the next positive number (first entry is 1). The existing unique constraint on (source_file, source_sheet, source_row) prevents duplicate references. A concurrent collision retries using a fresh maximum up to five attempts; exhausted retries produce a visible recoverable error. This does not promise gap-free numbering and does not allocate across other tables. No sequence or key changes are required.

## Preview review

1. Confirm existing dummy beneficiaries load and the count matches the table dataset.
2. Submit an empty add form and confirm required-field errors.
3. Save a unique synthetic beneficiary; confirm the success toast, refreshed count/table, and generated provenance.
4. Repeat the same beneficiary ID; confirm the visible duplicate-ID error without a success toast.
5. Filter the table and export; confirm all matching rows and all columns appear in the CSV.
6. Test mobile layout, panel scrolling, keyboard focus, Escape, and cancel.

Repository tests use an isolated local Postgres engine and mocked Supabase HTTP responses. Browser checks use a production Next.js build against an isolated SQL-backed API with synthetic rows. They do not verify the unapplied migration on the hosted database or certify actual Vercel preview speed.
