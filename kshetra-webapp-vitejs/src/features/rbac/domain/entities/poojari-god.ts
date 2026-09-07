/**
 * The gods (pooja categories) whose shrine a poojari keeps.
 *
 * A "god" is a `PoojaCategory` — the screen says God, the table predates the
 * screen. The temple's poojaris are not interchangeable: one keeps Ganapathi,
 * another Devi, and this list is what turns their app from "everything
 * happening today" into "everything happening today at my shrine".
 *
 * Rows hang off the **user**, not the poojari profile: a booking is assigned to
 * a user, and a poojari without an `employee_id` yet still has work.
 */

/** One god as the picker lists it. */
export interface PoojariGodOption {
  readonly id: number
  readonly name: string
}

/** One shrine currently assigned, with the audit trail the server keeps. */
export interface PoojariGodAssignment {
  readonly god: PoojariGodOption
  /**
   * Who made the assignment, or `null` when the poojari chose it themselves —
   * a row naming them as their own assigner would read as if somebody had
   * rostered them.
   */
  readonly assignedByName: string | null
  readonly assignedAt: string
}

/**
 * A poojari's shrine list as `GET admin/poojaris/{id}/gods/` returns it.
 *
 * **An empty list is not "sees nothing", it is "sees everything".** Every
 * poojari was unscoped before this table existed, so the server reads "no rows"
 * as *no scoping applies* rather than as an empty allow-list. Assigning the
 * first god switches scoping on for that person; clearing the list switches it
 * back off. The UI must say so — a bare "0 gods" would read as a lockout.
 */
export interface PoojariGods {
  readonly poojariId: number
  readonly poojariName: string
  readonly assignments: readonly PoojariGodAssignment[]
}
