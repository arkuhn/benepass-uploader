# benepass-uploader

Automates submitting reimbursement claims to Benepass from receipts or medical bills.

## When the user gives you a bills directory

Run the full workflow end-to-end:

### 1 — Read the bills

Read every PDF in the specified directory using the Read tool. For each file, extract:

- **Service dates** — each individual session or transaction date
- **Amount** — the amount to be reimbursed per session/transaction
- **Provider name** — the name of the provider or merchant
- **PDF filename** — the source filename

If a bill covers multiple sessions, create one entry per session.

### 2 — Confirm the benefit plan

Ask the user which Benepass benefit plan to use (e.g. "2026 Mental Health HRA"). The name must exactly match what appears in their Benepass dropdown.

### 3 — Write sessions.json

```json
{
  "benefitPlan": "2026 Mental Health HRA",
  "sessions": [
    { "date": "YYYY-MM-DD", "amount": 20.00, "provider": "Jane Smith", "pdf": "filename.pdf" },
    ...
  ]
}
```

Dates in ISO format (`YYYY-MM-DD`), sorted chronologically.

### 4 — Open the browser

Run `node open-browser.js` in the background. Tell the user to log in to Benepass and confirm when they're ready.

### 5 — Submit all claims

Once the user confirms they're logged in, run:

```bash
node submit.js <bills-dir>
```

Monitor the output. If a submission fails, diagnose and retry from the failed index:

```bash
node submit.js <bills-dir> <index>
```

## Project files

| File | Purpose |
|------|---------|
| `open-browser.js` | Launches Chromium with remote debugging, navigates to Benepass |
| `submit.js` | Connects to open browser, reads sessions.json, submits each claim |
| `sessions.json` | Generated — gitignored |
| `sessions.example.json` | Format reference |
