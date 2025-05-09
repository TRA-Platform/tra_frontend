<script setup>
import { ref, computed, capitalize } from 'vue'
import { useMockupStore } from '@/stores/useMockupStore'
import { useAuthStore } from '@/stores/useAuthStore'
import MockupPreviewDialog from '@/views/projects/MockupPreviewDialog.vue'
import { getStatusChipColor } from "@core/utils/formatters";

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

const searchQuery = ref('')
const selectedMockup = ref(null)
const previewDialogVisible = ref(false)
const confirmDeleteDialog = ref(false)
const processingAction = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const isAdmin = computed(() => authStore.is_admin())
const hasManagerPermission = computed(() => authStore.userData.role >= 2)
const hasModeratorPermission = computed(() => authStore.userData.role >= 3)

const filteredMockups = computed(() => {
  return props.mockups.filter(mockup => {
    return !searchQuery.value ||
      mockup.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (mockup.requirement && mockup.requirement.title.toLowerCase().includes(searchQuery.value.toLowerCase()))
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

const previewMockup = (mockup) => {
  selectedMockup.value = mockup
  previewDialogVisible.value = true
}

const handleDeleteMockup = async () => {
  if (!selectedMockup.value) return

  processingAction.value = true
  confirmDeleteDialog.value = false

  try {
    const { success, error } = await mockupStore.deleteMockup(selectedMockup.value.id)

    if (success && !error) {
      showSnackbar('Mockup deleted successfully')
      emit('refresh')
      previewDialogVisible.value = false
    } else {
      showSnackbar('Failed to delete mockup', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to delete mockup: ' + err.message, 'error')
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
</script>

<template>
  <VCardText class="pa-6">
    <VRow>
      <VCol cols="12" md="6">
        <VTextField
          v-model="searchQuery"
          density="compact"
          placeholder="Search mockups..."
          prepend-inner-icon="tabler-search"
          hide-details
          variant="outlined"
          clearable
        />
      </VCol>
    </VRow>

    <VDivider class="my-5" />

    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <div v-else-if="filteredMockups.length === 0" class="text-center pa-4">
      <VIcon icon="tabler-photo-off" size="64" color="secondary" class="mb-4" />
      <h4 class="text-h6 mb-2">No Mockups Found</h4>
      <p class="text-body-1 text-medium-emphasis mb-6">
        {{ searchQuery ? 'Try adjusting your search to see more results.' : 'This project does not have any mockups yet.' }}
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
              <VChip
                :color="getStatusChipColor(mockup.status)"
                size="small"
                label
              >
                {{ capitalize(mockup.status) }}
              </VChip>
            </template>
          </VCardItem>

          <VDivider />

          <VCardText>
            <div class="mockup-preview mb-3">
              <div class="overflow-hidden position-relative rounded bg-grey-lighten-4" style="height: 150px;">
                <div v-if="mockup.html_content" class="html-preview">
                  <div v-html="truncateHtml(mockup.html_content)"></div>
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
                  >
                    Preview
                  </VBtn>
                </div>
              </div>
            </div>

            <div v-if="mockup.requirement" class="mb-2">
              <span class="text-caption font-weight-medium">Requirement: </span>
              <VChip size="x-small" color="primary" class="ms-1">
                {{ mockup.requirement }}
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
      confirmationMsg="Are you sure you want to delete this mockup? This action cannot be undone."
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
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  padding: 5px;
  height: 100%;
  width: 100%;
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
