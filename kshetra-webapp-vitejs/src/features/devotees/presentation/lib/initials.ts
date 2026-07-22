/** First letter of the first two words of a name, upper-cased, e.g. "Lakshmi Narayan Iyer" → "LN". */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}
