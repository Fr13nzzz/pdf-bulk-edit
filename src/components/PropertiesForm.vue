<script setup>
import { computed } from 'vue'
import { PAGE_MODE_OPTIONS, PAGE_LAYOUT_OPTIONS } from '../utils/settings'

const settings = defineModel({ required: true })

const pageModeDisabled = computed(
  () => !settings.value.pageMode.apply || (settings.value.viewerPrefs.apply && settings.value.viewerPrefs.fullScreen),
)
</script>

<template>
  <section class="card">
    <h2>2. Dokumenteigenschaften</h2>

    <h3>Beschreibung</h3>
    <div class="field-group">
      <div class="field-body">
        <label class="field-label">Titel</label>
        <input v-model="settings.title.value" type="text" placeholder="z. B. Jahresbericht 2026" />
      </div>
    </div>
    <div class="field-group">
      <div class="field-body">
        <label class="field-label">Verfasser</label>
        <input v-model="settings.author.value" type="text" placeholder="z. B. Max Mustermann" />
      </div>
    </div>

    <h3>Ansicht beim Öffnen</h3>
    <div class="field-group">
      <input v-model="settings.pageMode.apply" type="checkbox" class="apply-toggle" title="Übernehmen" />
      <div class="field-body">
        <label class="field-label">Navigationsregisterkarte</label>
        <select v-model="settings.pageMode.value" :disabled="pageModeDisabled">
          <option v-for="opt in PAGE_MODE_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <p v-if="settings.viewerPrefs.apply && settings.viewerPrefs.fullScreen" class="hint">
          Deaktiviert, solange „Im Vollbildmodus öffnen" aktiv ist.
        </p>
      </div>
    </div>

    <div class="field-group">
      <input v-model="settings.pageLayout.apply" type="checkbox" class="apply-toggle" title="Übernehmen" />
      <div class="field-body">
        <label class="field-label">Seitenlayout</label>
        <select v-model="settings.pageLayout.value" :disabled="!settings.pageLayout.apply">
          <option v-for="opt in PAGE_LAYOUT_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="field-group">
      <input v-model="settings.viewerPrefs.apply" type="checkbox" class="apply-toggle" title="Übernehmen" />
      <div class="field-body">
        <label class="field-label">Fensteroptionen</label>
        <div class="checkbox-row">
          <input
            id="fitWindow"
            v-model="settings.viewerPrefs.fitWindow"
            type="checkbox"
            :disabled="!settings.viewerPrefs.apply"
          />
          <label for="fitWindow">Fenster an Anfangsseite anpassen</label>
        </div>
        <div class="checkbox-row">
          <input
            id="centerWindow"
            v-model="settings.viewerPrefs.centerWindow"
            type="checkbox"
            :disabled="!settings.viewerPrefs.apply"
          />
          <label for="centerWindow">Fenster auf Bildschirm zentrieren</label>
        </div>
        <div class="checkbox-row">
          <input
            id="displayDocTitle"
            v-model="settings.viewerPrefs.displayDocTitle"
            type="checkbox"
            :disabled="!settings.viewerPrefs.apply"
          />
          <label for="displayDocTitle">Dokumenttitel als Fenstertitel verwenden</label>
        </div>
        <div class="checkbox-row">
          <input
            id="fullScreen"
            v-model="settings.viewerPrefs.fullScreen"
            type="checkbox"
            :disabled="!settings.viewerPrefs.apply"
          />
          <label for="fullScreen">Im Vollbildmodus öffnen</label>
        </div>
        <p class="hint">
          „Im Vollbildmodus öffnen" hat Vorrang vor der Navigationsregisterkarte-Auswahl,
          da beide denselben PDF-Schlüssel (<code>/PageMode</code>) verwenden.
        </p>
      </div>
    </div>
  </section>
</template>
