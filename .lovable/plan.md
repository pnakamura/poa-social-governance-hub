

## Analysis: PEP Data Discrepancy

### Problem Identified

The "Total BID Atual" KPI on the /pep page shows **US$ 134,806,750**, while the spreadsheet cell N247 shows **132,161,750**. The difference is **US$ 2,645,000**.

### Root Cause

The data was imported into Supabase on **2026-03-11 01:27** from a file called `tmp_pep.xlsx` using the `import_pep_supabase.py` script. The linked Google Sheets spreadsheet has since been updated with different values, but the database was **not re-imported**.

The KPI calculation itself is correct -- it sums column `n_atual` for all rows where `ref='C'` (Componente lines):
- C1: 27,000,000
- C2: 103,806,750
- C3: 4,000,000
- **Total: 134,806,750**

The spreadsheet now shows a different total (132,161,750), meaning one or more component values changed in the spreadsheet after the import.

### What Needs to Happen

The data needs to be **re-imported** from the current spreadsheet. There are two approaches:

#### Option A: Manual Re-import (immediate)
Run the existing Python script against the updated spreadsheet:
```bash
python scripts/import_pep_supabase.py <updated_spreadsheet.xlsx> --versao v2
```
The script already handles delete-and-reinsert for the given version.

#### Option B: Automated Sync (sustainable solution)
Build an automated pipeline that periodically syncs the Google Sheet to Supabase, so the data stays current without manual re-imports. This could be done via:
1. A Supabase Edge Function that reads the Google Sheet via its export URL and upserts the data
2. An n8n workflow (the project already has `n8n/workflows/sync-google-sheets-bid.json`)
3. A scheduled script

### No Code Changes Needed on the Frontend

The `/pep` page logic is correct. The KPI strip sums `ref='C'` rows which matches the spreadsheet's total row (N247). The issue is purely **stale data** in the database.

### Recommendation

1. **Immediate**: Re-run the import script with the latest spreadsheet file to fix the current discrepancy
2. **Long-term**: Set up the n8n workflow or an Edge Function to auto-sync from Google Sheets on a schedule (daily or on-demand), so the dashboard always reflects the latest spreadsheet data

