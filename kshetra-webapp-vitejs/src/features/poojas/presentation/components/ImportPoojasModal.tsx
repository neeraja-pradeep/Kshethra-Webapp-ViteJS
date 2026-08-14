import { useEffect, useState } from 'react'

import { toFailure } from '@/core/error/result'
import { Alert, Button, Icon, Modal, Spinner } from '@/shared/ui'

import { useImportPoojasMutation } from '@/features/poojas/application/queries/usePoojaMutations'
import { getImportTemplate } from '@/features/poojas/infrastructure/data-sources/remote/poojas.api'
import type { PoojaImportOutcome } from '@/features/poojas/domain/repositories/pooja.repository'

export interface ImportPoojasModalProps {
  open: boolean
  onClose: () => void
  /** Fired with the server's own summary sentence once anything was created. */
  onImported: (message: string) => void
}

const MAX_FILE_MB = 2
const MAX_ROWS = 1000
/** Long enough for the browser to have started the download before the handle goes. */
const REVOKE_DELAY_MS = 10_000

/**
 * Bulk-add poojas from a spreadsheet.
 *
 * The file is validated by the server, not here: it is the only thing that
 * knows which gods exist, which pooja names are already taken under them, and
 * how prices parse. A browser-side pass could only ever disagree with it.
 */
export function ImportPoojasModal({ open, onClose, onImported }: ImportPoojasModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<PoojaImportOutcome | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)

  const importPoojas = useImportPoojasMutation()
  const failure = toFailure(importPoojas.error)

  useEffect(() => {
    if (open) return
    setFile(null)
    setResult(null)
    setTemplateError(null)
    importPoojas.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  /**
   * One endpoint serves both links so they cannot drift, and the sample is by
   * construction a file the importer accepts.
   */
  async function downloadTemplate(sample: boolean) {
    setTemplateError(null)
    try {
      const blob = await getImportTemplate(sample)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = sample ? 'poojas-sample.csv' : 'poojas-template.csv'
      // Firefox ignores a click on an anchor that is not in the document, and
      // revoking the URL in the same tick races the download everywhere else.
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
    } catch {
      setTemplateError('The template could not be downloaded. Try again in a moment.')
    }
  }

  function handleUpload() {
    if (!file) return
    importPoojas.mutate(file, {
      onSuccess: (outcome) => {
        setResult(outcome)
        if (outcome.createdCount > 0) onImported(outcome.message)
      },
    })
  }

  const busy = importPoojas.isPending

  return (
    <Modal open title="Import poojas" onClose={onClose} size="lg">
      <div className="flex flex-col gap-4">
        {result ? (
          <>
            <Alert type={result.failedCount ? 'warning' : 'success'}>{result.message}</Alert>

            {result.errors.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                  Rows that were skipped
                </div>
                <div className="max-h-[260px] overflow-y-auto rounded-lg border border-stroke-subtle">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border-b border-stroke-subtle bg-sunken px-3 py-2 text-left text-2xs font-semibold uppercase tracking-header text-ink-table">
                          Row
                        </th>
                        <th className="border-b border-stroke-subtle bg-sunken px-3 py-2 text-left text-2xs font-semibold uppercase tracking-header text-ink-table">
                          Column
                        </th>
                        <th className="border-b border-stroke-subtle bg-sunken px-3 py-2 text-left text-2xs font-semibold uppercase tracking-header text-ink-table">
                          Problem
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((row) => (
                        <tr key={`${row.row}-${row.column}`}>
                          {/* The line number as the spreadsheet shows it — the header is row 1. */}
                          <td className="border-b border-gray-100 px-3 py-2 tabular-nums text-ink-muted">
                            {row.row}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2 text-ink-muted">
                            {row.column || '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2 text-ink">
                            {row.error}
                            {row.value && <span className="text-ink-subtle"> ({row.value})</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-2xs leading-snug text-ink-subtle">
                  Rows are independent — the {result.createdCount} good{' '}
                  {result.createdCount === 1 ? 'row was' : 'rows were'} imported. Fix these and
                  upload again; only the corrected rows will be added.
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <div className="flex-1" />
              <Button
                theme="default"
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setResult(null)
                  importPoojas.reset()
                }}
              >
                Import another
              </Button>
              <Button theme="primary" onClick={onClose}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="m-0 text-sm leading-normal text-ink-muted">
              Add poojas in bulk from a CSV. Each row names an existing god — the importer never
              creates one, because a mis-spelled name would become a permanent, image-less entry in
              the app.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                theme="default"
                variant="outline"
                size="sm"
                onClick={() => void downloadTemplate(false)}
                iconLeft={<Icon name="download-simple" size={15} />}
              >
                Download template
              </Button>
              <button
                type="button"
                onClick={() => void downloadTemplate(true)}
                className="cursor-pointer border-none bg-transparent p-0 text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                Load sample data
              </button>
            </div>

            {templateError && <Alert type="warning">{templateError}</Alert>}

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-stroke-strong bg-sunken px-4 py-7 text-ink-subtle hover:bg-hover">
              <input
                type="file"
                accept=".csv,text/csv"
                className="absolute h-0 w-0 opacity-0"
                onChange={(e) => {
                  const picked = e.target.files?.[0] ?? null
                  setFile(picked)
                  e.target.value = ''
                }}
              />
              <Icon name="upload-simple" size={24} />
              <span className="text-sm font-medium text-ink">
                {file ? file.name : 'Choose a CSV file'}
              </span>
              <span className="text-2xs">
                Up to {MAX_ROWS.toLocaleString('en-IN')} rows, {MAX_FILE_MB} MB, UTF-8
              </span>
            </label>

            {failure && <Alert type="danger">{failure.message}</Alert>}

            <div className="flex items-center gap-2.5">
              <div className="flex-1" />
              <Button theme="default" variant="outline" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button theme="primary" onClick={handleUpload} disabled={!file || busy}>
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size={14} /> Importing…
                  </span>
                ) : (
                  'Import poojas'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
