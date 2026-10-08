import { contextBridge, ipcRenderer } from 'electron'
import type { Bootstrap, Draft, Invoice, PdfResult, PrintResult, SaveResult, Settings } from '../shared/types'

const billing = {
  bootstrap: (): Promise<Bootstrap> => ipcRenderer.invoke('app:bootstrap'),
  saveSettings: (settings: Settings): Promise<Settings> => ipcRenderer.invoke('settings:save', settings),
  saveInvoice: (draft: Draft): Promise<SaveResult> => ipcRenderer.invoke('invoice:save', draft),
  deleteInvoice: (id: string): Promise<Invoice[]> => ipcRenderer.invoke('invoice:delete', id),
  printInvoice: (invoice: Invoice): Promise<PrintResult> => ipcRenderer.invoke('invoice:print', invoice),
  exportPdf: (invoice: Invoice): Promise<PdfResult> => ipcRenderer.invoke('invoice:pdf', invoice)
}

contextBridge.exposeInMainWorld('billing', billing)

export type BillingApi = typeof billing
