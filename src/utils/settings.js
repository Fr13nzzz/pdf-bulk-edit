export const PAGE_MODE_OPTIONS = [
  { value: 'UseNone', label: 'Nur Seite' },
  { value: 'UseOutlines', label: 'Lesezeichen und Seite' },
  { value: 'UseThumbs', label: 'Seiten und Seite' },
  { value: 'UseAttachments', label: 'Anlagen und Seite' },
]

export const PAGE_LAYOUT_OPTIONS = [
  { value: '', label: 'Standard (Vorgabe des Anzeigeprogramms)' },
  { value: 'SinglePage', label: 'Einzelne Seite' },
  { value: 'OneColumn', label: 'Fortlaufend' },
  { value: 'TwoColumnLeft', label: 'Doppelseiten fortlaufend' },
  { value: 'TwoPageLeft', label: 'Doppelseiten' },
]

export function createDefaultSettings() {
  return {
    title: { apply: false, value: '' },
    author: { apply: false, value: '' },
    pageMode: { apply: false, value: 'UseNone' },
    pageLayout: { apply: false, value: '' },
    viewerPrefs: {
      apply: false,
      fitWindow: false,
      centerWindow: false,
      displayDocTitle: false,
      fullScreen: false,
    },
  }
}
