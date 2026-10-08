import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { validateDraft } from '@shared/invoice'
import { emptyDraft, type Draft, type DraftItem, type Invoice, type SaveResult } from '@shared/types'

type DeskState = { invoice: { draft: Draft } }

export type Notice = { kind: 'ok' | 'err'; text: string } | null
export type Screen = 'bill' | 'ledger' | 'studio'
export type Pending = 'save' | 'print' | 'pdf' | null

export type DeskResult = SaveResult & {
  action: 'save' | 'print' | 'pdf'
  canceled?: boolean
  pdfPath?: string
  error?: string
}

type InvoiceState = {
  status: 'idle' | 'loading' | 'ready' | 'failed'
  bootError: string
  screen: Screen
  draft: Draft
  invoices: Invoice[]
  pending: Pending
  notice: Notice
}

const initialState: InvoiceState = {
  status: 'idle',
  bootError: '',
  screen: 'bill',
  draft: emptyDraft(),
  invoices: [],
  pending: null,
  notice: null
}

function failureText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

async function storeDraft(draft: Draft): Promise<SaveResult> {
  const error = validateDraft(draft)
  if (error) throw new Error(error)
  return window.billing.saveInvoice(draft)
}

export const bootstrap = createAsyncThunk('app/bootstrap', () => window.billing.bootstrap())

export const persistDraft = createAsyncThunk<DeskResult, void, { state: DeskState; rejectValue: string }>(
  'invoice/save',
  async (_, { getState, rejectWithValue }) => {
    try {
      const saved = await storeDraft(getState().invoice.draft)
      return { ...saved, action: 'save' }
    } catch (error) {
      return rejectWithValue(failureText(error, 'Could not save the bill.'))
    }
  }
)

export const printDraft = createAsyncThunk<DeskResult, void, { state: DeskState; rejectValue: string }>(
  'invoice/print',
  async (_, { getState, rejectWithValue }) => {
    try {
      const saved = await storeDraft(getState().invoice.draft)
      const printed = await window.billing.printInvoice(saved.invoice)
      if (!printed.ok && printed.canceled) return { ...saved, action: 'print', canceled: true }
      if (!printed.ok) return { ...saved, action: 'print', error: printed.error || 'Print failed.' }
      return { ...saved, action: 'print' }
    } catch (error) {
      return rejectWithValue(failureText(error, 'Could not print the bill.'))
    }
  }
)

export const exportDraftPdf = createAsyncThunk<DeskResult, void, { state: DeskState; rejectValue: string }>(
  'invoice/pdf',
  async (_, { getState, rejectWithValue }) => {
    try {
      const saved = await storeDraft(getState().invoice.draft)
      const pdf = await window.billing.exportPdf(saved.invoice)
      if (!pdf.ok && pdf.canceled) return { ...saved, action: 'pdf', canceled: true }
      if (!pdf.ok) return { ...saved, action: 'pdf', error: pdf.error || 'Could not create the PDF.' }
      return { ...saved, action: 'pdf', pdfPath: pdf.path }
    } catch (error) {
      return rejectWithValue(failureText(error, 'Could not export the PDF.'))
    }
  }
)

export const printStored = createAsyncThunk<
  { number: string; canceled?: boolean },
  Invoice,
  { rejectValue: string }
>('invoice/print-stored', async (invoice, { rejectWithValue }) => {
  try {
    const printed = await window.billing.printInvoice(invoice)
    if (!printed.ok && !printed.canceled) return rejectWithValue(printed.error || 'Print failed.')
    return { number: invoice.number, canceled: !printed.ok }
  } catch (error) {
    return rejectWithValue(failureText(error, 'Could not print the bill.'))
  }
})

export const exportStoredPdf = createAsyncThunk<
  { number: string; path?: string; canceled?: boolean },
  Invoice,
  { rejectValue: string }
>('invoice/pdf-stored', async (invoice, { rejectWithValue }) => {
  try {
    const pdf = await window.billing.exportPdf(invoice)
    if (!pdf.ok && !pdf.canceled) return rejectWithValue(pdf.error || 'Could not create the PDF.')
    return { number: invoice.number, path: pdf.ok ? pdf.path : undefined, canceled: !pdf.ok }
  } catch (error) {
    return rejectWithValue(failureText(error, 'Could not export the PDF.'))
  }
})

export const removeInvoice = createAsyncThunk<Invoice[], string, { rejectValue: string }>(
  'invoice/delete',
  async (id, { rejectWithValue }) => {
    try {
      return await window.billing.deleteInvoice(id)
    } catch (error) {
      return rejectWithValue(failureText(error, 'Could not delete that bill.'))
    }
  }
)

function applyDesk(state: InvoiceState, action: { payload: DeskResult }): void {
  const result = action.payload
  state.draft.id = result.invoice.id
  state.draft.number = result.invoice.number
  state.draft.clientGstin = result.invoice.clientGstin
  state.invoices = result.invoices
  state.pending = null
  if (result.error) {
    state.notice = { kind: 'err', text: `Saved ${result.invoice.number}. ${result.error}` }
    return
  }
  if (result.canceled) {
    state.notice = {
      kind: 'ok',
      text:
        result.action === 'pdf'
          ? `Saved ${result.invoice.number}. PDF export was canceled.`
          : `Saved ${result.invoice.number}. Print was canceled.`
    }
    return
  }
  if (result.action === 'print') {
    state.notice = { kind: 'ok', text: `Sent ${result.invoice.number} to the printer.` }
    return
  }
  if (result.action === 'pdf') {
    state.notice = { kind: 'ok', text: `PDF saved · ${result.pdfPath}` }
    return
  }
  state.notice = { kind: 'ok', text: `Saved ${result.invoice.number}.` }
}

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    setScreen(state, action: PayloadAction<Screen>) {
      state.screen = action.payload
    },
    clearNotice(state) {
      state.notice = null
    },
    patchDraft(state, action: PayloadAction<Partial<Omit<Draft, 'items' | 'id'>>>) {
      Object.assign(state.draft, action.payload)
    },
    setItem(state, action: PayloadAction<{ id: string; patch: Partial<Omit<DraftItem, 'id'>> }>) {
      const item = state.draft.items.find((line) => line.id === action.payload.id)
      if (item) Object.assign(item, action.payload.patch)
    },
    addItem(state, action: PayloadAction<DraftItem>) {
      state.draft.items.push(action.payload)
    },
    removeItem(state, action: PayloadAction<string>) {
      if (state.draft.items.length === 1) {
        state.draft.items[0].title = ''
        state.draft.items[0].amount = ''
        state.draft.items[0].gstRate = 18
        return
      }
      state.draft.items = state.draft.items.filter((item) => item.id !== action.payload)
    },
    useService(state, action: PayloadAction<{ id: string; title: string }>) {
      const blank = state.draft.items.find((item) => !item.title.trim())
      if (blank) blank.title = action.payload.title
      else {
        state.draft.items.push({
          id: action.payload.id,
          title: action.payload.title,
          amount: '',
          gstRate: 18
        })
      }
    },
    startBill(state, action: PayloadAction<Draft>) {
      state.draft = action.payload
      state.screen = 'bill'
      state.notice = null
    },
    openInvoice(state, action: PayloadAction<Invoice>) {
      const invoice = action.payload
      state.draft = {
        id: invoice.id,
        number: invoice.number,
        date: invoice.date,
        clientName: invoice.clientName,
        clientAddress: invoice.clientAddress,
        clientGstin: invoice.clientGstin,
        clientState: invoice.clientState,
        sac: invoice.sac,
        notes: invoice.notes,
        items: invoice.items.map((item) => ({
          id: item.id,
          title: item.title,
          amount: String(item.amount),
          gstRate: item.gstRate
        }))
      }
      state.screen = 'bill'
      state.notice = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrap.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(bootstrap.fulfilled, (state, action) => {
        const fresh =
          !state.draft.clientName &&
          !state.draft.number &&
          state.draft.items.every((item) => !item.title.trim() && !item.amount.trim())
        state.status = 'ready'
        state.invoices = action.payload.invoices
        if (fresh) state.draft = emptyDraft(action.payload.settings)
      })
      .addCase(bootstrap.rejected, (state, action) => {
        state.status = 'failed'
        state.bootError = action.error.message || 'Could not open the billing desk.'
      })
      .addCase(persistDraft.pending, (state) => {
        state.pending = 'save'
      })
      .addCase(printDraft.pending, (state) => {
        state.pending = 'print'
      })
      .addCase(exportDraftPdf.pending, (state) => {
        state.pending = 'pdf'
      })
      .addCase(printStored.pending, (state) => {
        state.pending = 'print'
      })
      .addCase(exportStoredPdf.pending, (state) => {
        state.pending = 'pdf'
      })
      .addCase(persistDraft.fulfilled, applyDesk)
      .addCase(printDraft.fulfilled, applyDesk)
      .addCase(exportDraftPdf.fulfilled, applyDesk)
      .addCase(persistDraft.rejected, (state, action) => {
        state.pending = null
        state.notice = { kind: 'err', text: action.payload || 'Could not save the bill.' }
      })
      .addCase(printDraft.rejected, (state, action) => {
        state.pending = null
        state.notice = { kind: 'err', text: action.payload || 'Could not print the bill.' }
      })
      .addCase(exportDraftPdf.rejected, (state, action) => {
        state.pending = null
        state.notice = { kind: 'err', text: action.payload || 'Could not export the PDF.' }
      })
      .addCase(printStored.fulfilled, (state, action) => {
        state.pending = null
        state.notice = action.payload.canceled
          ? { kind: 'ok', text: `Print canceled for ${action.payload.number}.` }
          : { kind: 'ok', text: `Sent ${action.payload.number} to the printer.` }
      })
      .addCase(exportStoredPdf.fulfilled, (state, action) => {
        state.pending = null
        state.notice = action.payload.canceled
          ? { kind: 'ok', text: `PDF export canceled for ${action.payload.number}.` }
          : { kind: 'ok', text: `PDF saved · ${action.payload.path}` }
      })
      .addCase(printStored.rejected, (state, action) => {
        state.pending = null
        state.notice = { kind: 'err', text: action.payload || 'Could not print the bill.' }
      })
      .addCase(exportStoredPdf.rejected, (state, action) => {
        state.pending = null
        state.notice = { kind: 'err', text: action.payload || 'Could not export the PDF.' }
      })
      .addCase(removeInvoice.fulfilled, (state, action) => {
        const removed = state.invoices.find((invoice) => !action.payload.some((item) => item.id === invoice.id))
        state.invoices = action.payload
        if (removed && state.draft.id === removed.id) {
          state.draft.id = null
          state.draft.number = ''
        }
        state.notice = { kind: 'ok', text: removed ? `Deleted ${removed.number}.` : 'Bill deleted.' }
      })
      .addCase(removeInvoice.rejected, (state, action) => {
        state.notice = { kind: 'err', text: action.payload || 'Could not delete that bill.' }
      })
  }
})

export const {
  setScreen,
  clearNotice,
  patchDraft,
  setItem,
  addItem,
  removeItem,
  useService,
  startBill,
  openInvoice
} = invoiceSlice.actions

export default invoiceSlice.reducer
