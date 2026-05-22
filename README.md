# Spell Card Generator at https://nzain.github.io/

A local, zero-install web app for D&D spell cards. Open a hardcodex-compatible CSV file, preview cards, edit descriptions in the browser, and print a 3×3 grid on A4 paper.

Works in any modern browser on Windows (no Python or Node required).

## Quick start

1. Open the project folder.
2. Double-click **`Open.bat`** (or open `index.html` in your browser).
3. Click **Open CSV…** and choose your spell list file.
4. Use **Print** → Save as PDF or your printer.
5. After editing, use **Export CSV…** to save your changes.

## CSV format

Semicolon-delimited (`;`), hardcodex-compatible column order:

```text
Level; Name; Type; Cast Time; Range; Components; Duration; Description; [Classes]
```

Descriptions may include limited HTML (`<br>`, `<strong>`, `<b>`, `<span class=nameref>`, `<a href=123>`, tables). Content is sanitized before display.

Encoding: UTF-8 preferred; Windows-1252 is detected automatically for older German exports.

## Card size and print

- Default card size: **63 × 88 mm** (adjustable in the toolbar).
- Print layout: **3 × 3 cards per A4 portrait page**.
- Test print preview in Firefox and Chrome/Edge; margins may differ slightly between browsers.

## Editing and export

- Click a card **description** to edit inline (dirty cards show an orange outline).
- **Export CSV…** downloads the current list (including your edits).

## Files

| Path | Purpose |
|------|---------|
| `index.html` | App shell |
| `css/app.css` | Screen + print styles |
| `js/` | App logic |
| `vendor/` | Papa Parse, DOMPurify |
| `data/` | Optional sample CSV files |

## Privacy

Everything runs locally in the browser. No server, no uploads.
