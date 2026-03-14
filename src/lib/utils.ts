import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Compara dois textos palavra a palavra e retorna uma descrição
 * concisa do que mudou (inserção, remoção, substituição).
 */
export function diffWords(
  valorAnterior: string | null | undefined,
  valorNovo: string | null | undefined
): string {
  const anterior = valorAnterior?.trim() || ''
  const novo = valorNovo?.trim() || ''

  if (!anterior && !novo) return '(sem alteração)'
  if (!anterior && novo) {
    return `"${trunc(novo, 60)}" — Inserido`
  }
  if (anterior && !novo) {
    return `"${trunc(anterior, 60)}" — Removido`
  }

  // Para valores curtos / simples (datas, status), formato direto
  const wordsOld = anterior.split(/\s+/)
  const wordsNew = novo.split(/\s+/)

  if (wordsOld.length <= 3 && wordsNew.length <= 3) {
    return `${anterior} → ${novo}`
  }

  // LCS para encontrar diferenças palavra a palavra
  const lcs = computeLCS(wordsOld, wordsNew)

  const removed: string[] = []
  const added: string[] = []

  let i = 0, j = 0
  for (const word of lcs) {
    while (i < wordsOld.length && wordsOld[i] !== word) {
      removed.push(wordsOld[i])
      i++
    }
    while (j < wordsNew.length && wordsNew[j] !== word) {
      added.push(wordsNew[j])
      j++
    }
    i++
    j++
  }
  while (i < wordsOld.length) { removed.push(wordsOld[i]); i++ }
  while (j < wordsNew.length) { added.push(wordsNew[j]); j++ }

  if (removed.length === 0 && added.length === 0) return '(sem alteração)'

  const parts: string[] = []

  if (removed.length > 0 && added.length > 0) {
    parts.push(`"${trunc(removed.join(' '), 50)}" substituído por "${trunc(added.join(' '), 50)}"`)
  } else if (removed.length > 0) {
    const label = removed.length === 1 ? 'palavra' : 'frase'
    parts.push(`${label} "${trunc(removed.join(' '), 50)}" — Apagada`)
  } else if (added.length > 0) {
    const label = added.length === 1 ? 'palavra' : 'frase'
    parts.push(`${label} "${trunc(added.join(' '), 50)}" — Adicionada`)
  }

  return parts.join('; ')
}

function trunc(text: string, max: number): string {
  return text.length > max ? text.substring(0, max) + '...' : text
}

function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  const result: string[] = []
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { result.unshift(a[i - 1]); i--; j-- }
    else if (dp[i - 1][j] > dp[i][j - 1]) i--
    else j--
  }
  return result
}
