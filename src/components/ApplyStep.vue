<script setup>
import { ref, computed } from 'vue'
import { applySettingsToPdf } from '../utils/pdfProcessor'
import { downloadAsZip } from '../utils/downloadZip'

const props = defineProps({
  files: {
    type: Array,
    required: true,
  },
  settings: {
    type: Object,
    required: true,
  },
})

const isProcessing = ref(false)
const processedCount = ref(0)
const errors = ref([])
const hasRun = ref(false)

const progressPercent = computed(() => {
  if (!props.files.length) return 0
  return Math.round((processedCount.value / props.files.length) * 100)
})

async function applyAndDownload() {
  isProcessing.value = true
  hasRun.value = true
  processedCount.value = 0
  errors.value = []

  const results = []

  for (const entry of props.files) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const bytes = await applySettingsToPdf(entry.file, props.settings)
      results.push({ name: entry.name, bytes })
    } catch (err) {
      errors.value.push({ name: entry.name, message: err?.message || String(err) })
    }
    processedCount.value += 1
  }

  if (results.length) {
    await downloadAsZip(results)
  }

  isProcessing.value = false
}
</script>

<template>
  <section class="card">
    <h2>3. Anwenden &amp; Download</h2>
    <p class="hint">
      Die eingestellten Eigenschaften werden auf alle {{ files.length }} hochgeladene(n)
      Datei(en) angewendet. Fehlerhafte Dateien werden übersprungen, alle übrigen
      werden gebündelt als ZIP heruntergeladen.
    </p>

    <div v-if="isProcessing" class="progress-bar">
      <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }" />
    </div>
    <p v-if="isProcessing" class="hint">
      Verarbeite Datei {{ processedCount }} von {{ files.length }} …
    </p>

    <div class="actions">
      <button class="primary" :disabled="!files.length || isProcessing" @click="applyAndDownload">
        {{ isProcessing ? 'Wird verarbeitet …' : 'Anwenden' }}
      </button>
    </div>

    <div v-if="hasRun && !isProcessing" class="hint" style="margin-top: 1rem">
      {{ files.length - errors.length }} von {{ files.length }} Datei(en) erfolgreich verarbeitet.
    </div>

    <div v-if="errors.length" class="error-list">
      <strong>Folgende Dateien konnten nicht verarbeitet werden:</strong>
      <ul>
        <li v-for="err in errors" :key="err.name">{{ err.name }}: {{ err.message }}</li>
      </ul>
    </div>
  </section>
</template>
