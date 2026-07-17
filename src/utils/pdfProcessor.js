import { PDFDocument, PDFName } from 'pdf-lib'

/**
 * Applies the given settings to a single PDF file and returns the
 * resulting bytes. Throws on load/save failure (e.g. encrypted/corrupt PDF)
 * so callers can handle errors per file.
 */
export async function applySettingsToPdf(file, settings) {
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes, { updateMetadata: false })

  if (settings.title.apply) {
    pdfDoc.setTitle(settings.title.value)
  }
  if (settings.author.apply) {
    pdfDoc.setAuthor(settings.author.value)
  }

  const catalog = pdfDoc.catalog
  const context = pdfDoc.context

  // /PageMode — the "Vollbildmodus" checkbox writes to the same key as the
  // "Navigationsregisterkarte" dropdown and takes precedence when active.
  const fullScreenActive = settings.viewerPrefs.apply && settings.viewerPrefs.fullScreen
  if (fullScreenActive) {
    catalog.set(PDFName.of('PageMode'), PDFName.of('FullScreen'))
  } else if (settings.pageMode.apply) {
    catalog.set(PDFName.of('PageMode'), PDFName.of(settings.pageMode.value))
  }

  // /PageLayout — empty value means "Standard", i.e. omit the key entirely.
  if (settings.pageLayout.apply) {
    if (settings.pageLayout.value) {
      catalog.set(PDFName.of('PageLayout'), PDFName.of(settings.pageLayout.value))
    } else {
      catalog.delete(PDFName.of('PageLayout'))
    }
  }

  // /ViewerPreferences sub-dictionary (FitWindow, CenterWindow, DisplayDocTitle).
  if (settings.viewerPrefs.apply) {
    const viewerPrefsDict = context.obj({
      FitWindow: settings.viewerPrefs.fitWindow,
      CenterWindow: settings.viewerPrefs.centerWindow,
      DisplayDocTitle: settings.viewerPrefs.displayDocTitle,
    })
    catalog.set(PDFName.of('ViewerPreferences'), viewerPrefsDict)
  }

  return pdfDoc.save()
}
