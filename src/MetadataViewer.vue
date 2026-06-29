<template>
  <v-card class="overflow-y-auto">
    <!-- Zentraler Div, der die geladenen Daten beinhaltet-->
    <div v-if="metadata.title">
      <!-- Header: Titel -->
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="title-text px-4 text-h7 font-weight-bold">
          {{ metadata.title || 'Metadaten' }}
        </div>
        <!-- Lizenz rechts -->
        <div class="license">
          <VChip
            v-if="metadata.license"
            :href="metadata.license"
            target="_blank"
            variant="tonal"
            style="background-color: rgb(209, 5, 12); color: rgb(var(--v-theme-base-lighten-5));"
            class="license-chip"
          >
            <VIcon class="icon-bold">mdi-copyright</VIcon>
          </VChip>
        </div>
      </v-card-title>
      <!-- Keywords + Lizenz -->
      <div class="d-flex justify-space-between align-start mb-2 keywords-license px-4 py-2">
        <!-- Keywords links -->
        <div class="keywords">
          <VChip
            v-for="(kw, idx) in metadata.tags || []"
            :key="idx"
            style="color: rgb(var(--v-theme-primary)); padding: 8px; margin: 2px;"
            variant="outlined"
          >
            {{ kw }}
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
            <div dense class="publisher-list">
              <div class="d-flex flex-column align-center">
                <p v-if="metadata.publisher_organization">{{ metadata.publisher_organization }}</p>
                <p v-if="metadata.publisher_name">{{ metadata.publisher_name }}</p>
                <p v-if="metadata.publisher_email">
                  <v-chip
                    variant="tonal"
                    class="email-chip"
                    :href="`mailto:${metadata.publisher_email}`"
                    target="_blank"
                  >
                    <VIcon class="icon-bold">mdi-email</VIcon>
                    &nbsp;{{ metadata.publisher_email }}
                  </v-chip>
                </p>
              </div>
            </div>
          </div>

          <!-- Dienstverlinkungen -->
          <hr><br>
          <div v-if="metadata.links" class="d-flex justify-left align-center pa-2 flex-wrap ">
            
            <div class="d-flex justify-space-between align-start">
                <VChip
                v-for="(service, idx) in metadata.links || []"
                :key="idx"
                :href="service.link"
                target="_blank"
                variant="tonal"
                class="link-chip"
              >
               {{ service.type }}
              </VChip>
            </div>
            <div v-if="metadata.opendata">
              <VChip
                :href="metadata.opendata"
                target="_blank"
                variant="tonal"
                class="link-chip"
              >
               OpenData
              </VChip>
            </div>
          </div>

          <!-- Datenquellen -->
          <div v-if="metadata.repositories[0]">
            <br><hr><br>
            <div v-for="(repository, repo_index) in metadata.repositories" :key="repo_index">
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
              <!--<div v-if="repository.authors" class="d-flex justify-left py-4">-->
              <div v-if="repository.authors">  
                <v-list class="author-list">
                <v-list-item-title><span class="highlight">Autoren:</span></v-list-item-title>
                  <v-list-item v-for="(author, author_index) in repository.authors" :key="author_index">
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
            </div>
          </div>
          <div v-else class="text-center pa-4">
            <p>Keine Informationen zur Datenquelle verfügbar</p>
          </div>
        </div>
      </v-card-text>
    </div>
  
  
    <!-- Statusindikator und Fallback statt des Zentralen Div-->
    <div v-else class="text-center pa-4">
      <div v-if="status == 'Lade Metadaten...'">
        <v-progress-circular color="primary" indeterminate style="margin: 5px;"></v-progress-circular>
        <div>{{status}}</div>
      </div>
      <div v-else> {{status}} </div>
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
  VProgressCircular,
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
  "links":[],
  "serviceType":"",
  "opendata":"",
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
      //console.log( metadataResponse);
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
      //console.log(jsonObject)
      // TODO: Add Authors from repository


    } else if (props.infoUrl.startsWith("datenwerft:")) {

        requestURL = props.infoUrl.replace("datenwerft:", "");
        const topicData = await request(requestURL)
        //console.log(topicData)
        const service = topicData.services[1]
        const requestData = await request(service)
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

        // get links and service types
        for (const serviceLink of topicData.services){
          const service = {
            "link": "",
            "type": ""
          }
          const serviceData = await request(serviceLink)
          if (!(serviceData.link.includes("inspire"))&&(serviceData.type.includes("WMTS"))){
          service.type = "WMTS"
          }else if((serviceData.link.includes("inspire"))&&(serviceData.type.includes("WMTS"))){
          service.type = "INSPIRE WMTS"  
          }
          if (!(serviceData.link.includes("inspire"))&&(serviceData.type.includes("WFS"))){
          service.type = "WFS"
          }else if((serviceData.link.includes("inspire"))&&(serviceData.type.includes("WFS"))){
          service.type = "INSPIRE WFS"
          }
          if (!(serviceData.link.includes("inspire"))&&(serviceData.type.includes("WMS"))&&(!(serviceData.type.includes("WMTS")))){
          service.type = "WMS"
          }else if((serviceData.link.includes("inspire"))&&(serviceData.type.includes("WMS"))&&(!(serviceData.type.includes("WMTS")))){
          service.type = "INSPIRE WMS"  
          }
          if (serviceData.type.includes("OGC API - Features")){
          service.type = "OGC API - Features"  
          }
          if (serviceData.type.includes("WCS")){
          service.type = "WCS"  
          }
          service.link = serviceData.link
          jsonObject.value.links.push(service)
        }
      
        //OpenData
        if (topicData.datasets[1]){
          const opendataData = await request(topicData.datasets[0])
          const opendataName = opendataData.name
          const opendataURL = "https://www.opendata-hro.de/dataset/"+opendataName.split(".")[0]
          jsonObject.value.opendata = opendataURL
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
  max-width: 100%;
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
  color: rgb(var(--v-theme-base-primary));
}

.email-chip{
  background-color: rgb(var(--v-theme-base-lighten-3)); 
  margin-top: 3px;
}

.link-chip {
  display: flex;
  flex-wrap: wrap;
  max-width: 100%;
  background-color: rgb(var(--v-theme-primary)); 
  color: rgb(var(--v-theme-base-lighten-5));
  padding: 6px;
  margin: 2px;
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
tr:nth-child(even) {background-color:rgb(var(--v-theme-base-lighten-3));}

</style>