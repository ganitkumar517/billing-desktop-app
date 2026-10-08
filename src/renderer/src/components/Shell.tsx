import { emptyDraft } from '@shared/types'
import { Mark } from './Mark'
import { BillDesk } from '../screens/BillDesk'
import { Ledger } from '../screens/Ledger'
import { Studio } from '../screens/Studio'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { clearNotice, setScreen, startBill, type Screen } from '../store/invoiceSlice'

const NAV: { id: Screen; label: string }[] = [
  { id: 'bill', label: 'Bill' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'studio', label: 'Studio' }
]

export function Shell() {
  const dispatch = useAppDispatch()
  const screen = useAppSelector((state) => state.invoice.screen)
  const notice = useAppSelector((state) => state.invoice.notice)
  const settings = useAppSelector((state) => state.settings.current)

  return (
    <div className="flex h-screen flex-col bg-paper text-ink">
      <header className="flex items-center justify-between gap-6 border-b border-line px-8 py-3">
        <div className="flex items-center gap-4">
          <Mark className="h-20 w-20" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-teal">tlscreativestudio.com</p>
            <h1 className="font-serif text-5xl font-semibold leading-none">
              Billing
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <nav className="flex gap-6 text-sm">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`border-b-2 pb-1 ${
                  screen === item.id ? 'border-teal text-ink' : 'border-transparent text-mute hover:text-teal'
                }`}
                onClick={() => dispatch(setScreen(item.id))}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="bg-teal px-4 py-2 text-sm text-white"
            onClick={() => dispatch(startBill(emptyDraft(settings)))}
          >
            New bill
          </button>
        </div>
      </header>
      <div className="h-1 bg-teal" />
      <main className="min-h-0 flex-1">
        {screen === 'bill' && <BillDesk />}
        {screen === 'ledger' && <Ledger />}
        {screen === 'studio' && <Studio key={`${settings.gstin}-${settings.nextNumber}-${settings.legalName}`} />}
      </main>
      {notice && (
        <div
          className={`flex items-start justify-between gap-6 px-8 py-3 text-sm text-white ${
            notice.kind === 'err' ? 'bg-danger' : 'bg-deep'
          }`}
        >
          <p className="min-w-0 break-all">{notice.text}</p>
          <button type="button" className="shrink-0 underline" onClick={() => dispatch(clearNotice())}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
