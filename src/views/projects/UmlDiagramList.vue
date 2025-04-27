<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUmlDiagramStore } from '@/stores/useUmlDiagramStore'
import { useAuthStore } from '@/stores/useAuthStore'
import UmlDiagramDetailsDialog from '@/views/projects/UmlDiagramDetailsDialog.vue'
import { getStatusChipColor, renderUML } from "@core/utils/formatters"

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  diagrams: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])

const umlDiagramStore = useUmlDiagramStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const selectedDiagramType = ref('all')
const selectedDiagram = ref(null)
const detailsDialogVisible = ref(false)
const confirmDeleteDialog = ref(false)
const generateDiagramDialog = ref(false)
const processingAction = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const isAdmin = computed(() => authStore.is_admin())
const hasManagerPermission = computed(() => authStore.userData.role >= 2)
const hasModeratorPermission = computed(() => authStore.userData.role >= 3)

const diagramTypeOptions = [
  { title: 'All Diagram Types', value: 'all' },
  { title: 'Class Diagram', value: 'class' },
  { title: 'Sequence Diagram', value: 'sequence' },
  { title: 'Activity Diagram', value: 'activity' },
  { title: 'Use Case Diagram', value: 'usecase' },
  { title: 'State Diagram', value: 'state' },
  { title: 'Component Diagram', value: 'component' },
  { title: 'Deployment Diagram', value: 'deployment' },
  { title: 'ER Diagram', value: 'er' }
]

const generatingDiagramType = ref('class')

const filteredDiagrams = computed(() => {
  return props.diagrams.filter(diagram => {
    const matchesSearch = !searchQuery.value ||
      diagram.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      diagram.diagram_type.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesType = selectedDiagramType.value === 'all' ||
      diagram.diagram_type.toLowerCase() === selectedDiagramType.value.toLowerCase()

    return matchesSearch && matchesType
  })
})

const openDiagramDetails = (diagram) => {
  selectedDiagram.value = diagram
  detailsDialogVisible.value = true
}

const openGenerateDialog = () => {
  generatingDiagramType.value = 'class'
  generateDiagramDialog.value = true
}

const handleGenerateDiagrams = async () => {
  generateDiagramDialog.value = false
  processingAction.value = true

  try {
    const { data, error } = await umlDiagramStore.generateDiagrams(
      props.projectId,
      generatingDiagramType.value
    )

    if (data && !error) {
      showSnackbar(`${generatingDiagramType.value.charAt(0).toUpperCase() + generatingDiagramType.value.slice(1)} diagram generation started`)
      setTimeout(() => {
        emit('refresh')
      }, 3000)
    } else {
      showSnackbar('Failed to generate UML diagrams', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to generate UML diagrams: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleDeleteDiagram = async () => {
  if (!selectedDiagram.value) return

  processingAction.value = true
  confirmDeleteDialog.value = false

  try {
    const { success, error } = await umlDiagramStore.deleteDiagram(selectedDiagram.value.id)

    if (success && !error) {
      showSnackbar('UML diagram deleted successfully')
      emit('refresh')
      detailsDialogVisible.value = false
    } else {
      showSnackbar('Failed to delete UML diagram', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to delete UML diagram: ' + err.message, 'error')
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

const formatDate = (dateString) => {
  if (!dateString) return ''
  dateString = parseInt(dateString)
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getDiagramTypeIcon = (type) => {
  switch (type.toLowerCase()) {
    case 'class': return 'tabler-box'
    case 'sequence': return 'tabler-arrow-right-square'
    case 'activity': return 'tabler-activity'
    case 'usecase': return 'tabler-user-check'
    case 'state': return 'tabler-circle-check'
    case 'component': return 'tabler-puzzle'
    case 'deployment': return 'tabler-server'
    case 'er': return 'tabler-database'
    default: return 'tabler-chart-dots'
  }
}

const getDiagramTypeDisplay = (type) => {
  switch (type.toLowerCase()) {
    case 'class': return 'Class Diagram'
    case 'sequence': return 'Sequence Diagram'
    case 'activity': return 'Activity Diagram'
    case 'usecase': return 'Use Case Diagram'
    case 'state': return 'State Diagram'
    case 'component': return 'Component Diagram'
    case 'deployment': return 'Deployment Diagram'
    case 'er': return 'ER Diagram'
    default: return type.charAt(0).toUpperCase() + type.slice(1) + ' Diagram'
  }
}

onMounted(() => {
  if (props.projectId && !props.diagrams.length && !props.loading) {
    umlDiagramStore.fetchDiagrams(props.projectId)
      .then(({ data }) => {
        if (data) {
          emit('refresh')
        }
      })
  }
})
</script>

<template>
  <VCardText class="pa-6">
    <VRow>
      <VCol cols="12" md="4">
        <VTextField
          v-model="searchQuery"
          density="compact"
          placeholder="Search diagrams..."
          prepend-inner-icon="tabler-search"
          hide-details
          variant="outlined"
          clearable
        />
      </VCol>

      <VCol cols="12" md="4">
        <VSelect
          v-model="selectedDiagramType"
          :items="diagramTypeOptions"
          density="compact"
          hide-details
          label="Diagram Type"
          variant="outlined"
        />
      </VCol>

      <VCol cols="12" md="4" class="d-flex align-center">
        <VBtn
          v-if="hasModeratorPermission"
          color="primary"
          prepend-icon="tabler-plus"
          @click="openGenerateDialog"
          :loading="processingAction"
          block
        >
          Generate Diagram
        </VBtn>
      </VCol>
    </VRow>

    <VDivider class="my-5" />

    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <div v-else-if="filteredDiagrams.length === 0" class="text-center pa-4">
      <VIcon icon="tabler-chart-dots" size="64" color="secondary" class="mb-4" />
      <h4 class="text-h6 mb-2">No UML Diagrams Found</h4>
      <p class="text-body-1 text-medium-emphasis mb-6">
        {{ searchQuery || selectedDiagramType !== 'all'
        ? 'Try adjusting your filters to see more results.'
        : 'This project does not have any UML diagrams yet.' }}
      </p>

      <VBtn
        v-if="hasModeratorPermission && !searchQuery && selectedDiagramType === 'all'"
        color="primary"
        @click="openGenerateDialog"
        prepend-icon="tabler-plus"
      >
        Generate UML Diagram
      </VBtn>
    </div>

    <VRow v-else>
      <VCol
        v-for="diagram in filteredDiagrams"
        :key="diagram.id"
        cols="12"
        md="6"
        lg="4"
      >
        <VCard
          class="diagram-card h-100"
          @click="openDiagramDetails(diagram)"
          border
          hover
        >
          <VCardItem>
            <template #prepend>
              <VAvatar
                color="primary"
                variant="tonal"
                size="42"
              >
                <VIcon :icon="getDiagramTypeIcon(diagram.diagram_type)" />
              </VAvatar>
            </template>

            <VCardTitle>{{ diagram.name }}</VCardTitle>

            <template #append>
              <VChip
                :color="getStatusChipColor(diagram.status)"
                size="small"
                label
              >
                {{ diagram.status }}
              </VChip>
            </template>
          </VCardItem>

          <VCardText>
            <div class="mb-3 d-flex align-center">
              <VChip
                color="secondary"
                size="small"
                label
                class="me-2"
              >
                {{ getDiagramTypeDisplay(diagram.diagram_type) }}
              </VChip>
            </div>

            <div class="diagram-preview mb-3">
              <div class="overflow-hidden position-relative rounded bg-grey-lighten-4" style="height: 150px;">
                <div class="d-flex justify-center align-center h-100">
                  <div class="text-center pa-2" v-if="diagram.generation_status === 'in_progress'">
                    <VProgressCircular
                      indeterminate
                      color="primary"
                      size="40"
                      class="mb-2"
                    />
                    <div class="text-caption">Generating diagram...</div>
                  </div>
                  <div v-else-if="diagram.content" class="diagram-thumbnail pa-2">
                    <VImg
                      v-if="diagram.content"
                      :src="renderUML(diagram.content)"
                      class="diagram-svg"
                      alt="Generated Diagram"
                    />
                  </div>
                  <div v-else class="text-center">
                    <VIcon :icon="getDiagramTypeIcon(diagram.diagram_type)" size="48" color="secondary" />
                    <div class="text-caption mt-2">Preview not available</div>
                  </div>
                </div>
                <div class="preview-overlay d-flex justify-center align-center">
                  <VBtn
                    color="primary"
                    variant="elevated"
                    size="small"
                    prepend-icon="tabler-eye"
                  >
                    View Diagram
                  </VBtn>
                </div>
              </div>
            </div>

            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <VIcon size="16" icon="tabler-calendar" class="me-1" />
                <span class="text-caption">{{ formatDate(diagram.created_at) }}</span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <UmlDiagramDetailsDialog
      v-if="selectedDiagram"
      v-model="detailsDialogVisible"
      :diagram="selectedDiagram"
      @delete="confirmDeleteDialog = true"
      :is-admin="isAdmin"
      :has-manager-permission="hasManagerPermission"
      :has-moderator-permission="hasModeratorPermission"
    />

    <!-- Generate UML Dialog -->
    <VDialog
      v-model="generateDiagramDialog"
      max-width="600"
      persistent
    >
      <VCard>
        <VCardTitle class="pt-5 pb-2">
          Generate UML Diagram
        </VCardTitle>

        <VCardText>
          <p class="text-body-1 mb-4">
            Select the type of UML diagram you want to generate for this project.
            The system will analyze the requirements and create an appropriate diagram.
          </p>

          <VSelect
            v-model="generatingDiagramType"
            :items="[
              { title: 'Class Diagram', value: 'class' },
              { title: 'Sequence Diagram', value: 'sequence' },
              { title: 'Activity Diagram', value: 'activity' },
              { title: 'Use Case Diagram', value: 'usecase' },
              { title: 'State Diagram', value: 'state' },
              { title: 'Component Diagram', value: 'component' }
            ]"
            label="Diagram Type"
          />
        </VCardText>

        <VCardActions>
          <VBtn
            color="secondary"
            variant="tonal"
            @click="generateDiagramDialog = false"
          >
            Cancel
          </VBtn>

          <VSpacer />

          <VBtn
            color="primary"
            @click="handleGenerateDiagrams"
          >
            Generate
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <ConfirmDialog
      v-model:isDialogVisible="confirmDeleteDialog"
      confirmationMsg="Are you sure you want to delete this UML diagram? This action cannot be undone."
      @confirm="handleDeleteDiagram"
    />

    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="5000"
    >
      {{ snackbar.text }}
      <template #actions>
        <IconBtn @click="snackbar.show = false">
          <VIcon icon="tabler-x" />
        </IconBtn>
      </template>
    </VSnackbar>
  </VCardText>
</template>

<style scoped>
.diagram-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.diagram-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(var(--v-theme-on-surface), 0.1) !important;
}

.diagram-preview {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.diagram-thumbnail {
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.diagram-thumbnail :deep(svg) {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.diagram-card:hover .preview-overlay {
  opacity: 1;
}
</style>
