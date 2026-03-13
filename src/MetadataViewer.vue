<template>
  <v-card>
    <!-- Header: Titel -->
    <v-card-title class="d-flex justify-space-between align-center">
      <div class="title-text px-4 text-h7 font-weight-bold">
        {{ jsonObject?.title || 'Metadaten' }}
      </div>
    </v-card-title>

    <!-- Keywords + Lizenz -->
    <div class="d-flex justify-space-between align-start mb-4 keywords-license px-4 py-2">
      <!-- Keywords links -->
      <div class="keywords">
        <VChip
          v-for="(kw, idx) in jsonObject?.tags || []"
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
          v-if="jsonObject.license"
          :href="jsonObject.license"
          target="_blank"
          variant="tonal"
          style="background-color: base-lighten-3; color: red;"
          class="license-chip"
        >
          <VIcon class="icon-bold">mdi-copyright</VIcon>
        </VChip>
        <span v-else>–</span>
      </div>
    </div>

    <!-- Inhalt: Metadaten direkt -->
    <v-card-text class="pa-4">
      <div v-if="jsonObject">
        <!-- Beschreibung -->
        <p>{{ jsonObject?.description }}</p>

        <!-- Kontakte (nur Publisher) -->
        <div v-if="jsonObject.publisher_organization" class="d-flex justify-center pa-4">
          <v-list dense class="publisher-list">
            <v-list-item class="d-flex flex-column align-center">
              <v-list-item-subtitle v-if="jsonObject.publisher_organization">{{ jsonObject.publisher_organization }}</v-list-item-subtitle>
              <v-list-item-title v-if="jsonObject.publisher_name">{{ jsonObject.publisher_name }}</v-list-item-title>
              <v-list-item-subtitle v-if="jsonObject.publisher_email">
                <v-chip
                  color="primary"
                  variant="tonal"
                  class="email-chip"
                  :href="`mailto:${jsonObject.publisher_email}`"
                  target="_blank"
                >
                  <VIcon class="icon-bold">mdi-email</VIcon>
                  &nbsp;{{ jsonObject.publisher_email }}
                </v-chip>
              </v-list-item-subtitle>
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
  VCardTitle,
  VCardText,
  VChip,
  VList,
  VListItem,
  VListItemTitle,
  VListItemSubtitle,
} from 'vuetify/components';

const props = defineProps({
  infoUrl: { type: String, required: true }
});

const metadata = ref(null);

const jsonObject = ref();
jsonObject.value = {
  "title": "",
  "description": "",
  "publisher_organization": "",
  "publisher_email": "",
  "license":"",
  "tags": [],
  "authors": []    
};

const author = {
  "author_name":"",
  "author_mail":"",
  "author_organization":"",
  "last_update":"",
  "update_frequency":""
};

const openDialog = async () => {
  try {
    let requestURL;
    if (props.infoUrl.startsWith("recordapi:")) {
      requestURL = props.infoUrl.replace("recordapi:", "");
      const res = await fetch(requestURL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const metadataResponse = await res.json();
      console.log( metadataResponse);
      jsonObject.value.title = metadataResponse?.properties?.title || "Metadaten";
      jsonObject.value.description = metadataResponse?.properties?.description;
      jsonObject.value.license = metadataResponse?.properties?.license;
      jsonObject.value.tags = metadataResponse?.properties?.keywords;

      if (metadataResponse?.properties?.contacts) {
        const publisher = metadataResponse.properties.contacts.find(c => c.roles?.includes('publisher'));
        console.log("Publisher:", publisher);
        if (publisher) {
          jsonObject.value.publisher_organization = publisher?.organization;
          jsonObject.value.publisher_name = publisher?.name || null;
          jsonObject.value.publisher_email = publisher?.emails?.[0]?.value || null;
        }
      };
      // TODO: Add Authors from repository
    } else if (props.infoUrl.startsWith("capabilities:")) {
      // TODO: capabilities handling
    }
    
    } catch (err) {
      console.error('Fehler beim Laden der Metadaten:', err);
    };
}
openDialog();

</script>

<style>
.title-text {
  word-break: break-word;
  overflow-wrap: break-word;
  flex: 1 1 auto;
  white-space: normal;
}

.keywords-license {
  flex-wrap: wrap;
  align-items: flex-start;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  max-width: 70%;
}

.license {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 30%;
}

.custom-chip, .license-chip {
  font-size: 1rem;
  padding: 8px 16px;
}

.icon-bold {
  font-weight: bold;
  font-size: 1.2em;
}

.publisher-list .v-list-item-title {
  margin: 0.2rem 0;
  font-weight: bold;
}

.publisher-list .v-list-item-subtitle {
  font-size: 0.9rem;
  color: #555;
}
</style>