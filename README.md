# Pats Zauberkarten-Generator — https://nzain.github.io/

Öffne eine CSV-Datei, sieh die Karten in der Vorschau, bearbeite Beschreibungen im Browser und drucke ein 3×3-Raster auf A4. Läuft in jedem modernen Browser unter Windows — ohne Python oder Node.
Lokal starten geht ohne Installation: `index.html` doppelklicken.

## CSV-Format

Trennzeichen Semikolon (`;`), feste Spaltenreihenfolge:

```text
Level; Name; Type; Cast Time; Range; Components; Duration; Description; [Classes]; [Ritual]; [Name (EN)]
```

Die optionale Spalte `Ritual` enthält `R`, wenn der Zauber als Ritual gewirkt werden kann, sonst leer. Fehlende Werte gelten als kein Ritual. Ritualzauber werden in der Kartenfußzeile neben der Schule mit `(Ritual)` markiert.

Die optionale Spalte `Name (EN)` enthält den englischen PHB-Zaubernamen zum manuellen Abgleich mit den deutschen Namen. Sie erscheint nicht auf den Karten und ist in der Oberfläche nicht editierbar; beim Export ist die Spalte immer dabei (leer, wenn nicht gesetzt).

Beschreibungen dürfen eingeschränktes HTML enthalten (`<br>`, `<strong>`, `<b>`, `<span class=nameref>`, `<a href=123>`, Tabellen). Vor der Anzeige wird der Inhalt bereinigt.

Kodierung: UTF-8 bevorzugt; Windows-Zeichensätze haben bei mir ebenfalls funktioniert.

## Kartengröße und Druck

- Standardkartengröße: **63 × 90 mm** (in der Werkzeugleiste einstellbar).
- Drucklayout: **3 × 3 Karten pro A4-Hochformat**.
- Druckvorschau in Firefox sowie Chrome/Edge testen; die Ränder können je nach Browser leicht abweichen.

## Bearbeiten, Auswahl und Export

- Zauberbeschreibungen sind oft lang — Überlauf im Drucklayout wird in der Web-Oberfläche angezeigt.
- **Karte anklicken** (Vorder- oder Rückseite), um sie für den Druck auszuwählen. Sobald mindestens eine Karte gewählt ist, werden nicht ausgewählte Karten abgedunkelt; mit **Auswahl aufheben** druckst du wieder alle sichtbaren Karten.
- **Rechtsklick auf eine Karte** und **Zauber bearbeiten** öffnen einen geteilten Editor: links Rohtext/HTML, rechts Live-Vorschau. Speichern oder Abbrechen (Escape verwirft Änderungen).
- **CSV exportieren…** lädt die aktuelle Liste herunter (inklusive deiner Änderungen).

## Datenschutz

Alles läuft lokal im Browser. Kein Server, keine Uploads.
