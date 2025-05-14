<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMockupStore } from '@/stores/useMockupStore'
import { useAuthStore } from '@/stores/useAuthStore'
import MockupPreviewDialog from '@/views/projects/MockupPreviewDialog.vue'
import { getStatusChipColor } from "@core/utils/formatters";
import { useI18n } from 'vue-i18n'
import mitt from 'mitt'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  mockups: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])

const mockupStore = useMockupStore()
const authStore = useAuthStore()
const { t } = useI18n()

const searchQuery = ref('')
const selectedMockup = ref(null)
const previewDialogVisible = ref(false)
const confirmDeleteDialog = ref(false)
const processingAction = ref(false)
const refreshInterval = ref(null)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const isAdmin = computed(() => authStore.is_admin())
const hasManagerPermission = computed(() => authStore.userData.role >= 2)
const hasModeratorPermission = computed(() => authStore.userData.role >= 3)

const pendingMockups = computed(() => {
  return props.mockups.filter(mockup => 
    mockup.needs_regeneration || 
    mockup.generation_status === 'in_progress' || 
    mockup.generation_status === 'pending'
  ).length
})

const filteredMockups = computed(() => {
  return props.mockups.filter(mockup => {
    return !searchQuery.value ||
      mockup.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (mockup.requirement && mockup.requirement.toLowerCase().includes(searchQuery.value.toLowerCase()))
  })
})

const formatDate = (dateString) => {
  if (!dateString) return ''

  return new Date(parseInt(dateString)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const eventBus = mitt()

const previewMockup = async (mockup) => {
  const { data } = await mockupStore.fetchMockupById(mockup.id)
  selectedMockup.value = data || mockup
  previewDialogVisible.value = true
}

const handleDeleteMockup = async () => {
  if (!selectedMockup.value) return

  processingAction.value = true
  confirmDeleteDialog.value = false

  try {
    const { success, error } = await mockupStore.deleteMockupById(selectedMockup.value.id)

    if (success && !error) {
      showSnackbar(t('projects.mockups.notifications.deleted'))
      emit('refresh')
      previewDialogVisible.value = false
    } else {
      showSnackbar(t('projects.mockups.notifications.delete_failed'), 'error')
    }
  } catch (err) {
    showSnackbar(t('projects.mockups.notifications.delete_failed') + ': ' + err.message, 'error')
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

const truncateHtml = (html, length = 150) => {
  if (!html || html.length <= length) return html

  const textOnly = html.replace(/<[^>]*>/g, '')

  if (textOnly.length <= length) return html

  return textOnly.substring(0, length) + '...'
}

const anyMockupInProgress = computed(() =>
  props.mockups.some(m => m.generation_status === 'in_progress' || m.generation_status === 'pending' || m.needs_regeneration)
)

onMounted(() => {
  eventBus.on('project-refresh', () => {
    mockupStore.fetchProjectMockups(props.projectId)
      .then(({ data }) => {
        if (data) emit('refresh')
      })
  })
})

watch(previewDialogVisible, (val) => {
  if (val) {
    eventBus.on('project-refresh', async () => {
      if (selectedMockup.value) {
        const { data } = await mockupStore.fetchMockupById(selectedMockup.value.id)
        if (data) selectedMockup.value = data
      }
    })
  } else {
    eventBus.off('project-refresh')
  }
})
</script>

<template>
  <VCardText class="pa-6">
    <div v-if="anyMockupInProgress" class="mb-4">
      <VAlert type="info" variant="tonal" border="start" class="d-flex align-center">
        <VProgressCircular indeterminate color="primary" size="24" class="me-3" />
        <span>{{ t('projects.mockups.status.generating') }}</span>
      </VAlert>
    </div>
    <VRow>
      <VCol cols="12" md="6">
        <VTextField
          v-model="searchQuery"
          density="compact"
          :placeholder="t('projects.mockups.search')"
          prepend-inner-icon="tabler-search"
          hide-details
          variant="outlined"
          clearable
        />
      </VCol>
      
      <VCol cols="12" md="6" class="d-flex align-center">
        <VAlert
          v-if="pendingMockups > 0"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-0 flex-grow-1 me-2"
        >
          <div class="d-flex align-center">
            <VProgressCircular
              indeterminate
              color="info"
              size="16"
              width="2"
              class="me-2"
            />
            <span>{{ pendingMockups }} {{ t('projects.mockups.status.pending_count') }}</span>
          </div>
        </VAlert>
      </VCol>
    </VRow>

    <VDivider class="my-5" />

    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <div v-else-if="filteredMockups.length === 0" class="text-center pa-4">
      <VIcon icon="tabler-photo-off" size="64" color="secondary" class="mb-4" />
      <h4 class="text-h6 mb-2">{{ t('projects.mockups.empty.title') }}</h4>
      <p class="text-body-1 text-medium-emphasis mb-6">
        {{ searchQuery ? t('projects.mockups.empty.filtered') : t('projects.mockups.empty.description') }}
      </p>
    </div>

    <VRow v-else>
      <VCol
        v-for="mockup in filteredMockups"
        :key="mockup.id"
        cols="12"
        md="6"
        lg="4"
      >
        <VCard
          class="mockup-card h-100"
          @click="previewMockup(mockup)"
          border
          hover
        >
          <VCardItem>
            <VCardTitle>{{ mockup.name }}</VCardTitle>
            <template #append>
              <div class="d-flex align-center">
                <VProgressCircular
                  v-if="mockup.generation_status === 'in_progress' || mockup.generation_status === 'pending' || mockup.needs_regeneration"
                  indeterminate
                  color="primary"
                  size="20"
                  width="2"
                  class="me-2"
                />
                <VChip
                  v-if="mockup.generation_status === 'pending' || mockup.needs_regeneration"
                  color="warning"
                  size="small"
                  label
                  prepend-icon="tabler-refresh"
                >
                  {{ t('projects.mockups.status.generating') }}
                </VChip>
                <VChip
                  :color="getStatusChipColor(mockup.status)"
                  size="small"
                  label
                >
                  {{ t(`projects.status.${mockup.status}`) }}
                </VChip>
              </div>
            </template>
          </VCardItem>

          <VDivider />

          <VCardText>
            <div class="mockup-preview mb-3">
              <div class="overflow-hidden position-relative rounded bg-grey-lighten-4" style="height: 150px;">
                <div v-if="mockup.generation_status === 'in_progress' || mockup.generation_status === 'pending'" 
                     class="d-flex justify-center align-center h-100">
                  <div class="text-center">
                    <VProgressCircular indeterminate color="primary" size="40" class="mb-2" />
                    <div class="text-caption">{{ t('projects.mockups.status.generating') }}</div>
                  </div>
                </div>
                <div v-else-if="mockup.image" class="html-preview">
                  <VImg
                    :src="mockup.image"
                    :alt="mockup.name"
                  />
                </div>
                <div v-else class="d-flex justify-center align-center h-100">
                  <VIcon icon="tabler-file-code" size="48" color="secondary" />
                </div>
                <div class="preview-overlay d-flex justify-center align-center">
                  <VBtn
                    color="primary"
                    variant="elevated"
                    size="small"
                    prepend-icon="tabler-eye"
                    :disabled="mockup.generation_status === 'in_progress' || mockup.generation_status === 'pending'"
                  >
                    {{ t('projects.mockups.actions.preview') }}
                  </VBtn>
                </div>
              </div>
            </div>

            <div v-if="mockup.needs_regeneration" class="mb-2">
              <VChip
                color="warning"
                size="small"
                label
                prepend-icon="tabler-refresh"
              >
                {{ t('projects.mockups.status.regenerating') }}
              </VChip>
            </div>

            <div v-if="mockup.requirement" class="mb-2">
              <span class="text-caption font-weight-medium">{{ t('projects.details.requirement') }}: </span>
              <VChip size="x-small" color="primary" class="ms-1">
                {{ mockup.requirement_name }}
              </VChip>
            </div>
            <div v-if="mockup.user_story" class="mb-2">
              <span class="text-caption font-weight-medium">{{ t('projects.details.user_story') }}: </span>
              <VChip size="x-small" color="primary" class="ms-1">
                {{ mockup.user_story_name }}
              </VChip>
            </div>

            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <VIcon size="16" icon="tabler-calendar" class="me-1" />
                <span class="text-caption">{{ formatDate(mockup.created_at) }}</span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <MockupPreviewDialog
      v-if="selectedMockup"
      v-model="previewDialogVisible"
      :mockup="selectedMockup"
      @delete="confirmDeleteDialog = true"
      :is-admin="isAdmin"
      :has-manager-permission="hasManagerPermission"
    />

    <ConfirmDialog
      v-model:isDialogVisible="confirmDeleteDialog"
      :confirmationMsg="t('projects.mockups.delete_confirm.message')"
      @confirm="handleDeleteMockup"
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
.mockup-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.mockup-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(var(--v-theme-on-surface), 0.1) !important;
}

.mockup-preview {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.html-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.html-preview :deep(img) {
  width: 100%;
  height: auto;
  object-fit: cover;
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

.mockup-card:hover .preview-overlay {
  opacity: 1;
}
</style>
