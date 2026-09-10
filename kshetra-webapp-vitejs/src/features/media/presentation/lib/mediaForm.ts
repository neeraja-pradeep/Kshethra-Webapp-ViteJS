import type { MediaTrackDetail, MediaTrackWrite } from '@/features/media/domain/entities/media-track'

/**
 * The audio limits the form enforces, mirrored so a file is refused before an
 * upload is spent on it.
 *
 * **20 MB, not the API's documented 50 MB.** nginx sits in front of Django with
 * `client_max_body_size 25m`, so anything above ~25 MB dies at the proxy with
 * an HTML `413` that no JSON error handler can read — the user would see a bare
 * failure. 20 MB leaves room for multipart overhead and keeps the refusal here,
 * where it can be explained. Raise this only when the proxy cap moves; see
 * `docs/api/backend-requests.md` §10.
 */
export const AUDIO_MAX_BYTES = 20 * 1024 * 1024
export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'] as const

/**
 * Why this file cannot be uploaded, or `null` if it can.
 *
 * The size is reported with one decimal: the server floor-divides to whole
 * megabytes, so at the boundary its own message reads "That file is 50MB. The
 * limit is 50MB." — true, and useless exactly where it matters.
 */
export function audioFileError(file: File): string | null {
  const name = file.name.toLowerCase()
  if (!AUDIO_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return `That is not an audio file. Upload one of ${AUDIO_EXTENSIONS.join(', ')}.`
  }
  if (file.size > AUDIO_MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    return `That file is ${mb} MB. The limit is 20 MB.`
  }
  return null
}

/**
 * What the create/edit form holds.
 *
 * Distinct from `MediaTrack`: the form carries the **files** the user picked
 * alongside the URLs the server returned, because those are different things —
 * a preview is a URL until it is replaced, and only a `File` can be uploaded.
 */
export interface MediaFormValues {
  title: string
  artist: string
  /** The audio the user picked this session. Mandatory on create. */
  audioFile: File | null
  /** The saved file's name, for the chip when nothing new was picked. */
  audioFilename: string
  /** A newly picked cover, or null when untouched/removed. */
  coverFile: File | null
  /** What to show now — an object URL for a new pick, the CDN URL otherwise. */
  coverPreview: string | null
  /** The saved cover was explicitly removed, so it must be cleared server-side. */
  coverCleared: boolean
  homeScreen: boolean
  active: boolean
}

export function blankMediaForm(): MediaFormValues {
  return {
    title: '',
    artist: '',
    audioFile: null,
    audioFilename: '',
    coverFile: null,
    coverPreview: null,
    coverCleared: false,
    homeScreen: false,
    active: true,
  }
}

export function mediaFormFromTrack(track: MediaTrackDetail): MediaFormValues {
  return {
    title: track.title,
    artist: track.artist,
    audioFile: null,
    audioFilename: track.audioFilename ?? '',
    coverFile: null,
    coverPreview: track.coverUrl,
    coverCleared: false,
    homeScreen: track.homeScreen,
    active: track.status === 'active',
  }
}

/**
 * The form's fields as a write.
 *
 * `audioFile` is sent only when the user picked one — omitting it leaves the
 * existing audio alone, so a rename does not re-upload. The cover follows the
 * server's rule that **`null` clears and absent leaves alone**: a new file is
 * sent, an explicit removal sends null, and an untouched cover sends nothing.
 */
export function toMediaWrite(form: MediaFormValues): MediaTrackWrite {
  return {
    title: form.title.trim(),
    artist: form.artist.trim(),
    ...(form.audioFile ? { audioFile: form.audioFile } : {}),
    ...(form.coverFile ? { cover: form.coverFile } : form.coverCleared ? { cover: null } : {}),
    homeScreen: form.homeScreen,
    status: form.active ? 'active' : 'inactive',
  }
}
