# Pat's Spell Card Generator at https://nzain.github.io/

Open a (hardcodex-compatible) CSV file, preview cards, edit descriptions in the browser, and print a 3×3 grid on A4 paper. Works in any modern browser on Windows (no Python or Node required).
You can run this locally without any extra installs, just double click the index.html.

## CSV format

Semicolon-delimited (`;`), hardcodex-compatible column order:

```text
Level; Name; Type; Cast Time; Range; Components; Duration; Description; [Classes]
```

Descriptions may include limited HTML (`<br>`, `<strong>`, `<b>`, `<span class=nameref>`, `<a href=123>`, tables). Content is sanitized before display.

Encoding: UTF-8 preferred; Windows-codepage worked for me, too.

## Card size and print

- Default card size: **63 × 90 mm** (adjustable in the toolbar).
- Print layout: **3 × 3 cards per A4 portrait page**.
- Test print preview in Firefox and Chrome/Edge; margins may differ slightly between browsers.

## Editing and export

- Often spell descriptions are lengthy and overwhelming: print layout overflow is indicated in the web UI.
- Click a card **description** to edit inline (dirty cards show an orange outline).
- **Export CSV…** downloads the current list (including your edits).

## Privacy

Everything runs locally in the browser. No server, no uploads.
