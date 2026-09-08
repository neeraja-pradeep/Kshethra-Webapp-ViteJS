import { useEffect, useMemo, useState } from 'react'

import { TEMPLE_NAME } from '@/core/config/app'
import { toFailure } from '@/core/error/result'
import { Alert, Button, Icon, Spinner } from '@/shared/ui'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import { useAgentBookingsQuery } from '@/features/counter-pos/application/queries/useAgentBookingsQuery'
import { useGodsQuery, useNakshatramsQuery, usePoojasQuery } from '@/features/counter-pos/application/queries/useCatalogueQueries'
import { useCollectionSummaryQuery } from '@/features/counter-pos/application/queries/useCollectionSummaryQuery'
import { useCreateCounterSaleMutation } from '@/features/counter-pos/application/queries/useCreateCounterSaleMutation'
import { useRecordAgentPaymentMutation } from '@/features/counter-pos/application/queries/useRecordAgentPaymentMutation'
import { countOccurrences, MAX_OCCURRENCES_PER_SALE } from '@/features/counter-pos/domain/entities/booking'
import type { BookingLine, BookingPerson } from '@/features/counter-pos/domain/entities/booking'
import type { CounterReceipt, ReceiptPerson } from '@/features/counter-pos/domain/entities/counter-receipt'
import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'
import { priceForDate, type Pooja } from '@/features/counter-pos/domain/entities/pooja'
import { todayISO } from '@/features/counter-pos/presentation/lib/date'
import { buildReceiptPages } from '@/features/counter-pos/presentation/lib/receipt'
import { BookingPanel } from '@/features/counter-pos/presentation/components/BookingPanel'
import type { BookingPanelLine } from '@/features/counter-pos/presentation/components/BookingPanel'
import { CounterPaymentsModal } from '@/features/counter-pos/presentation/components/CounterPaymentsModal'
import type { CounterPaymentsMode } from '@/features/counter-pos/presentation/components/CounterPaymentsModal'
import { CounterToast } from '@/features/counter-pos/presentation/components/CounterToast'
import { KpiBand } from '@/features/counter-pos/presentation/components/KpiBand'
import { PeoplePanel } from '@/features/counter-pos/presentation/components/PeoplePanel'
import { PoojaConfigModal } from '@/features/counter-pos/presentation/components/PoojaConfigModal'
import { PoojaSearchPanel } from '@/features/counter-pos/presentation/components/PoojaSearchPanel'
import { Receipt } from '@/features/counter-pos/presentation/components/Receipt'
import { TakePaymentModal } from '@/features/counter-pos/presentation/components/TakePaymentModal'

/**
 * A timed-out write may still have been recorded, so the operator must check
 * before ringing it up again — there is no edit path, only void-and-re-ring.
 */
const TIMEOUT_WARNING =
  'The server took too long to reply, so it is unclear whether this went through. Do NOT take payment again until you have confirmed it with a supervisor — it may already be recorded.'

function failureMessageForWrite(error: unknown, fallback: string): string {
  const failure = toFailure(error)
  if (failure?.kind === 'timeout') return TIMEOUT_WARNING
  return failure?.message ?? fallback
}

/** Longest result list the catalogue panel renders at once. */
const MAX_RESULTS = 80
const TOAST_DURATION_MS = 2600
/** Server-side search is one request per keystroke without this. */
const SEARCH_DEBOUNCE_MS = 300

interface ConfigState {
  readonly editId: string | null
  readonly poojaId: number
  readonly name: string
  readonly godName: string
  readonly base: number
  readonly selectedIds: ReadonlySet<string>
  readonly dates: readonly string[]
  readonly remarks: string
  readonly calYear: number
  readonly calMonth: number
  /** Set for a special pooja: the only dates the server will accept. */
  readonly allowedDates: readonly string[] | undefined
}

/** Counter Bookings — walk-in pooja sale + billing, and settlement of app agent-code bookings. */
export function CounterPosScreen() {
  const can = useCan()
  const canSell = can(PERMISSIONS.operateCounter) && can(PERMISSIONS.addPoojaOrder)
  const canCollect = can(PERMISSIONS.collectCounterPayment)

  // ── server state ──
  const today = todayISO()
  const godsQuery = useGodsQuery()
  const nakshatramsQuery = useNakshatramsQuery()
  const summaryQuery = useCollectionSummaryQuery(today)
  const createSale = useCreateCounterSaleMutation()
  const recordPayment = useRecordAgentPaymentMutation()

  // ── client state ──
  const [people, setPeople] = useState<BookingPerson[]>([{ id: 'P1', name: '', nakshatramId: null }])
  const [peopleSeq, setPeopleSeq] = useState(2)
  const [bookingSeq, setBookingSeq] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [browseOpen, setBrowseOpen] = useState(false)
  const [browseGodId, setBrowseGodId] = useState<number | null>(null)
  const [config, setConfig] = useState<ConfigState | null>(null)
  const [booking, setBooking] = useState<BookingLine[]>([])
  const [payOpen, setPayOpen] = useState(false)
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receipt, setReceipt] = useState<CounterReceipt | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [cpOpen, setCpOpen] = useState(false)
  const [cpSearch, setCpSearch] = useState('')
  const [cpDebouncedSearch, setCpDebouncedSearch] = useState('')
  const [cpSelId, setCpSelId] = useState<number | null>(null)
  const [cpMethod, setCpMethod] = useState<PaymentMethod>('cash')
  const [cpReceipt, setCpReceipt] = useState<CounterReceipt | null>(null)

  // Both catalogue and payments search server-side, so each waits on its own
  // debounced term — hence declared here rather than with the other queries.
  const poojasQuery = usePoojasQuery(debouncedSearch || undefined, browseGodId)
  const agentBookingsQuery = useAgentBookingsQuery({ search: cpDebouncedSearch || undefined, enabled: cpOpen })

  const gods = useMemo(() => godsQuery.data ?? [], [godsQuery.data])
  const poojas = useMemo(() => poojasQuery.data ?? [], [poojasQuery.data])
  const nakshatrams = useMemo(() => nakshatramsQuery.data ?? [], [nakshatramsQuery.data])

  const godNameOf = useMemo(() => {
    const names = new Map(gods.map((god) => [god.id, god.name]))
    return (id: number | undefined) => (id === undefined ? '' : (names.get(id) ?? ''))
  }, [gods])

  // ── derived — roster & booking math ──
  const namedPeople = useMemo(() => people.filter((p) => p.name.trim()), [people])

  const nakshatraNameOf = useMemo(() => {
    const names = new Map(nakshatrams.map((n) => [n.id, n.name]))
    return (id: number | null) => (id === null ? '' : (names.get(id) ?? ''))
  }, [nakshatrams])

  const sectionPeople = (line: BookingLine): ReceiptPerson[] =>
    line.peopleIds
      .map((id) => people.find((p) => p.id === id))
      .filter((p): p is BookingPerson => !!p && p.name.trim().length > 0)
      .map((p) => ({ name: p.name.trim(), nakshatram: nakshatraNameOf(p.nakshatramId) }))

  const bookingLines: BookingPanelLine[] = booking.map((line) => ({ line, people: sectionPeople(line) }))
  const orderTotal = booking.reduce((sum, line) => sum + line.base * sectionPeople(line).length * line.dates.length, 0)
  const orderPoojaCount = booking.reduce((sum, line) => sum + sectionPeople(line).length * line.dates.length, 0)
  const bookingValid = booking.length > 0 && booking.every((line) => sectionPeople(line).length > 0)
  const paymentBlocked = booking.length > 0 && !bookingValid
  // The server rejects the whole sale past this, so stop it before the operator pays.
  const overOccurrenceCap = countOccurrences(booking) > MAX_OCCURRENCES_PER_SALE

  /**
   * A god with no poojas is left off the browse row: its chip could only ever
   * lead to an empty list, and a filter that dead-ends reads as a broken till
   * rather than an empty shrine. Most of the temple's gods have none.
   */
  const activeGods = useMemo(
    () => gods.filter((g) => g.status === 'Active' && g.poojasCount > 0),
    [gods],
  )

  /**
   * Both the search and the god chip are the server's — see `usePoojasQuery`.
   * Nothing is filtered here; only the display order is decided locally.
   */
  const matchedPoojas = useMemo(() => poojas.slice().sort((a, b) => a.name.localeCompare(b.name)), [poojas])
  const results = matchedPoojas.slice(0, MAX_RESULTS)

  const cpRows = agentBookingsQuery.data ?? []
  const cpSelected = cpSelId === null ? null : (cpRows.find((b) => b.orderId === cpSelId) ?? null)
  const cpMode: CounterPaymentsMode = cpReceipt ? 'receipt' : cpSelected ? 'detail' : 'list'

  const receiptPages = useMemo(() => (receipt ? buildReceiptPages(receipt, TEMPLE_NAME) : []), [receipt])

  const catalogueError = poojasQuery.isError || godsQuery.isError || nakshatramsQuery.isError
  const isCatalogueLoading = poojasQuery.isPending || godsQuery.isPending || nakshatramsQuery.isPending
  const saleErrorMessage = createSale.isError ? failureMessageForWrite(createSale.error, 'Could not record the sale.') : ''
  const cpErrorMessage = recordPayment.isError
    ? failureMessageForWrite(recordPayment.error, 'Could not record the payment.')
    : agentBookingsQuery.isError
      ? (toFailure(agentBookingsQuery.error)?.message ?? 'Could not load bookings.')
      : ''

  // ── escape closes the topmost open layer ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (receiptOpen) return closeReceipt()
      if (payOpen) return closePay()
      if (config) return setConfig(null)
      if (cpOpen) return closeCp()
      if (browseOpen) setBrowseOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptOpen, payOpen, config, cpOpen, browseOpen])

  // Search the catalogue server-side, but not on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [search])

  // Search the counter-payments list server-side, but not on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setCpDebouncedSearch(cpSearch), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [cpSearch])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => clearTimeout(id)
  }, [toast])

  // ── people roster ──
  function addPerson() {
    setPeople((prev) => [...prev, { id: `P${peopleSeq}`, name: '', nakshatramId: null }])
    setPeopleSeq((n) => n + 1)
  }
  function setPersonName(id: string, value: string) {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, name: value } : p)))
  }
  function setPersonNakshatram(id: string, value: string) {
    const nakshatramId = value === '' ? null : Number(value)
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, nakshatramId } : p)))
  }
  function removePerson(id: string) {
    setPeople((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev))
    setBooking((prev) => prev.map((line) => ({ ...line, peopleIds: line.peopleIds.filter((pid) => pid !== id) })))
  }

  // ── pooja config modal ──
  function openConfigForNew(pooja: Pooja) {
    // A special pooja may only be booked on a published date, so default to the
    // first one rather than today — today is usually not one of them.
    const allowedDates = pooja.isSpecial ? pooja.specialDates.map((d) => d.date) : undefined
    if (allowedDates && allowedDates.length === 0) {
      // Every date would be blocked; opening the dialog would strand the
      // operator in a form they cannot submit.
      setToast(`${pooja.name} has no published dates to book`)
      return
    }
    const firstDate = pooja.isSpecial ? allowedDates?.[0] : todayISO()
    const dates = firstDate ? [firstDate] : []
    const anchor = firstDate ?? todayISO()
    const [year, month] = anchor.split('-').map(Number)

    setConfig({
      editId: null,
      poojaId: pooja.id,
      name: pooja.name,
      godName: godNameOf(pooja.godIds[0]),
      base: priceForDate(pooja, anchor),
      selectedIds: new Set(namedPeople.map((p) => p.id)),
      dates,
      remarks: '',
      calYear: year ?? new Date().getFullYear(),
      calMonth: (month ?? 1) - 1,
      allowedDates,
    })
  }
  function openConfigForEdit(lineId: string) {
    const line = booking.find((b) => b.id === lineId)
    if (!line) return
    const pooja = poojas.find((p) => p.id === line.poojaId)
    const first = line.dates[0] ?? todayISO()
    const [y, m] = first.split('-').map(Number)
    setConfig({
      editId: line.id,
      poojaId: line.poojaId,
      name: line.name,
      godName: line.godName,
      base: line.base,
      selectedIds: new Set(line.peopleIds),
      dates: line.dates.slice(),
      remarks: line.remarks,
      calYear: y ?? new Date().getFullYear(),
      calMonth: (m ?? 1) - 1,
      allowedDates: pooja?.isSpecial ? pooja.specialDates.map((d) => d.date) : undefined,
    })
  }
  function closeConfig() {
    setConfig(null)
  }
  function toggleConfigPerson(personId: string) {
    setConfig((prev) => {
      if (!prev) return prev
      const next = new Set(prev.selectedIds)
      if (next.has(personId)) next.delete(personId)
      else next.add(personId)
      return { ...prev, selectedIds: next }
    })
  }
  function toggleConfigDate(iso: string) {
    setConfig((prev) => {
      if (!prev) return prev
      const has = prev.dates.includes(iso)
      const dates = has ? prev.dates.filter((d) => d !== iso) : [...prev.dates, iso].sort()
      return { ...prev, dates }
    })
  }
  function setConfigRemarks(value: string) {
    setConfig((prev) => (prev ? { ...prev, remarks: value } : prev))
  }
  function calPrev() {
    setConfig((prev) => {
      if (!prev) return prev
      let year = prev.calYear
      let month = prev.calMonth - 1
      if (month < 0) {
        month = 11
        year -= 1
      }
      return { ...prev, calYear: year, calMonth: month }
    })
  }
  function calNext() {
    setConfig((prev) => {
      if (!prev) return prev
      let year = prev.calYear
      let month = prev.calMonth + 1
      if (month > 11) {
        month = 0
        year += 1
      }
      return { ...prev, calYear: year, calMonth: month }
    })
  }
  function saveConfig() {
    if (!config) return
    const peopleIds = namedPeople.filter((p) => config.selectedIds.has(p.id)).map((p) => p.id)
    if (peopleIds.length === 0 || config.dates.length === 0) return
    if (config.editId) {
      const editId = config.editId
      setBooking((prev) =>
        prev.map((line) => (line.id === editId ? { ...line, peopleIds, dates: config.dates.slice(), remarks: config.remarks.trim() } : line)),
      )
    } else {
      const newLine: BookingLine = {
        id: `B${bookingSeq}`,
        poojaId: config.poojaId,
        name: config.name,
        godName: config.godName,
        base: config.base,
        peopleIds,
        dates: config.dates.slice(),
        remarks: config.remarks.trim(),
      }
      setBooking((prev) => [...prev, newLine])
      setBookingSeq((n) => n + 1)
    }
    setConfig(null)
    setSearch('')
    setBrowseGodId(null)
  }
  function removeLine(id: string) {
    setBooking((prev) => prev.filter((line) => line.id !== id))
  }

  // ── take payment / receipt ──
  function openPay() {
    if (!bookingValid || !canSell || overOccurrenceCap) return
    createSale.reset()
    setPayOpen(true)
    setPayMethod('cash')
  }
  function closePay() {
    if (createSale.isPending) return
    setPayOpen(false)
  }
  function confirmPayment() {
    if (!bookingValid || createSale.isPending) return
    const namedIds = new Set(namedPeople.map((p) => p.id))

    createSale.mutate(
      {
        paymentMethod: payMethod,
        // The payer's name and phone have no field on this screen yet.
        customerName: '',
        customerPhone: '',
        people: namedPeople,
        // Drop refs whose name was blanked after the line was configured —
        // the server rejects the whole sale on an unknown person ref.
        lines: booking.map((line) => ({ ...line, peopleIds: line.peopleIds.filter((id) => namedIds.has(id)) })),
      },
      {
        onSuccess: (saved) => {
          // Everything printed comes from the server: receipt number, total, staff.
          setBooking([])
          setPeople([{ id: `P${peopleSeq}`, name: '', nakshatramId: null }])
          setPeopleSeq((n) => n + 1)
          setPayOpen(false)
          setReceipt(saved)
          setReceiptOpen(true)
          setSearch('')
          setBrowseGodId(null)
          setToast(`Sale recorded · ${saved.receiptNo}`)
        },
      },
    )
  }
  function closeReceipt() {
    setReceiptOpen(false)
    setReceipt(null)
  }
  function printReceipt() {
    try {
      window.print()
    } catch {
      /* printing unavailable in this environment */
    }
  }

  // ── counter payments (app agent-code bookings) ──
  function openCp() {
    recordPayment.reset()
    setCpOpen(true)
    setCpSearch('')
    setCpDebouncedSearch('')
    setCpSelId(null)
    setCpMethod('cash')
    setCpReceipt(null)
  }
  function closeCp() {
    if (recordPayment.isPending) return
    setCpOpen(false)
    setCpSelId(null)
    setCpReceipt(null)
  }
  function selectCpRow(orderId: number) {
    recordPayment.reset()
    setCpSelId(orderId)
    setCpMethod('cash')
    setCpReceipt(null)
  }
  function backCp() {
    recordPayment.reset()
    setCpSelId(null)
    setCpReceipt(null)
  }
  function recordCp() {
    if (cpSelId === null || recordPayment.isPending) return
    recordPayment.mutate(
      { orderId: cpSelId, method: cpMethod },
      {
        onSuccess: (saved) => {
          setCpReceipt(saved)
          setToast(`Payment recorded · ${saved.receiptNo}`)
        },
      },
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-3 pt-5">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading tracking-title leading-tight text-ink-strong">Counter Bookings</h1>
          <p className="m-0 mt-1.5 text-sm text-ink-muted">Walk-in pooja bookings, and counter payments for app agent-code bookings.</p>
        </div>
        {canCollect && (
          <Button theme="default" variant="outline" size="md" onClick={openCp} iconLeft={<Icon name="hand-coins" size={16} />}>
            Counter payments
          </Button>
        )}
      </div>

      <KpiBand summary={summaryQuery.data ?? null} isLoading={summaryQuery.isPending} />

      {catalogueError && (
        <div className="flex-shrink-0 px-7 pb-3">
          <Alert type="danger" title="Catalogue unavailable">
            Poojas, gods or nakshatras could not be loaded, so a booking cannot be taken right now. Check the connection and reload.
          </Alert>
        </div>
      )}

      {overOccurrenceCap && (
        <div className="flex-shrink-0 px-7 pb-3">
          <Alert type="warning" title="Too many poojas for one sale">
            This booking is {countOccurrences(booking)} poojas; the limit is {MAX_OCCURRENCES_PER_SALE} per receipt. Split it across two sales.
          </Alert>
        </div>
      )}

      {isCatalogueLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center gap-2.5 text-sm text-ink-subtle">
          <Spinner size={20} />
          Loading catalogue…
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-7 pb-5.5 md:flex-row md:flex-nowrap md:overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3.5 md:overflow-y-auto md:pb-1">
            <PeoplePanel
              people={people}
              nakshatraOptions={nakshatrams.map((n) => ({ value: String(n.id), label: n.name }))}
              onNameChange={setPersonName}
              onNakshatraChange={setPersonNakshatram}
              onRemove={removePerson}
              onAddPerson={addPerson}
            />
            <PoojaSearchPanel
              search={search}
              onSearchChange={setSearch}
              browseOpen={browseOpen}
              onToggleBrowse={() => setBrowseOpen((v) => !v)}
              gods={activeGods}
              browseGodId={browseGodId}
              onSelectGod={(id) => setBrowseGodId((prev) => (prev === id ? null : id))}
              results={results}
              resultCount={matchedPoojas.length}
              searching={poojasQuery.isFetching}
              godNameOf={godNameOf}
              onPick={openConfigForNew}
            />
          </div>

          <BookingPanel
            lines={bookingLines}
            orderTotal={orderTotal}
            orderPoojaCount={orderPoojaCount}
            paymentBlocked={paymentBlocked || overOccurrenceCap || !canSell}
            onEditLine={openConfigForEdit}
            onRemoveLine={removeLine}
            onTakePayment={openPay}
          />
        </div>
      )}

      <PoojaConfigModal
        open={!!config}
        isEdit={!!config?.editId}
        poojaName={config?.name ?? ''}
        godName={config?.godName ?? ''}
        base={config?.base ?? 0}
        namedPeople={namedPeople}
        selectedPersonIds={config?.selectedIds ?? new Set<string>()}
        onTogglePerson={toggleConfigPerson}
        dates={config?.dates ?? []}
        allowedDates={config?.allowedDates}
        onToggleDate={toggleConfigDate}
        calYear={config?.calYear ?? new Date().getFullYear()}
        calMonth={config?.calMonth ?? new Date().getMonth()}
        onPrevMonth={calPrev}
        onNextMonth={calNext}
        remarks={config?.remarks ?? ''}
        onRemarksChange={setConfigRemarks}
        onClose={closeConfig}
        onSave={saveConfig}
      />

      <TakePaymentModal
        open={payOpen}
        total={orderTotal}
        method={payMethod}
        onSelectMethod={setPayMethod}
        onClose={closePay}
        onConfirm={confirmPayment}
        isSubmitting={createSale.isPending}
        errorMessage={saleErrorMessage}
      />

      <Receipt open={receiptOpen} pages={receiptPages} closeLabel="New booking" onClose={closeReceipt} onPrint={printReceipt} />

      <CounterPaymentsModal
        open={cpOpen}
        mode={cpMode}
        search={cpSearch}
        onSearchChange={setCpSearch}
        rows={cpRows}
        selected={cpSelected}
        receipt={cpReceipt}
        method={cpMethod}
        onSelectMethod={setCpMethod}
        onSelectRow={selectCpRow}
        onBack={backCp}
        onClose={closeCp}
        onViewBooking={() => {
          /* navigation to Pooja Bookings is outside this feature's scope */
        }}
        onRecord={recordCp}
        onDone={closeCp}
        onPrint={printReceipt}
        templeName={TEMPLE_NAME}
        isLoading={agentBookingsQuery.isPending}
        isRecording={recordPayment.isPending}
        errorMessage={cpErrorMessage}
      />

      <CounterToast message={toast} />
    </div>
  )
}
