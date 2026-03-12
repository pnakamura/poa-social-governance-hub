import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { NAV_GROUPS, PROTECTED_ROUTES } from '@/config/nav-items'
import React from 'react'

const STORAGE_KEY = 'poa-menu-visibility'

function getAllRoutes(): string[] {
  return NAV_GROUPS.flatMap(g => g.items.map(i => i.to))
}

/** Default: only protected routes (Dashboard, Configurações) are visible */
function getDefaultVisibility(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {}
  for (const route of getAllRoutes()) {
    defaults[route] = PROTECTED_ROUTES.includes(route)
  }
  return defaults
}

function loadVisibility(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return getDefaultVisibility()
}

function saveVisibility(v: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
}

interface MenuVisibilityContextValue {
  visibleRoutes: Record<string, boolean>
  isVisible: (route: string) => boolean
  setRouteVisible: (route: string, visible: boolean) => void
  resetAll: () => void
}

const MenuVisibilityContext = createContext<MenuVisibilityContextValue | null>(null)

export function MenuVisibilityProvider({ children }: { children: ReactNode }) {
  const [visibleRoutes, setVisibleRoutes] = useState<Record<string, boolean>>(loadVisibility)

  const setRouteVisible = useCallback((route: string, visible: boolean) => {
    if (PROTECTED_ROUTES.includes(route)) return
    setVisibleRoutes(prev => {
      const next = { ...prev, [route]: visible }
      saveVisibility(next)
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    const defaults: Record<string, boolean> = {}
    for (const route of getAllRoutes()) defaults[route] = true
    saveVisibility(defaults)
    setVisibleRoutes(defaults)
  }, [])

  const isVisible = useCallback((route: string) => {
    if (PROTECTED_ROUTES.includes(route)) return true
    return visibleRoutes[route] !== false
  }, [visibleRoutes])

  return React.createElement(MenuVisibilityContext.Provider, {
    value: { visibleRoutes, isVisible, setRouteVisible, resetAll },
  }, children)
}

export function useMenuVisibility() {
  const ctx = useContext(MenuVisibilityContext)
  if (!ctx) throw new Error('useMenuVisibility must be used within MenuVisibilityProvider')
  return ctx
}
