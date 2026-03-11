

## Fix: Supabase env variable mismatch

**Problem**: Line 6 of `src/lib/supabase.ts` checks for `VITE_SUPABASE_ANON_KEY`, but the `.env` file defines `VITE_SUPABASE_PUBLISHABLE_KEY`. This makes `supabaseConfigured` always `false`.

The actual Supabase client works fine because the hardcoded fallback key on line 4 is correct. But the flag is wrong.

**Fix** (single line change in `src/lib/supabase.ts`):

Change line 6 from:
```ts
export const supabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
```
to:
```ts
export const supabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
```

This is a one-line fix. All panels already connect to the real database via the hardcoded fallback — this just corrects the configuration detection flag.

