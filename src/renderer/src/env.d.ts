import type { Bootstrap, Draft, Invoice, PdfResult, PrintResult, SaveResult, Settings } from '@shared/types'

declare global {
  interface Window {
    billing: {
      bootstrap: () => Promise<Bootstrap>
      saveSettings: (settings: Settings) => Promise<Settings>
      saveInvoice: (draft: Draft) => Promise<SaveResult>
      deleteInvoice: (id: string) => Promise<Invoice[]>
      printInvoice: (invoice: Invoice) => Promise<PrintResult>
      exportPdf: (invoice: Invoice) => Promise<PdfResult>
    }
  }
}

export {}
