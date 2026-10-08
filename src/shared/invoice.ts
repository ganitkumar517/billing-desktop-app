import { amountInWords, isGstRate, paiseToRupees, rupeesToPaise } from './money'
import type { Draft, GstRate, InvoiceItem, Settings } from './types'

export type BillLine = {
  title: string
  sac: string
  gstRate: GstRate
  taxable: number
  gst: number
  total: number
}

export type TaxBreakup = {
  rate: GstRate
  taxable: number
  cgst: number
  sgst: number
  igst: number
}

export type BillMath = {
  lines: BillLine[]
  taxes: TaxBreakup[]
  intraState: boolean
  taxable: number
  tax: number
  total: number
  words: string
}

export type BillView = {
  number: string
  date: string
  clientName: string
  clientAddress: string
  clientGstin: string
  clientState: string
  sac: string
  notes: string
  items: InvoiceItem[]
}

function samePlace(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function draftItems(draft: Pick<Draft, 'items' | 'sac'>): InvoiceItem[] {
  return draft.items
    .filter((item) => item.title.trim() || item.amount.trim())
    .map((item) => ({
      id: item.id,
      title: item.title.trim(),
      amount: Number(item.amount),
      gstRate: item.gstRate
    }))
}

export function validateDraft(draft: Draft): string | null {
  if (!draft.clientName.trim()) return 'Add the client name.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return 'Pick a valid invoice date.'
  if (draft.clientGstin.trim() && draft.clientGstin.replace(/\s/g, '').length !== 15) {
    return 'Client GSTIN should be 15 characters, or leave it blank.'
  }
  const items = draftItems(draft)
  if (items.length === 0) return 'Add a title and an amount.'
  for (const item of items) {
    if (!item.title) return 'Each line needs a title.'
    if (!Number.isFinite(item.amount) || item.amount <= 0) return `Enter a valid amount for “${item.title}”.`
    if (!isGstRate(item.gstRate)) return 'Pick a GST rate of 0, 5, 12, 18, or 28.'
  }
  return null
}

export function computeBill(items: InvoiceItem[], clientState: string, sellerState: string, sac: string): BillMath {
  const intraState = samePlace(clientState || sellerState, sellerState)
  const lines: BillLine[] = []
  const buckets = new Map<GstRate, { taxable: number; cgst: number; sgst: number; igst: number }>()

  for (const item of items) {
    const taxablePaise = rupeesToPaise(item.amount)
    const gstPaise = Math.round((taxablePaise * item.gstRate) / 100)
    const line: BillLine = {
      title: item.title,
      sac,
      gstRate: item.gstRate,
      taxable: paiseToRupees(taxablePaise),
      gst: paiseToRupees(gstPaise),
      total: paiseToRupees(taxablePaise + gstPaise)
    }
    lines.push(line)

    const bucket = buckets.get(item.gstRate) ?? { taxable: 0, cgst: 0, sgst: 0, igst: 0 }
    bucket.taxable += taxablePaise
    if (intraState) {
      const cgst = Math.round(gstPaise / 2)
      bucket.cgst += cgst
      bucket.sgst += gstPaise - cgst
    } else {
      bucket.igst += gstPaise
    }
    buckets.set(item.gstRate, bucket)
  }

  const taxes: TaxBreakup[] = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, bucket]) => ({
      rate,
      taxable: paiseToRupees(bucket.taxable),
      cgst: paiseToRupees(bucket.cgst),
      sgst: paiseToRupees(bucket.sgst),
      igst: paiseToRupees(bucket.igst)
    }))

  const taxablePaise = lines.reduce((sum, line) => sum + rupeesToPaise(line.taxable), 0)
  const taxPaise = taxes.reduce(
    (sum, row) => sum + rupeesToPaise(row.cgst) + rupeesToPaise(row.sgst) + rupeesToPaise(row.igst),
    0
  )
  const total = paiseToRupees(taxablePaise + taxPaise)

  return {
    lines,
    taxes,
    intraState,
    taxable: paiseToRupees(taxablePaise),
    tax: paiseToRupees(taxPaise),
    total,
    words: amountInWords(total)
  }
}

export function viewFromDraft(draft: Draft): BillView {
  const items = draft.items
    .filter((item) => item.title.trim() || item.amount.trim())
    .map((item) => {
      const amount = Number(item.amount)
      return {
        id: item.id,
        title: item.title.trim(),
        amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
        gstRate: item.gstRate
      }
    })

  return {
    number: draft.number.trim(),
    date: draft.date,
    clientName: draft.clientName.trim(),
    clientAddress: draft.clientAddress.trim(),
    clientGstin: draft.clientGstin.trim().toUpperCase(),
    clientState: draft.clientState,
    sac: draft.sac.trim(),
    notes: draft.notes.trim(),
    items
  }
}

export function nextInvoiceNumber(settings: Settings, date: string): string {
  const year = (date || '').slice(0, 4) || String(new Date().getFullYear())
  const prefix = (settings.invoicePrefix || 'CS').replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'CS'
  const serial = String(Math.max(1, settings.nextNumber || 1)).padStart(4, '0')
  return `${prefix}-${year}-${serial}`
}

export function sellerLines(settings: Settings): string[] {
  const cityLine = [settings.city, settings.state].filter(Boolean).join(', ')
  return [settings.address, cityLine, settings.phone, settings.email, settings.website.replace(/^https?:\/\//, '')].filter(
    Boolean
  )
}
