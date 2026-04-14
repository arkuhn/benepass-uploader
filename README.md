# benepass-uploader

Automates submitting reimbursement claims to [Benepass](https://www.getbenepass.com) using Playwright.

## Usage

Open [Claude Code](https://claude.ai/code) in this directory and say:

> "Here are my bills to submit: ~/Downloads/my-bills"

Claude will read the receipts, extract the sessions, open a browser for you to log in, and submit everything automatically.

## Setup

```bash
git clone https://github.com/arkuhn/benepass-uploader
cd benepass-uploader
npm install
```

## sessions.json

Claude generates this from your bills. You can also write it manually — see `sessions.example.json`.

## License

MIT
