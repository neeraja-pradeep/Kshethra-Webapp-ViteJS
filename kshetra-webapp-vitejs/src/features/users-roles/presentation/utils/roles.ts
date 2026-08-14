/**
 * Role display helpers, re-exported from `rbac/` where roles are owned.
 *
 * The users screen renders roles but does not define them; keeping the
 * implementation in `rbac/presentation/lib/roleDisplay.ts` stops the two
 * features from depending on each other in both directions.
 */
export { baseRoleLabel, roleBadgeColor } from '@/features/rbac/presentation/lib/roleDisplay'

/** Strips non-digits so phone numbers can be compared regardless of formatting. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}
