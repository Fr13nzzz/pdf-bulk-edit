import { PDFDocument, PDFName } from 'pdf-lib'
import { updateXmpDublinCoreFields } from './xmpMetadata.js'

/**
 * Applies the given settings to a single PDF file and returns the
 * resulting bytes. Throws on load/save failure (e.g. encrypted/corrupt PDF)
 * so callers can handle errors per file.
 */
export async function applySettingsToPdf(file, settings) {
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes, { updateMetadata: false })

  const titleValue = settings.title.value.trim()
  if (titleValue) {
    pdfDoc.setTitle(titleValue)
  }
  const authorValue = settings.author.value.trim()
  if (authorValue) {
    pdfDoc.setAuthor(authorValue)
  }

  if (titleValue || authorValue) {
    syncXmpMetadata(pdfDoc, {
      title: titleValue || undefined,
      author: authorValue || undefined,
    })
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

/**
 * pdf-lib's setTitle()/setAuthor() only update the /Info dictionary, never the
 * XMP metadata stream, and Acrobat Pro prefers XMP over /Info when both are
 * present. Patch just the changed dc:title/dc:creator fields so the rest of
 * the XMP metadata (PDF/A tags, custom properties, ...) survives. Only when
 * the existing stream can't be parsed do we fall back to removing it
 * entirely, so Acrobat at least falls back to the updated /Info dictionary.
 */
function syncXmpMetadata(pdfDoc, fields) {
  const catalog = pdfDoc.catalog
  const metadataRef = catalog.get(PDFName.of('Metadata'))
  if (!metadataRef) {
    return
  }

  const metadataStream = pdfDoc.context.lookup(metadataRef)
  const updatedContents = updateXmpDublinCoreFields(metadataStream.getContents(), fields)

  if (updatedContents) {
    const newStream = pdfDoc.context.stream(updatedContents, { Type: 'Metadata', Subtype: 'XML' })
    catalog.set(PDFName.of('Metadata'), pdfDoc.context.register(newStream))
  } else {
    catalog.delete(PDFName.of('Metadata'))
  }
}
