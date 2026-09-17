import axios from 'axios'
import { z } from 'zod'

import { clozrAttachmentPath } from '@/core/config/endpoints'
import { env } from '@/core/config/env'

import type { UploadedAttachment } from '@/features/tech-support/domain/entities/attachment-upload'
import { AttachmentsUnavailableError, WebhookNotConfiguredError } from '@/features/tech-support/domain/entities/webhook-failure'
import { clozrWebhookClient } from '@/features/tech-support/infrastructure/data-sources/remote/clozrWebhookClient'

/** The 202 body from §3. */
const uploadResponseSchema = z.object({
  attachment_token: z.string(),
  expires_in: z.number(),
  name: z.string(),
  size: z.number(),
  content_type: z.string(),
})

/**
 * Upload one file and get back a redeemable token (§3).
 *
 * Browser mode only: the HMAC variant needs `X-Timestamp`, `X-Upload-Nonce`
 * and a signature over request metadata, and signing requires the key's
 * secret — which must never reach a browser bundle. A key with
 * `require_hmac: true` therefore cannot be driven from this app at all, and
 * its uploads will fail `401 invalid_signature` rather than silently
 * half-working.
 */
export async function uploadAttachment(file: File, signal?: AbortSignal): Promise<UploadedAttachment> {
  if (!env.clozrIssueKey) {
    throw new WebhookNotConfiguredError('CLOZR_ISSUE_KEY is not set — attachments cannot be uploaded.')
  }

  const form = new FormData()
  // Exactly one part named `file`; §3 rejects zero or more than one.
  form.append('file', file)

  let response
  try {
    response = await clozrWebhookClient.post(clozrAttachmentPath(env.clozrIssueKey), form, {
      /*
       * Undefined, not a string: the shared client sets `application/json`,
       * and multipart needs a boundary parameter only the browser can
       * generate. Setting it by hand produces a body the server cannot parse;
       * axios fills it in correctly once the default is cleared.
       */
      headers: { 'Content-Type': undefined },
      signal,
    })
  } catch (error) {
    /*
     * §3 answers `404 key_not_found` both for a genuinely unknown key and for
     * a valid key with `attachments_enabled: false` — deliberately identical,
     * so the feature is not advertised to a prober. Since the ticket webhook
     * shares this key and demonstrably works, a 404 here means attachments
     * are switched off, not that reporting is misconfigured. Saying the
     * latter would send someone debugging a system that is fine.
     */
    if (axios.isAxiosError(error) && error.response?.status === 404) {
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
