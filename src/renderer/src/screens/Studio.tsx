import { useState } from 'react'
import { INDIAN_STATES, type Settings } from '@shared/types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { saveSettings } from '../store/settingsSlice'
import { fieldClass, labelClass } from '../ui'

export function Studio() {
  const dispatch = useAppDispatch()
  const settings = useAppSelector((state) => state.settings.current)
  const dataPath = useAppSelector((state) => state.settings.dataPath)
  const [form, setForm] = useState<Settings>(settings)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const update = (patch: Partial<Settings>) => {
    setSaved(false)
    setError('')
    setForm((current) => ({ ...current, ...patch }))
  }

  const onSave = async () => {
    setBusy(true)
    setError('')
    const result = await dispatch(saveSettings(form))
    setBusy(false)
    if (saveSettings.rejected.match(result)) {
      setError(result.payload || 'Could not save studio details.')
      setSaved(false)
      return
    }
    setSaved(true)
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-7">
      <p className="text-[11px] uppercase tracking-[0.18em] text-teal">Studio</p>
      <h2 className="mb-8 font-serif text-5xl font-semibold leading-none">
        Details on every <span className="italic text-teal">bill</span>
      </h2>

      <div className="grid max-w-4xl grid-cols-2 gap-x-8 gap-y-5">
        <label className="col-span-2">
          <span className={labelClass}>Legal name</span>
          <input className={fieldClass} value={form.legalName} onChange={(event) => update({ legalName: event.target.value })} />
        </label>
        <label className="col-span-2">
          <span className={labelClass}>Address</span>
          <input className={fieldClass} value={form.address} onChange={(event) => update({ address: event.target.value })} />
        </label>
        <label>
          <span className={labelClass}>City</span>
          <input className={fieldClass} value={form.city} onChange={(event) => update({ city: event.target.value })} />
        </label>
        <label>
          <span className={labelClass}>State</span>
          <select className={fieldClass} value={form.state} onChange={(event) => update({ state: event.target.value })}>
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Email</span>
          <input className={fieldClass} value={form.email} onChange={(event) => update({ email: event.target.value })} />
        </label>
        <label>
          <span className={labelClass}>Phone</span>
          <input className={fieldClass} value={form.phone} onChange={(event) => update({ phone: event.target.value })} />
        </label>
        <label>
          <span className={labelClass}>GSTIN</span>
          <input
            className={fieldClass}
            value={form.gstin}
            maxLength={15}
            placeholder="15 characters"
            onChange={(event) => update({ gstin: event.target.value.toUpperCase() })}
          />
        </label>
        <label>
          <span className={labelClass}>PAN</span>
          <input
            className={fieldClass}
            value={form.pan}
            maxLength={10}
            onChange={(event) => update({ pan: event.target.value.toUpperCase() })}
          />
        </label>
        <label>
          <span className={labelClass}>Invoice prefix</span>
          <input
            className={fieldClass}
            value={form.invoicePrefix}
            onChange={(event) => update({ invoicePrefix: event.target.value.toUpperCase() })}
          />
        </label>
        <label>
          <span className={labelClass}>Next number</span>
          <input
            className={fieldClass}
            inputMode="numeric"
            value={String(form.nextNumber)}
            onChange={(event) => update({ nextNumber: Math.max(1, Number(event.target.value.replace(/\D/g, '')) || 1) })}
          />
        </label>
        <label>
          <span className={labelClass}>Default SAC</span>
          <input className={fieldClass} value={form.defaultSac} onChange={(event) => update({ defaultSac: event.target.value })} />
        </label>
        <label>
          <span className={labelClass}>Website</span>
          <input className={fieldClass} value={form.website} onChange={(event) => update({ website: event.target.value })} />
        </label>
        <label>
          <span className={labelClass}>Bank</span>
          <input className={fieldClass} value={form.bankName} onChange={(event) => update({ bankName: event.target.value })} />
        </label>
        <label>
          <span className={labelClass}>Account name</span>
          <input className={fieldClass} value={form.accountName} onChange={(event) => update({ accountName: event.target.value })} />
        </label>
        <label>
          <span className={labelClass}>Account number</span>
          <input
            className={fieldClass}
            value={form.accountNumber}
            onChange={(event) => update({ accountNumber: event.target.value })}
          />
        </label>
        <label>
          <span className={labelClass}>IFSC</span>
          <input
            className={fieldClass}
            value={form.ifsc}
            onChange={(event) => update({ ifsc: event.target.value.toUpperCase() })}
          />
        </label>
        <label className="col-span-2">
          <span className={labelClass}>UPI</span>
          <input className={fieldClass} value={form.upi} onChange={(event) => update({ upi: event.target.value })} />
        </label>
      </div>

      <p className="mt-6 max-w-2xl text-sm text-mute">
        GSTIN prints on the invoice once you save it here. SAC 998361 is the usual code for advertising services — change it if your accountant uses another one. Same-state clients are billed CGST + SGST. Other states are billed IGST.
      </p>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          disabled={busy}
          className="bg-teal px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
          onClick={() => void onSave()}
        >
          {busy ? 'Saving…' : 'Save studio details'}
        </button>
        {saved && <span className="text-sm text-teal">Saved.</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>

      {dataPath && <p className="mt-8 text-xs text-mute">Bills are stored on this computer: {dataPath}</p>}
    </div>
  )
}
