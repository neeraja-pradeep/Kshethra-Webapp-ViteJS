import type { AxiosRequestConfig } from 'axios'

/**
 * Sending files through the shared client.
 *
 * Most of the API takes JSON, so `http` pins `Content-Type: application/json`
 * on every request. Left in place on a file upload that header does not merely
 * lose the multipart boundary — axios reads it and **silently rewrites the
 * body**: `defaults/index.js` turns a `FormData` payload into JSON via
 * `formDataToJSON` whenever the content type is JSON, so every `File` arrives
 * as `{}` and the request succeeds having uploaded nothing.
 *
 * Clearing the header with `null` is what fixes it — the browser then writes
 * `multipart/form-data` complete with its boundary. Two near-misses, both
 * verified against axios 1.18:
 *
 * - `undefined` keeps the files but leaves axios falling back to
 *   `application/x-www-form-urlencoded`, which the server cannot parse.
 * - A literal `'multipart/form-data'` is the original bug more convincingly
 *   spelled: it carries no boundary, so the parts cannot be split.
 */
export const MULTIPART_REQUEST: AxiosRequestConfig = {
  headers: { 'Content-Type': null },
}

/** What a form field can hold on its way to `FormData`. */
export type MultipartValue = string | number | boolean | File | null | undefined

/**
 * Builds a `FormData` body from a flat record.
 *
 * - `undefined` fields are **left out**, so a partial update sends only what it
 *   means to change rather than blanking the rest.
 * - `null` is sent as an empty value — the way a form clears a field.
 * - An array repeats its key, which is how DRF reads a list of files
 *   (`images`) or of ids (`remove_images`).
 * - Everything else is stringified, because a multipart part is only ever text
 *   or a file; `false` has to arrive as `"false"`, not as nothing at all.
 */
export function toFormData(fields: Record<string, MultipartValue | readonly MultipartValue[]>): FormData {
  const body = new FormData()

  const append = (key: string, value: MultipartValue) => {
    if (value === undefined) return
    if (value === null) {
      body.append(key, '')
    } else if (value instanceof File) {
      body.append(key, value)
    } else {
      body.append(key, String(value))
    }
  }

  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) value.forEach((entry) => append(key, entry))
    else append(key, value as MultipartValue)
  }

  return body
}

/** True when a payload carries at least one file and so has to go as multipart. */
export function hasFiles(fields: Record<string, unknown>): boolean {
  return Object.values(fields).some((value) =>
    Array.isArray(value) ? value.some((entry) => entry instanceof File) : value instanceof File,
  )
}
