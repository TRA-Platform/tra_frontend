<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRequirementStore } from '@/stores/useRequirementStore'
import { useAuthStore } from '@/stores/useAuthStore'
import RequirementDetailsDialog from '@/views/projects/RequirementDetailsDialog.vue'
import RequirementCreateDialog from '@/views/projects/RequirementCreateDialog.vue'
import { getCategoryChipColor, getStatusChipColor } from "@core/utils/formatters"

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  requirements: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh', 'view-user-stories'])

const requirementStore = useRequirementStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const filteredCategory = ref([])
const filteredStatus = ref(['draft', 'active', 'completed'])
const selectedRequirement = ref(null)
const detailsDialogVisible = ref(false)
const createDialogVisible = ref(false)
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

const categoryOptions = [
  { title: 'Functional', value: 'functional' },
  { title: 'Non-Functional', value: 'nonfunctional' },
  { title: 'UI/UX', value: 'uiux' },
  { title: 'Other', value: 'other' }
]

const statusOptions = [
  { title: 'Draft', value: 'draft' },
  { title: 'Active', value: 'active' },
  { title: 'Archived', value: 'archived' },
  { title: 'Completed', value: 'completed' }
]

const filteredRequirements = computed(() => {
  return props.requirements.filter(req => {
    const matchesSearch = !searchQuery.value ||
      req.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesCategory = filteredCategory.value.length === 0 ||
      filteredCategory.value.includes(req.category)

    const matchesStatus = filteredStatus.value.includes(req.status)

    return matchesSearch && matchesCategory && matchesStatus
  })
})

const openRequirementDetails = (req) => {
  selectedRequirement.value = req
  detailsDialogVisible.value = true
}

const openCreateRequirement = () => {
  createDialogVisible.value = true
}

const handleCreateRequirement = async (requirementData) => {
  processingAction.value = true

  try {
    const { data, error } = await requirementStore.createRequirement({
      ...requirementData,
      project: props.projectId
    })

    if (data && !error) {
      showSnackbar('Requirement created successfully')
      emit('refresh')
    } else {
      showSnackbar('Failed to create requirement', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to create requirement: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleUpdateRequirement = async (requirementData) => {
  processingAction.value = true

  try {
    const { data, error } = await requirementStore.updateRequirement(
      selectedRequirement.value.id,
      requirementData
    )

    if (data && !error) {
      showSnackbar('Requirement updated successfully')
      emit('refresh')
    } else {
      showSnackbar('Failed to update requirement', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to update requirement: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleDeleteRequirement = async () => {
  if (!selectedRequirement.value) return

  processingAction.value = true
  confirmDeleteDialog.value = false

  try {
    const { success, error } = await requirementStore.deleteRequirement(selectedRequirement.value.id)

    if (success && !error) {
      showSnackbar('Requirement deleted successfully')
      emit('refresh')
      detailsDialogVisible.value = false
    } else {
      showSnackbar('Failed to delete requirement', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to delete requirement: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const viewUserStories = (requirement) => {
  emit('view-user-stories', requirement)
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

const truncateDescription = (text, length = 120) => {
  if (!text || text.length <= length) return text
  return text.substring(0, length) + '...'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  dateString = parseInt(dateString)
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>

<template>
  <VCardText class="pa-6">
    <VRow>
      <VCol cols="12" md="4">
        <VTextField
          v-model="searchQuery"
          density="compact"
          placeholder="Search requirements..."
          prepend-inner-icon="tabler-search"
          hide-details
          variant="outlined"
          clearable
        />
      </VCol>

      <VCol cols="12" md="3">
        <VSelect
          v-model="filteredCategory"
          :items="categoryOptions"
          density="compact"
          hide-details
          label="Category"
          variant="outlined"
          multiple
          chips
        />
      </VCol>

      <VCol cols="12" md="3">
        <VSelect
          v-model="filteredStatus"
          :items="statusOptions"
          density="compact"
          hide-details
          label="Status"
          variant="outlined"
          multiple
          chips
        />
      </VCol>

      <VCol cols="12" md="2" class="d-flex align-center">
        <VBtn
          v-if="hasModeratorPermission"
          color="primary"
          prepend-icon="tabler-plus"
          @click="openCreateRequirement"
          :loading="processingAction"
          block
        >
          Add
        </VBtn>
      </VCol>
    </VRow>

    <VDivider class="my-5" />

    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <div v-else-if="filteredRequirements.length === 0" class="text-center pa-4">
      <VIcon icon="tabler-file-search" size="64" color="secondary" class="mb-4" />
      <h4 class="text-h6 mb-2">No Requirements Found</h4>
      <p class="text-body-1 text-medium-emphasis mb-6">
        {{ searchQuery || filteredCategory.length > 0 || filteredStatus.length > 0
        ? 'Try adjusting your filters to see more results.'
        : 'This project does not have any requirements yet.' }}
      </p>

      <VBtn
        v-if="hasModeratorPermission && !searchQuery && filteredCategory.length === 0 && filteredStatus.length === 0"
        color="primary"
        @click="openCreateRequirement"
        prepend-icon="tabler-plus"
      >
        Add Requirement
      </VBtn>
    </div>

    <VRow v-else>
      <VCol
        v-for="req in filteredRequirements"
        :key="req.id"
        cols="12"
      >
        <VCard
          class="requirement-card"
          @click="openRequirementDetails(req)"
          border
          hover
        >
          <VCardItem>
            <template #prepend>
              <VAvatar
                :color="getCategoryChipColor(req.category)"
                variant="tonal"
                size="42"
              >
                <VIcon
                  v-if="req.category === 'functional'"
                  icon="tabler-function"
                />
                <VIcon
                  v-else-if="req.category === 'nonfunctional'"
                  icon="tabler-chart-bar"
                />
                <VIcon
                  v-else-if="req.category === 'uiux'"
                  icon="tabler-palette"
                />
                <VIcon
                  v-else
                  icon="tabler-file-description"
                />
              </VAvatar>
            </template>

            <VCardTitle>{{req.handle}} {{ req.title }}</VCardTitle>

            <template #append>
              <VChip
                :color="getStatusChipColor(req.status)"
                size="small"
                label
              >
                {{ capitalize(req.status) }}
              </VChip>
            </template>
          </VCardItem>

          <VCardText>
            <p class="text-body-2 mb-3">{{ truncateDescription(req.description) }}</p>

            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center">
                <VIcon size="16" icon="tabler-tag" class="me-1" />
                <span class="text-caption text-capitalize">{{ req.category }}</span>
              </div>

              <div class="d-flex align-center">
                <VIcon size="16" icon="tabler-calendar" class="me-1" />
                <span class="text-caption">{{ formatDate(req.updated_at) }}</span>
              </div>

              <div class="d-flex align-center">
                <VIcon size="16" icon="tabler-history" class="me-1" />
                <span class="text-caption">v{{ req.version_number }}</span>
              </div>
            </div>
            <div v-if="req.user_stories && req.user_stories.length > 0" class="mt-3">
              <VBtn
                size="small"
                variant="tonal"
                color="primary"
                prepend-icon="tabler-user-check"
                @click.stop="viewUserStories(req)"
              >
                {{ req.user_stories.length }} User {{ req.user_stories.length === 1 ? 'Story' : 'Stories' }}
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <RequirementDetailsDialog
      v-if="selectedRequirement"
      v-model="detailsDialogVisible"
      :requirement="selectedRequirement"
      @delete="confirmDeleteDialog = true"
      @update="handleUpdateRequirement"
      @view-user-stories="viewUserStories"
      :is-admin="isAdmin"
      :has-manager-permission="hasManagerPermission"
      :has-moderator-permission="hasModeratorPermission"
    />

    <RequirementCreateDialog
      v-model="createDialogVisible"
      @submit="handleCreateRequirement"
    />

    <ConfirmDialog
      v-model:isDialogVisible="confirmDeleteDialog"
      confirmationMsg="Are you sure you want to delete this requirement? This action cannot be undone."
      @confirm="handleDeleteRequirement"
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
.requirement-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.requirement-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(var(--v-theme-on-surface), 0.1) !important;
}
</style>
