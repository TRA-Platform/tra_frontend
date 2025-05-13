<script setup>
import { capitalize, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
  if (!dateString) return t('projects.details.not_set')
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
  'en': t('projects.languages.english'),
  'ru': t('projects.languages.russian'),
  'de': t('projects.languages.german'),
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

              <VCardTitle>{{ t('projects.details.project_overview') }}</VCardTitle>

              <template #append>
                <VChip
                  size="small"
                  :color="statusColor"
                  label
                >
                  {{ t(`projects.status.${project.status}`) }}
                </VChip>
              </template>
            </VCardItem>

            <VDivider />

            <VCardText>
              <div class="d-flex flex-column gap-2">
                <div class="d-flex align-center">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">{{ t('projects.details.created_at') }}:</span>
                  <span>{{ formattedDate(project.created_at) }}</span>
                </div>

                <div class="d-flex align-center">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">{{ t('projects.details.updated_at') }}:</span>
                  <span>{{ formattedDate(project.updated_at) }}</span>
                </div>

                <div class="d-flex align-center">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">{{ t('projects.details.type') }}:</span>
                  <VChip size="small">{{ t(`projects.types.${project.type_of_application}`) }}</VChip>
                </div>

                <div class="d-flex align-center">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">{{ t('projects.details.language') }}:</span>
                  <VChip size="small">{{ formatLanguage(project.language) }}</VChip>
                </div>

                <div class="d-flex align-center" v-if="project.deadline">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">{{ t('projects.details.deadline') }}:</span>
                  <span>{{ formattedDate(project.deadline) }}</span>
                </div>

                <div class="d-flex align-center" v-if="project.preliminary_budget">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">{{ t('projects.details.budget') }}:</span>
                  <span>${{ project.preliminary_budget }}</span>
                </div>

                <div class="d-flex align-center" v-if="project.color_scheme">
                  <span class="text-medium-emphasis font-weight-medium me-3" style="min-width: 120px">{{ t('projects.details.color_scheme') }}:</span>
                  <div class="d-flex align-center">
                    <template v-for="(color, index) in project.color_scheme.split(',')" :key="index">
                      <div
                        class="color-swatch rounded me-1"
                        :style="{ backgroundColor: color.trim() }"
                        :title="t('projects.details.color')"
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

              <VCardTitle>{{ t('projects.details.additional_requirements') }}</VCardTitle>
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

              <VCardTitle>{{ t('projects.details.technical_details') }}</VCardTitle>
            </VCardItem>

            <VDivider />

            <VCardText>
              <div class="d-flex flex-column gap-4">
                <div v-if="project.technology_stack">
                  <h6 class="text-subtitle-1 font-weight-bold mb-2">{{ t('projects.details.technology_stack') }}</h6>
                  <div class="whitespace-pre-wrap">{{ project.technology_stack }}</div>
                </div>

                <div v-if="project.operating_system">
                  <h6 class="text-subtitle-1 font-weight-bold mb-2">{{ t('projects.details.operating_system') }}</h6>
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

              <VCardTitle>{{ t('projects.details.description') }}</VCardTitle>
            </VCardItem>

            <VDivider />

            <VCardText>
              <div class="whitespace-pre-wrap mb-4">{{ project.short_description }}</div>

              <div v-if="project.application_description" class="whitespace-pre-wrap">
                <h6 class="text-subtitle-1 font-weight-bold mb-2">{{ t('projects.details.application_description') }}</h6>
                <div>{{ project.application_description }}</div>
              </div>
            </VCardText>
          </VCard>

          <VCard border class="project-info-card" v-if="project.target_users">
            <VCardItem>
              <template #prepend>
                <VIcon color="primary" icon="tabler-users" />
              </template>

              <VCardTitle>{{ t('projects.details.target_users') }}</VCardTitle>
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

              <VCardTitle>{{ t('projects.details.non_functional_requirements') }}</VCardTitle>
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

              <VCardTitle>{{ t('projects.details.priority_modules') }}</VCardTitle>
            </VCardItem>

            <VDivider />

            <VCardText>
              <div class="whitespace-pre-wrap">{{ project.priority_modules }}</div>
            </VCardText>
          </VCard>

          <VCard border class="project-info-card" v-if="project.generation_progress">
            <VCardItem>
              <template #prepend>
                <VAvatar
                  color="info"
                  variant="tonal"
                  rounded
                  size="42"
                >
                  <VIcon icon="tabler-info-circle" />
                </VAvatar>
              </template>

              <VCardTitle>{{ t('projects.details.generation_status') }}</VCardTitle>
            </VCardItem>

            <VDivider />

            <VCardText>
              <div class="d-flex flex-column gap-3">
                <div>
                  <div class="font-weight-medium mb-1">{{ t('projects.details.requirements') }}</div>
                  <VProgressLinear
                    :model-value="project.generation_progress.requirements.status === 'completed' ? 100 : 
                                 project.generation_progress.requirements.status === 'in_progress' ? 50 : 
                                 project.generation_progress.requirements.status === 'pending' ? 10 : 0"
                    :color="project.generation_progress.requirements.status === 'completed' ? 'success' : 
                           project.generation_progress.requirements.status === 'in_progress' ? 'info' : 
                           project.generation_progress.requirements.status === 'failed' ? 'error' : 'warning'"
                    height="8"
                    rounded
                  ></VProgressLinear>
                  <div class="d-flex justify-space-between mt-1">
                    <small>{{ t(`projects.details.${project.generation_progress.requirements.status}`) }}</small>
                    <small>{{ project.requirements ? project.requirements.length : 0 }} {{ t('projects.details.requirements_count') }}</small>
                  </div>
                </div>
                
                <div>
                  <div class="font-weight-medium mb-1">{{ t('projects.details.user_stories') }}</div>
                  <VProgressLinear
                    :model-value="project.generation_progress.user_stories.total > 0 ? 
                                 (project.generation_progress.user_stories.completed / project.generation_progress.user_stories.total * 100) : 0"
                    color="info"
                    height="8"
                    rounded
                  ></VProgressLinear>
                  <div class="d-flex justify-space-between mt-1">
                    <small>{{ project.generation_progress.user_stories.completed }} {{ t('projects.details.completed') }}</small>
                    <small>{{ project.generation_progress.user_stories.total }} {{ t('projects.details.total') }}</small>
                  </div>
                </div>
                
                <div>
                  <div class="font-weight-medium mb-1">{{ t('projects.details.mockups') }}</div>
                  <div class="d-flex align-center gap-2">
                    <div class="flex-grow-1">
                      <VProgressLinear
                        :model-value="project.mockups && project.mockups.length ? 
                                     (project.mockups.filter(m => m.generation_status === 'completed' && !m.needs_regeneration).length / project.mockups.length * 100) : 0"
                        color="success"
                        height="8"
                        rounded
                      ></VProgressLinear>
                    </div>
                    <div>
                      <VChip
                        v-if="project.mockups && project.mockups.some(m => m.needs_regeneration || m.generation_status === 'in_progress' || m.generation_status === 'pending')"
                        color="warning"
                        size="small"
                        label
                        prepend-icon="tabler-refresh"
                      >
                        {{ project.mockups.filter(m => m.needs_regeneration || m.generation_status === 'in_progress' || m.generation_status === 'pending').length }} {{ t('projects.details.pending') }}
                      </VChip>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div class="font-weight-medium mb-1">{{ t('projects.details.uml_diagrams') }}</div>
                  <VProgressLinear
                    :model-value="project.generation_progress.uml_diagrams.total > 0 ? 
                                 (project.generation_progress.uml_diagrams.completed / project.generation_progress.uml_diagrams.total * 100) : 0"
                    color="primary"
                    height="8"
                    rounded
                  ></VProgressLinear>
                  <div class="d-flex justify-space-between mt-1">
                    <small>{{ project.generation_progress.uml_diagrams.completed }} {{ t('projects.details.completed') }}</small>
                    <small>{{ project.generation_progress.uml_diagrams.total }} {{ t('projects.details.total') }}</small>
                  </div>
                </div>
              </div>
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
