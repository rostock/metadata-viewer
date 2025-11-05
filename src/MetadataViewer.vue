<template>
    <v-card>
    <!-- Header: Titel + Close-Button -->
    <v-card-title class="d-flex justify-space-between align-center">
      <div class="title-text">
        {{ 'Metadaten: ' + (metadata?.properties?.title || 'Metadaten') }}
      </div>
      <v-btn icon @click="closeDialog">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <!-- Keywords + Lizenz -->
    <div class="d-flex justify-space-between align-start mb-4 keywords-license px-4">
      <!-- Keywords links -->
      <div class="keywords">
        <v-chip
          v-for="(kw, idx) in metadata?.properties?.keywords || []"
          :key="idx"
          color="secondary"
          variant="tonal"
          class="custom-chip"
        >
          {{ kw }}
        </v-chip>
      </div>

      <!-- Lizenz rechts -->
      <div class="license">
        <v-chip
          v-if="licenseLink"
          :href="licenseLink"
          target="_blank"
          variant="tonal"
          color="primary"
          class="license-chip"
        >
          <v-icon left class="icon-bold">mdi-copyright</v-icon>
        </v-chip>
        <span v-else>–</span>
      </div>
    </div>

    <!-- Inhalt: Metadaten direkt -->
    <v-card-text class="pa-4">
      <div v-if="metadata">
        <!-- Beschreibung -->
        <p>{{ metadata.properties.description }}</p>

        <!-- Kontakte (nur Publisher) -->
        <!-- <p class="text-center"><strong>Kontakt:</strong></p> -->
        <div v-if="publisher" class="d-flex justify-center">
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
                    <v-icon left class="icon-bold">mdi-email</v-icon>
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
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <div>Lade Metadaten...</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import 'vuetify/styles';


const props = defineProps({
    infoUrl: {type: string, required: true}
});


const dialog = ref(false);
const metadata = ref(null);

const METADATA_URL = 'https://geo.sv.rostock.de/metadata/collections/service/items/5b4014de-8d15-4f23-831e-25ea9abec3a7?f=json';

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

const closeDialog = () => {
  dialog.value = false;
};

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