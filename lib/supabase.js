/*
  SUPABASE CONNECTION
  ===================
  The one place the app connects to its database. Everything else asks
  this file for the connection.

  It needs two settings, which are never written into the code:
    SUPABASE_URL       the address of the Supabase project
    SUPABASE_ANON_KEY  the project's publishable ("anon") key

  On this computer they live in .env.local (not sent to GitHub).
  On the live site they are set in Netlify, under Environment variables.

  This file only runs on the server, never in the visitor's browser.
*/

import { createClient } from "@supabase/supabase-js";

let client = null;

export function getSupabase() {
  if (client) {
    return client;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "The database settings are missing. Set SUPABASE_URL and SUPABASE_ANON_KEY " +
      "(in .env.local on this computer, or in Netlify's environment variables for the live site)."
    );
  }

  client = createClient(url, key, {
    // The app has no logins, so there is no session to remember.
    auth: { persistSession: false, autoRefreshToken: false },
    // Always ask the database for current data. Never reuse a saved answer.
    global: {
      fetch: function (input, init) {
        return fetch(input, { ...init, cache: "no-store" });
      },
    },
  });

  return client;
}
