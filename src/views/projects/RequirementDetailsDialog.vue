<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRequirementStore } from '@/stores/useRequirementStore'
import { useMockupStore } from '@/stores/useMockupStore'
import { getCategoryChipColor, getStatusChipColor } from "@core/utils/formatters"
import { useI18n } from 'vue-i18n'
import MockupPreviewDialog from '@/views/projects/MockupPreviewDialog.vue'

const { t } = useI18n()

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
const mockupStore = useMockupStore()

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

const selectedMockup = ref(null)
const previewDialogVisible = ref(false)
const refreshInterval = ref(null)

const categoryOptions = [
  { title: t('projects.categories.functional'), value: 'functional' },
  { title: t('projects.categories.nonfunctional'), value: 'nonfunctional' },
  { title: t('projects.categories.uiux'), value: 'uiux' },
  { title: t('projects.categories.other'), value: 'other' }
]

const statusOptions = [
  { title: t('projects.status.draft'), value: 'draft' },
  { title: t('projects.status.active'), value: 'active' },
  { title: t('projects.status.archived'), value: 'archived' },
  { title: t('projects.status.completed'), value: 'completed' }
]

const requirementTypeOptions = [
  { title: t('projects.requirements.types.feature'), value: 'feature' },
  { title: t('projects.requirements.types.constraint'), value: 'constraint' },
  { title: t('projects.requirements.types.quality'), value: 'quality' },
  { title: t('projects.requirements.types.interface'), value: 'interface' },
  { title: t('projects.requirements.types.security'), value: 'security' },
  { title: t('projects.requirements.types.performance'), value: 'performance' },
  { title: t('projects.requirements.types.other'), value: 'other' }
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

const relatedMockups = computed(() => {
  return props.requirement.mockups || []
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
  activeTab.value = "0"
}

const checkRequirementStatus = () => {
  if (dialog.value) {
    requirementStore.fetchRequirementById(props.requirement.id)
      .then(({ data }) => {
        if (data) {
          Object.assign(props.requirement, data)
        }
      })
  }
}

onMounted(() => {
  refreshInterval.value = setInterval(checkRequirementStatus, 5000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

const saveRequirement = () => {
  emit('update', editedRequirement.value)
  isEditMode.value = false
  dialog.value = false // Close dialog after save
}

const handleDeleteRequirement = () => {
  emit('delete')
  dialog.value = false // Close dialog after delete
}

const viewUserStories = () => {
  emit('view-user-stories', props.requirement)
  dialog.value = false // Close dialog after viewing user stories
}

const submitComment = async () => {
  if (!newComment.value.trim()) return

  processingComment.value = true

  try {
    const { data, error } = await requirementStore.createComment(props.requirement.id, {
      text: newComment.value,
      status: 'active'
    })

    if (data && !error) {
      showSnackbar(t('projects.requirements.notifications.comment_added'))
      newComment.value = ''
      const { data: refreshedRequirement } = await requirementStore.fetchRequirementById(props.requirement.id)
      if (refreshedRequirement) {
        Object.assign(props.requirement, refreshedRequirement)
      }
    } else {
      showSnackbar(t('projects.requirements.notifications.comment_add_failed'), 'error')
    }
  } catch (err) {
    showSnackbar(t('projects.requirements.notifications.comment_add_failed') + ': ' + err.message, 'error')
  } finally {
    processingComment.value = false
  }
}

const deleteComment = async (commentId) => {
  processingComment.value = true

  try {
    const { success, error } = await requirementStore.deleteComment(commentId)

    if (success && !error) {
      showSnackbar(t('projects.requirements.notifications.comment_deleted'))
      const { data: refreshedRequirement } = await requirementStore.fetchRequirementById(props.requirement.id)
      if (refreshedRequirement) {
        Object.assign(props.requirement, refreshedRequirement)
      }
    } else {
      showSnackbar(t('projects.requirements.notifications.comment_delete_failed'), 'error')
    }
  } catch (err) {
    showSnackbar(t('projects.requirements.notifications.comment_delete_failed') + ': ' + err.message, 'error')
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
const truncateHtml = (html, length = 150) => {
  if (!html || html.length <= length) return html

  const textOnly = html.replace(/<[^>]*>/g, '')

  if (textOnly.length <= length) return html

  return textOnly.substring(0, length) + '...'
}
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
          <h5 class="text-h5">{{ t('projects.requirements.actions.edit') }}</h5>
        </template>
        <template v-else>
          <h5 class="text-h5">{{ t('projects.requirements.actions.view_details') }}</h5>
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
            {{ t('projects.requirements.tabs.details') }}
          </VTab>
          <VTab value="1">
            <VIcon size="18" icon="tabler-user-check" start/>
            {{ t('projects.requirements.tabs.user_stories') }}
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
            <VIcon size="18" icon="tabler-photo" start/>
            {{ t('projects.requirements.tabs.mockups') }}
            <VChip
              v-if="relatedMockups.length"
              size="x-small"
              color="primary"
              class="ms-2"
            >
              {{ relatedMockups.length }}
            </VChip>
          </VTab>
          <VTab value="3">
            <VIcon size="18" icon="tabler-history" start/>
            {{ t('projects.requirements.tabs.history') }}
            <VChip
              v-if="history.length"
              size="x-small"
              color="primary"
              class="ms-2"
            >
              {{ history.length }}
            </VChip>
          </VTab>
          <VTab value="4">
            <VIcon size="18" icon="tabler-messages" start/>
            {{ t('projects.requirements.tabs.comments') }}
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
                      :label="t('projects.requirements.title')"
                      required
                      :rules="[v => !!v || t('validation.required')]"
                    />
                  </VCol>

                  <VCol cols="12" md="4">
                    <VSelect
                      v-model="editedRequirement.category"
                      :label="t('projects.requirements.category')"
                      :items="categoryOptions"
                      required
                    />
                  </VCol>

                  <VCol cols="12" md="4">
                    <VSelect
                      v-model="editedRequirement.requirement_type"
                      :label="t('projects.requirements.type')"
                      :items="requirementTypeOptions"
                      required
                    />
                  </VCol>

                  <VCol cols="12" md="4">
                    <VSelect
                      v-model="editedRequirement.status"
                      :label="t('projects.requirements.status')"
                      :items="statusOptions"
                      required
                    />
                  </VCol>

                  <VCol cols="12">
                    <VTextarea
                      v-model="editedRequirement.description"
                      :label="t('projects.requirements.description')"
                      required
                      rows="8"
                      :rules="[v => !!v || t('validation.required')]"
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
                  {{ t(`projects.categories.${requirement.category}`) }}
                </VChip>

                <VChip
                  :color="getStatusChipColor(requirement.status)"
                  size="small"
                  label
                >
                  {{ t(`projects.status.${requirement.status}`) }}
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
                  {{ t(`projects.requirements.types.${requirement.requirement_type}`) }}
                </VChip>

                <VSpacer/>
                </div>
                <div class="d-flex align-center">

                <div class="text-medium-emphasis d-flex align-center">
                  <VIcon size="18" icon="tabler-calendar" class="me-1"/>
                  <span class="text-caption me-4">{{ t('projects.details.updated_at') }}: {{ formatDate(requirement.updated_at) }}</span>

                  <VIcon size="18" icon="tabler-calendar-plus" class="me-1"/>
                  <span class="text-caption">{{ t('projects.details.created_at') }}: {{ formatDate(requirement.created_at) }}</span>
                </div>
              </div>

              <h4 class="text-h4 mb-4">{{ requirement.title }}</h4>

              <div class="text-body-1 whitespace-pre-wrap">{{ requirement.description }}</div>
            </div>
          </VWindowItem>

          <VWindowItem value="1">
            <div v-if="userStories.length === 0" class="text-center pa-6">
              <VIcon icon="tabler-user-check" size="64" color="secondary" class="mb-3"/>
              <h4 class="text-h6 mb-2">{{ t('projects.requirements.user_stories.empty.title') }}</h4>
              <p class="text-medium-emphasis mb-4">
                {{ t('projects.requirements.user_stories.empty.description') }}
              </p>

              <VBtn
                color="primary"
                @click="viewUserStories"
              >
                {{ t('projects.requirements.actions.generate_user_stories') }}
              </VBtn>
            </div>

            <div v-else>
              <div class="d-flex justify-space-between align-center mb-4">
                <h5 class="text-h5">{{ t('projects.requirements.user_stories.title') }}</h5>
                <VBtn
                  color="primary"
                  variant="tonal"
                  @click="viewUserStories"
                >
                  {{ t('projects.requirements.actions.view_all_stories') }}
                </VBtn>
              </div>

              <VCard
                v-for="(story, index) in userStories.slice(0, 3)"
                :key="story.id"
                class="mb-4"
                border
              >
                <VCardItem>
                  <VCardTitle>{{ t('projects.requirements.user_stories.as_a', { role: story.role }) }}</VCardTitle>
                  <template #append>
                    <VChip
                      :color="getStatusChipColor(story.status)"
                      size="small"
                      label
                    >
                      {{ t(`projects.status.${story.status}`) }}
                    </VChip>
                  </template>
                </VCardItem>
                <VCardText>
                  <p class="mb-2"><strong>{{ t('projects.requirements.user_stories.i_want_to') }}:</strong> {{ story.action }}</p>
                  <p><strong>{{ t('projects.requirements.user_stories.so_that') }}:</strong> {{ story.benefit }}</p>

                  <div v-if="story.acceptance_criteria && story.acceptance_criteria.length > 0" class="mt-3">
                    <div class="text-subtitle-2">{{ t('projects.requirements.user_stories.acceptance_criteria') }}:</div>
                    <ul class="pl-4">
                      <li v-for="(criterion, idx) in story.acceptance_criteria.slice(0, 2)" :key="idx">
                        {{ criterion }}
                      </li>
                      <li v-if="story.acceptance_criteria.length > 2">
                        {{ t('projects.requirements.user_stories.and_more', { count: story.acceptance_criteria.length - 2 }) }}
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
                  {{ t('projects.requirements.actions.view_all_stories_count', { count: userStories.length }) }}
                </VBtn>
              </div>
            </div>
          </VWindowItem>

          <VWindowItem value="2">
            <div v-if="relatedMockups.length === 0" class="text-center pa-6">
              <VIcon icon="tabler-photo-off" size="64" color="secondary" class="mb-3"/>
              <h4 class="text-h6 mb-2">{{ t('projects.requirements.mockups.empty.title') }}</h4>
              <p class="text-medium-emphasis">
                {{ t('projects.requirements.mockups.empty.description') }}
              </p>
            </div>

            <div v-else>
              <VRow>
                <VCol
                  v-for="mockup in relatedMockups"
                  :key="mockup.id"
                  cols="12"
                  md="6"
                  lg="4"
                >
                  <VCard
                    class="mockup-card h-100"
                    @click="selectedMockup = mockup; previewDialogVisible = true"
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
                          <div v-else-if="mockup.html_content" class="html-preview">
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
            </div>
          </VWindowItem>
          <VWindowItem value="3">
            <div v-if="history.length === 0" class="text-center pa-6">
              <VIcon icon="tabler-history" size="64" color="secondary" class="mb-3"/>
              <h4 class="text-h6 mb-2">{{ t('projects.requirements.history.empty.title') }}</h4>
              <p class="text-medium-emphasis">
                {{ t('projects.requirements.history.empty.description') }}
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
                      <VCardTitle>{{ item.title }}</VCardTitle>
                      <template #append>
                        <VChip
                          :color="getStatusChipColor(item.status)"
                          size="small"
                          label
                          class="ms-2"
                        >
                          {{ t(`projects.status.${item.status}`) }}
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
                          {{ t(`projects.categories.${item.category}`) }}
                        </VChip>

                        <span class="text-caption">
                          {{ t('projects.requirements.history.changed_by') }}: {{ item.changed_by ? item.changed_by.username : t('projects.requirements.history.unknown') }}
                        </span>
                      </div>

                      <div class="text-body-2 whitespace-pre-wrap">{{ item.description }}</div>
                    </VCardText>
                  </VCard>
                </VTimelineItem>
              </VTimeline>
            </div>
          </VWindowItem>

          <VWindowItem value="4">
            <VRow class="mt-3">
              <VCol cols="12">
                <VTextarea
                  v-model="newComment"
                  :label="t('projects.requirements.comments.add')"
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
                    {{ t('projects.requirements.comments.add_button') }}
                  </VBtn>
                </div>
              </VCol>

              <VCol cols="12">
                <VDivider v-if="comments.length" class="mb-4"/>

                <div v-if="comments.length === 0" class="text-center pa-6">
                  <VIcon icon="tabler-messages" size="64" color="secondary" class="mb-3"/>
                  <h4 class="text-h6 mb-2">{{ t('projects.requirements.comments.empty.title') }}</h4>
                  <p class="text-medium-emphasis">
                    {{ t('projects.requirements.comments.empty.description') }}
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
                              <strong>{{ comment.user ? comment.user.username : t('projects.requirements.comments.unknown_user') }}</strong>
                              <div class="text-caption text-medium-emphasis ml-2">
                                {{ formatDate(comment.created_at) }}
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
            {{ t('projects.actions.cancel') }}
          </VBtn>

          <VSpacer/>

          <VBtn
            color="primary"
            @click="saveRequirement"
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
            @click="handleDeleteRequirement"
          >
            {{ t('projects.requirements.actions.delete') }}
          </VBtn>

          <VBtn
            v-if="hasModeratorPermission && userStories.length === 0"
            color="info"
            variant="tonal"
            prepend-icon="tabler-user-check"
            class="ms-2"
            @click="viewUserStories"
          >
            {{ t('projects.requirements.actions.generate_user_stories') }}
          </VBtn>

          <VSpacer/>

          <VBtn
            v-if="hasModeratorPermission"
            color="primary"
            prepend-icon="tabler-edit"
            @click="toggleEditMode"
          >
            {{ t('projects.requirements.actions.edit') }}
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

    <MockupPreviewDialog
      v-if="selectedMockup"
      v-model="previewDialogVisible"
      :mockup="selectedMockup"
      :is-admin="isAdmin"
      :has-manager-permission="hasManagerPermission"
    />
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
