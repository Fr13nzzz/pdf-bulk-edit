<script setup>
import { ref } from 'vue'
import { isValidPdfFile } from '../utils/validatePdf'

const props = defineProps({
  files: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['add-files', 'remove-file'])

const isDragOver = ref(false)
const fileInput = ref(null)
const rejectedNames = ref([])

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function handleFiles(fileList) {
  const accepted = []
  const rejected = []
  for (const file of Array.from(fileList)) {
    // eslint-disable-next-line no-await-in-loop
    if (await isValidPdfFile(file)) {
      accepted.push(file)
    } else {
      rejected.push(file.name)
    }
  }
  rejectedNames.value = rejected
  if (accepted.length) {
    emit('add-files', accepted)
  }
}

function onInputChange(event) {
  handleFiles(event.target.files)
  event.target.value = ''
}

function onDrop(event) {
  isDragOver.value = false
  handleFiles(event.dataTransfer.files)
}

function openFileDialog() {
  fileInput.value?.click()
}
</script>

<template>
  <section class="card">
    <h2>1. PDF-Dateien hochladen</h2>
    <div
      class="dropzone"
      :class="{ dragover: isDragOver }"
      @click="openFileDialog"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="onDrop"
    >
      <p>Dateien hierher ziehen oder klicken, um auszuwählen</p>
      <p class="hint">Nur .pdf-Dateien werden akzeptiert (Mehrfachauswahl möglich)</p>
      <input
        ref="fileInput"
        type="file"
        accept="application/pdf,.pdf"
        multiple
        @change="onInputChange"
      />
    </div>

    <p v-if="rejectedNames.length" class="hint" style="color: #c0392b">
      Ignoriert (keine gültige PDF-Datei): {{ rejectedNames.join(', ') }}
    </p>

    <ul v-if="files.length" class="file-list">
      <li v-for="entry in files" :key="entry.id">
        <span class="file-name">{{ entry.name }}</span>
        <span class="file-size">{{ formatSize(entry.size) }}</span>
        <button class="remove-btn" title="Entfernen" @click="emit('remove-file', entry.id)">✕</button>
      </li>
    </ul>
    <p v-else class="hint">Noch keine Dateien hochgeladen.</p>
  </section>
</template>
