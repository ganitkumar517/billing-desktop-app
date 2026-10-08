import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron'
import { existsSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { renderInvoiceHtml } from '../shared/document'
import type { BillView } from '../shared/invoice'
import type { Draft, Invoice, PrintResult, PdfResult, Settings } from '../shared/types'
import { dataPath, deleteInvoice, readInvoices, readSettings, saveInvoice, writeSettings } from './data'

let mainWindow: BrowserWindow | null = null

function billFromInvoice(invoice: Invoice): BillView {
  return {
    number: invoice.number,
    date: invoice.date,
    clientName: invoice.clientName,
    clientAddress: invoice.clientAddress,
    clientGstin: invoice.clientGstin,
    clientState: invoice.clientState,
    sac: invoice.sac,
    notes: invoice.notes,
    items: invoice.items
  }
}

function safeFileName(number: string): string {
  return number.replace(/[<>:"/\\|?*]/g, '-') || 'invoice'
}

async function openInvoiceWindow(invoice: Invoice, settings: Settings, show: boolean): Promise<BrowserWindow> {
  const html = renderInvoiceHtml(billFromInvoice(invoice), settings)
  const file = join(app.getPath('temp'), `cs-invoice-${invoice.id}.html`)
  writeFileSync(file, html, 'utf8')

  const win = new BrowserWindow({
    width: 900,
    height: 1100,
    show,
    title: invoice.number,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    parent: mainWindow ?? undefined,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('closed', () => {
    try {
      unlinkSync(file)
    } catch {
      /* temp file already removed */
    }
  })

  await win.loadFile(file)
  await win.webContents.executeJavaScript('document.fonts ? document.fonts.ready : null')
  return win
}

async function printInvoice(invoice: Invoice): Promise<PrintResult> {
  const settings = readSettings()
  const win = await openInvoiceWindow(invoice, settings, true)
  win.focus()
  await new Promise((resolve) => setTimeout(resolve, 150))

  return new Promise((resolve) => {
    win.webContents.print(
      {
        silent: false,
        printBackground: true,
        color: true,
        pageSize: 'A4',
        margins: { marginType: 'none' }
      },
      (success, failureReason) => {
        const canceled = !success && /cancel/i.test(failureReason || '')
        if (!win.isDestroyed()) win.close()
        if (success) resolve({ ok: true })
        else if (canceled) resolve({ ok: false, canceled: true })
        else resolve({ ok: false, error: failureReason || 'The printer did not accept this bill.' })
      }
    )
  })
}

async function exportPdf(invoice: Invoice): Promise<PdfResult> {
  if (!mainWindow) return { ok: false, error: 'The billing window is not open.' }
  const suggested = `${safeFileName(invoice.number)}.pdf`
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export invoice PDF',
    defaultPath: suggested,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (canceled || !filePath) return { ok: false, canceled: true }

  const settings = readSettings()
  const win = await openInvoiceWindow(invoice, settings, false)
  try {
    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      pageSize: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    })
    writeFileSync(filePath, pdf)
    return { ok: true, path: filePath }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Could not create the PDF.' }
  } finally {
    if (!win.isDestroyed()) win.close()
  }
}

function createWindow(): void {
  const iconPath = join(__dirname, '../../build/icon.png')
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    title: 'Creative Studio Billing',
    backgroundColor: '#f6f6f4',
    icon: existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle('app:bootstrap', () => ({
    settings: readSettings(),
    invoices: readInvoices(),
    dataPath: dataPath()
  }))

  ipcMain.handle('settings:save', (_event, settings: Settings) => writeSettings(settings))
  ipcMain.handle('invoice:save', (_event, draft: Draft) => saveInvoice(draft))
  ipcMain.handle('invoice:delete', (_event, id: string) => deleteInvoice(id))
  ipcMain.handle('invoice:print', (_event, invoice: Invoice) => printInvoice(invoice))
  ipcMain.handle('invoice:pdf', (_event, invoice: Invoice) => exportPdf(invoice))
}

const locked = app.requestSingleInstanceLock()
if (!locked) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  void app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    registerIpc()
    createWindow()
  })

  app.on('window-all-closed', () => {
    app.quit()
  })
}
