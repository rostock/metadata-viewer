<template>
  <v-card class="overflow-y-auto">
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
        </div>
      </div>

      <!-- Inhalt: Metadaten direkt -->
      <v-card-text class="pa-4">
        <div v-if="metadata">
          <!-- Beschreibung -->
          <p>{{ metadata.description }}</p>

          <!-- Kontakte (nur Publisher) -->
          <div v-if="metadata.publisher_organization" class="d-flex justify-center pa-4">
            <p dense class="publisher-list">
              <p class="d-flex flex-column align-center">
                <p v-if="metadata.publisher_organization">{{ metadata.publisher_organization }}</p>
                <p v-if="metadata.publisher_name">{{ metadata.publisher_name }}</p>
                <p v-if="metadata.publisher_email">
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
                </p>
              </p>
            </p>
          </div>

          <!-- Datenquellen -->
          <div v-if="metadata.repositories[0]">
            <br><hr><br>
            <p v-for="(repository, repo_index) in metadata.repositories">
              <span class="highlight">Datenquelle:</span><br>
              <table>
                <tbody>
                  <tr>
                    <td>
                      <span class="highlight">Letzte Aktualisierung: </span> 
                    </td>
                    <td>{{ repository.last_update }}</td>
                  </tr>
                  <tr>
                    <td>
                      <span class="highlight">Aktualisierungsfrequenz: </span> 
                    </td>
                    <td>{{ repository.update_frequency }}</td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Autoren -->
              <div v-if="repository.authors" class="d-flex justify-left py-4">
                <v-list class="author-list">
                <v-list-item-title><span class="highlight">Autoren:</span></v-list-item-title>
                  <v-list-item v-for=" author in repository.authors ">
                      <table>
                        <tbody>
                          <tr>
                            <td><span class="highlight">Name: </span></td><td>{{ author.author_name }}</td>
                          </tr>
                          <tr>
                            <td><span class="highlight">E-Mail: </span></td><td>{{ author.author_mail }}</td>
                          </tr>
                          <tr>
                            <td><span class="highlight">Organisation: </span></td><td>{{ author.author_organization }}</td>
                          </tr>
                        </tbody>
                      </table>
                      <!-- Name: {{ author.author_name }} <br> E-Mail: {{ author.author_mail }} <br> Organisation: {{ author.author_organization }} -->
                    </v-list-item>
                </v-list>
              </div>
              <br><hr><br>
            </p>
          </div>
          <div v-else class="text-center pa-4">
            <p>Keine Informationen zur Datenquelle verfügbar</p>
          </div>
        </div>
      </v-card-text>
    </div>
  
  
    <!-- Statusindikator und Fallback statt des Zentralen Div-->
    <div v-else class="text-center pa-4">
      <div>{{status}}</div>
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
import { VcsDataTable, VcsTable } from '@vcmap/ui';

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
  "repositories": [],
};

let status = ref()
status.value = "Lade Metadaten..."



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
        
      // TODO: Add Handling for multiple repos and display of repo info

        // get repo info 
        const requestURLRepo = requestData.repositories
        for (const repo of requestURLRepo){
          const repository = {
            "authors": [],
            "last_update":"",
            "update_frequency":""
          }

          // get update info
          const json_repo_data = await request(repo)
          // format date to DD/MM/YYYY
          const last_update = new Date(json_repo_data.last_update)
          const date_formated = new Intl.DateTimeFormat("en-GB").format(last_update)        
          repository.last_update = date_formated
          const requestURLUpdateFrequency = json_repo_data.update_frequency
          const json_updateFrequency_data = await request(requestURLUpdateFrequency)
          repository.update_frequency = json_updateFrequency_data.title          
       
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
            repository.authors.push(authorJSON)
            
          }
          // append repostitory to list of repositories of the main metadata object
          jsonObject.value.repositories.push(repository)
        }
         
        
        
        metadata.value = jsonObject.value
        console.log(metadata)

    }
    } catch (err) {
      console.error('Fehler beim Laden der Metadaten:', err);
      status.value = "Keine Metadateninformationen vorhanden."
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

.publisher-list{
  font-size: 0.9rem;
  font-weight: bold;
  color: #555;
}

span.highlight
{
font-weight:bold;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th, td {
  padding: 3px;
  text-align: left;
}
tr:nth-child(even) {background-color: #f2f2f2;}

</style>