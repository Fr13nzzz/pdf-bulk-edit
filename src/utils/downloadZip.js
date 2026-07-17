import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export async function downloadAsZip(results, zipFileName = 'pdf-bulk-edit.zip') {
  const zip = new JSZip()
  const usedNames = new Set()

  for (const { name, bytes } of results) {
    let finalName = name
    let counter = 1
    while (usedNames.has(finalName)) {
      const dotIndex = name.lastIndexOf('.')
      finalName = dotIndex === -1
        ? `${name} (${counter})`
        : `${name.slice(0, dotIndex)} (${counter})${name.slice(dotIndex)}`
      counter += 1
    }
    usedNames.add(finalName)
    zip.file(finalName, bytes)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, zipFileName)
}
