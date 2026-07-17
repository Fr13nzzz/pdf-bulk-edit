# pdf-bulk-edit — Spezifikation

> Hinweis: Ursprünglich war die Anwendung für `.docx`-Dateien geplant. Nach Klärung mit
> dem Auftraggeber ist der Scope auf **PDF-Dateien** umgestellt worden (siehe die
> konkret genannten Eigenschaften unten, die aus dem Adobe-Acrobat-Dialog
> „Dokumenteigenschaften" stammen). Der Projektordner-/Repo-Name `docx-bulk-edit`
> bleibt vorerst bestehen, bezieht sich inhaltlich aber auf PDF.

## 1. Ziel

Eine Webanwendung, mit der Benutzer mehrere `.pdf`-Dateien gleichzeitig hochladen, für
alle hochgeladenen Dateien identische Dokumenteigenschaften setzen und die
bearbeiteten Dateien anschließend gebündelt als ZIP herunterladen können.

Die Anwendung läuft vollständig im Browser (client-seitig), es gibt keinen Server und
keine Backend-Logik. Dateien verlassen zu keinem Zeitpunkt das Gerät des Benutzers.

## 2. Rahmenbedingungen

- **Kein Backend.** Alle Verarbeitung (Parsen der PDF, Setzen der Properties, Zippen)
  findet im Browser statt.
- **Lokal einfach lauffähig.** Das Build-Ergebnis (`dist/`) besteht aus statischem
  HTML + JS + CSS und muss ohne technische Kenntnisse nutzbar sein — Doppelklick auf
  `index.html` bzw. einfaches Hosten über einen simplen statischen Server reicht aus.
- **Tech-Stack:** Vue 3 mit Vite als Build-Tool. Vite-Konfiguration so wählen, dass
  relative Pfade erzeugt werden (`base: './'`), damit `dist/index.html` auch per
  `file://` funktioniert (falls das an Browser-Sicherheitsgrenzen scheitert, siehe
  Fallback in Abschnitt 7).
- **PDF-Manipulation:** [`pdf-lib`](https://pdf-lib.js.org/) — reine JS-Bibliothek,
  läuft vollständig im Browser, kann sowohl das Document-Info-Dictionary (Titel,
  Verfasser, …) als auch niedrigschwellig das Catalog-Dictionary (`/PageMode`,
  `/PageLayout`, `/ViewerPreferences`) setzen.
- **Download:** Alle bearbeiteten Dateien werden client-seitig zu einem ZIP
  zusammengefasst (`JSZip.generateAsync`) und als ein Download angeboten
  (z. B. via `file-saver` oder direktem `Blob` + `<a download>`).

## 3. Funktionale Anforderungen

### 3.1 Upload
- Mehrfachauswahl von `.pdf`-Dateien (File-Input mit `multiple` + Drag & Drop).
- Validierung: nur `.pdf` zulassen (MIME-Type `application/pdf` bzw. Dateiendung als
  Fallback-Check, PDF-Header `%PDF-` als Inhaltsprüfung).
- Hochgeladene Dateien werden als Liste angezeigt (Dateiname, Größe), mit Möglichkeit,
  einzelne Dateien wieder zu entfernen.

### 3.2 Properties einstellen
- Ein Formular zeigt die editierbaren Eigenschaften, gruppiert wie im
  Acrobat-Dialog „Dokumenteigenschaften" (siehe 4).
- Die eingegebenen Werte gelten global für **alle** hochgeladenen Dateien
  (kein Datei-individuelles Overriding in v1).
- Pro Feld muss erkennbar sein, ob es „übernommen" werden soll oder der bestehende
  Wert der jeweiligen PDF unangetastet bleibt (Tri-State/„übernehmen"-Checkbox pro
  Feld, analog zur ursprünglichen docx-Spec).

### 3.3 Anwenden & Download
- Button „Anwenden" verarbeitet alle Dateien:
  1. Datei mit `pdf-lib` laden (`PDFDocument.load`).
  2. Info-Dictionary-Felder setzen (`setTitle`, `setAuthor`).
  3. Catalog-Einträge setzen (`PageMode`, `PageLayout`, `ViewerPreferences`) über die
     Low-Level-API von `pdf-lib` (`context.obj`, `PDFName`, `PDFDict`, `PDFBool`).
  4. Datei neu speichern (`save()` → `Uint8Array`).
- Fortschrittsanzeige, falls viele/große Dateien verarbeitet werden.
- Alle Ergebnisdateien werden in ein ZIP gebündelt und automatisch heruntergeladen.
- Fehlerfälle pro Datei (z. B. verschlüsseltes/passwortgeschütztes PDF, defekte Datei)
  dürfen den Gesamtprozess nicht abbrechen — Fehler pro Datei anzeigen, restliche
  Dateien trotzdem verarbeiten.

## 4. Datenmodell

### 4.1 Reiter „Beschreibung" (Document Information Dictionary)

| UI-Label   | PDF-Schlüssel | Ort                              |
|------------|---------------|-----------------------------------|
| Titel      | `/Title`      | Document Info Dictionary (Trailer) |
| Verfasser  | `/Author`     | Document Info Dictionary (Trailer) |

`pdf-lib` bietet dafür direkte High-Level-Methoden: `pdfDoc.setTitle(...)`,
`pdfDoc.setAuthor(...)`.

> Erweiterbar (später, wie schon in der docx-Spec für benutzerdefinierte
> Eigenschaften vorgesehen): Betreff (`/Subject`), Stichwörter (`/Keywords`) — im
> Acrobat-Dialog Teil desselben „Beschreibung"-Reiters, aktuell aber **nicht**
> angefordert und daher nicht im Scope von v1.

### 4.2 Reiter „Ansicht beim Öffnen" (Initial View)

Diese Einstellungen liegen im **Catalog-Dictionary** des PDF (nicht im Info
Dictionary!) — technisch ein anderer Teil der Datei als 4.1.

**a) Dropdown „Navigationsregisterkarte"** → Catalog-Schlüssel `/PageMode`

| UI-Wert (Acrobat, deutsch)      | PDF-Wert         |
|----------------------------------|------------------|
| Nur Seite                        | `UseNone`        |
| Lesezeichen und Seite             | `UseOutlines`    |
| Seiten und Seite                  | `UseThumbs`      |
| Anlagen und Seite                 | `UseAttachments` |

**b) Dropdown „Seitenlayout"** → Catalog-Schlüssel `/PageLayout`

| UI-Wert (Acrobat, deutsch)                | PDF-Wert         |
|--------------------------------------------|------------------|
| Standard (Vorgabe des Anzeigeprogramms)     | *(Schlüssel weglassen)* |
| Einzelne Seite                              | `SinglePage`     |
| Fortlaufend                                 | `OneColumn`      |
| Doppelseiten fortlaufend                    | `TwoColumnLeft`  |
| Doppelseiten                                | `TwoPageLeft`    |

**c) Checkboxen „Fensteroptionen"** → Catalog-Schlüssel `/ViewerPreferences`
(eigenes Sub-Dictionary), mit einer Ausnahme (siehe Konflikt-Hinweis unten):

| UI-Label                                          | PDF-Schlüssel                       | Typ     |
|----------------------------------------------------|---------------------------------------|---------|
| Fenster an Anfangsseite anpassen                    | `ViewerPreferences /FitWindow`         | Boolean |
| Fenster auf Bildschirm zentrieren                   | `ViewerPreferences /CenterWindow`      | Boolean |
| Dokumenttitel als Fenstertitel verwenden             | `ViewerPreferences /DisplayDocTitle`   | Boolean |
| Im Vollbildmodus öffnen                             | `Catalog /PageMode = FullScreen`       | *(Sonderfall, s.u.)* |

> ⚠️ **Konflikt-Hinweis (technisch wichtig für die Implementierung):**
> „Im Vollbildmodus öffnen" schreibt auf **denselben** Catalog-Schlüssel
> (`/PageMode`) wie das Dropdown „Navigationsregisterkarte" (4.2 a). Im PDF-Standard
> kann `/PageMode` nur einen einzigen Wert haben. Ist die Checkbox aktiv, muss sie
> Vorrang vor der Dropdown-Auswahl haben (bzw. das Dropdown in der UI deaktiviert
> werden, solange die Checkbox aktiv ist) — sonst überschreiben sich beide
> Einstellungen gegenseitig unvorhersehbar.

## 5. UI-Flow (grob)

1. **Upload-Schritt:** Drag&Drop-/Auswahlfläche, Dateiliste mit Entfernen-Option.
2. **Eigenschaften-Schritt:** Formular mit zwei Abschnitten passend zu den
   Acrobat-Reitern:
   - „Beschreibung": Titel, Verfasser.
   - „Ansicht beim Öffnen": Navigationsregisterkarte (Dropdown), Seitenlayout
     (Dropdown), Fensteroptionen (Checkboxen, inkl. Vollbildmodus-Konfliktlogik s.o.).
3. **Anwenden & Download:** Klick auf „Anwenden", Fortschrittsanzeige, danach
   automatischer ZIP-Download; Fehlerliste falls einzelne Dateien fehlschlugen.

Ein einfacher linearer Ablauf (kein komplexes Routing) genügt; alles kann auf einer
Single-Page-Ansicht mit Abschnitten/Steps liegen.

## 6. Out of Scope (v1)

- Bearbeitung des Dokumentinhalts (Text, Seiten, Formulare, Anmerkungen).
- Datei-individuelle (pro Datei unterschiedliche) Property-Werte.
- Weitere Beschreibung-Felder (Betreff, Stichwörter) — siehe Hinweis 4.1.
- „Benutzeroberflächenoptionen" (Menüleiste/Symbolleiste/Fensterbedienelemente
  ausblenden) — ein separater Abschnitt im Acrobat-Dialog, der nicht mit den
  angefragten „Fensteroptionen" verwechselt werden darf und aktuell nicht im Scope ist.
- Passwortgeschützte/verschlüsselte PDFs (werden als Fehler pro Datei behandelt,
  nicht entschlüsselt).
- Serverseitige Verarbeitung, Authentifizierung, Persistenz/Historie.
- Unterstützung anderer Formate (`.docx`, `.doc`, `.odt`, etc.) — siehe Hinweis oben.

## 7. Offene technische Punkte / Risiken

- **`file://`-Tauglichkeit:** Manche Browser blockieren Modul-Skripte oder Fetch bei
  `file://`. Muss beim Vite-Build geprüft werden (`base: './'`, ggf. IIFE-Bundle statt
  ES-Module-Build, falls nötig). Als Doku-Fallback: ein Mini-Static-Server-Skript
  (`start-local-server.(sh|bat)`).
- **`/PageMode`-Konflikt** zwischen Vollbildmodus-Checkbox und
  Navigationsregisterkarte-Dropdown — siehe 4.2 c.
- **Low-Level-API von `pdf-lib`:** Für `PageMode`/`PageLayout`/`ViewerPreferences`
  gibt es keine High-Level-Methoden; Zugriff über `pdfDoc.catalog.context.obj(...)`
  und `pdfDoc.catalog.set(PDFName.of('PageMode'), ...)`. Muss früh im
  Implementierungsprozess mit einer Test-PDF verifiziert werden (Acrobat/Preview
  öffnen und Verhalten prüfen), da diese Catalog-Einträge nicht von jedem
  PDF-Viewer identisch respektiert werden (z. B. Browser-PDF-Viewer ignorieren
  `ViewerPreferences` teils vollständig — nur mit Acrobat Reader zuverlässig
  überprüfbar).
- **Verschlüsselte/linearisierte PDFs:** `pdf-lib` kann manche verschlüsselten PDFs
  nicht laden — pro Datei defensiv behandeln (Fehler anzeigen, nicht crashen).
- **Große Dateimengen/-größen:** Verarbeitung ggf. mit Web Worker auslagern, falls UI
  während der Verarbeitung spürbar blockiert (Performance-Optimierung, kein
  Hard-Requirement für v1).

## 8. Empfohlene Bibliotheken

- `vue` (3.x) + `vite` — UI & Build.
- `pdf-lib` — Laden/Setzen/Speichern der PDF-Eigenschaften (Info Dictionary +
  Catalog/ViewerPreferences).
- `jszip` — Bündeln der Ergebnisdateien zu einem ZIP-Download.
- `file-saver` (optional) — komfortabler Blob-Download, alternativ nativer
  `<a download>`-Ansatz ohne zusätzliche Abhängigkeit.
