

## Bug: Sidebar doesn't update in real-time when visibility toggles change

### Problem
The `useMenuVisibility` hook uses `useState` initialized from `localStorage`. When Settings toggles a route, it updates localStorage and its own React state. But the Sidebar has a **separate** hook instance with its own state that doesn't re-read localStorage until the next page load.

**Result**: Toggling modules in Settings takes effect only after a full page reload. "Restaurar padrão" also doesn't immediately reflect in the sidebar.

### Fix: Shared state via React Context

Replace the independent hook instances with a single context provider so both Sidebar and Settings share the same React state.

**Files changed:**

| File | Action |
|---|---|
| `src/hooks/useMenuVisibility.ts` | Refactor to export a Context Provider + consumer hook |
| `src/components/layout/AppLayout.tsx` | Wrap layout with `MenuVisibilityProvider` |

**Implementation:**

1. **`useMenuVisibility.ts`** — Add `MenuVisibilityProvider` (React context) that holds the state. Export `useMenuVisibility()` as a context consumer. Keep all existing logic (localStorage read/write, protected routes).

2. **`AppLayout.tsx`** — Wrap the layout tree with `<MenuVisibilityProvider>` so both Sidebar and Settings share a single state instance.

No changes needed to `Sidebar.tsx` or `Settings.tsx` — they already call `useMenuVisibility()`, which will now read from context instead of local state.

