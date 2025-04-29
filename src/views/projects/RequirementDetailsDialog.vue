<script setup>
import { ref, computed, watch } from 'vue'
import { useRequirementStore } from '@/stores/useRequirementStore'
import { getCategoryChipColor, getStatusChipColor } from "@core/utils/formatters"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  requirement: {
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

const emit = defineEmits ([ 'update:modelValue', 'update', 'delete', 'view-user-stories' ])

const dialog = computed ({
  get: () => props.modelValue,
  set: (value) => emit ('update:modelValue', value)
})

const requirementStore = useRequirementStore ()

const activeTab = ref (0)
const isEditMode = ref (false)
const editedRequirement = ref ({ ...props.requirement })
const newComment = ref ('')
const processingComment = ref (false)
const snackbar = ref ({
  show: false,
  text: '',
  color: 'success'
})

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

const requirementTypeOptions = [
  { title: 'Feature', value: 'feature' },
  { title: 'Constraint', value: 'constraint' },
  { title: 'Quality', value: 'quality' },
  { title: 'Interface', value: 'interface' },
  { title: 'Security', value: 'security' },
  { title: 'Performance', value: 'performance' },
  { title: 'Other', value: 'other' }
]

const history = computed (() => {
  return props.requirement.history || []
})

const comments = computed (() => {
  return props.requirement.comments || []
})

const userStories = computed (() => {
  return props.requirement.user_stories || []
})

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

const capitalize = (str) => {
  if (!str) return ''
  return str.charAt (0).toUpperCase () + str.slice (1)
}

const toggleEditMode = () => {
  if (isEditMode.value) {
    editedRequirement.value = { ...props.requirement }
  }
  isEditMode.value = !isEditMode.value
}

const saveRequirement = () => {
  emit ('update', editedRequirement.value)
  isEditMode.value = false
}

const handleDeleteRequirement = () => {
  emit ('delete')
}

const viewUserStories = () => {
  emit ('view-user-stories', props.requirement)
  dialog.value = false
}

const submitComment = async () => {
  if (!newComment.value.trim ()) return

  processingComment.value = true

  try {
    const { data, error } = await requirementStore.createComment (props.requirement.id, {
      text: newComment.value,
      status: 'active'
    })

    if (data && !error) {
      showSnackbar ('Comment added successfully')
      newComment.value = ''
      const { data: refreshedRequirement } = await requirementStore.fetchRequirementById (props.requirement.id)
      if (refreshedRequirement) {
        Object.assign (props.requirement, refreshedRequirement)
      }
    } else {
      showSnackbar ('Failed to add comment', 'error')
    }
  } catch (err) {
    showSnackbar ('Failed to add comment: ' + err.message, 'error')
  } finally {
    processingComment.value = false
  }
}

const deleteComment = async (commentId) => {
  processingComment.value = true

  try {
    const { success, error } = await requirementStore.deleteComment (commentId)

    if (success && !error) {
      showSnackbar ('Comment deleted successfully')
      const { data: refreshedRequirement } = await requirementStore.fetchRequirementById (props.requirement.id)
      if (refreshedRequirement) {
        Object.assign (props.requirement, refreshedRequirement)
      }
    } else {
      showSnackbar ('Failed to delete comment', 'error')
    }
  } catch (err) {
    showSnackbar ('Failed to delete comment: ' + err.message, 'error')
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

watch (() => props.requirement, (newVal) => {
  editedRequirement.value = { ...newVal }
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
          <h5 class="text-h5">Edit Requirement</h5>
        </template>
        <template v-else>
          <h5 class="text-h5">Requirement Details</h5>
        </template>

        <VSpacer/>

        <IconBtn @click="dialog = false">
          <VIcon icon="tabler-x"/>
        </IconBtn>
      </VCardTitle>

      <VCardText class="pb-0">
        <VTabs
          v-model="activeTab"
          slider-color="primary"
          align-tabs="start"
        >
          <VTab value="0">
            <VIcon size="18" icon="tabler-info-circle" start/>
            Details
          </VTab>
          <VTab value="1">
            <VIcon size="18" icon="tabler-user-check" start/>
            User Stories
            <VChip
              v-if="userStories.length"
              size="x-small"
              color="primary"
              class="ms-2"
            >
              {{ userStories.length }}
            </VChip>
          </VTab>
          <VTab value="2">
            <VIcon size="18" icon="tabler-history" start/>
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
          <VTab value="3">
            <VIcon size="18" icon="tabler-messages" start/>
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

      <VDivider/>

      <VCardText class="pa-6" style="min-height: 400px; max-height: 70vh;">
        <VWindow v-model="activeTab" class="mt-5">
          <VWindowItem value="0">
            <div v-if="isEditMode">
              <VForm @submit.prevent="saveRequirement">
                <VRow class="mt-3">
                  <VCol cols="12">
                    <VTextField
                      v-model="editedRequirement.title"
                      label="Title"
                      required
                      :rules="[v => !!v || 'Title is required']"
                    />
                  </VCol>

                  <VCol cols="12" md="4">
                    <VSelect
                      v-model="editedRequirement.category"
                      label="Category"
                      :items="categoryOptions"
                      required
                    />
                  </VCol>

                  <VCol cols="12" md="4">
                    <VSelect
                      v-model="editedRequirement.requirement_type"
                      label="Requirement Type"
                      :items="requirementTypeOptions"
                      required
                    />
                  </VCol>

                  <VCol cols="12" md="4">
                    <VSelect
                      v-model="editedRequirement.status"
                      label="Status"
                      :items="statusOptions"
                      required
                    />
                  </VCol>

                  <VCol cols="12">
                    <VTextarea
                      v-model="editedRequirement.description"
                      label="Description"
                      required
                      rows="8"
                      :rules="[v => !!v || 'Description is required']"
                    />
                  </VCol>
                </VRow>
              </VForm>
            </div>
            <div v-else>
              <div class="d-flex align-center mb-5">
                <VChip
                  :color="getCategoryChipColor(requirement.category)"
                  size="small"
                  label
                  class="me-2"
                >
                  {{ requirement.category }}
                </VChip>

                <VChip
                  :color="getStatusChipColor(requirement.status)"
                  size="small"
                  label
                >
                  {{ capitalize (requirement.status) }}
                </VChip>

                <VChip
                  color="secondary"
                  size="small"
                  label
                  class="ms-2"
                >
                  v{{ requirement.version_number }}
                </VChip>

                <VChip
                  v-if="requirement.requirement_type"
                  color="info"
                  size="small"
                  label
                  class="ms-2"
                >
                  {{ requirement.requirement_type }}
                </VChip>

                <VSpacer/>

                <div class="text-medium-emphasis d-flex align-center">
                  <VIcon size="18" icon="tabler-calendar" class="me-1"/>
                  <span class="text-caption me-4">Updated: {{ formatDate (requirement.updated_at) }}</span>

                  <VIcon size="18" icon="tabler-calendar-plus" class="me-1"/>
                  <span class="text-caption">Created: {{ formatDate (requirement.created_at) }}</span>
                </div>
              </div>

              <h4 class="text-h4 mb-4">{{ requirement.title }}</h4>

              <div class="text-body-1 whitespace-pre-wrap">{{ requirement.description }}</div>
            </div>
          </VWindowItem>

          <VWindowItem value="1">
            <div v-if="userStories.length === 0" class="text-center pa-6">
              <VIcon icon="tabler-user-check" size="64" color="secondary" class="mb-3"/>
              <h4 class="text-h6 mb-2">No User Stories Available</h4>
              <p class="text-medium-emphasis mb-4">
                This requirement doesn't have any user stories yet.
              </p>

              <VBtn
                color="primary"
                @click="viewUserStories"
              >
                Generate User Stories
              </VBtn>
            </div>

            <div v-else>
              <div class="d-flex justify-space-between align-center mb-4">
                <h5 class="text-h5">User Stories</h5>
                <VBtn
                  color="primary"
                  variant="tonal"
                  @click="viewUserStories"
                >
                  View All User Stories
                </VBtn>
              </div>

              <VCard
                v-for="(story, index) in userStories.slice(0, 3)"
                :key="story.id"
                class="mb-4"
                border
              >
                <VCardItem>
                  <VCardTitle>As a {{ story.role }}</VCardTitle>
                  <template #append>
                    <VChip
                      :color="getStatusChipColor(story.status)"
                      size="small"
                      label
                    >
                      {{ story.status }}
                    </VChip>
                  </template>
                </VCardItem>
                <VCardText>
                  <p class="mb-2"><strong>I want to:</strong> {{ story.action }}</p>
                  <p><strong>So that:</strong> {{ story.benefit }}</p>

                  <div v-if="story.acceptance_criteria && story.acceptance_criteria.length > 0" class="mt-3">
                    <div class="text-subtitle-2">Acceptance Criteria:</div>
                    <ul class="pl-4">
                      <li v-for="(criterion, idx) in story.acceptance_criteria.slice(0, 2)" :key="idx">
                        {{ criterion }}
                      </li>
                      <li v-if="story.acceptance_criteria.length > 2">
                        ...and {{ story.acceptance_criteria.length - 2 }} more
                      </li>
                    </ul>
                  </div>
                </VCardText>
              </VCard>

              <div v-if="userStories.length > 3" class="text-center mt-4">
                <VBtn
                  color="primary"
                  variant="tonal"
                  @click="viewUserStories"
                >
                  View All {{ userStories.length }} User Stories
                </VBtn>
              </div>
            </div>
          </VWindowItem>

          <VWindowItem value="2">
            <div v-if="history.length === 0" class="text-center pa-6">
              <VIcon icon="tabler-history" size="64" color="secondary" class="mb-3"/>
              <h4 class="text-h6 mb-2">No History Available</h4>
              <p class="text-medium-emphasis">
                This requirement hasn't been modified since its creation.
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
                    <div class="text-caption">{{ formatDate (item.changed_at) }}</div>
                    <div class="text-caption text-medium-emphasis">v{{ item.version_number }}</div>
                  </template>

                  <VCard border>
                    <VCardItem>
                      <VCardTitle>{{ item.title }}</VCardTitle>
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
                      <div class="d-flex align-center mb-2">
                        <VChip
                          :color="getCategoryChipColor(item.category)"
                          size="small"
                          label
                          class="me-2"
                        >
                          {{ item.category }}
                        </VChip>

                        <span class="text-caption">
                          Changed by: {{ item.changed_by ? item.changed_by.username : 'Unknown' }}
                        </span>
                      </div>

                      <div class="text-body-2 whitespace-pre-wrap">{{ item.description }}</div>
                    </VCardText>
                  </VCard>
                </VTimelineItem>
              </VTimeline>
            </div>
          </VWindowItem>

          <VWindowItem value="3">
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
                <VDivider v-if="comments.length" class="mb-4"/>

                <div v-if="comments.length === 0" class="text-center pa-6">
                  <VIcon icon="tabler-messages" size="64" color="secondary" class="mb-3"/>
                  <h4 class="text-h6 mb-2">No Comments Yet</h4>
                  <p class="text-medium-emphasis">
                    Be the first to comment on this requirement.
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
                            <VIcon icon="tabler-user"/>
                          </VAvatar>

                          <div>
                            <div class="d-flex align-center">
                              <strong>{{ comment.user ? comment.user.username : 'Unknown User' }}</strong>
                              <div class="text-caption text-medium-emphasis ml-2">
                                {{ formatDate (comment.created_at) }}
                              </div>
                            </div>
                          </div>

                          <VSpacer/>

                          <IconBtn
                            v-if="isAdmin || hasManagerPermission"
                            size="small"
                            color="error"
                            variant="text"
                            @click="deleteComment(comment.id)"
                            :disabled="processingComment"
                          >
                            <VIcon icon="tabler-trash" size="18"/>
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

      <VDivider/>

      <VCardActions class="pa-4">
        <template v-if="isEditMode">
          <VBtn
            color="secondary"
            variant="tonal"
            @click="toggleEditMode"
          >
            Cancel
          </VBtn>

          <VSpacer/>

          <VBtn
            color="primary"
            @click="saveRequirement"
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
            @click="handleDeleteRequirement"
          >
            Delete
          </VBtn>

          <VBtn
            v-if="hasModeratorPermission && userStories.length === 0"
            color="info"
            variant="tonal"
            prepend-icon="tabler-user-check"
            class="ms-2"
            @click="viewUserStories"
          >
            Generate User Stories
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
.whitespace-pre-wrap {
  white-space: pre-wrap;
}

.comment-item {
  transition: transform 0.2s;
}

.comment-item:hover {
  transform: translateX(3px);
}
</style>
