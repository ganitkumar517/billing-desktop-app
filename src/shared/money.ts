const BELOW_TWENTY = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen'
]

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

export function rupeesToPaise(amount: number): number {
  if (!Number.isFinite(amount)) return 0
  return Math.round(amount * 100)
}

export function paiseToRupees(paise: number): number {
  return paise / 100
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function twoDigits(n: number): string {
  if (n < 20) return BELOW_TWENTY[n] ?? ''
  const ten = TENS[Math.floor(n / 10)] ?? ''
  const one = BELOW_TWENTY[n % 10] ?? ''
  return one ? `${ten} ${one}` : ten
}

function threeDigits(n: number): string {
  if (n < 100) return twoDigits(n)
  const hundreds = BELOW_TWENTY[Math.floor(n / 100)] ?? ''
  const rest = n % 100
  return rest ? `${hundreds} Hundred ${twoDigits(rest)}` : `${hundreds} Hundred`
}

function indianNumber(n: number): string {
  if (n === 0) return 'Zero'
  const parts: string[] = []
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const rest = n % 1000
  if (crore) parts.push(`${crore < 100 ? twoDigits(crore) : indianNumber(crore)} Crore`)
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`)
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`)
  if (rest) parts.push(threeDigits(rest))
  return parts.join(' ')
}

export function amountInWords(amount: number): string {
  const paiseTotal = rupeesToPaise(Math.abs(amount))
  const rupees = Math.floor(paiseTotal / 100)
  const paise = paiseTotal % 100
  const rupeeWords = indianNumber(rupees)
  if (paise === 0) return `Indian Rupees ${rupeeWords} Only`
  return `Indian Rupees ${rupeeWords} and ${twoDigits(paise)} Paise Only`
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function isGstRate(value: number): value is 0 | 5 | 12 | 18 | 28 {
  return value === 0 || value === 5 || value === 12 || value === 18 || value === 28
}
