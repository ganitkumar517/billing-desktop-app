import { logoDataUri } from './logo'
import { computeBill, sellerLines } from './invoice'
import type { BillView } from './invoice'
import { escapeHtml, formatDate, formatInr } from './money'
import type { Settings } from './types'

function rateLabel(rate: number): string {
  return Number.isInteger(rate) ? String(rate) : String(rate)
}

export function renderInvoiceHtml(bill: BillView, settings: Settings): string {
  const math = computeBill(
    bill.items.length
      ? bill.items
      : [{ id: 'blank', title: '', amount: 0, gstRate: 18 }],
    bill.clientState,
    settings.state,
    bill.sac
  )
  const taxInvoice = math.tax > 0
  const cityLine = [settings.city, settings.state].filter(Boolean).join(', ')
  const from = sellerLines(settings)
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join('')

  const itemRows = (bill.items.length ? math.lines : []).map((line, index) => {
    return `<tr>
      <td class="idx">${index + 1}</td>
      <td>
        <div class="title">${escapeHtml(line.title)}</div>
        ${line.sac ? `<div class="sac">SAC ${escapeHtml(line.sac)}</div>` : ''}
      </td>
      <td class="num">${formatInr(line.taxable)}</td>
      <td class="num">${line.gstRate}%</td>
      <td class="num">${formatInr(line.gst)}</td>
      <td class="num strong">${formatInr(line.total)}</td>
    </tr>`
  })

  if (itemRows.length === 0) {
    itemRows.push(`<tr>
      <td class="idx">1</td>
      <td class="muted">Title</td>
      <td class="num muted">—</td>
      <td class="num muted">18%</td>
      <td class="num muted">—</td>
      <td class="num muted">—</td>
    </tr>`)
  }

  const taxRows = math.taxes
    .filter((row) => row.cgst + row.sgst + row.igst > 0)
    .flatMap((row) => {
      if (math.intraState) {
        const half = row.rate / 2
        return [
          `<div class="sum"><span>CGST ${rateLabel(half)}%</span><span>${formatInr(row.cgst)}</span></div>`,
          `<div class="sum"><span>SGST ${rateLabel(half)}%</span><span>${formatInr(row.sgst)}</span></div>`
        ]
      }
      return [`<div class="sum"><span>IGST ${rateLabel(row.rate)}%</span><span>${formatInr(row.igst)}</span></div>`]
    })
    .join('')

  const bankBits = [
    settings.bankName ? `<div><span>Bank</span> ${escapeHtml(settings.bankName)}</div>` : '',
    settings.accountName ? `<div><span>Name</span> ${escapeHtml(settings.accountName)}</div>` : '',
    settings.accountNumber ? `<div><span>A/c</span> ${escapeHtml(settings.accountNumber)}</div>` : '',
    settings.ifsc ? `<div><span>IFSC</span> ${escapeHtml(settings.ifsc)}</div>` : '',
    settings.upi ? `<div><span>UPI</span> ${escapeHtml(settings.upi)}</div>` : ''
  ].filter(Boolean)

  const address = bill.clientAddress
    ? bill.clientAddress
        .split('\n')
        .map((line) => `<div>${escapeHtml(line)}</div>`)
        .join('')
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(bill.number || 'Invoice')} · Creative Studio</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #f6f6f4; color: #071c3b; }
    body {
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      width: 210mm;
      min-height: 296mm;
      display: flex;
      flex-direction: column;
      background: #f6f6f4;
    }
    .band {
      padding: 10mm 14mm 6mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
    }
    .logo { width: 42mm; height: 42mm; object-fit: contain; }
    .doctype { text-align: right; }
    .doctype strong {
      display: block;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 32px;
      font-weight: 500;
      letter-spacing: -0.03em;
      color: #071c3b;
    }
    .doctype span { display: block; margin-top: 6px; letter-spacing: 0.16em; text-transform: uppercase; font-size: 10px; color: #006d67; }
    .rule { height: 3px; background: #006d67; }
    .body { padding: 10mm 16mm 8mm; }
    .split { display: flex; justify-content: space-between; gap: 28px; }
    .label {
      font-size: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #006d67;
      margin-bottom: 6px;
    }
    .who { font-size: 16px; font-weight: 600; letter-spacing: -0.02em; color: #071c3b; }
    .meta { min-width: 62mm; }
    .meta-row { display: flex; justify-content: space-between; gap: 16px; padding: 3px 0; border-bottom: 1px solid #d7e6e4; }
    .meta-row span { color: #5d6b78; }
    .billto { margin-top: 8mm; }
    table { width: 100%; border-collapse: collapse; margin-top: 8mm; }
    th {
      text-align: left;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 600;
      color: #006d67;
      border-bottom: 1.5px solid #071c3b;
      padding: 0 6px 7px;
    }
    td { padding: 9px 6px; border-bottom: 1px solid #d7e6e4; vertical-align: top; }
    .idx { width: 8mm; color: #5d6b78; }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    th.num { text-align: right; }
    .title { font-weight: 600; }
    tr, .words, .foot { break-inside: avoid; }
    .sac, .muted { color: #5d6b78; font-size: 11px; }
    .strong { font-weight: 700; }
    .totals { display: flex; justify-content: flex-end; margin-top: 4mm; }
    .box { width: 78mm; }
    .sum { display: flex; justify-content: space-between; gap: 18px; padding: 3px 0; }
    .grand {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      margin-top: 4px;
      padding-top: 8px;
      border-top: 1.5px solid #006d67;
      font-size: 15px;
      font-weight: 700;
      color: #006d67;
    }
    .words { margin-top: 6mm; padding: 8px 10px; background: #eef4f3; }
    .words strong { display: block; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #006d67; font-weight: 600; }
    .notes { margin-top: 5mm; white-space: pre-wrap; }
    .foot {
      margin-top: auto;
      padding: 6mm 16mm 12mm;
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-end;
    }
    .bank { font-size: 11px; }
    .bank span { display: inline-block; width: 42px; color: #5d6b78; }
    .sign { text-align: right; min-width: 62mm; }
    .sign .for { font-size: 11px; color: #5d6b78; }
    .line { margin: 16mm 0 4px auto; width: 52mm; border-top: 1px solid #006d67; }
    .fine { padding: 0 16mm 10mm; color: #5d6b78; font-size: 10px; display: flex; justify-content: space-between; gap: 12px; }
  </style>
</head>
<body>
  <article class="sheet">
    <header class="band">
      <img class="logo" src="${logoDataUri}" alt="Creative Studio by TLS Group" />
      <div class="doctype">
        <strong>${taxInvoice ? 'Tax Invoice' : 'Invoice'}</strong>
        <span>${escapeHtml(cityLine || 'Gurugram')}</span>
      </div>
    </header>
    <div class="rule"></div>
    <section class="body">
      <div class="split">
        <div>
          <div class="label">From</div>
          <div class="who">${escapeHtml(settings.legalName || 'Creative Studio by TLS Group')}</div>
          ${from}
          ${settings.gstin ? `<div>GSTIN ${escapeHtml(settings.gstin.toUpperCase())}</div>` : ''}
          ${settings.pan ? `<div>PAN ${escapeHtml(settings.pan.toUpperCase())}</div>` : ''}
        </div>
        <div class="meta">
          <div class="label">Invoice</div>
          <div class="meta-row"><span>Number</span><strong>${escapeHtml(bill.number || 'Draft')}</strong></div>
          <div class="meta-row"><span>Date</span><strong>${escapeHtml(formatDate(bill.date))}</strong></div>
          <div class="meta-row"><span>Place</span><strong>${escapeHtml(bill.clientState || settings.state)}</strong></div>
          <div class="meta-row"><span>Supply</span><strong>${math.intraState ? 'Intra-state' : 'Inter-state'}</strong></div>
        </div>
      </div>
      <div class="billto">
        <div class="label">Bill to</div>
        <div class="who">${escapeHtml(bill.clientName || 'Client name')}</div>
        ${address}
        ${bill.clientGstin ? `<div>GSTIN ${escapeHtml(bill.clientGstin)}</div>` : ''}
        ${bill.clientState ? `<div>${escapeHtml(bill.clientState)}</div>` : ''}
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th class="num">Amount</th>
            <th class="num">GST</th>
            <th class="num">GST amt</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows.join('')}
        </tbody>
      </table>
      <div class="totals">
        <div class="box">
          <div class="sum"><span>Taxable value</span><span>${formatInr(math.taxable)}</span></div>
          ${taxRows}
          <div class="grand"><span>Total</span><span>${formatInr(math.total)}</span></div>
        </div>
      </div>
      <div class="words">
        <strong>Amount in words</strong>
        ${escapeHtml(math.words)}
      </div>
      ${bill.notes ? `<div class="notes"><div class="label">Notes</div>${escapeHtml(bill.notes)}</div>` : ''}
    </section>
    <footer class="foot">
      <div class="bank">
        ${bankBits.length ? `<div class="label">Payment</div>${bankBits.join('')}` : '<div class="label">Payment</div><div>Due on receipt.</div>'}
      </div>
      <div class="sign">
        <div class="for">For ${escapeHtml(settings.legalName || 'Creative Studio by TLS Group')}</div>
        <div class="line"></div>
        <div>Authorised signatory</div>
      </div>
    </footer>
    <div class="fine">
      <span>${taxInvoice ? 'Whether tax is payable under reverse charge: No' : 'Computer generated invoice'}</span>
      <span>tlscreativestudio.com</span>
    </div>
  </article>
</body>
</html>`
}
