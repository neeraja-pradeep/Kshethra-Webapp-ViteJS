import axios from 'axios'
import { z } from 'zod'

import { MULTIPART_REQUEST } from '@/core/api/multipart'
import { TECH_SUPPORT_ENDPOINTS } from '@/core/config/endpoints'

import type { UploadedAttachment } from '@/features/tech-support/domain/entities/attachment-upload'
import { AttachmentsUnavailableError } from '@/features/tech-support/domain/entities/webhook-failure'
import { postWithRetry } from '@/features/tech-support/infrastructure/data-sources/remote/techSupport.api'

/**
 * The relay waits up to 45 s for Clozr to take a file, so the shared client's
 * 20 s default would abandon uploads the server is still finishing.
 */
const UPLOAD_TIMEOUT_MS = 60_000

/** The 202 body from `POST /api/tech-support/attachments/`. */
const uploadResponseSchema = z.object({
  attachment_token: z.string(),
  expires_in: z.number(),
  name: z.string(),
  size: z.number(),
  content_type: z.string(),
})

/**
 * Upload one file through the relay and get back a redeemable token.
 *
 * Exactly one multipart part named `file`; the relay rejects zero or more
 * than one. `MULTIPART_REQUEST` clears the shared client's JSON content type
 * so the browser writes `multipart/form-data` with its boundary — see
 * `core/api/multipart.ts` for why neither `undefined` nor a literal string
 * works. The server decides the type from the file's bytes and sanitises the
 * name; both come back in the response.
 */
export async function uploadAttachment(file: File, signal?: AbortSignal): Promise<UploadedAttachment> {
  const form = new FormData()
  form.append('file', file)

  let response
  try {
    response = await postWithRetry(TECH_SUPPORT_ENDPOINTS.attachments, form, {
      ...MULTIPART_REQUEST,
      timeout: UPLOAD_TIMEOUT_MS,
      signal,
    })
  } catch (error) {
    /*
     * `409 attachments_unavailable`: Clozr has attachments switched off for
     * this deployment's key. Reporting itself still works, so this is "send
     * the ticket without files", not a misconfiguration.
     */
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 409 &&
      (error.response.data as { error_code?: unknown } | undefined)?.error_code === 'attachments_unavailable'
    ) {
      throw new AttachmentsUnavailableError('Attachments are not enabled for this workspace.')
    }
    throw error
  }

  const dto = uploadResponseSchema.parse(response.data)
  return {
    token: dto.attachment_token,
    expiresIn: dto.expires_in,
    expiresAt: Date.now() + dto.expires_in * 1000,
    name: dto.name,
    size: dto.size,
    contentType: dto.content_type,
  }
}
