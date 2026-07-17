import { PDFDocument, PDFName } from 'pdf-lib'
import { readFileSync } from 'fs'

async function applySettingsToPdf(bytes, settings) {
  const pdfDoc = await PDFDocument.load(bytes, { updateMetadata: false })

  if (settings.title.apply) pdfDoc.setTitle(settings.title.value)
  if (settings.author.apply) pdfDoc.setAuthor(settings.author.value)

  const catalog = pdfDoc.catalog
  const context = pdfDoc.context

  const fullScreenActive = settings.viewerPrefs.apply && settings.viewerPrefs.fullScreen
  if (fullScreenActive) {
    catalog.set(PDFName.of('PageMode'), PDFName.of('FullScreen'))
  } else if (settings.pageMode.apply) {
    catalog.set(PDFName.of('PageMode'), PDFName.of(settings.pageMode.value))
  }

  if (settings.pageLayout.apply) {
    if (settings.pageLayout.value) {
      catalog.set(PDFName.of('PageLayout'), PDFName.of(settings.pageLayout.value))
    } else {
      catalog.delete(PDFName.of('PageLayout'))
    }
  }

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

const input = readFileSync('/tmp/claude-1000/-var-www-html-projects-docx-bulk-edit/0d607d28-20b8-43f6-89c2-3fcc59d7eb9c/scratchpad/sample1.pdf')

// Test 1: normal case, no fullscreen conflict
const settings1 = {
  title: { apply: true, value: 'Testtitel' },
  author: { apply: true, value: 'Test Autor' },
  pageMode: { apply: true, value: 'UseOutlines' },
  pageLayout: { apply: true, value: 'TwoColumnLeft' },
  viewerPrefs: { apply: true, fitWindow: true, centerWindow: false, displayDocTitle: true, fullScreen: false },
}
const out1 = await applySettingsToPdf(input, settings1)
const doc1 = await PDFDocument.load(out1)
console.log('--- Test 1: normal, no fullscreen ---')
console.log('Title:', doc1.getTitle())
console.log('Author:', doc1.getAuthor())
console.log('PageMode:', doc1.catalog.get(PDFName.of('PageMode'))?.toString())
console.log('PageLayout:', doc1.catalog.get(PDFName.of('PageLayout'))?.toString())
const vp1 = doc1.catalog.lookup(PDFName.of('ViewerPreferences'))
console.log('ViewerPreferences:', vp1?.toString())

// Test 2: fullscreen checkbox wins over pageMode dropdown
const settings2 = {
  title: { apply: false, value: '' },
  author: { apply: false, value: '' },
  pageMode: { apply: true, value: 'UseThumbs' },
  pageLayout: { apply: true, value: '' }, // Standard -> omit key
  viewerPrefs: { apply: true, fitWindow: false, centerWindow: true, displayDocTitle: false, fullScreen: true },
}
const out2 = await applySettingsToPdf(input, settings2)
const doc2 = await PDFDocument.load(out2)
console.log('\n--- Test 2: fullscreen wins, pageLayout=Standard omitted ---')
console.log('PageMode (expect FullScreen, not UseThumbs):', doc2.catalog.get(PDFName.of('PageMode'))?.toString())
console.log('PageLayout key present (expect undefined):', doc2.catalog.get(PDFName.of('PageLayout')))
const vp2 = doc2.catalog.lookup(PDFName.of('ViewerPreferences'))
console.log('ViewerPreferences:', vp2?.toString())

// Test 3: nothing applied -> original PDF fields untouched
const settings3 = {
  title: { apply: false, value: 'ignored' },
  author: { apply: false, value: 'ignored' },
  pageMode: { apply: false, value: 'UseNone' },
  pageLayout: { apply: false, value: 'SinglePage' },
  viewerPrefs: { apply: false, fitWindow: true, centerWindow: true, displayDocTitle: true, fullScreen: true },
}
const out3 = await applySettingsToPdf(input, settings3)
const doc3 = await PDFDocument.load(out3)
console.log('\n--- Test 3: apply=false everywhere -> untouched ---')
console.log('Title (expect undefined):', doc3.getTitle())
console.log('PageMode (expect undefined):', doc3.catalog.get(PDFName.of('PageMode')))
console.log('PageLayout (expect undefined):', doc3.catalog.get(PDFName.of('PageLayout')))
console.log('ViewerPreferences (expect undefined):', doc3.catalog.get(PDFName.of('ViewerPreferences')))

console.log('\nAll tests executed without throwing.')
