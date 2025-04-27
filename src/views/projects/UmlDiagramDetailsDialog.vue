<script setup>
import { computed, ref, watch } from 'vue'
import { useUmlDiagramStore } from '@/stores/useUmlDiagramStore'
import { getStatusChipColor, renderUML } from "@core/utils/formatters"
import pako from 'pako'
import { Buffer } from "buffer/";

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

const statusOptions = [
  { title: 'Draft', value: 'draft' },
  { title: 'Active', value: 'active' },
  { title: 'Archived', value: 'archived' },
  { title: 'Completed', value: 'completed' }
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
      showSnackbar ('UML diagram updated successfully')
      Object.assign (props.diagram, data)
      isEditMode.value = false
    } else {
      showSnackbar ('Failed to update UML diagram', 'error')
    }
  } catch (err) {
    showSnackbar ('Failed to update UML diagram: ' + err.message, 'error')
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
      showSnackbar ('UML diagram regeneration started')
      setTimeout (() => {
        emit ('regenerate')
      }, 3000)
    } else {
      showSnackbar ('Failed to regenerate UML diagram', 'error')
    }
  } catch (err) {
    showSnackbar ('Failed to regenerate UML diagram: ' + err.message, 'error')
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
          <h5 class="text-h5">Edit UML Diagram</h5>
        </template>
        <template v-else>
          <h5 class="text-h5">{{ diagram.name }}</h5>
          <VChip
            class="ms-2"
            color="secondary"
            size="small"
            label
          >
            {{ getDiagramTypeDisplay (diagram.diagram_type) }}
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
                  label="Diagram Name"
                  required
                  :rules="[v => !!v || 'Name is required']"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VSelect
                  v-model="editedDiagram.status"
                  label="Status"
                  :items="statusOptions"
                  required
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="editedDiagram.notes"
                  label="Notes"
                  rows="4"
                />
              </VCol>

              <VCol cols="12">
                <div class="text-subtitle-1 font-weight-medium mb-2">Diagram Content (SVG)</div>
                <div class="bg-grey-lighten-5 rounded pa-3">
                  <div class="text-medium-emphasis text-caption mb-2">
                    Note: Direct editing of diagram content is not recommended.
                    Use the Regenerate button to create a new version instead.
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
              <VAlertTitle>Generating Diagram</VAlertTitle>
              <p>This diagram is currently being generated. Please check back shortly.</p>
            </VAlert>

            <div class="d-flex justify-center my-8">
              <VProgressCircular indeterminate color="primary" size="64"/>
            </div>

            <div class="d-flex align-center justify-center text-medium-emphasis">
              <VIcon size="18" icon="tabler-calendar" class="me-1"/>
              <span class="text-caption me-4">Updated: {{ formatDate (diagram.updated_at) }}</span>

              <VIcon size="18" icon="tabler-calendar-plus" class="me-1"/>
              <span class="text-caption">Created: {{ formatDate (diagram.created_at) }}</span>
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
                {{ diagram.status }}
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
                <span class="text-caption me-4">Updated: {{ formatDate (diagram.updated_at) }}</span>

                <VIcon size="18" icon="tabler-calendar-plus" class="me-1"/>
                <span class="text-caption">Created: {{ formatDate (diagram.created_at) }}</span>
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
            <h4 class="text-h6 mb-2">No Diagram Content</h4>
            <p class="text-medium-emphasis text-center">
              This diagram doesn't have any content to display. Try regenerating it.
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
            Cancel
          </VBtn>

          <VSpacer/>

          <VBtn
            color="primary"
            @click="saveDiagram"
            :loading="processingAction"
          >
            Save Changes
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
            Delete
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
            Regenerate
          </VBtn>

          <VSpacer/>

          <VBtn
            v-if="hasModeratorPermission"
            color="primary"
            prepend-icon="tabler-edit"
            @click="toggleEditMode"
          >
            Edit
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
