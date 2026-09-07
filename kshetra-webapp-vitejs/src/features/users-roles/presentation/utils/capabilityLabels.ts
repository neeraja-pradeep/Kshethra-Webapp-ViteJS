/**
 * Display text for a module capability key.
 *
 * Deliberately **not** reusing `MODULE_MAP`'s labels: those are written per
 * module, so `read` is "Open the counter" in one and "View orders" in another.
 * Borrowing them across modules would print a confidently wrong verb. These are
 * module-agnostic on purpose — the module's own name supplies the object, so
 * "Counter Bookings · Void a sale" reads correctly without either half
 * repeating the other.
 *
 * The map is a nicety, not a contract: an unrecognised key is humanised rather
 * than dropped, so a capability the backend adds tomorrow still renders.
 */
const CAPABILITY_LABELS: Readonly<Record<string, string>> = {
  read: 'View',
  create: 'Create',
  update: 'Edit',
  delete: 'Delete',
  export: 'Export',
  refund: 'Cancel or refund',
  cancel: 'Void a sale',
  collect_payment: 'Collect payment',
  complete: 'Mark performed',
  assign: 'Assign',
  register: 'Register',
  activate: 'Activate',
  suspend: 'Suspend',
  send: 'Send',
  statistics: 'View statistics',
  estimate_audience: 'Estimate audience',
  attendance: 'Manage attendance',
  gods_read: 'View assigned gods',
  gods_update: 'Change assigned gods',
  delete_variant: 'Delete a variant',
  repeat_read: 'View repeats',
  repeat_create: 'Add a repeat',
  repeat_update: 'Edit a repeat',
  repeat_delete: 'Delete a repeat',
}

/** `estimate_audience` → "Estimate audience". The fallback for an unmapped key. */
function humanise(key: string): string {
  const words = key.split('_')
  const [first = '', ...rest] = words
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(' ')
}

export function capabilityLabel(key: string): string {
  return CAPABILITY_LABELS[key] ?? humanise(key)
}
