import { clsx, type ClassValue } from 'clsx'

/**
 * Merge conditional class names. Thin wrapper over clsx so every component
 * composes classes the same way (never string concatenation).
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}
