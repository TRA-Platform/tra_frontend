<script setup>
import { ref, computed, watch, capitalize } from 'vue'
import { useUserStoryStore } from '@/stores/useUserStoryStore'
import { getStatusChipColor } from "@core/utils/formatters"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  userStory: {
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

const emit = defineEmits(['update:modelValue', 'update', 'delete', 'regenerate'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const userStoryStore = useUserStoryStore()

const activeTab = ref(0)
const isEditMode = ref(false)
const editedUserStory = ref({ ...props.userStory })
const criteriaInput = ref('')
const newComment = ref('')
const regenerateFeedback = ref('')
const regenerateDialogVisible = ref(false)
const processingComment = ref(false)
const snackbar = ref({
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

const history = computed(() => {
  return props.userStory.history || []
})

const comments = computed(() => {
  return props.userStory.comments || []
})

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

const toggleEditMode = () => {
  if (isEditMode.value) {
    editedUserStory.value = { ...props.userStory }
    criteriaInput.value = ''
  }
  isEditMode.value = !isEditMode.value
}

const addCriterion = () => {
  if (!criteriaInput.value.trim()) return

  if (!editedUserStory.value.acceptance_criteria) {
    editedUserStory.value.acceptance_criteria = []
  }

  editedUserStory.value.acceptance_criteria.push(criteriaInput.value.trim())
  criteriaInput.value = ''
}

const removeCriterion = (index) => {
  editedUserStory.value.acceptance_criteria.splice(index, 1)
}

const saveUserStory = () => {
  emit('update', editedUserStory.value)
  isEditMode.value = false
}

const handleDeleteUserStory = () => {
  emit('delete')
}

const openRegenerateDialog = () => {
  regenerateFeedback.value = ''
  regenerateDialogVisible.value = true
}

const submitRegeneration = () => {
  emit('regenerate', regenerateFeedback.value)
  regenerateDialogVisible.value = false
}

const submitComment = async () => {
  if (!newComment.value.trim()) return

  processingComment.value = true

  try {
    const { data, error } = await userStoryStore.createComment(props.userStory.id, {
      text: newComment.value,
      status: 'active'
    })

    if (data && !error) {
      showSnackbar('Comment added successfully')
      newComment.value = ''
      const { data: refreshedUserStory } = await userStoryStore.fetchUserStoryById(props.userStory.id)
      if (refreshedUserStory) {
        Object.assign(props.userStory, refreshedUserStory)
      }
    } else {
      showSnackbar('Failed to add comment', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to add comment: ' + err.message, 'error')
  } finally {
    processingComment.value = false
  }
}

const deleteComment = async (commentId) => {
  processingComment.value = true

  try {
    const { success, error } = await userStoryStore.deleteComment(commentId)

    if (success && !error) {
      showSnackbar('Comment deleted successfully')
      const { data: refreshedUserStory } = await userStoryStore.fetchUserStoryById(props.userStory.id)
      if (refreshedUserStory) {
        Object.assign(props.userStory, refreshedUserStory)
      }
    } else {
      showSnackbar('Failed to delete comment', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to delete comment: ' + err.message, 'error')
  } finally {
    processingComment.value = false
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

watch(() => props.userStory, (newVal) => {
  editedUserStory.value = { ...newVal }
}, { deep: true })
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="900"
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex pt-5 px-5">
        <template v-if="isEditMode">
          <h5 class="text-h5">Edit User Story</h5>
        </template>
        <template v-else>
          <h5 class="text-h5">User Story Details</h5>
        </template>

        <VSpacer />

        <IconBtn @click="dialog = false">
          <VIcon icon="tabler-x" />
        </IconBtn>
      </VCardTitle>

      <VCardText class="pb-0">
        <VTabs
          v-model="activeTab"
          slider-color="primary"
          align-tabs="start"
        >
          <VTab value="0">
            <VIcon size="18" icon="tabler-user-check" start />
            Details
          </VTab>
          <VTab value="1">
            <VIcon size="18" icon="tabler-history" start />
            History
            <VChip
              v-if="history.length"
              size="x-small"
              color="primary"
              class="ms-2"
            >
              {{ history.length }}
            </VChip>
          </VTab>
          <VTab value="2">
            <VIcon size="18" icon="tabler-messages" start />
            Comments
            <VChip
              v-if="comments.length"
              size="x-small"
              color="primary"
              class="ms-2"
            >
              {{ comments.length }}
            </VChip>
          </VTab>
        </VTabs>
      </VCardText>

      <VDivider />

      <VCardText class="pa-6" style="min-height: 400px; max-height: 70vh;">
        <VWindow v-model="activeTab" class="mt-5">
          <VWindowItem value="0">
            <div v-if="isEditMode">
              <VForm @submit.prevent="saveUserStory">
                <VRow class="mt-3">
                  <VCol cols="12">
                    <VTextField
                      v-model="editedUserStory.role"
                      label="Role (As a...)"
                      required
                      :rules="[v => !!v || 'Role is required']"
                    />
                  </VCol>

                  <VCol cols="12">
                    <VTextField
                      v-model="editedUserStory.action"
                      label="Action (I want to...)"
                      required
                      :rules="[v => !!v || 'Action is required']"
                    />
                  </VCol>

                  <VCol cols="12">
                    <VTextField
                      v-model="editedUserStory.benefit"
                      label="Benefit (So that...)"
                      required
                      :rules="[v => !!v || 'Benefit is required']"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <VSelect
                      v-model="editedUserStory.status"
                      label="Status"
                      :items="statusOptions"
                      required
                    />
                  </VCol>

                  <VCol cols="12">
                    <div class="align-center justify-space-between mb-3">
                      <div class="text-subtitle-1 font-weight-medium">Acceptance Criteria</div>
                      <VRow
                        class="w-100"
                      >
                        <VCol
                          cols="10"
                          sm="8"
                        >
                          <VTextField
                            v-model="criteriaInput"
                            placeholder="Add new criterion"
                            density="compact"
                            hide-details
                            class="me-2"
                            @keyup.enter="addCriterion"
                          />
                        </VCol>
                        <VCol
                          cols="2"
                          sm="4"
                        >
                          <VBtn
                            color="primary"
                            size="small"
                            :disabled="!criteriaInput.trim()"
                            @click="addCriterion"
                          >
                            Add
                          </VBtn>
                        </VCol>
                      </VRow>
                    </div>

                    <VList v-if="editedUserStory.acceptance_criteria && editedUserStory.acceptance_criteria.length > 0">
                      <VListItem
                        v-for="(criterion, index) in editedUserStory.acceptance_criteria"
                        :key="index"
                      >
                        <template #prepend>
                          <VIcon icon="tabler-check" color="success" />
                        </template>
                        <VListItemTitle>{{ criterion }}</VListItemTitle>
                        <template #append>
                          <IconBtn
                            color="error"
                            variant="text"
                            size="small"
                            @click="removeCriterion(index)"
                          >
                            <VIcon icon="tabler-trash" size="18" />
                          </IconBtn>
                        </template>
                      </VListItem>
                    </VList>
                    <div
                      v-else
                      class="text-medium-emphasis text-center pa-4 rounded bg-grey-lighten-5"
                    >
                      No acceptance criteria added yet
                    </div>
                  </VCol>
                </VRow>
              </VForm>
            </div>
            <div v-else>
              <div class="d-flex align-center mb-5">
                <VChip
                  :color="getStatusChipColor(userStory.status)"
                  size="small"
                  label
                  class="me-2"
                >
                  {{ capitalize(userStory.status) }}
                </VChip>

                <VChip
                  color="secondary"
                  size="small"
                  label
                  class="ms-2"
                >
                  v{{ userStory.version_number }}
                </VChip>

                <VSpacer />

                <div class="text-medium-emphasis d-flex align-center">
                  <VIcon size="18" icon="tabler-calendar" class="me-1" />
                  <span class="text-caption me-4">Updated: {{ formatDate(userStory.updated_at) }}</span>

                  <VIcon size="18" icon="tabler-calendar-plus" class="me-1" />
                  <span class="text-caption">Created: {{ formatDate(userStory.created_at) }}</span>
                </div>
              </div>

              <div class="user-story-format mb-6">
                <div class="text-h5 mb-4">
                  <span class="text-primary">As a</span> {{ userStory.role }},
                </div>
                <div class="text-h5 mb-4">
                  <span class="text-primary">I want to</span> {{ userStory.action }},
                </div>
                <div class="text-h5 mb-4">
                  <span class="text-primary">so that</span> {{ userStory.benefit }}.
                </div>
              </div>

              <VDivider class="mb-4" />

              <div v-if="userStory.acceptance_criteria && userStory.acceptance_criteria.length > 0">
                <div class="text-h6 mb-3">Acceptance Criteria</div>
                <VList>
                  <VListItem
                    v-for="(criterion, index) in userStory.acceptance_criteria"
                    :key="index"
                    class="px-0"
                  >
                    <template #prepend>
                      <VIcon icon="tabler-check" color="success" class="me-2" />
                    </template>
                    <VListItemTitle>{{ criterion }}</VListItemTitle>
                  </VListItem>
                </VList>
              </div>
              <div v-else class="text-medium-emphasis text-center pa-4">
                No acceptance criteria defined for this user story.
              </div>

              <div class="mt-6" v-if="userStory.generation_status === 'in_progress'">
                <VAlert
                  color="info"
                  variant="tonal"
                  icon="tabler-refresh"
                >
                  <VAlertTitle>Regenerating User Story</VAlertTitle>
                  <p>This user story is currently being regenerated. Please check back shortly.</p>
                </VAlert>
              </div>
            </div>
          </VWindowItem>

          <VWindowItem value="1">
            <div v-if="history.length === 0" class="text-center pa-6">
              <VIcon icon="tabler-history" size="64" color="secondary" class="mb-3" />
              <h4 class="text-h6 mb-2">No History Available</h4>
              <p class="text-medium-emphasis">
                This user story hasn't been modified since its creation.
              </p>
            </div>

            <div v-else>
              <VTimeline density="compact" align="start">
                <VTimelineItem
                  v-for="(item, index) in history"
                  :key="index"
                  dot-color="primary"
                  size="small"
                >
                  <template #opposite>
                    <div class="text-caption">{{ formatDate(item.changed_at) }}</div>
                    <div class="text-caption text-medium-emphasis">v{{ item.version_number }}</div>
                  </template>

                  <VCard border>
                    <VCardItem>
                      <template #prepend>
                        <VAvatar
                          color="primary"
                          variant="tonal"
                          size="36"
                        >
                          <VIcon icon="tabler-user-check" />
                        </VAvatar>
                      </template>

                      <VCardTitle>
                        <span class="text-primary">As a</span> {{ item.role }}
                      </VCardTitle>

                      <template #append>
                        <VChip
                          :color="getStatusChipColor(item.status)"
                          size="small"
                          label
                          class="ms-2"
                        >
                          {{ item.status }}
                        </VChip>
                      </template>
                    </VCardItem>

                    <VCardText>
                      <p class="mb-2">
                        <span class="text-primary">I want to</span> {{ item.action }}
                      </p>
                      <p class="mb-4">
                        <span class="text-primary">so that</span> {{ item.benefit }}
                      </p>

                      <div v-if="item.acceptance_criteria && item.acceptance_criteria.length > 0">
                        <div class="text-subtitle-2 font-weight-medium mb-2">Acceptance Criteria:</div>
                        <ul class="ms-3">
                          <li v-for="(criterion, idx) in item.acceptance_criteria" :key="idx">
                            {{ criterion }}
                          </li>
                        </ul>
                      </div>

                      <div class="text-caption mt-3">
                        Changed by: {{ item.changed_by ? item.changed_by.username : 'System' }}
                      </div>
                    </VCardText>
                  </VCard>
                </VTimelineItem>
              </VTimeline>
            </div>
          </VWindowItem>

          <VWindowItem value="2">
            <VRow class="mt-3">
              <VCol cols="12">
                <VTextarea
                  v-model="newComment"
                  label="Add a comment"
                  rows="3"
                  counter
                  :disabled="processingComment"
                />

                <div class="d-flex justify-end mt-2">
                  <VBtn
                    color="primary"
                    size="small"
                    :loading="processingComment"
                    :disabled="!newComment.trim()"
                    @click="submitComment"
                  >
                    Add Comment
                  </VBtn>
                </div>
              </VCol>

              <VCol cols="12">
                <VDivider v-if="comments.length" class="mb-4" />

                <div v-if="comments.length === 0" class="text-center pa-6">
                  <VIcon icon="tabler-messages" size="64" color="secondary" class="mb-3" />
                  <h4 class="text-h6 mb-2">No Comments Yet</h4>
                  <p class="text-medium-emphasis">
                    Be the first to comment on this user story.
                  </p>
                </div>

                <div v-else>
                  <div
                    v-for="comment in comments"
                    :key="comment.id"
                    class="comment-item mb-4"
                  >
                    <VCard border>
                      <VCardText class="py-2">
                        <div class="d-flex align-center">
                          <VAvatar
                            color="primary"
                            variant="tonal"
                            size="36"
                            class="me-3"
                          >
                            <VIcon icon="tabler-user" />
                          </VAvatar>

                          <div>
                            <div class="d-flex align-center">
                              <strong>{{ comment.user ? comment.user.username : 'Unknown User' }}</strong>
                              <div class="text-caption text-medium-emphasis ml-2">
                                {{ formatDate(comment.created_at) }}
                              </div>
                            </div>
                          </div>

                          <VSpacer />

                          <IconBtn
                            v-if="isAdmin || hasManagerPermission"
                            size="small"
                            color="error"
                            variant="text"
                            @click="deleteComment(comment.id)"
                            :disabled="processingComment"
                          >
                            <VIcon icon="tabler-trash" size="18" />
                          </IconBtn>
                        </div>

                        <div class="comment-text mt-2 whitespace-pre-wrap">
                          {{ comment.text }}
                        </div>
                      </VCardText>
                    </VCard>
                  </div>
                </div>
              </VCol>
            </VRow>
          </VWindowItem>
        </VWindow>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <template v-if="isEditMode">
          <VBtn
            color="secondary"
            variant="tonal"
            @click="toggleEditMode"
          >
            Cancel
          </VBtn>

          <VSpacer />

          <VBtn
            color="primary"
            @click="saveUserStory"
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
            @click="handleDeleteUserStory"
          >
            Delete
          </VBtn>

          <VBtn
            v-if="hasModeratorPermission"
            color="info"
            variant="tonal"
            prepend-icon="tabler-refresh"
            class="ms-2"
            @click="openRegenerateDialog"
          >
            Regenerate
          </VBtn>

          <VSpacer />

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

    <!-- Regenerate Dialog -->
    <VDialog
      v-model="regenerateDialogVisible"
      max-width="600"
      persistent
    >
      <VCard>
        <VCardTitle class="pt-3 pb-0">
          Regenerate User Story
        </VCardTitle>

        <VCardText>
          <p class="text-body-1 mb-3">
            This will use AI to regenerate this user story based on your feedback and the associated requirement.
          </p>

          <VTextarea
            v-model="regenerateFeedback"
            label="Feedback for Regeneration"
            placeholder="Explain what you want to improve about this user story..."
            rows="4"
            counter
          />
        </VCardText>

        <VCardActions>
          <VBtn
            color="secondary"
            variant="tonal"
            @click="regenerateDialogVisible = false"
          >
            Cancel
          </VBtn>

          <VSpacer />

          <VBtn
            color="primary"
            @click="submitRegeneration"
          >
            Regenerate
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

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
  </VDialog>
</template>

<style scoped>
.whitespace-pre-wrap {
  white-space: pre-wrap;
}

.comment-item {
  transition: transform 0.2s;
}

.comment-item:hover {
  transform: translateX(3px);
}

.user-story-format {
  line-height: 1.5;
  border-left: 4px solid var(--v-theme-primary);
  padding-left: 20px;
}
</style>
