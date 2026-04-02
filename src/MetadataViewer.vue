<template>
  <v-card>
    <!-- Zentraler Div, der die geladenen Daten beinhaltet-->
    <div v-if="metadata.title">
    <!-- Header: Titel -->
    <v-card-title class="d-flex justify-space-between align-center">
      <div class="title-text px-4 text-h7 font-weight-bold">
        {{ metadata.title || 'Metadaten' }}
      </div>
    </v-card-title>
    <!-- Keywords + Lizenz -->
    <div class="d-flex justify-space-between align-start mb-4 keywords-license px-4 py-2">
      <!-- Keywords links -->
      <div class="keywords">
        <VChip
          v-for="(kw, idx) in metadata.tags || []"
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
          v-if="metadata.license"
          :href="metadata.license"
          target="_blank"
          variant="tonal"
          style="background-color: base-lighten-3; color: red;"
          class="license-chip"
        >
          <VIcon class="icon-bold">mdi-copyright</VIcon>
        </VChip>
      <!--<span v-else>–</span>-->
      </div>
    </div>

    <!-- Inhalt: Metadaten direkt -->
    <v-card-text class="pa-4">
      <div v-if="metadata">
        <!-- Beschreibung -->
        <p>{{ metadata.description }}</p>

        <!-- Autoren -->
        <div v-if="metadata.authors" class="d-flex justify-left py-4">
          <v-list class="author-list">
            <v-list-item class="d-flex flex-column align-center">
              <v-list-item-title v-if="metadata.authors[0]">Autoren:</v-list-item-title>
              <v-list-item-title v-else >Keine Autoreninformationen vorhanden</v-list-item-title>
              <v-list-item v-for=" author in metadata.authors ">Name: {{ author.author_name }} <br> E-Mail: {{ author.author_mail }} <br> Organisation: {{ author.author_organization }} </v-list-item>
            </v-list-item>
          </v-list>
        </div>

        <!-- Kontakte (nur Publisher) -->
        <div v-if="metadata.publisher_organization" class="d-flex justify-left pa-4">
          <v-list dense class="publisher-list">
            <v-list-item class="d-flex flex-column align-center">
              <v-list-item-subtitle v-if="metadata.publisher_organization">{{ metadata.publisher_organization }}</v-list-item-subtitle>
              <v-list-item-title v-if="metadata.publisher_name">{{ metadata.publisher_name }}</v-list-item-title>
              <v-list-item-subtitle v-if="metadata.publisher_email">
                <v-chip
                  color="primary"
                  variant="tonal"
                  class="email-chip"
                  :href="`mailto:${metadata.publisher_email}`"
                  target="_blank"
                >
                  <VIcon class="icon-bold">mdi-email</VIcon>
                  &nbsp;{{ metadata.publisher_email }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>
      </div>
      
    
    </v-card-text>
  </div>
  <!-- Ladeindikator statt des Zentralen Div-->
  <div v-else class="text-center pa-4">
    <div>Lade Metadaten...</div>
  </div>
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
import { toString } from 'ol/transform';

const props = defineProps({
  infoUrl: { type: String, required: true }
});

const metadata = ref();
metadata.value = []

const jsonObject = ref();
jsonObject.value = {
  "title": "",
  "description": "",
  "publisher_organization": "",
  "publisher_email": "",
  "license":"",
  "tags": [],
  "authors": [],
  "last_update":"",
  "update_frequency":""   
};



// request function to get json from api
async function request(requestURL){
  const response = await fetch(requestURL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data
}

async function openDialog(){
  try {
    let requestURL;
    if (props.infoUrl.startsWith("recordapi:")) {
      requestURL = props.infoUrl.replace("recordapi:", "");
      const metadataResponse = await request(requestURL)
      console.log( metadataResponse);
      jsonObject.value.title = metadataResponse.properties.title || "Metadaten";
      jsonObject.value.description = metadataResponse.properties.description;
      jsonObject.value.license = metadataResponse.properties.license;
      for (const tag of metadataResponse.properties.keywords){
        jsonObject.value.tags.push(tag)
      };

      if (metadataResponse?.properties?.contacts) {
        const publisher = metadataResponse.properties.contacts.find(c => c.roles?.includes('publisher'));
        if (publisher) {
          jsonObject.value.publisher_organization = publisher?.organization;
          //jsonObject.publisher_name = publisher?.name || null;
          jsonObject.value.publisher_email = publisher?.emails?.[0]?.value || null;
        }
      };

      metadata.value = jsonObject.value
      console.log(jsonObject)
      // TODO: Add Authors from repository


    } else if (props.infoUrl.startsWith("datenwerft:")) {

        requestURL = props.infoUrl.replace("datenwerft:", "");
        const requestData = await request(requestURL)
        //console.log(requestData)

        // get title/description info
        jsonObject.value.title = requestData.title
        jsonObject.value.description = requestData.description

        // get publisher info
        const requestURLPublisher = requestData.publishers[0]
        const json_publisher_data = await request(requestURLPublisher)
        jsonObject.value.publisher_email = json_publisher_data.email
        const requestURLPublisherOrganization = json_publisher_data.organization
        const json_publisher_organization_data = await request(requestURLPublisherOrganization)
        jsonObject.value.publisher_organization = json_publisher_organization_data.title

        // get license info
        const requestURLLegal = requestData.legal
        const json_legal_data = await request(requestURLLegal)
        const requestURLLicense = json_legal_data.license
        const json_license_data = await request(requestURLLicense)
        jsonObject.value.license = json_license_data.code

        // get tags info
        const requestURLTags = requestData.tags
        for (const tag of requestURLTags){
          const json_tags_data = await request(tag)
          jsonObject.value.tags.push(json_tags_data.title)
        }

        // get repo/update info
        const requestURLRepo = requestData.repositories
        const json_repo_data = await request(requestURLRepo)
        jsonObject.last_update = json_repo_data.last_update
        const requestURLUpdateFrequency = json_repo_data.update_frequency
        const json_updateFrequency_data = await request(requestURLUpdateFrequency)
        jsonObject.value.update_frequency = json_updateFrequency_data.title
       
        // get authors info
        const requestURLAuthors = json_repo_data.authors
        for (const author of requestURLAuthors){
          const authorJSON = {
            "author_name":"",
            "author_mail":"",
            "author_organization":"",
          };
          const json_author_data = await request(author)
          authorJSON.author_name = json_author_data.first_name+" "+json_author_data.last_name
          authorJSON.author_mail = json_author_data.email
          const json_author_organization_data = await request(json_author_data.organization)
          authorJSON.author_organization = json_author_organization_data.title
          jsonObject.value.authors.push(authorJSON)
        }
         
        
        console.log(jsonObject)
        metadata.value = jsonObject.value

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