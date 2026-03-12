import { useState, useCallback } from 'react'
import { NAV_GROUPS, PROTECTED_ROUTES } from '@/config/nav-items'

const STORAGE_KEY = 'poa-menu-visibility'

function getAllRoutes(): string[] {
  return NAV_GROUPS.flatMap(g => g.items.map(i => i.to))
}

function loadVisibility(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  // default: all visible
  const defaults: Record<string, boolean> = {}
  for (const route of getAllRoutes()) defaults[route] = true
  return defaults
}

function saveVisibility(v: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
}

export function useMenuVisibility() {
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

  return { visibleRoutes, isVisible, setRouteVisible, resetAll }
}
