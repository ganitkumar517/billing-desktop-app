export const GST_RATES = [0, 5, 12, 18, 28] as const

export type GstRate = (typeof GST_RATES)[number]

export type DraftItem = {
  id: string
  title: string
  amount: string
  gstRate: GstRate
}

export type Draft = {
  id: string | null
  number: string
  date: string
  clientName: string
  clientAddress: string
  clientGstin: string
  clientState: string
  sac: string
  notes: string
  items: DraftItem[]
}

export type InvoiceItem = {
  id: string
  title: string
  amount: number
  gstRate: GstRate
}

export type Invoice = {
  id: string
  number: string
  date: string
  clientName: string
  clientAddress: string
  clientGstin: string
  clientState: string
  sac: string
  notes: string
  items: InvoiceItem[]
  taxable: number
  tax: number
  total: number
  createdAt: string
  updatedAt: string
}

export type Settings = {
  legalName: string
  address: string
  city: string
  state: string
  email: string
  phone: string
  website: string
  gstin: string
  pan: string
  bankName: string
  accountName: string
  accountNumber: string
  ifsc: string
  upi: string
  invoicePrefix: string
  nextNumber: number
  defaultSac: string
}

export type Bootstrap = {
  settings: Settings
  invoices: Invoice[]
  dataPath: string
}

export type SaveResult = {
  invoice: Invoice
  invoices: Invoice[]
  settings: Settings
}

export type PdfResult =
  | { ok: true; path: string }
  | { ok: false; canceled?: boolean; error?: string }

export type PrintResult = { ok: true } | { ok: false; canceled?: boolean; error?: string }

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
] as const

export const SERVICES = [
  'Brand Identity',
  'Website & Digital',
  'Performance Marketing',
  'SEO & Growth',
  'Social Media',
  'Print & Packaging',
  'Film & Commercial Production',
  'PR & Brand Communications',
  'Custom Apps & Software'
] as const

export const defaultSettings: Settings = {
  legalName: 'Creative Studio by TLS Group',
  address: '605A, Welldone Techpark, Sector 48',
  city: 'Gurugram',
  state: 'Haryana',
  email: 'info@tlscreativestudio.com',
  phone: '+91 96501 65005',
  website: 'https://tlscreativestudio.com',
  gstin: '',
  pan: '',
  bankName: '',
  accountName: 'Creative Studio by TLS Group',
  accountNumber: '',
  ifsc: '',
  upi: '',
  invoicePrefix: 'CS',
  nextNumber: 1,
  defaultSac: '998361'
}

export function todayISO(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function emptyDraft(settings: Settings = defaultSettings): Draft {
  return {
    id: null,
    number: '',
    date: todayISO(),
    clientName: '',
    clientAddress: '',
    clientGstin: '',
    clientState: settings.state || 'Haryana',
    sac: settings.defaultSac || '998361',
    notes: '',
    items: [
      {
        id: crypto.randomUUID(),
        title: '',
        amount: '',
        gstRate: 18
      }
    ]
  }
}
