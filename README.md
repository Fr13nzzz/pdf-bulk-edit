# PDF Bulk Edit

Eine Webanwendung, mit der mehrere `.pdf`-Dateien gleichzeitig hochgeladen, mit
identischen Dokumenteigenschaften versehen und anschließend gebündelt als ZIP
heruntergeladen werden können.

Die Anwendung läuft vollständig **client-seitig im Browser** — es gibt kein
Backend, und die Dateien verlassen zu keinem Zeitpunkt das Gerät der
Benutzerin/des Benutzers. Details zum fachlichen Scope stehen in
[`specs.md`](./specs.md).

> Hinweis: Der Repo-/Ordnername `docx-bulk-edit` ist historisch bedingt — die
> Anwendung verarbeitet inhaltlich **PDF**-Dateien (siehe `specs.md`).

## Tech-Stack

- [Vue 3](https://vuejs.org/) — UI
- [Vite](https://vitejs.dev/) — Build-Tool / Dev-Server
- [pdf-lib](https://pdf-lib.js.org/) — Lesen/Schreiben der PDF-Eigenschaften
- [JSZip](https://stuk.github.io/jszip/) — Bündeln der Ergebnisdateien zu einem ZIP
- [file-saver](https://github.com/eligrey/FileSaver.js) — Auslösen des Downloads

## Voraussetzungen

- [Node.js](https://nodejs.org/) 18 oder neuer (empfohlen: 20 LTS)
- npm (wird mit Node.js installiert)

## Installation

```bash
npm install
```

## Entwicklung

Startet einen Dev-Server mit Hot-Reload unter <http://localhost:5173>:

```bash
npm run dev
```

## Produktions-Build

Erzeugt ein statisches Bundle im Ordner `dist/`:

```bash
npm run build
```

Das Ergebnis besteht ausschließlich aus statischem HTML/JS/CSS und benötigt
keinen Server mit Backend-Logik.

### Build lokal ansehen

Über den Vite-eigenen Preview-Server:

```bash
npm run preview
```

Alternativ kann `dist/` mit jedem beliebigen statischen Webserver
ausgeliefert werden, z. B. mit den beiliegenden Hilfsskripten (nutzen Python
`http.server`, Standardport 8080):

```bash
# Linux/macOS
./start-local-server.sh [port]

# Windows
start-local-server.bat [port]
```

Anschließend im Browser öffnen: <http://localhost:8080>

## Releases / Downloads über GitHub

Wird ein neuer Git-Tag im Format `v*` (z. B. `v1.0.0`) erstellt und gepusht,
baut eine GitHub-Actions-Pipeline (`.github/workflows/release.yml`)
automatisch das Produktions-Bundle und veröffentlicht es als Anhang
(`pdf-bulk-edit-<tag>.zip`) an einem GitHub Release. Das fertige Build kann
dann direkt von der Releases-Seite des Repositories heruntergeladen werden,
ohne dass Node.js oder npm installiert sein müssen — einfach entpacken und
gemäß Abschnitt „Build lokal ansehen" bereitstellen.

Neuen Tag erstellen und veröffentlichen:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Projektstruktur

```
src/
  App.vue                 Hauptkomponente / Layout der drei Schritte
  main.js                 Vue-Einstiegspunkt
  components/
    UploadStep.vue        Datei-Upload (Auswahl/Drag & Drop, Liste)
    PropertiesForm.vue    Formular für Dokumenteigenschaften
    ApplyStep.vue         Verarbeitung, Fortschritt, ZIP-Download
  utils/
    settings.js           Default-Einstellungen
    validatePdf.js         PDF-Validierung
    pdfProcessor.js        Setzen der Eigenschaften via pdf-lib
    downloadZip.js         Bündeln/Download via JSZip
```
