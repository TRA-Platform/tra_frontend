<script setup>
import { capitalize, computed } from 'vue'

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const formattedDate = (dateString) => {
  if (!dateString) return 'Not set'
  const date = new Date(parseInt(dateString))
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const statusColor = computed(() => {
  switch (props.project.status) {
    case 'draft': return 'warning'
    case 'active': return 'success'
    case 'archived': return 'secondary'
    case 'completed': return 'info'
    default: return 'primary'
  }
})

const typeIcon = computed(() => {
  switch (props.project.type_of_application) {
    case 'website': return 'tabler-world-www'
    case 'mobile': return 'tabler-device-mobile'
    case 'desktop': return 'tabler-device-desktop'
    case 'api': return 'tabler-api'
    default: return 'tabler-code'
  }
})

const languageMap = {
  'en': 'English',
  'ru': 'Russian',
  'de': 'German'
}

const formatLanguage = (code) => {
  return languageMap[code] || code
}
</script>

<template>
  <VCardText class="pa-6">
    <VRow>
      <VCol cols="12" md="6">
        <div class="d-flex flex-column gap-4">
          <VCard border class="project-info-card">
            <VCardItem>
              <template #prepend>
                <VAvatar
                  color="primary"
                  variant="tonal"
                  rounded
                  size="42"
                >
                  <VIcon :icon="typeIcon" />
                </VAvatar>
              </template>

              <VCardTitle>Project Overview</VCardTitle>

              <template #append>
                <VChip
                  size="small"
                  :color="statusColor"
                  label
                >
                  {{ capitalize(project.status) }}
                </VChip>
              </template>
            </VCardItem>

            <VDivider />

            <VCardText>
              <div class="d-flex flex-column gap-2">
                <div class="d-flex align-center">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">Created:</span>
                  <span>{{ formattedDate(project.created_at) }}</span>
                </div>

                <div class="d-flex align-center">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">Last Updated:</span>
                  <span>{{ formattedDate(project.updated_at) }}</span>
                </div>

                <div class="d-flex align-center">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">Type:</span>
                  <VChip size="small">{{ project.type_of_application }}</VChip>
                </div>

                <div class="d-flex align-center">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">Language:</span>
                  <VChip size="small">{{ formatLanguage(project.language) }}</VChip>
                </div>

                <div class="d-flex align-center" v-if="project.deadline">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">Deadline:</span>
                  <span>{{ formattedDate(project.deadline) }}</span>
                </div>

                <div class="d-flex align-center" v-if="project.preliminary_budget">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">Budget:</span>
                  <span>${{ project.preliminary_budget }}</span>
                </div>

                <div class="d-flex align-center" v-if="project.color_scheme">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">Color Scheme:</span>
                  <div class="d-flex align-center">
                    <template v-for="(color, index) in project.color_scheme.split(',')" :key="index">
                      <div
                        class="color-swatch rounded me-1"
                        :style="{ backgroundColor: color.trim() }"
                        title="color"
                      ></div>
                    </template>
                    <span class="ms-2">{{ project.color_scheme }}</span>
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>

          <VCard border class="project-info-card" v-if="project.additional_requirements">
            <VCardItem>
              <template #prepend>
                <VIcon color="primary" icon="tabler-list-details" />
              </template>

              <VCardTitle>Additional Requirements</VCardTitle>
            </VCardItem>

            <VDivider />

            <VCardText>
              <div class="whitespace-pre-wrap">{{ project.additional_requirements }}</div>
            </VCardText>
          </VCard>

          <VCard border class="project-info-card" v-if="project.technology_stack || project.operating_system">
            <VCardItem>
              <template #prepend>
                <VIcon color="primary" icon="tabler-device-laptop-code" />
              </template>

              <VCardTitle>Technical Details</VCardTitle>
            </VCardItem>

            <VDivider />

            <VCardText>
              <div class="d-flex flex-column gap-4">
                <div v-if="project.technology_stack">
                  <h6 class="text-subtitle-1 font-weight-bold mb-2">Technology Stack</h6>
                  <div class="whitespace-pre-wrap">{{ project.technology_stack }}</div>
                </div>

                <div v-if="project.operating_system">
                  <h6 class="text-subtitle-1 font-weight-bold mb-2">Operating System</h6>
                  <div>{{ project.operating_system }}</div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </div>
      </VCol>

      <VCol cols="12" md="6">
        <div class="d-flex flex-column gap-4">
          <VCard border class="project-info-card">
            <VCardItem>
              <template #prepend>
                <VIcon color="primary" icon="tabler-file-description" />
              </template>

              <VCardTitle>Description</VCardTitle>
            </VCardItem>

            <VDivider />

            <VCardText>
              <div class="whitespace-pre-wrap mb-4">{{ project.short_description }}</div>

              <div v-if="project.application_description" class="whitespace-pre-wrap">
                <h6 class="text-subtitle-1 font-weight-bold mb-2">Detailed Description</h6>
                <div>{{ project.application_description }}</div>
              </div>
            </VCardText>
          </VCard>

          <VCard border class="project-info-card" v-if="project.target_users">
            <VCardItem>
              <template #prepend>
                <VIcon color="primary" icon="tabler-users" />
              </template>

              <VCardTitle>Target Users</VCardTitle>
            </VCardItem>

            <VDivider />

            <VCardText>
              <div class="whitespace-pre-wrap">{{ project.target_users }}</div>
            </VCardText>
          </VCard>

          <VCard border class="project-info-card" v-if="project.non_functional_requirements">
            <VCardItem>
              <template #prepend>
                <VIcon color="primary" icon="tabler-chart-bubble" />
              </template>

              <VCardTitle>Non-Functional Requirements</VCardTitle>
            </VCardItem>

            <VDivider />

            <VCardText>
              <div class="whitespace-pre-wrap">{{ project.non_functional_requirements }}</div>
            </VCardText>
          </VCard>

          <VCard border class="project-info-card" v-if="project.priority_modules">
            <VCardItem>
              <template #prepend>
                <VIcon color="primary" icon="tabler-star" />
              </template>

              <VCardTitle>Priority Modules/Features</VCardTitle>
            </VCardItem>

            <VDivider />

            <VCardText>
              <div class="whitespace-pre-wrap">{{ project.priority_modules }}</div>
            </VCardText>
          </VCard>
        </div>
      </VCol>
    </VRow>
  </VCardText>
</template>

<style scoped>
.whitespace-pre-wrap {
  white-space: pre-wrap;
}

.project-info-card {
  height: 100%;
  transition: transform 0.2s, box-shadow 0.2s;
}

.project-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.08) !important;
}

.color-swatch {
  width: 20px;
  height: 20px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
