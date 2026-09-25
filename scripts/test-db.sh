#!/usr/bin/env bash
# Applies the Supabase shim + all migrations to a throwaway Postgres database
# and runs the RLS test-suite. Needs `psql` and a DATABASE_URL pointing at a
# superuser connection (CI uses a postgres service container).
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL, e.g. postgres://postgres:postgres@localhost:5432/postgres}"

psql() { command psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q "$@"; }

psql -c "drop schema if exists public cascade; create schema public; drop schema if exists auth cascade;"
psql -f supabase/tests/supabase_shim.sql
for f in supabase/migrations/*.sql; do
  echo "applying $f"
  psql -f "$f"
done
psql -f supabase/tests/rls_test.sql
