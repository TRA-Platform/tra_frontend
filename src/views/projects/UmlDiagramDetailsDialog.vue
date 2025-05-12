<script setup>
import { computed, ref, watch } from 'vue'
import { useUmlDiagramStore } from '@/stores/useUmlDiagramStore'
import { getStatusChipColor, renderUML } from "@core/utils/formatters"
import pako from 'pako'
import { Buffer } from "buffer/";
import { useI18n } from 'vue-i18n'

const props = defineProps ({
  modelValue: {
    type: Boolean,
    default: false
  },
  diagram: {
    type: Object,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  hasManagerPermission: {
    type: Boolean,
    default: false
  },
  hasModeratorPermission: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits ([ 'update:modelValue', 'delete', 'regenerate' ])

const dialog = computed ({
  get: () => props.modelValue,
  set: (value) => emit ('update:modelValue', value)
})

const umlDiagramStore = useUmlDiagramStore ()

const isFullscreen = ref (false)
const isEditMode = ref (false)
const editedDiagram = ref ({ ...props.diagram })
const processingAction = ref (false)
const snackbar = ref ({
  show: false,
  text: '',
  color: 'success'
})

const { t } = useI18n()

const statusOptions = [
  { title: t('projects.status.draft'), value: 'draft' },
  { title: t('projects.status.active'), value: 'active' },
  { title: t('projects.status.archived'), value: 'archived' },
  { title: t('projects.status.completed'), value: 'completed' }
]

const formatDate = (dateString) => {
  if (!dateString) return ''
  dateString = parseInt (dateString)
  return new Date (dateString).toLocaleDateString ('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getDiagramTypeDisplay = (type) => {
  switch (type.toLowerCase ()) {
    case 'class':
      return 'Class Diagram'
    case 'sequence':
      return 'Sequence Diagram'
    case 'activity':
      return 'Activity Diagram'
    case 'usecase':
      return 'Use Case Diagram'
    case 'state':
      return 'State Diagram'
    case 'component':
      return 'Component Diagram'
    case 'deployment':
      return 'Deployment Diagram'
    case 'er':
      return 'ER Diagram'
    default:
      return type.charAt (0).toUpperCase () + type.slice (1) + ' Diagram'
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const toggleEditMode = () => {
  if (isEditMode.value) {
    editedDiagram.value = { ...props.diagram }
  }
  isEditMode.value = !isEditMode.value
}

const saveDiagram = async () => {
  processingAction.value = true

  try {
    const { data, error } = await umlDiagramStore.updateDiagram (props.diagram.id, editedDiagram.value)

    if (data && !error) {
      showSnackbar (t('projects.uml_diagrams.notifications.updated'))
      Object.assign (props.diagram, data)
      isEditMode.value = false
    } else {
      showSnackbar (t('projects.uml_diagrams.notifications.update_failed'), 'error')
    }
  } catch (err) {
    showSnackbar (t('projects.uml_diagrams.notifications.update_failed') + ': ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleDeleteDiagram = () => {
  emit ('delete')
}

const handleRegenerateDiagram = async () => {
  processingAction.value = true

  try {
    const { data, error } = await umlDiagramStore.regenerateDiagram (props.diagram.id)

    if (data && !error) {
      showSnackbar (t('projects.uml_diagrams.notifications.regeneration_started'))
      setTimeout (() => {
        emit ('regenerate')
      }, 3000)
    } else {
      showSnackbar (t('projects.uml_diagrams.notifications.regeneration_failed'), 'error')
    }
  } catch (err) {
    showSnackbar (t('projects.uml_diagrams.notifications.regeneration_failed') + ': ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

watch (() => props.diagram, (newVal) => {
  editedDiagram.value = { ...newVal }
}, { deep: true })


</script>

<template>
  <VDialog
    v-model="dialog"
    :fullscreen="isFullscreen"
    :max-width="isFullscreen ? '100%' : '900'"
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex py-3 px-5">
        <template v-if="isEditMode">
          <h5 class="text-h5">{{ t('projects.uml_diagrams.actions.edit') }}</h5>
        </template>
        <template v-else>
          <h5 class="text-h5">{{ diagram.name }}</h5>
          <VChip
            class="ms-2"
            color="secondary"
            size="small"
            label
          >
            {{ t(`projects.uml_diagrams.types.${diagram.diagram_type}`) }}
          </VChip>
        </template>

        <VSpacer/>

        <VBtn
          icon
          variant="text"
          @click="toggleFullscreen"
        >
          <VIcon :icon="isFullscreen ? 'tabler-minimize' : 'tabler-maximize'"/>
        </VBtn>

        <IconBtn @click="dialog = false">
          <VIcon icon="tabler-x"/>
        </IconBtn>
      </VCardTitle>

      <VDivider/>

      <VCardText
        :class="{'pa-0': !isEditMode && diagram.content, 'pa-6': isEditMode || !diagram.content}"
        :style="{
          height: isFullscreen ? 'calc(100vh - 120px)' : '70vh',
          maxHeight: '800px'
        }"
      >
        <div v-if="isEditMode">
          <VForm @submit.prevent="saveDiagram">
            <VRow class="mt-3">
              <VCol cols="12">
                <VTextField
                  v-model="editedDiagram.name"
                  :label="t('projects.uml_diagrams.name')"
                  required
                  :rules="[v => !!v || t('projects.uml_diagrams.validation.name_required')]"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VSelect
                  v-model="editedDiagram.status"
                  :label="t('projects.uml_diagrams.status.title')"
                  :items="statusOptions"
                  required
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="editedDiagram.notes"
                  :label="t('projects.uml_diagrams.notes')"
                  rows="4"
                />
              </VCol>

              <VCol cols="12">
                <div class="text-subtitle-1 font-weight-medium mb-2">{{ t('projects.uml_diagrams.content') }}</div>
                <div class="bg-grey-lighten-5 rounded pa-3">
                  <div class="text-medium-emphasis text-caption mb-2">
                    {{ t('projects.uml_diagrams.content_hint') }}
                  </div>
                  <VTextarea
                    v-model="editedDiagram.content"
                    rows="15"
                    monospace
                    hide-details
                  />
                </div>
              </VCol>
            </VRow>
          </VForm>
        </div>
        <div v-else>
          <div v-if="diagram.generation_status === 'in_progress'" class="pa-5">
            <VAlert
              color="info"
              variant="tonal"
              icon="tabler-refresh"
            >
              <VAlertTitle>{{ t('projects.uml_diagrams.status.generating') }}</VAlertTitle>
              <p>{{ t('projects.uml_diagrams.status.generating_description') }}</p>
            </VAlert>

            <div class="d-flex justify-center my-8">
              <VProgressCircular indeterminate color="primary" size="64"/>
            </div>

            <div class="d-flex align-center justify-center text-medium-emphasis">
              <VIcon size="18" icon="tabler-calendar" class="me-1"/>
              <span class="text-caption me-4">{{ t('projects.details.updated_at') }}: {{ formatDate(diagram.updated_at) }}</span>

              <VIcon size="18" icon="tabler-calendar-plus" class="me-1"/>
              <span class="text-caption">{{ t('projects.details.created_at') }}: {{ formatDate(diagram.created_at) }}</span>
            </div>
          </div>
          <div v-else-if="diagram.content" class="diagram-content pa-0">
            <div class="diagram-metadata d-flex align-center px-6 py-3">
              <VChip
                :color="getStatusChipColor(diagram.status)"
                size="small"
                label
                class="me-2"
              >
                {{ t(`projects.status.${diagram.status}`) }}
              </VChip>

              <div v-if="diagram.notes" class="ms-2">
                <VTooltip>
                  <template #activator="{ props }">
                    <VIcon
                      icon="tabler-info-circle"
                      size="18"
                      color="info"
                      v-bind="props"
                    />
                  </template>
                  <span>{{ diagram.notes }}</span>
                </VTooltip>
              </div>

              <VSpacer/>

              <div class="text-medium-emphasis d-flex align-center">
                <VIcon size="18" icon="tabler-calendar" class="me-1"/>
                <span class="text-caption me-4">{{ t('projects.details.updated_at') }}: {{ formatDate(diagram.updated_at) }}</span>

                <VIcon size="18" icon="tabler-calendar-plus" class="me-1"/>
                <span class="text-caption">{{ t('projects.details.created_at') }}: {{ formatDate(diagram.created_at) }}</span>
              </div>
            </div>

            <VDivider/>

            <div
              class="diagram-svg-container pa-4 d-flex justify-center align-center"
              :style="{
                height: isFullscreen ? 'calc(100vh - 180px)' : 'calc(70vh - 110px)',
                overflow: 'auto'
              }"
            >
              <VImg
                v-if="diagram.content"
                :src="renderUML(diagram.content)"
                class="diagram-svg"
                alt="Generated Diagram"
              />
            </div>
          </div>
          <div v-else class="d-flex flex-column justify-center align-center pa-6" style="height: 400px;">
            <VIcon icon="tabler-chart-dots-2" size="64" color="secondary" class="mb-4"/>
            <h4 class="text-h6 mb-2">{{ t('projects.uml_diagrams.status.no_content.title') }}</h4>
            <p class="text-medium-emphasis text-center">
              {{ t('projects.uml_diagrams.status.no_content.description') }}
            </p>
          </div>
        </div>
      </VCardText>

      <VDivider/>

      <VCardActions class="pa-4">
        <template v-if="isEditMode">
          <VBtn
            color="secondary"
            variant="tonal"
            @click="toggleEditMode"
            :disabled="processingAction"
          >
            {{ t('projects.actions.cancel') }}
          </VBtn>

          <VSpacer/>

          <VBtn
            color="primary"
            @click="saveDiagram"
            :loading="processingAction"
          >
            {{ t('projects.actions.save') }}
          </VBtn>
        </template>
        <template v-else>
          <VBtn
            v-if="isAdmin"
            color="error"
            variant="tonal"
            prepend-icon="tabler-trash"
            @click="handleDeleteDiagram"
          >
            {{ t('projects.uml_diagrams.actions.delete') }}
          </VBtn>

          <VBtn
            v-if="hasModeratorPermission"
            color="info"
            variant="tonal"
            prepend-icon="tabler-refresh"
            class="ms-2"
            @click="handleRegenerateDiagram"
            :loading="processingAction"
          >
            {{ t('projects.uml_diagrams.actions.regenerate') }}
          </VBtn>

          <VSpacer/>

          <VBtn
            v-if="hasModeratorPermission"
            color="primary"
            prepend-icon="tabler-edit"
            @click="toggleEditMode"
          >
            {{ t('projects.uml_diagrams.actions.edit') }}
          </VBtn>
        </template>
      </VCardActions>
    </VCard>

    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="5000"
    >
      {{ snackbar.text }}
      <template #actions>
        <IconBtn @click="snackbar.show = false">
          <VIcon icon="tabler-x"/>
        </IconBtn>
      </template>
    </VSnackbar>
  </VDialog>
</template>

<style scoped>
.diagram-svg-container {
  background-color: white;
}

.diagram-svg {
  max-width: 100%;
  max-height: 100%;
}

.diagram-svg :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
