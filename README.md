# Pat's Spell Card Generator at https://nzain.github.io/

Open a (hardcodex-compatible) CSV file, preview cards, edit descriptions in the browser, and print a 3×3 grid on A4 paper. Works in any modern browser on Windows (no Python or Node required).
You can run this locally without any extra installs, just double click the index.html.

## CSV format

Semicolon-delimited (`;`), hardcodex-compatible column order:

```text
Level; Name; Type; Cast Time; Range; Components; Duration; Description; [Classes]; [Ritual]; [Name (EN)]
```

The optional `Ritual` column holds `R` for spells that may be cast as a ritual, otherwise empty. Missing values are treated as non-ritual. Ritual spells are tagged with a small `(Ritual)` next to the school in the card footer.

The optional `Name (EN)` column holds the English PHB spell name for manual cross-checks against German names. It is not shown on cards and is not editable in the UI; export always includes the column (empty when unset).

Descriptions may include limited HTML (`<br>`, `<strong>`, `<b>`, `<span class=nameref>`, `<a href=123>`, tables). Content is sanitized before display.

Encoding: UTF-8 preferred; Windows-codepage worked for me, too.

## Card size and print

- Default card size: **63 × 90 mm** (adjustable in the toolbar).
- Print layout: **3 × 3 cards per A4 portrait page**.
- Test print preview in Firefox and Chrome/Edge; margins may differ slightly between browsers.

## Editing, selection, and export

- Often spell descriptions are lengthy and overwhelming: print layout overflow is indicated in the web UI.
- **Click a card** (front or back) to include it in a print selection. Unselected cards are dimmed once any card is picked; use **Clear selection** to print all visible cards again.
- **Right-click a card** and choose **Edit description** to open a split-pane editor: raw HTML on the left, live card preview on the right. Save or Cancel (Escape discards changes).
- **Export CSV…** downloads the current list (including your edits).

## Privacy

Everything runs locally in the browser. No server, no uploads.
