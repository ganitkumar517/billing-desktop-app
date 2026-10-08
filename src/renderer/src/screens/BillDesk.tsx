import { useEffect, useMemo } from 'react'
import { renderInvoiceHtml } from '@shared/document'
import { computeBill, viewFromDraft } from '@shared/invoice'
import { formatInr } from '@shared/money'
import { GST_RATES, INDIAN_STATES, SERVICES, type GstRate } from '@shared/types'
import { Preview } from '../components/Preview'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  addItem,
  exportDraftPdf,
  patchDraft,
  persistDraft,
  printDraft,
  removeItem,
  setItem,
  useService
} from '../store/invoiceSlice'
import { fieldClass, labelClass } from '../ui'

export function BillDesk() {
  const dispatch = useAppDispatch()
  const draft = useAppSelector((state) => state.invoice.draft)
  const pending = useAppSelector((state) => state.invoice.pending)
  const settings = useAppSelector((state) => state.settings.current)
  const view = useMemo(() => viewFromDraft(draft), [draft])
  const html = useMemo(() => renderInvoiceHtml(view, settings), [view, settings])
  const math = useMemo(
    () =>
      computeBill(
        view.items.filter((item) => item.amount > 0),
        draft.clientState,
        settings.state,
        draft.sac
      ),
    [view, draft.clientState, draft.sac, settings.state]
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || pending) return
      const key = event.key.toLowerCase()
      if (key === 'p') {
        event.preventDefault()
        void dispatch(printDraft())
      }
      if (key === 's') {
        event.preventDefault()
        void dispatch(persistDraft())
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, pending])

  const busy = pending !== null

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(420px,520px)_minmax(0,1fr)]">
      <section className="flex min-h-0 flex-col border-r border-line bg-paper">
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className={labelClass}>Bill</p>
              <h2 className="font-serif text-5xl font-semibold leading-none">
                {draft.id ? 'Edit' : 'New'} <span className="italic text-teal">invoice</span>
              </h2>
            </div>
            <p className="pb-1 text-right text-xs text-mute">
              {draft.number || 'Number assigned on save'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <label className="col-span-2">
              <span className={labelClass}>Client</span>
              <input
                className={fieldClass}
                value={draft.clientName}
                placeholder="Client or company"
                onChange={(event) => dispatch(patchDraft({ clientName: event.target.value }))}
              />
            </label>
            <label>
              <span className={labelClass}>Invoice date</span>
              <input
                type="date"
                className={fieldClass}
                value={draft.date}
                onChange={(event) => dispatch(patchDraft({ date: event.target.value }))}
              />
            </label>
            <label>
              <span className={labelClass}>State</span>
              <select
                className={fieldClass}
                value={draft.clientState}
                onChange={(event) => dispatch(patchDraft({ clientState: event.target.value }))}
              >
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Client GSTIN</span>
              <input
                className={fieldClass}
                value={draft.clientGstin}
                placeholder="Optional"
                maxLength={15}
                onChange={(event) => dispatch(patchDraft({ clientGstin: event.target.value.toUpperCase() }))}
              />
            </label>
            <label>
              <span className={labelClass}>Invoice no.</span>
              <input
                className={fieldClass}
                value={draft.number}
                placeholder="Auto"
                onChange={(event) => dispatch(patchDraft({ number: event.target.value.toUpperCase() }))}
              />
            </label>
            <label className="col-span-2">
              <span className={labelClass}>Address</span>
              <textarea
                className={`${fieldClass} min-h-16 resize-none`}
                value={draft.clientAddress}
                placeholder="Optional"
                onChange={(event) => dispatch(patchDraft({ clientAddress: event.target.value }))}
              />
            </label>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <p className={labelClass}>Title, amount, GST</p>
              <button
                type="button"
                className="text-sm text-teal"
                onClick={() =>
                  dispatch(
                    addItem({
                      id: crypto.randomUUID(),
                      title: '',
                      amount: '',
                      gstRate: 18
                    })
                  )
                }
              >
                Add line
              </button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {SERVICES.map((service) => (
                <button
                  key={service}
                  type="button"
                  className="border border-ink/10 bg-white px-2 py-1 text-[11px] tracking-wide text-ink/80 hover:border-teal hover:text-teal"
                  onClick={() => dispatch(useService({ id: crypto.randomUUID(), title: service }))}
                >
                  {service}
                </button>
              ))}
            </div>
            <div className="space-y-5">
              {draft.items.map((item, index) => (
                <div key={item.id} className="border border-ink/10 bg-white px-3 py-3">
                  <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-mute">
                    <span>Line {index + 1}</span>
                    <button type="button" className="hover:text-danger" onClick={() => dispatch(removeItem(item.id))}>
                      Remove
                    </button>
                  </div>
                  <input
                    className={fieldClass}
                    value={item.title}
                    placeholder="Title"
                    onChange={(event) => dispatch(setItem({ id: item.id, patch: { title: event.target.value } }))}
                  />
                  <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3">
                    <label>
                      <span className={labelClass}>Amount</span>
                      <input
                        className={fieldClass}
                        inputMode="decimal"
                        value={item.amount}
                        placeholder="0.00"
                        onChange={(event) => {
                          const cleaned = event.target.value.replace(/[^\d.]/g, '')
                          const [whole, fraction] = cleaned.split('.')
                          const amount = fraction === undefined ? whole : `${whole}.${fraction.slice(0, 2)}`
                          dispatch(setItem({ id: item.id, patch: { amount } }))
                        }}
                      />
                    </label>
                    <div>
                      <span className={labelClass}>GST</span>
                      <div className="flex">
                        {GST_RATES.map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            className={`px-2 py-2 text-xs ${
                              item.gstRate === rate ? 'bg-teal text-white' : 'text-ink/50 hover:text-teal'
                            }`}
                            onClick={() => dispatch(setItem({ id: item.id, patch: { gstRate: rate as GstRate } }))}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[140px_1fr] gap-4">
            <label>
              <span className={labelClass}>SAC</span>
              <input
                className={fieldClass}
                value={draft.sac}
                onChange={(event) => dispatch(patchDraft({ sac: event.target.value }))}
              />
            </label>
            <label>
              <span className={labelClass}>Notes</span>
              <input
                className={fieldClass}
                value={draft.notes}
                placeholder="Optional"
                onChange={(event) => dispatch(patchDraft({ notes: event.target.value }))}
              />
            </label>
          </div>
        </div>

        <div className="border-t border-line px-7 py-4">
          {!settings.gstin && math.tax > 0 && (
            <p className="mb-3 text-sm text-teal">Add the studio GSTIN in Studio before issuing this tax invoice.</p>
          )}
          <div className="mb-3 flex items-end justify-between gap-4">
            <div className="text-sm text-mute">
              <div>Taxable {formatInr(math.taxable)}</div>
              <div>GST {formatInr(math.tax)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.16em] text-mute">Total</div>
              <div className="font-display text-5xl leading-none tracking-wide text-teal">{formatInr(math.total)}</div>
            </div>
          </div>
          {math.total > 0 && <p className="mb-4 text-xs leading-relaxed text-mute">{math.words}</p>}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={busy}
              className="border border-teal px-3 py-3 text-sm text-teal disabled:opacity-40"
              onClick={() => void dispatch(persistDraft())}
            >
              {pending === 'save' ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              disabled={busy}
              className="border border-teal px-3 py-3 text-sm text-teal disabled:opacity-40"
              onClick={() => void dispatch(exportDraftPdf())}
            >
              {pending === 'pdf' ? 'Exporting…' : 'Export PDF'}
            </button>
            <button
              type="button"
              disabled={busy}
              className="bg-teal px-3 py-3 text-sm font-medium text-white disabled:opacity-40"
              onClick={() => void dispatch(printDraft())}
            >
              {pending === 'print' ? 'Printing…' : 'Print'}
            </button>
          </div>
        </div>
      </section>
      <Preview html={html} />
    </div>
  )
}
