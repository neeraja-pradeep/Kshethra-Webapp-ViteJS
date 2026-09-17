import { useMutation } from '@tanstack/react-query'

import type { UploadedAttachment } from '@/features/tech-support/domain/entities/attachment-upload'
import { uploadAttachment } from '@/features/tech-support/infrastructure/data-sources/remote/attachmentUpload.api'
import { mapClozrError } from '@/features/tech-support/infrastructure/data-sources/remote/mapClozrError'
import { WebhookFailureError } from '@/features/tech-support/application/queries/useSubmitTicketMutation'

/**
 * Upload one file to §3 and hold its token until the ticket is submitted.
 *
 * One mutation per file rather than a batch: §3 takes exactly one file per
 * request, and a failure should cost only the file that failed — a batch
 * would make one rejected screenshot discard the others the reporter had
 * already waited for.
 */
export function useUploadAttachmentMutation() {
  return useMutation<UploadedAttachment, WebhookFailureError, File>({
    mutationFn: async (file) => {
      try {
        return await uploadAttachment(file)
      } catch (error) {
        throw new WebhookFailureError(mapClozrError(error))
      }
    },
  })
}
