import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { computeBill, draftItems, nextInvoiceNumber, validateDraft } from '../shared/invoice'
import { isGstRate } from '../shared/money'
import {
  defaultSettings,
  type Draft,
  type Invoice,
  type InvoiceItem,
  type SaveResult,
  type Settings
} from '../shared/types'

function dataDir(): string {
  const folder = app.getPath('userData')
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
  return folder
}

function readJson<T>(name: string): T | null {
  const file = join(dataDir(), name)
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T
  } catch {
    return null
  }
}

function writeJson(name: string, value: unknown): void {
  writeFileSync(join(dataDir(), name), JSON.stringify(value, null, 2), 'utf8')
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function normalizeSettings(input: Partial<Settings> | null | undefined): Settings {
  const source = input ?? {}
  const next: Settings = {
    legalName: text(source.legalName, defaultSettings.legalName).trim() || defaultSettings.legalName,
    address: text(source.address, defaultSettings.address).trim(),
    city: text(source.city, defaultSettings.city).trim(),
    state: text(source.state, defaultSettings.state).trim() || defaultSettings.state,
    email: text(source.email, defaultSettings.email).trim(),
    phone: text(source.phone, defaultSettings.phone).trim(),
    website: text(source.website, defaultSettings.website).trim() || defaultSettings.website,
    gstin: text(source.gstin).toUpperCase().replace(/\s/g, ''),
    pan: text(source.pan).toUpperCase().replace(/\s/g, ''),
    bankName: text(source.bankName).trim(),
    accountName: text(source.accountName, defaultSettings.accountName).trim(),
    accountNumber: text(source.accountNumber).replace(/\s/g, ''),
    ifsc: text(source.ifsc).toUpperCase().replace(/\s/g, ''),
    upi: text(source.upi).trim(),
    invoicePrefix: text(source.invoicePrefix, defaultSettings.invoicePrefix).replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'CS',
    nextNumber: Math.max(1, Math.floor(Number(source.nextNumber) || defaultSettings.nextNumber)),
    defaultSac: text(source.defaultSac, defaultSettings.defaultSac).trim() || defaultSettings.defaultSac
  }
  if (next.gstin && next.gstin.length !== 15) {
    throw new Error('Studio GSTIN should be 15 characters, or leave it blank.')
  }
  return next
}

export function readSettings(): Settings {
  return normalizeSettings(readJson<Partial<Settings>>('settings.json'))
}

export function writeSettings(settings: Settings): Settings {
  const next = normalizeSettings(settings)
  writeJson('settings.json', next)
  return next
}

function sortInvoices(list: Invoice[]): Invoice[] {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function readInvoices(): Invoice[] {
  const list = readJson<Invoice[]>('invoices.json')
  return Array.isArray(list) ? sortInvoices(list) : []
}

export function dataPath(): string {
  return dataDir()
}

function asItems(draft: Draft): InvoiceItem[] {
  return draftItems(draft).map((item) => {
    if (!isGstRate(item.gstRate)) throw new Error('Pick a GST rate of 0, 5, 12, 18, or 28.')
    return item
  })
}

export function saveInvoice(draft: Draft): SaveResult {
  const error = validateDraft(draft)
  if (error) throw new Error(error)

  const settings = readSettings()
  const invoices = readInvoices()
  const existing = draft.id ? invoices.find((invoice) => invoice.id === draft.id) : undefined
  let number = draft.number.trim()
  let nextNumber = settings.nextNumber
  const auto = nextInvoiceNumber(settings, draft.date)
  if (!number) {
    number = auto
    nextNumber += 1
  } else if (!existing && number === auto) {
    nextNumber += 1
  }

  const clash = invoices.find((invoice) => invoice.number === number && invoice.id !== existing?.id)
  if (clash) throw new Error(`Invoice ${number} already exists.`)

  const items = asItems(draft)
  const math = computeBill(items, draft.clientState, settings.state, draft.sac.trim())
  const now = new Date().toISOString()
  const invoice: Invoice = {
    id: existing?.id ?? crypto.randomUUID(),
    number,
    date: draft.date,
    clientName: draft.clientName.trim(),
    clientAddress: draft.clientAddress.trim(),
    clientGstin: draft.clientGstin.trim().toUpperCase(),
    clientState: draft.clientState,
    sac: draft.sac.trim(),
    notes: draft.notes.trim(),
    items,
    taxable: math.taxable,
    tax: math.tax,
    total: math.total,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  }

  const nextInvoices = sortInvoices(
    existing ? invoices.map((item) => (item.id === invoice.id ? invoice : item)) : [invoice, ...invoices]
  )
  const nextSettings = { ...settings, nextNumber }
  writeJson('invoices.json', nextInvoices)
  writeJson('settings.json', nextSettings)
  return { invoice, invoices: nextInvoices, settings: nextSettings }
}

export function deleteInvoice(id: string): Invoice[] {
  const next = readInvoices().filter((invoice) => invoice.id !== id)
  writeJson('invoices.json', next)
  return next
}
