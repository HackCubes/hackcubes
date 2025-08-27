# Hirelyst Library Import

This folder holds data and scripts to import the Hirelyst challenge library (questions + flags) into HackCubes, and seed sample assessments/sections.

Steps:
1) Place CSVs here as `questions_rows.csv` and `flags_rows.csv` (done).
2) Add a .env.local at project root with:
   - NEXT_PUBLIC_SUPABASE_URL=...
   - SUPABASE_SERVICE_ROLE=... (server-only; do not commit)
3) Run importer:
   - Windows PowerShell:
     - node scripts/import-hirelyst.js

The importer:
- Upserts questions and flags, preserving provided IDs, mapping columns to HackCubes schema.
- Creates a sample assessment + sections if none exist, and assigns imported challenges to the first section by category.
- Recalculates totals.
