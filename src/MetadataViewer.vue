<template>
    <v-card>
    <!-- Header: Titel -->
    <v-card-title class="d-flex justify-space-between align-center">
      <div class="title-text px-4 text-h5 font-weight-bold">
        {{ 'Metadaten: ' + (metadata?.properties?.title || 'Metadaten') }}
      </div>
    </v-card-title>

    <!-- Keywords + Lizenz -->
    <div class="d-flex justify-space-between align-start mb-4 keywords-license px-4 py-2">
      <!-- Keywords links -->
      <div class="keywords">
        <VChip
          v-for="(kw, idx) in metadata?.properties?.keywords || []"
          :key="idx"
          style="background-color: base-lighten-3; color: blue;"
          variant="tonal"
        >
          {{ kw }}
        </VChip>
      </div>

      <!-- Lizenz rechts -->
      <div class="license">        
        <VChip
          v-if="licenseLink"
          :href="licenseLink"
          target="_blank"
          variant="tonal"
          style="background-color: base-lighten-3; color: red;"
          class="license-chip"
        >
          <VIcon left class="icon-bold">mdi-copyright</VIcon>
        </VChip>
        <span v-else>–</span>
      </div>
    </div>

    <!-- Inhalt: Metadaten direkt -->
    <v-card-text class="pa-4">
      <div v-if="metadata">
        <!-- Beschreibung -->
        <p>{{ metadata.properties.description }}</p>

        <!-- Kontakte (nur Publisher) -->
        <div v-if="publisher" class="d-flex justify-center pa-4">
          <v-list dense class="publisher-list">
            <v-list-item class="d-flex flex-column align-center">
              <v-list-item-content class="text-center">
                <v-list-item-subtitle v-if="publisher.organization">{{ publisher.organization }}</v-list-item-subtitle>
                <v-list-item-title v-if="publisher.name">{{ publisher.name }}</v-list-item-title>
                <v-list-item-subtitle v-if="publisher.emails?.length">
                  <v-chip
                    v-for="(email, i) in publisher.emails"
                    :key="i"
                    color="primary"
                    variant="tonal"
                    large
                    class="email-chip"
                    clickable
                    :href="`mailto:${email.value}`"
                    target="_blank"
                  >
                    <VIcon left class="icon-bold">mdi-email</VIcon>
                    {{email.value }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </div>
        <p v-else class="text-center">Keine Publisher-Kontakte vorhanden</p>
      </div>

      <!-- Ladeindikator -->
      <div v-else class="text-center pa-4">
        <div>Lade Metadaten...</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import 'vuetify/styles';
import {
    VSheet,
    VDivider,
    VIcon,
    VCard,
    VCardText,
    VChip
  } from 'vuetify/components';

const props = defineProps({
    infoUrl: {type: String, required: true}
});

const metadata = ref(null);


const openDialog = async () => {
  if (!metadata.value) {
    try {
      const res = await fetch(props.infoUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      metadata.value = await res.json();
    } catch (err) {
      console.error('Fehler beim Laden der Metadaten:', err);
    }
  }
};
openDialog();


const publisher = computed(() => {
  if (!metadata.value?.properties?.contacts) return null;
  return metadata.value.properties.contacts.find(c => c.roles?.includes('publisher'));
});

const licenseLink = computed(() => {
  if (!metadata.value?.links) return null;
  const link = metadata.value.links.find(l => l.rel === 'license');
  return link?.href || null;
});
</script>

<style>
.title-text {
  word-break: break-word;
  overflow-wrap: break-word;
  flex: 1 1 auto;
  white-space: normal; /* erlaubt Zeilenumbruch */
}

.keywords-license {
  flex-wrap: wrap; /* erlaubt Zeilenumbruch bei vielen Keywords */
  align-items: flex-start; /* oberste Keyword-Zeile auf Höhe Lizenz */
}

/* Keywords links */
.keywords {
  display: flex;
  flex-wrap: wrap;
  max-width: 70%; /* Platz für Lizenz rechts */
}

/* Lizenz rechts */
.license {
  display: flex;
  align-items: center; /* vertikal zentriert */
  justify-content: flex-end;
  min-width: 30%;
}

/* größere Chips */
.custom-chip, .license-chip {
  font-size: 1rem;
  padding: 8px 16px;
}

/* fettes Icon */
.icon-bold {
  font-weight: bold;
  font-size: 1.2em;
}

/* Publisher-Kontakt */
.publisher-list .v-list-item-title {
  margin: 0.2rem 0;
  font-weight: bold;
}

.publisher-list .v-list-item-subtitle {
  font-size: 0.9rem;
  color: #555;
}
</style>