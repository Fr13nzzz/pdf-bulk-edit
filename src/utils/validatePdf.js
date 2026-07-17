const PDF_HEADER = '%PDF-'

export function hasPdfExtension(file) {
  return file.name.toLowerCase().endsWith('.pdf')
}

export async function hasPdfHeader(file) {
  const headerBytes = await file.slice(0, 5).arrayBuffer()
  const header = new TextDecoder('latin1').decode(new Uint8Array(headerBytes))
  return header === PDF_HEADER
}

export async function isValidPdfFile(file) {
  const mimeOk = file.type === 'application/pdf' || file.type === ''
  const extOk = hasPdfExtension(file)
  if (!mimeOk && !extOk) return false
  return hasPdfHeader(file)
}
