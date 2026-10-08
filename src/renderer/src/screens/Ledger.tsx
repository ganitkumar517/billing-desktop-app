import { useState } from 'react'
import { formatDate, formatInr } from '@shared/money'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { exportStoredPdf, openInvoice, printStored, removeInvoice } from '../store/invoiceSlice'
import { fieldClass } from '../ui'

export function Ledger() {
  const dispatch = useAppDispatch()
  const invoices = useAppSelector((state) => state.invoice.invoices)
  const pending = useAppSelector((state) => state.invoice.pending)
  const [query, setQuery] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const needle = query.trim().toLowerCase()
  const rows = invoices.filter((invoice) => {
    if (!needle) return true
    return `${invoice.number} ${invoice.clientName}`.toLowerCase().includes(needle)
  })

  return (
    <div className="h-full overflow-y-auto px-8 py-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-teal">Ledger</p>
          <h2 className="font-serif text-5xl font-semibold leading-none">
            Saved <span className="italic text-teal">bills</span>
          </h2>
        </div>
        <input
          className={`${fieldClass} w-72`}
          value={query}
          placeholder="Search client or number"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {rows.length === 0 ? (
        <p className="mt-16 max-w-md text-lg text-mute">
          {invoices.length === 0
            ? 'No bills yet. Write the first one on the desk, then print or export the PDF.'
            : 'Nothing matches that search.'}
        </p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.14em] text-mute">
              <th className="border-b border-line py-3 font-medium">Number</th>
              <th className="border-b border-line py-3 font-medium">Date</th>
              <th className="border-b border-line py-3 font-medium">Client</th>
              <th className="border-b border-line py-3 text-right font-medium">Total</th>
              <th className="border-b border-line py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((invoice) => (
              <tr key={invoice.id} className="border-b border-line">
                <td className="py-4 pr-4 font-medium">{invoice.number}</td>
                <td className="py-4 pr-4 text-mute">{formatDate(invoice.date)}</td>
                <td className="py-4 pr-4">{invoice.clientName}</td>
                <td className="py-4 pr-4 text-right tabular-nums">{formatInr(invoice.total)}</td>
                <td className="py-4 text-right">
                  <div className="flex justify-end gap-3 text-sm">
                    <button type="button" className="text-teal" onClick={() => dispatch(openInvoice(invoice))}>
                      Open
                    </button>
                    <button
                      type="button"
                      disabled={pending !== null}
                      className="disabled:opacity-40"
                      onClick={() => void dispatch(exportStoredPdf(invoice))}
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      disabled={pending !== null}
                      className="disabled:opacity-40"
                      onClick={() => void dispatch(printStored(invoice))}
                    >
                      Print
                    </button>
                    {confirming === invoice.id ? (
                      <button
                        type="button"
                        className="text-danger"
                        onClick={() => {
                          setConfirming(null)
                          void dispatch(removeInvoice(invoice.id))
                        }}
                      >
                        Confirm delete
                      </button>
                    ) : (
                      <button type="button" className="text-mute hover:text-danger" onClick={() => setConfirming(invoice.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
