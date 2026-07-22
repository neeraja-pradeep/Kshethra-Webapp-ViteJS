import { useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { formatINR } from '@/shared/lib/format'
import { Button, Icon, Modal, Table, type TableColumn } from '@/shared/ui'

import type { God } from '../../domain/entities/god'
import type { Pooja } from '../../domain/entities/pooja'
import { POOJAS_CSV_TEMPLATE, SAMPLE_POOJAS_CSV } from '../data/importSample.mock'
import { parseImportCsv, type ImportRow } from '../lib/importCsv'

export interface ImportPoojasModalProps {
  open: boolean
  gods: readonly God[]
  onClose: () => void
  onImport: (poojas: Pooja[]) => void
}

const TEMPLATE_HREF = 'data:text/csv;charset=utf-8,' + encodeURIComponent(POOJAS_CSV_TEMPLATE)

function importRowToPooja(r: ImportRow, index: number): Pooja {
  return {
    id: `PJ-IMP-${Date.now().toString(36).toUpperCase()}-${index}`,
    godIds: [r.godId],
    godNames: [r.godName],
    name: r.name,
    offlinePrice: r.offlinePrice,
    onlinePrice: r.onlinePrice,
    status: r.status,
    sortOrder: r.sortOrder,
    special: r.special,
    cardImage: null,
    cardDesc: '',
    bannerImage: null,
    bannerDesc: '',
    schedule: null,
    specificDates: [],
    unavailable: [],
  }
}

/** CSV bulk-import: upload stage, then a valid/invalid preview before committing the rows. */
export function ImportPoojasModal({ open, gods, onClose, onImport }: ImportPoojasModalProps) {
  const [stage, setStage] = useState<'upload' | 'preview'>('upload')
  const [rows, setRows] = useState<ImportRow[]>([])

  const reset = () => {
    setStage('upload')
    setRows([])
  }
  const handleClose = () => {
    reset()
    onClose()
  }
  const parse = (text: string) => {
    setRows(parseImportCsv(text, gods))
    setStage('preview')
  }
  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => parse(String(reader.result))
    reader.readAsText(file)
  }
  const handleCommit = () => {
    const valid = rows.filter((r) => r.valid)
    if (!valid.length) return handleClose()
    onImport(valid.map(importRowToPooja))
    reset()
  }

  const validCount = rows.filter((r) => r.valid).length
  const errCount = rows.length - validCount
  const allOk = errCount === 0 && validCount > 0
  const summary =
    rows.length === 0
      ? 'No rows found in this file.'
      : errCount === 0
        ? `${validCount} rows parsed — all valid and ready to import.`
        : `${errCount} of ${rows.length} rows have errors. Only the ${validCount} valid rows will be imported.`

  const columns: TableColumn<ImportRow>[] = [
    { key: 'row', header: 'Row', width: 52, render: (v) => <span className="tabular-nums text-ink-subtle">{v as number}</span> },
    {
      key: 'valid',
      header: '',
      width: 40,
      render: (v) => <Icon name={v ? 'check-circle' : 'x-circle'} weight="fill" size={18} className={v ? 'text-success' : 'text-danger'} />,
    },
    { key: 'godName', header: 'God' },
    { key: 'name', header: 'Pooja name', render: (v) => (v as string) || <span className="text-ink-disabled">—</span> },
    { key: 'offlinePrice', header: 'Offline', align: 'right', render: (v) => formatINR(v as number) },
    { key: 'onlinePrice', header: 'Online', align: 'right', render: (v) => formatINR(v as number) },
    { key: 'status', header: 'Status' },
    { key: 'special', header: 'Special', render: (v) => (v ? 'Yes' : 'No') },
    {
      key: 'errors',
      header: 'Issues',
      render: (v) => {
        const errors = v as string[]
        return errors.length ? <span className="text-xs text-danger">{errors.join('; ')}</span> : <span className="text-xs text-success">Valid</span>
      },
    },
  ]

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import poojas"
      description={stage === 'upload' ? 'Upload a CSV to add poojas in bulk.' : 'Review the parsed rows below before importing.'}
      size="lg"
      footer={
        stage === 'upload' ? (
          <Button theme="default" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        ) : (
          <>
            <Button theme="default" variant="outline" onClick={reset}>
              Back
            </Button>
            <Button theme="primary" disabled={validCount === 0} onClick={handleCommit}>
              {validCount > 0 ? `Import ${validCount} poojas` : 'Nothing to import'}
            </Button>
          </>
        )
      }
    >
      {stage === 'upload' && (
        <div className="flex flex-col gap-3.5 py-1.5 pb-2.5">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-stroke-subtle bg-sunken px-3.5 py-2.75">
            <span className="text-sm text-ink-muted">Need the format? Start from our CSV template.</span>
            <a
              href={TEMPLATE_HREF}
              download="poojas-template.csv"
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-primary no-underline"
            >
              <Icon name="download-simple" size={15} />
              Download template
            </a>
          </div>
          <label className="relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-stroke-strong bg-sunken p-8 hover:bg-hover">
            <input
              type="file"
              accept=".csv,text/csv"
              className="absolute h-0 w-0 opacity-0"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />
            <Icon name="file-csv" size={32} className="text-ink-subtle" />
            <span className="text-base font-medium text-ink">Choose a CSV file</span>
            <span className="text-center text-xs text-ink-subtle">Columns: God · Pooja Name · Offline Price · Online Price · Status · Sort Order · Special</span>
          </label>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-ink-subtle">No file handy?</span>
            <button type="button" onClick={() => parse(SAMPLE_POOJAS_CSV)} className="border-none bg-transparent text-sm font-medium text-primary">
              Load sample data
            </button>
          </div>
        </div>
      )}

      {stage === 'preview' && (
        <div className="flex flex-col gap-3 py-0.5 pb-2">
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-lg border px-3.25 py-2.5',
              rows.length === 0 ? 'border-stroke-subtle bg-sunken' : allOk ? 'border-success-border bg-success-surface' : 'border-warning-border bg-warning-surface',
            )}
          >
            <Icon name={allOk ? 'check-circle' : 'warning-circle'} weight="fill" size={18} className={allOk ? 'shrink-0 text-success' : 'shrink-0 text-warning'} />
            <span className="text-sm text-ink">{summary}</span>
          </div>
          <div className="max-h-[330px] overflow-auto rounded-lg">
            <Table<ImportRow> columns={columns} rows={rows} empty="Nothing parsed from the file." />
          </div>
        </div>
      )}
    </Modal>
  )
}
