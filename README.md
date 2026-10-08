# Creative Studio Billing

Desktop billing desk for [Creative Studio by TLS Group](https://tlscreativestudio.com/).

Fill the client, a title, an amount, and GST. The proof on the right updates as you type. **Print** opens the Windows print dialog. **Export PDF** saves an A4 PDF of the same invoice. Bills stay on this computer.

Same-state work (Haryana to Haryana) splits GST into CGST and SGST. A client in another state is billed IGST.

## Run it

```bash
npm install
npm run dev
```

Open **Studio** and save your GSTIN, bank account, and invoice prefix before the first tax invoice.

## Build the Windows installer

```bash
npm run dist
```

The installer is written to `release/Creative-Studio-Billing-Setup-1.0.0.exe`.

`npm run dist:dir` builds an unpacked app in `release/win-unpacked` if you only want to test the packaged exe without the installer.

Shortcuts: Ctrl+S saves the open bill. Ctrl+P prints it.
