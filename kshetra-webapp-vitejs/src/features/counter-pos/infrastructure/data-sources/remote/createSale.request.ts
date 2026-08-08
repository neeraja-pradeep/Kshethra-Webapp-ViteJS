import type { CreateSaleInput } from '@/features/counter-pos/domain/entities/counter-sale'
import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'

/**
 * Wire shape of `POST booking/counter/sales/`.
 *
 * There is deliberately no price field anywhere: the server computes every
 * amount from the catalogue, so a sale cannot be under-charged from the client.
 */
export interface CreateSaleRequestDto {
  readonly payment_method: PaymentMethod
  readonly customer_name: string
  readonly customer_phone: string
  readonly people: readonly {
    readonly ref: string
    readonly name: string
    readonly nakshatram_id?: number
  }[]
  readonly lines: readonly {
    readonly pooja_id: number
    readonly person_refs: readonly string[]
    readonly dates: readonly string[]
    readonly remarks: string
  }[]
}

export function toCreateSaleRequest(input: CreateSaleInput): CreateSaleRequestDto {
  // Only people actually attached to a line are sent — an empty roster row the
  // operator never filled in would be rejected as a blank name.
  const usedRefs = new Set(input.lines.flatMap((line) => line.peopleIds))

  return {
    payment_method: input.paymentMethod,
    customer_name: input.customerName.trim(),
    customer_phone: input.customerPhone.trim(),
    people: input.people
      .filter((person) => usedRefs.has(person.id))
      .map((person) => ({
        ref: person.id,
        name: person.name.trim(),
        ...(person.nakshatramId === null ? {} : { nakshatram_id: person.nakshatramId }),
      })),
    lines: input.lines.map((line) => ({
      pooja_id: line.poojaId,
      person_refs: line.peopleIds,
      dates: line.dates,
      remarks: line.remarks.trim(),
    })),
  }
}
