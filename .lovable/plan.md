

## Feature: Visibility toggles for sidebar menu items

### Overview
Add a new card in Settings where you can toggle each sidebar item on/off. Hidden items disappear from the sidebar. State persists in `localStorage`. Dashboard and Settings are always visible (non-toggleable) so you can never lock yourself out.

### Architecture

1. **Shared nav config** (`src/config/nav-items.ts`) -- extract `NAV_GROUPS` from `Sidebar.tsx` into a shared file so both Sidebar and Settings can reference the same list with stable route keys.

2. **Custom hook** (`src/hooks/useMenuVisibility.ts`) -- reads/writes a `Record<string, boolean>` to `localStorage` key `menu-visibility`. Defaults all items to visible. Exposes `{ visibleRoutes, setRouteVisible, resetAll }`.

3. **Settings page** -- new card "Módulos Visíveis" with a checklist of all nav items grouped by section. Each row shows the icon + label + a Switch toggle. Dashboard (`/`) and Configurações (`/configuracoes`) are always checked and disabled.

4. **Sidebar** -- imports the hook, filters `group.items` by `visibleRoutes` before rendering. If a group has zero visible items, the entire group header is hidden.

### Files changed

| File | Action |
|---|---|
| `src/config/nav-items.ts` | **Create** -- export `NAV_GROUPS` array with `to`, `icon`, `label` |
| `src/hooks/useMenuVisibility.ts` | **Create** -- localStorage-backed hook |
| `src/components/layout/Sidebar.tsx` | **Edit** -- import from config + hook, filter items |
| `src/pages/Settings.tsx` | **Edit** -- add "Módulos Visíveis" card with Switch toggles |

### Key details
- localStorage key: `poa-menu-visibility`
- Protected routes (always visible, toggle disabled): `/` and `/configuracoes`
- A "Restaurar padrão" button resets all to visible
- No database needed -- purely client-side preference

