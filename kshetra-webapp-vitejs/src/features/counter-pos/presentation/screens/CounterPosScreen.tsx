import { useEffect, useMemo, useState } from 'react'

import { Button, Icon } from '@/shared/ui'

import type { AgentBooking } from '@/features/counter-pos/domain/entities/agent-booking'
import type { BookingLine, BookingPerson } from '@/features/counter-pos/domain/entities/booking'
import type { CollectionSummary } from '@/features/counter-pos/domain/entities/collection-summary'
import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'
import type { Pooja } from '@/features/counter-pos/domain/entities/pooja'
import type { Transaction, TransactionPerson } from '@/features/counter-pos/domain/entities/transaction'
import { AGENT_BOOKINGS } from '@/features/counter-pos/presentation/data/agent-bookings.mock'
import { COUNTER_STAFF } from '@/features/counter-pos/presentation/data/counter-staff.mock'
import { GODS } from '@/features/counter-pos/presentation/data/gods.mock'
import { NAKSHATRAS } from '@/features/counter-pos/presentation/data/nakshatras.mock'
import { PAYMENT_METHODS } from '@/features/counter-pos/presentation/data/payment-methods.mock'
import { POOJAS } from '@/features/counter-pos/presentation/data/poojas.mock'
import { SEED_NEXT_RECEIPT_NO, SEED_TRANSACTIONS } from '@/features/counter-pos/presentation/data/transactions.mock'
import { nowTimeDisplay, todayDisplay, todayISO } from '@/features/counter-pos/presentation/lib/date'
import { buildReceiptPages } from '@/features/counter-pos/presentation/lib/receipt'
import { BookingPanel } from '@/features/counter-pos/presentation/components/BookingPanel'
import type { BookingPanelLine } from '@/features/counter-pos/presentation/components/BookingPanel'
import { CounterPaymentsModal } from '@/features/counter-pos/presentation/components/CounterPaymentsModal'
import type { CounterPaymentsMode } from '@/features/counter-pos/presentation/components/CounterPaymentsModal'
import { KpiBand } from '@/features/counter-pos/presentation/components/KpiBand'
import { PeoplePanel } from '@/features/counter-pos/presentation/components/PeoplePanel'
import { PoojaConfigModal } from '@/features/counter-pos/presentation/components/PoojaConfigModal'
import { PoojaSearchPanel } from '@/features/counter-pos/presentation/components/PoojaSearchPanel'
import { Receipt } from '@/features/counter-pos/presentation/components/Receipt'
import { TakePaymentModal } from '@/features/counter-pos/presentation/components/TakePaymentModal'

const TEMPLE_NAME = 'Sri Kshetra Devasthanam'
const STAFF_NAME = COUNTER_STAFF[0]?.name ?? 'Ravi Kumar'

interface ConfigState {
  readonly editId: string | null
  readonly poojaId: string
  readonly name: string
  readonly godName: string
  readonly base: number
  readonly selectedIds: ReadonlySet<string>
  readonly dates: readonly string[]
  readonly remarks: string
  readonly calYear: number
  readonly calMonth: number
}

function godNameOf(id: string): string {
  return GODS.find((g) => g.id === id)?.name ?? ''
}

/** Counter Bookings — walk-in pooja sale + billing, and settlement of app agent-code bookings. */
export function CounterPosScreen() {
  const [people, setPeople] = useState<BookingPerson[]>([{ id: 'P1', name: '', nakshatra: '' }])
  const [peopleSeq, setPeopleSeq] = useState(2)
  const [bookingSeq, setBookingSeq] = useState(1)
  const [search, setSearch] = useState('')
  const [browseOpen, setBrowseOpen] = useState(false)
  const [browseGodId, setBrowseGodId] = useState<string | null>(null)
  const [config, setConfig] = useState<ConfigState | null>(null)
  const [booking, setBooking] = useState<BookingLine[]>([])
  const [payOpen, setPayOpen] = useState(false)
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receipt, setReceipt] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS.slice())
  const [nextRcp, setNextRcp] = useState(SEED_NEXT_RECEIPT_NO)

  const [cpOpen, setCpOpen] = useState(false)
  const [cpSearch, setCpSearch] = useState('')
  const [cpSelRef, setCpSelRef] = useState<string | null>(null)
  const [cpMethod, setCpMethod] = useState<PaymentMethod>('Cash')
  const [cpPaid, setCpPaid] = useState(false)
  const [agentBookings, setAgentBookings] = useState<AgentBooking[]>(AGENT_BOOKINGS.slice())

  // ── derived — roster & booking math (recomputed each render, never mirrored into state) ──
  const namedPeople = useMemo(() => people.filter((p) => p.name.trim()), [people])

  const sectionPeople = (line: BookingLine): TransactionPerson[] =>
    line.peopleIds
      .map((id) => people.find((p) => p.id === id))
      .filter((p): p is BookingPerson => !!p && p.name.trim().length > 0)
      .map((p) => ({ name: p.name.trim(), nakshatra: p.nakshatra }))

  const bookingLines: BookingPanelLine[] = booking.map((line) => ({ line, people: sectionPeople(line) }))
  const orderTotal = booking.reduce((sum, line) => sum + line.base * sectionPeople(line).length * line.dates.length, 0)
  const orderPoojaCount = booking.reduce((sum, line) => sum + sectionPeople(line).length * line.dates.length, 0)
  const bookingValid = booking.length > 0 && booking.every((line) => sectionPeople(line).length > 0)
  const paymentBlocked = booking.length > 0 && !bookingValid

  const activeGods = useMemo(() => GODS.filter((g) => g.status === 'Active').slice().sort((a, b) => a.sortOrder - b.sortOrder), [])
  const activePoojas = useMemo(() => POOJAS.filter((p) => p.status === 'Active'), [])

  const matchedPoojas = useMemo(() => {
    let list = activePoojas
    if (browseGodId) list = list.filter((p) => p.godIds.includes(browseGodId))
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q))
    return list.slice().sort((a, b) => a.name.localeCompare(b.name))
  }, [activePoojas, browseGodId, search])
  const results = matchedPoojas.slice(0, 80)

  const collectionSummary: CollectionSummary = useMemo(() => {
    const byMethod = PAYMENT_METHODS.map((method) => ({
      method,
      amount: transactions.filter((t) => t.method === method).reduce((sum, t) => sum + t.total, 0),
    }))
    return {
      totalAmount: transactions.reduce((sum, t) => sum + t.total, 0),
      poojaCount: transactions.reduce((sum, t) => sum + t.poojaCount, 0),
      transactionCount: transactions.length,
      byMethod,
    }
  }, [transactions])

  const cpRows = useMemo(() => {
    const q = cpSearch.trim().toLowerCase()
    return agentBookings
      .filter((b) => !q || `${b.orderRef} ${b.code} ${b.devotee} ${b.phone} ${b.poojaSummary}`.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => Number(a.paid) - Number(b.paid))
  }, [agentBookings, cpSearch])
  const cpSelected = cpSelRef ? (agentBookings.find((b) => b.orderRef === cpSelRef) ?? null) : null
  const cpMode: CounterPaymentsMode = cpSelRef && cpPaid ? 'receipt' : cpSelRef ? 'detail' : 'list'

  const receiptPages = useMemo(() => (receipt ? buildReceiptPages(receipt, TEMPLE_NAME) : []), [receipt])

  // ── escape closes the topmost open layer ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (receiptOpen) return closeReceipt()
      if (payOpen) return setPayOpen(false)
      if (config) return setConfig(null)
      if (cpOpen) return closeCp()
      if (browseOpen) setBrowseOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptOpen, payOpen, config, cpOpen, browseOpen])

  // ── people roster ──
  function addPerson() {
    setPeople((prev) => [...prev, { id: `P${peopleSeq}`, name: '', nakshatra: '' }])
    setPeopleSeq((n) => n + 1)
  }
  function setPersonName(id: string, value: string) {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, name: value } : p)))
  }
  function setPersonNakshatra(id: string, value: string) {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, nakshatra: value as BookingPerson['nakshatra'] } : p)))
  }
  function removePerson(id: string) {
    setPeople((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev))
    setBooking((prev) => prev.map((line) => ({ ...line, peopleIds: line.peopleIds.filter((pid) => pid !== id) })))
  }

  // ── pooja config modal ──
  function openConfigForNew(pooja: Pooja) {
    const now = new Date()
    setConfig({
      editId: null,
      poojaId: pooja.id,
      name: pooja.name,
      godName: godNameOf(pooja.godIds[0] ?? ''),
      base: pooja.offlinePrice,
      selectedIds: new Set(namedPeople.map((p) => p.id)),
      dates: [todayISO()],
      remarks: '',
      calYear: now.getFullYear(),
      calMonth: now.getMonth(),
    })
  }
  function openConfigForEdit(lineId: string) {
    const line = booking.find((b) => b.id === lineId)
    if (!line) return
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
      calYear: y,
      calMonth: (m ?? 1) - 1,
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
    if (bookingValid) {
      setPayOpen(true)
      setPayMethod('Cash')
    }
  }
  function closePay() {
    setPayOpen(false)
  }
  function confirmPayment() {
    if (!bookingValid) return
    const devotees: TransactionPerson[] = namedPeople.map((p) => ({ name: p.name.trim(), nakshatra: p.nakshatra }))
    const items = booking.map((line) => {
      const ppl = sectionPeople(line)
      return {
        name: line.name,
        god: line.godName,
        dates: line.dates.slice(),
        peopleCount: ppl.length,
        count: ppl.length * line.dates.length,
        amount: line.base * ppl.length * line.dates.length,
        base: line.base,
        people: ppl,
        remarks: line.remarks,
      }
    })
    const total = items.reduce((sum, it) => sum + it.amount, 0)
    const txn: Transaction = {
      rcp: `RCP-${nextRcp}`,
      time: nowTimeDisplay(),
      date: todayDisplay(),
      devotees,
      items,
      total,
      method: payMethod,
      staff: STAFF_NAME,
      poojaCount: items.reduce((sum, it) => sum + it.count, 0),
    }
    setTransactions((prev) => [txn, ...prev])
    setNextRcp((n) => n + 1)
    setBooking([])
    setPeople([{ id: `P${peopleSeq}`, name: '', nakshatra: '' }])
    setPeopleSeq((n) => n + 1)
    setPayOpen(false)
    setReceipt(txn)
    setReceiptOpen(true)
    setSearch('')
    setBrowseGodId(null)
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
    setCpOpen(true)
    setCpSearch('')
    setCpSelRef(null)
    setCpMethod('Cash')
    setCpPaid(false)
  }
  function closeCp() {
    setCpOpen(false)
    setCpSelRef(null)
    setCpPaid(false)
  }
  function selectCpRow(orderRef: string) {
    setCpSelRef(orderRef)
    setCpMethod('Cash')
    setCpPaid(false)
  }
  function backCp() {
    setCpSelRef(null)
    setCpPaid(false)
  }
  function recordCp() {
    if (!cpSelRef) return
    const method = cpMethod
    setAgentBookings((prev) => prev.map((b) => (b.orderRef === cpSelRef ? { ...b, paid: true, method } : b)))
    setCpPaid(true)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-3 pt-5">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading tracking-title leading-tight text-ink-strong">Counter Bookings</h1>
          <p className="m-0 mt-1.5 text-sm text-ink-muted">Walk-in pooja bookings, and counter payments for app agent-code bookings.</p>
        </div>
        <Button theme="default" variant="outline" size="md" onClick={openCp} iconLeft={<Icon name="hand-coins" size={16} />}>
          Counter payments
        </Button>
      </div>

      <KpiBand summary={collectionSummary} />

      <div className="flex min-h-0 flex-1 flex-wrap gap-4 overflow-y-auto px-7 pb-5.5">
        <div className="flex min-h-0 min-w-0 flex-[1_1_300px] flex-col gap-3.5">
          <PeoplePanel
            people={people}
            nakshatraOptions={NAKSHATRAS.map((n) => ({ value: n, label: n }))}
            onNameChange={setPersonName}
            onNakshatraChange={setPersonNakshatra}
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
            godNameOf={godNameOf}
            onPick={openConfigForNew}
          />
        </div>

        <BookingPanel
          lines={bookingLines}
          orderTotal={orderTotal}
          orderPoojaCount={orderPoojaCount}
          paymentBlocked={paymentBlocked}
          onEditLine={openConfigForEdit}
          onRemoveLine={removeLine}
          onTakePayment={openPay}
        />
      </div>

      <PoojaConfigModal
        open={!!config}
        isEdit={!!config?.editId}
        poojaName={config?.name ?? ''}
        godName={config?.godName ?? ''}
        base={config?.base ?? 0}
        namedPeople={namedPeople}
        selectedPersonIds={config?.selectedIds ?? new Set()}
        onTogglePerson={toggleConfigPerson}
        dates={config?.dates ?? []}
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

      <TakePaymentModal open={payOpen} total={orderTotal} method={payMethod} onSelectMethod={setPayMethod} onClose={closePay} onConfirm={confirmPayment} />

      <Receipt open={receiptOpen} pages={receiptPages} closeLabel="New booking" onClose={closeReceipt} onPrint={printReceipt} />

      <CounterPaymentsModal
        open={cpOpen}
        mode={cpMode}
        search={cpSearch}
        onSearchChange={setCpSearch}
        rows={cpRows}
        selected={cpSelected}
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
      />
    </div>
  )
}
