const RDF_LI_TAG = 'rdf:li'

function replaceOrCreateDublinCoreField(document, description, tagName, containerTagName, value, liAttributes) {
  const existing = document.getElementsByTagName(tagName)[0]
  const items = existing ? existing.getElementsByTagName(RDF_LI_TAG) : []

  if (items.length > 0) {
    for (const item of items) {
      item.textContent = value
    }
    return
  }

  existing?.remove()

  const field = document.createElement(tagName)
  const container = document.createElement(containerTagName)
  const li = document.createElement(RDF_LI_TAG)
  for (const [name, attributeValue] of Object.entries(liAttributes)) {
    li.setAttribute(name, attributeValue)
  }
  li.textContent = value
  container.appendChild(li)
  field.appendChild(container)
  description.appendChild(field)
}

/**
 * Patches dc:creator/dc:title inside an existing XMP metadata stream in place,
 * leaving every other XMP property (PDF/A tags, custom properties, ...)
 * untouched. Returns null when the stream can't be parsed as XML, so the
 * caller can fall back to dropping it instead of shipping a document where
 * XMP and /Info disagree.
 */
export function updateXmpDublinCoreFields(xmpBytes, { title, author }) {
  const xmpText = new TextDecoder().decode(xmpBytes)
  const document = new DOMParser().parseFromString(xmpText, 'application/xml')

  if (document.getElementsByTagName('parsererror').length > 0) {
    return null
  }

  const description = document.getElementsByTagName('rdf:Description')[0]
  if (!description) {
    return null
  }

  if (author !== undefined) {
    replaceOrCreateDublinCoreField(document, description, 'dc:creator', 'rdf:Seq', author, {})
  }
  if (title !== undefined) {
    replaceOrCreateDublinCoreField(document, description, 'dc:title', 'rdf:Alt', title, { 'xml:lang': 'x-default' })
  }

  return new TextEncoder().encode(new XMLSerializer().serializeToString(document))
}
