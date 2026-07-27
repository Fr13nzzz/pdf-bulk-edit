import { PDFDocument, PDFName } from 'pdf-lib'
import { DOMParser } from 'linkedom'
import { applySettingsToPdf } from './src/utils/pdfProcessor.js'

// Node has no native DOMParser/XMLSerializer (only browsers do, which is
// where this app actually runs), so linkedom stands in for this manual
// verification script. Its serializer drops the <?xpacket?> wrapper and adds
// an XML declaration where a real browser wouldn't — harmless for the
// assertions below, which only check that specific fields were touched.
globalThis.DOMParser = DOMParser
globalThis.XMLSerializer = class {
  serializeToString(node) {
    return node.toString()
  }
}

async function buildSamplePdf() {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.addPage([200, 200])
  pdfDoc.setAuthor('Old XMP Author')
  pdfDoc.setTitle('Old Title')

  // Simulate a real-world PDF (e.g. exported from Word) that ships an XMP
  // metadata stream alongside the /Info dictionary, including an unrelated
  // custom field, so we can verify the fix patches only dc:creator/dc:title
  // instead of wiping the whole stream.
  const xmp = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:creator><rdf:Seq><rdf:li>Old XMP Author</rdf:li></rdf:Seq></dc:creator>
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">Old Title</rdf:li></rdf:Alt></dc:title>
      <dc:subject><rdf:Bag><rdf:li>ImportantDoc</rdf:li></rdf:Bag></dc:subject>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`
  const metadataStream = pdfDoc.context.stream(xmp, { Type: 'Metadata', Subtype: 'XML' })
  const metadataRef = pdfDoc.context.register(metadataStream)
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef)

  return pdfDoc.save()
}

function hasMetadataStream(pdfDoc) {
  return pdfDoc.catalog.get(PDFName.of('Metadata')) !== undefined
}

function getXmpText(pdfDoc) {
  const ref = pdfDoc.catalog.get(PDFName.of('Metadata'))
  if (!ref) return null
  return new TextDecoder().decode(pdfDoc.context.lookup(ref).getContents())
}

function assertEqual(label, actual, expected) {
  const pass = actual === expected
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label} (actual: ${actual}, expected: ${expected})`)
  return pass
}

const input = await buildSamplePdf()
const results = []

// Test 1: title/author changed -> the XMP stream must survive with dc:creator/
// dc:title patched in place, and unrelated XMP fields must be untouched.
const settings1 = {
  title: { value: 'Testtitel' },
  author: { value: 'Test Autor' },
  pageMode: { apply: true, value: 'UseOutlines' },
  pageLayout: { apply: true, value: 'TwoColumnLeft' },
  viewerPrefs: { apply: true, fitWindow: true, centerWindow: false, displayDocTitle: true, fullScreen: false },
}
const out1 = await applySettingsToPdf(new Blob([input]), settings1)
const doc1 = await PDFDocument.load(out1)
const xmp1 = getXmpText(doc1)
console.log('\n--- Test 1: title/author changed ---')
results.push(assertEqual('Title', doc1.getTitle(), 'Testtitel'))
results.push(assertEqual('Author', doc1.getAuthor(), 'Test Autor'))
results.push(assertEqual('XMP /Metadata preserved (patched, not removed)', hasMetadataStream(doc1), true))
results.push(assertEqual('XMP dc:creator updated', xmp1?.includes('Test Autor'), true))
results.push(assertEqual('XMP dc:title updated', xmp1?.includes('Testtitel'), true))
results.push(assertEqual('XMP old author gone', xmp1?.includes('Old XMP Author'), false))
results.push(assertEqual('XMP old title gone', xmp1?.includes('Old Title'), false))
results.push(assertEqual('XMP unrelated dc:subject preserved', xmp1?.includes('ImportantDoc'), true))
results.push(assertEqual('PageMode', doc1.catalog.get(PDFName.of('PageMode'))?.toString(), '/UseOutlines'))
results.push(assertEqual('PageLayout', doc1.catalog.get(PDFName.of('PageLayout'))?.toString(), '/TwoColumnLeft'))

// Test 2: fullscreen checkbox wins over pageMode dropdown; title/author left
// untouched -> the pre-existing XMP /Metadata stream must be preserved as-is.
const settings2 = {
  title: { value: '' },
  author: { value: '' },
  pageMode: { apply: true, value: 'UseThumbs' },
  pageLayout: { apply: true, value: '' }, // Standard -> omit key
  viewerPrefs: { apply: true, fitWindow: false, centerWindow: true, displayDocTitle: false, fullScreen: true },
}
const out2 = await applySettingsToPdf(new Blob([input]), settings2)
const doc2 = await PDFDocument.load(out2)
const xmp2 = getXmpText(doc2)
console.log('\n--- Test 2: fullscreen wins, pageLayout=Standard omitted, title/author untouched ---')
results.push(assertEqual('PageMode', doc2.catalog.get(PDFName.of('PageMode'))?.toString(), '/FullScreen'))
results.push(assertEqual('PageLayout key present', doc2.catalog.get(PDFName.of('PageLayout')), undefined))
results.push(assertEqual('XMP /Metadata preserved', hasMetadataStream(doc2), true))
results.push(assertEqual('XMP author left untouched', xmp2?.includes('Old XMP Author'), true))

// Test 3: nothing applied -> original PDF fields untouched
const settings3 = {
  title: { value: '' },
  author: { value: '' },
  pageMode: { apply: false, value: 'UseNone' },
  pageLayout: { apply: false, value: 'SinglePage' },
  viewerPrefs: { apply: false, fitWindow: true, centerWindow: true, displayDocTitle: true, fullScreen: true },
}
const out3 = await applySettingsToPdf(new Blob([input]), settings3)
const doc3 = await PDFDocument.load(out3)
console.log('\n--- Test 3: apply=false everywhere -> untouched ---')
results.push(assertEqual('Title', doc3.getTitle(), 'Old Title'))
results.push(assertEqual('PageMode', doc3.catalog.get(PDFName.of('PageMode')), undefined))
results.push(assertEqual('PageLayout', doc3.catalog.get(PDFName.of('PageLayout')), undefined))
results.push(assertEqual('ViewerPreferences', doc3.catalog.get(PDFName.of('ViewerPreferences')), undefined))
results.push(assertEqual('XMP /Metadata preserved', hasMetadataStream(doc3), true))

// Test 4: malformed XMP stream -> can't be patched, must fall back to removing
// it entirely (not throwing, not leaving mismatched values in place).
const malformedPdf = await PDFDocument.create()
malformedPdf.addPage([200, 200])
const malformedStream = malformedPdf.context.stream('not valid xml <<<', { Type: 'Metadata', Subtype: 'XML' })
malformedPdf.catalog.set(PDFName.of('Metadata'), malformedPdf.context.register(malformedStream))
const malformedInput = await malformedPdf.save()

const out4 = await applySettingsToPdf(new Blob([malformedInput]), {
  title: { value: '' },
  author: { value: 'Fallback Autor' },
  pageMode: { apply: false, value: 'UseNone' },
  pageLayout: { apply: false, value: 'SinglePage' },
  viewerPrefs: { apply: false, fitWindow: true, centerWindow: true, displayDocTitle: true, fullScreen: true },
})
const doc4 = await PDFDocument.load(out4)
console.log('\n--- Test 4: malformed XMP -> falls back to removing /Metadata ---')
results.push(assertEqual('Author', doc4.getAuthor(), 'Fallback Autor'))
results.push(assertEqual('XMP /Metadata removed as fallback', hasMetadataStream(doc4), false))

console.log(`\n${results.filter(Boolean).length}/${results.length} assertions passed`)
if (results.includes(false)) {
  process.exit(1)
}
