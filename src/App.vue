<script setup>
import { reactive, ref } from 'vue'
import UploadStep from './components/UploadStep.vue'
import PropertiesForm from './components/PropertiesForm.vue'
import ApplyStep from './components/ApplyStep.vue'
import { createDefaultSettings } from './utils/settings'

const version = __APP_VERSION__

let nextId = 1
const files = reactive([])
const settings = ref(createDefaultSettings())

function addFiles(newFiles) {
  for (const file of newFiles) {
    files.push({
      id: nextId++,
      file,
      name: file.name,
      size: file.size,
    })
  }
}

function removeFile(id) {
  const index = files.findIndex((entry) => entry.id === id)
  if (index !== -1) files.splice(index, 1)
}
</script>

<template>
  <h1>PDF Bulk Edit</h1>
  <p class="subtitle">
    Dokumenteigenschaften für mehrere PDF-Dateien gleichzeitig setzen — alles läuft
    lokal im Browser, Ihre Dateien verlassen nie dieses Gerät.
  </p>

  <UploadStep :files="files" @add-files="addFiles" @remove-file="removeFile" />
  <PropertiesForm v-model="settings" />
  <ApplyStep :files="files" :settings="settings" />

  <footer>
    <p>Version: {{ version }}</p>
  </footer>
</template>
