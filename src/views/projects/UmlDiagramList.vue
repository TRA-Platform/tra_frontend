<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useUmlDiagramStore } from '@/stores/useUmlDiagramStore'
import { useAuthStore } from '@/stores/useAuthStore'
import UmlDiagramDetailsDialog from '@/views/projects/UmlDiagramDetailsDialog.vue'
import { getStatusChipColor, renderUML } from "@core/utils/formatters"
import { useI18n } from 'vue-i18n'
import mitt from 'mitt'

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
const { t } = useI18n()

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
  { title: t('projects.uml_diagrams.types.all'), value: 'all' },
  { title: t('projects.uml_diagrams.types.class'), value: 'class' },
  { title: t('projects.uml_diagrams.types.sequence'), value: 'sequence' },
  { title: t('projects.uml_diagrams.types.activity'), value: 'activity' },
  { title: t('projects.uml_diagrams.types.usecase'), value: 'use_case' },
  { title: t('projects.uml_diagrams.types.state'), value: 'state' },
  { title: t('projects.uml_diagrams.types.component'), value: 'component' },
  { title: t('projects.uml_diagrams.types.deployment'), value: 'deployment' },
  { title: t('projects.uml_diagrams.types.er'), value: 'er' }
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

const eventBus = mitt()

const openDiagramDetails = async (diagram) => {
  const { data } = await umlDiagramStore.fetchDiagramById(diagram.id)
  selectedDiagram.value = data || diagram
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
      showSnackbar(t('projects.uml_diagrams.notifications.generation_started'))
      setTimeout(() => {
        emit('refresh')
      }, 3000)
    } else {
      showSnackbar(t('projects.uml_diagrams.notifications.generation_failed'), 'error')
    }
  } catch (err) {
    showSnackbar(t('projects.uml_diagrams.notifications.generation_failed') + ': ' + err.message, 'error')
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
      showSnackbar(t('projects.uml_diagrams.notifications.delete_success'))
      emit('refresh')
      detailsDialogVisible.value = false
    } else {
      showSnackbar(t('projects.uml_diagrams.notifications.delete_failed'), 'error')
    }
  } catch (err) {
    showSnackbar(t('projects.uml_diagrams.notifications.delete_failed') + ': ' + err.message, 'error')
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
    case 'all': return 'tabler-chart-dots'
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
    case 'all': return t('projects.uml_diagrams.types.all')
    case 'class': return t('projects.uml_diagrams.types.class')
    case 'sequence': return t('projects.uml_diagrams.types.sequence')
    case 'activity': return t('projects.uml_diagrams.types.activity')
    case 'usecase': return t('projects.uml_diagrams.types.usecase')
    case 'state': return t('projects.uml_diagrams.types.state')
    case 'component': return t('projects.uml_diagrams.types.component')
    case 'deployment': return t('projects.uml_diagrams.types.deployment')
    case 'er': return t('projects.uml_diagrams.types.er')
    default: return type.charAt(0).toUpperCase() + type.slice(1) + ' ' + t('projects.uml_diagrams.types.diagram')
  }
}

onMounted(() => {
  eventBus.on('project-refresh', () => {
    umlDiagramStore.fetchDiagrams(props.projectId, { silent: true })
      .then(({ data }) => {
        if (data) emit('refresh')
      })
  })
})

watch(detailsDialogVisible, (val) => {
  if (val) {
    eventBus.on('project-refresh', async () => {
      if (selectedDiagram.value) {
        const { data } = await umlDiagramStore.fetchDiagramById(selectedDiagram.value.id)
        if (data) selectedDiagram.value = data
      }
    })
  } else {
    eventBus.off('project-refresh')
  }
})
</script>

<template>
  <VCardText class="pa-6">
    <div v-if="anyDiagramInProgress" class="mb-4">
      <VAlert type="info" variant="tonal" border="start" class="d-flex align-center">
        <VProgressCircular indeterminate color="primary" size="24" class="me-3" />
        <span>{{ t('projects.uml_diagrams.status.generating') }}</span>
      </VAlert>
    </div>
    <VRow>
      <VCol cols="12" md="4">
        <VTextField
          v-model="searchQuery"
          density="compact"
          :placeholder="t('projects.uml_diagrams.actions.search')"
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
          :label="t('projects.uml_diagrams.type')"
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
          {{ t('projects.uml_diagrams.actions.generate') }}
        </VBtn>
      </VCol>
    </VRow>

    <VDivider class="my-5" />

    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <div v-else-if="filteredDiagrams.length === 0" class="text-center pa-4">
      <VIcon icon="tabler-chart-dots" size="64" color="secondary" class="mb-4" />
      <h4 class="text-h6 mb-2">{{ t('projects.uml_diagrams.empty.title') }}</h4>
      <p class="text-body-1 text-medium-emphasis mb-6">
        {{ searchQuery || selectedDiagramType !== 'all'
        ? t('projects.uml_diagrams.empty.filtered')
        : t('projects.uml_diagrams.empty.description') }}
      </p>

      <VBtn
        v-if="hasModeratorPermission && !searchQuery && selectedDiagramType === 'all'"
        color="primary"
        @click="openGenerateDialog"
        prepend-icon="tabler-plus"
      >
        {{ t('projects.uml_diagrams.actions.generate') }}
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
              <div class="d-flex align-center">
                <VProgressCircular
                  v-if="diagram.generation_status === 'in_progress' || diagram.generation_status === 'pending'"
                  indeterminate
                  color="primary"
                  size="20"
                  width="2"
                  class="me-2"
                />
                <VChip
                  v-if="diagram.generation_status === 'pending'"
                  color="warning"
                  size="small"
                  label
                  prepend-icon="tabler-refresh"
                >
                  {{ t('projects.uml_diagrams.status.generating') }}
                </VChip>
                <VChip
                  :color="getStatusChipColor(diagram.status)"
                  size="small"
                  label
                >
                  {{ diagram.status }}
                </VChip>
              </div>
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
                    <div class="text-caption">{{ t('projects.uml_diagrams.status.generating') }}</div>
                  </div>
                  <div v-else-if="diagram.content" class="diagram-thumbnail pa-2">
                    <VImg
                      v-if="diagram.content"
                      :src="renderUML(diagram.content)"
                      class="diagram-svg"
                      :alt="t('projects.uml_diagrams.title')"
                    />
                  </div>
                  <div v-else class="text-center">
                    <VIcon :icon="getDiagramTypeIcon(diagram.diagram_type)" size="48" color="secondary" />
                    <div class="text-caption mt-2">{{ t('projects.uml_diagrams.status.no_content.title') }}</div>
                  </div>
                </div>
                <div class="preview-overlay d-flex justify-center align-center">
                  <VBtn
                    color="primary"
                    variant="elevated"
                    size="small"
                    prepend-icon="tabler-eye"
                  >
                    {{ t('projects.uml_diagrams.actions.view') }}
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
    <VDialog
      v-model="generateDiagramDialog"
      max-width="600"
      persistent
    >
      <VCard>
        <VCardTitle class="pt-5 pb-2">
          {{ t('projects.uml_diagrams.generation.title') }}
        </VCardTitle>

        <VCardText>
          <p class="text-body-1 mb-4">
            {{ t('projects.uml_diagrams.generation.description') }}
          </p>

          <VSelect
            v-model="generatingDiagramType"
            :items="diagramTypeOptions"
            :label="t('projects.uml_diagrams.type')"
          />
        </VCardText>

        <VCardActions>
          <VBtn
            color="secondary"
            variant="tonal"
            @click="generateDiagramDialog = false"
          >
            {{ t('projects.user_stories.actions.cancel') }}
          </VBtn>

          <VSpacer />

          <VBtn
            color="primary"
            @click="handleGenerateDiagrams"
          >
            {{ t('projects.uml_diagrams.actions.generate') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <ConfirmDialog
      v-model:isDialogVisible="confirmDeleteDialog"
      :confirmationMsg="t('projects.uml_diagrams.delete_confirm.message')"
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
