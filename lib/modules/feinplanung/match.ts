export function normalizeMatchKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Prefix match for ignore lists and customer priority.
 * The first three letters of a name are enough: "VDL" matches "VDL Janssen".
 * Longer entries still match when the value starts with the entry
 * ("VDL Janssen" matches "VDL Janssen GmbH").
 */
export function matchesPrefix(value: string, entry: string): boolean {
  const haystack = normalizeMatchKey(value)
  const needle = normalizeMatchKey(entry)
  if (!haystack || !needle) return false
  if (haystack === needle) return true
  if (haystack.startsWith(needle)) return true
  if (needle.length <= 3 && haystack.startsWith(needle)) return true
  return false
}

export function matchesAnyPrefix(value: string, entries: readonly string[]): boolean {
  return entries.some((entry) => matchesPrefix(value, entry))
}

export function findPrefixMatch<T extends { name: string }>(value: string, entries: readonly T[]): T | undefined {
  const matches = entries.filter((entry) => matchesPrefix(value, entry.name))
  if (matches.length === 0) return undefined
  return [...matches].sort((a, b) => b.name.trim().length - a.name.trim().length)[0]
}
