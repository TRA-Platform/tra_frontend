<script setup>
import {ref, computed, onMounted} from 'vue'
import {useUserStoryStore} from '@/stores/useUserStoryStore'
import {useAuthStore} from '@/stores/useAuthStore'
import UserStoryDetailsDialog from '@/views/projects/UserStoryDetailsDialog.vue'
import UserStoryCreateDialog from '@/views/projects/UserStoryCreateDialog.vue'
import {getStatusChipColor} from "@core/utils/formatters"

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  requirementId: {
    type: String,
    required: false,
    default: null
  },
  userStories: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])

const userStoryStore = useUserStoryStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const filteredStatus = ref(['draft', 'active', 'completed'])
const selectedUserStory = ref(null)
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

const statusOptions = [
  {title: 'Draft', value: 'draft'},
  {title: 'Active', value: 'active'},
  {title: 'Archived', value: 'archived'},
  {title: 'Completed', value: 'completed'}
]

const filteredUserStories = computed(() => {
  return props.userStories.filter(userStory => {
    const matchesSearch = !searchQuery.value ||
      userStory.role.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      userStory.action.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      userStory.benefit.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesStatus = filteredStatus.value.includes(userStory.status)

    return matchesSearch && matchesStatus
  })
})

const openUserStoryDetails = (userStory) => {
  selectedUserStory.value = userStory
  detailsDialogVisible.value = true
}

const openCreateUserStory = () => {
  createDialogVisible.value = true
}

const handleCreateUserStory = async (storyData) => {
  processingAction.value = true

  try {
    const {data, error} = await userStoryStore.createUserStory({
      ...storyData,
      requirement: props.requirementId
    })

    if (data && !error) {
      showSnackbar('User story created successfully')
      emit('refresh')
    } else {
      showSnackbar('Failed to create user story', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to create user story: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleUpdateUserStory = async (storyData) => {
  processingAction.value = true

  try {
    const {data, error} = await userStoryStore.updateUserStory(
      selectedUserStory.value.id,
      storyData
    )

    if (data && !error) {
      showSnackbar('User story updated successfully')
      emit('refresh')
    } else {
      showSnackbar('Failed to update user story', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to update user story: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleDeleteUserStory = async () => {
  if (!selectedUserStory.value) return

  processingAction.value = true
  confirmDeleteDialog.value = false

  try {
    const {success, error} = await userStoryStore.deleteUserStory(selectedUserStory.value.id)

    if (success && !error) {
      showSnackbar('User story deleted successfully')
      emit('refresh')
      detailsDialogVisible.value = false
    } else {
      showSnackbar('Failed to delete user story', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to delete user story: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleRegenerateUserStory = async (feedback = "") => {
  if (!selectedUserStory.value) return

  processingAction.value = true

  try {
    const {data, error} = await userStoryStore.regenerateUserStory(
      selectedUserStory.value.id,
      feedback
    )

    if (data && !error) {
      showSnackbar('User story regeneration started')
      setTimeout(() => {
        emit('refresh')
      }, 3000)
    } else {
      showSnackbar('Failed to regenerate user story', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to regenerate user story: ' + err.message, 'error')
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

onMounted(() => {
  if (props.requirementId && !props.userStories.length && !props.loading) {
    userStoryStore.fetchUserStories(props.requirementId)
      .then(({data}) => {
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
      <VCol cols="12" md="6">
        <VTextField
          v-model="searchQuery"
          density="compact"
          placeholder="Search user stories..."
          prepend-inner-icon="tabler-search"
          hide-details
          variant="outlined"
          clearable
        />
      </VCol>

      <VCol cols="12" md="4">
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
          v-if="hasModeratorPermission && requirementId"
          color="primary"
          prepend-icon="tabler-plus"
          @click="openCreateUserStory"
          :loading="processingAction"
          block
        >
          Add
        </VBtn>
      </VCol>
    </VRow>

    <VDivider class="my-5"/>

    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px">
      <VProgressCircular indeterminate color="primary"/>
    </div>

    <div v-else-if="filteredUserStories.length === 0" class="text-center pa-4">
      <VIcon icon="tabler-notebook" size="64" color="secondary" class="mb-4"/>
      <h4 class="text-h6 mb-2">No User Stories Found</h4>
      <p class="text-body-1 text-medium-emphasis mb-6">
        {{
          searchQuery || filteredStatus.length > 0
            ? 'Try adjusting your filters to see more results.'
            : 'This requirement does not have any user stories yet.'
        }}
      </p>

      <VBtn
        v-if="hasModeratorPermission && requirementId && !searchQuery && filteredStatus.length === 0"
        color="primary"
        @click="openCreateUserStory"
        prepend-icon="tabler-plus"
      >
        Add User Story
      </VBtn>
    </div>

    <VRow v-else>
      <VCol
        v-for="userStory in filteredUserStories"
        :key="userStory.id"
        cols="12"
        md="6"
      >
        <VCard
          class="user-story-card h-100 d-flex flex-column"
          @click="openUserStoryDetails(userStory)"
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
                <VIcon icon="tabler-user-check"/>
              </VAvatar>
            </template>

            <VCardTitle>As a {{ userStory.role }}</VCardTitle>

            <template #append>
              <VChip
                :color="getStatusChipColor(userStory.status)"
                size="small"
                label
              >
                {{ userStory.status }}
              </VChip>
            </template>
          </VCardItem>

          <VCardText class="d-flex flex-column">
            <p class="text-body-1 mb-2">
              <span class="font-weight-medium text-primary">I want to:</span> {{ userStory.action }}
            </p>
            <p class="text-body-1 mb-4">
              <span class="font-weight-medium text-primary">So that:</span> {{ userStory.benefit }}
            </p>

            <div v-if="userStory.acceptance_criteria && userStory.acceptance_criteria.length > 0">
              <div class="text-subtitle-2 font-weight-medium mb-2 text-primary">Acceptance Criteria:</div>
              <ul class="ml-4">
                <li v-for="(criterion, idx) in userStory.acceptance_criteria.slice(0, 2)" :key="idx">
                  {{ criterion }}
                </li>
                <li v-if="userStory.acceptance_criteria.length > 2">
                  ...and {{ userStory.acceptance_criteria.length - 2 }} more
                </li>
              </ul>
            </div>
            <VSpacer/>
            <div class="d-flex align-center justify-space-between mt-3">
              <div class="d-flex align-center">
                <VIcon size="16" icon="tabler-calendar" class="me-1"/>
                <span class="text-caption">{{ formatDate(userStory.updated_at) }}</span>
              </div>

              <div class="d-flex align-center">
                <VIcon size="16" icon="tabler-history" class="me-1"/>
                <span class="text-caption">v{{ userStory.version_number }}</span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <UserStoryDetailsDialog
      v-if="selectedUserStory"
      v-model="detailsDialogVisible"
      :user-story="selectedUserStory"
      @delete="confirmDeleteDialog = true"
      @update="handleUpdateUserStory"
      @regenerate="handleRegenerateUserStory"
      :is-admin="isAdmin"
      :has-manager-permission="hasManagerPermission"
      :has-moderator-permission="hasModeratorPermission"
    />

    <UserStoryCreateDialog
      v-model="createDialogVisible"
      @submit="handleCreateUserStory"
    />

    <ConfirmDialog
      v-model:isDialogVisible="confirmDeleteDialog"
      confirmationMsg="Are you sure you want to delete this user story? This action cannot be undone."
      @confirm="handleDeleteUserStory"
    />

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
  </VCardText>
</template>

<style scoped>
.user-story-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.user-story-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(var(--v-theme-on-surface), 0.1) !important;
}
</style>
