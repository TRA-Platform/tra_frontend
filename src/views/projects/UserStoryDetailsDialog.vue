<script setup>
import {ref, computed, watch, capitalize, onMounted, onUnmounted} from 'vue'
import {useUserStoryStore} from '@/stores/useUserStoryStore'
import {useMockupStore} from '@/stores/useMockupStore'
import {getStatusChipColor} from "@core/utils/formatters"
import {useI18n} from 'vue-i18n'
import MockupPreviewDialog from '@/views/projects/MockupPreviewDialog.vue'

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
const mockupStore = useMockupStore()
const {t} = useI18n()

const activeTab = ref(0)
const isEditMode = ref(false)
const editedUserStory = ref({...props.userStory})
const criteriaInput = ref('')
const newComment = ref('')
const regenerateFeedback = ref('')
const regenerateDialogVisible = ref(false)
const processingComment = ref(false)
const selectedMockup = ref(null)
const previewDialogVisible = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})
const refreshInterval = ref(null)

const statusOptions = [
  {title: t('projects.status.draft'), value: 'draft'},
  {title: t('projects.status.active'), value: 'active'},
  {title: t('projects.status.archived'), value: 'archived'},
  {title: t('projects.status.completed'), value: 'completed'}
]

const history = computed(() => {
  return props.userStory.history || []
})

const comments = computed(() => {
  return props.userStory.comments || []
})

const relatedMockups = computed(() => {
  return props.userStory.mockups || []
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
    editedUserStory.value = {...props.userStory}
    criteriaInput.value = ''
  }
  isEditMode.value = !isEditMode.value
  activeTab.value = "0"
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

const checkUserStoryStatus = () => {
  if (dialog.value) {
    userStoryStore.fetchUserStoryById(props.userStory.id)
      .then(({ data }) => {
        if (data) {
          Object.assign(props.userStory, data)
        }
      })
  }
}

onMounted(() => {
  refreshInterval.value = setInterval(checkUserStoryStatus, 5000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

const saveUserStory = () => {
  emit('update', editedUserStory.value)
  isEditMode.value = false
  dialog.value = false
}

const handleDeleteUserStory = () => {
  emit('delete')
  dialog.value = false
}

const openRegenerateDialog = () => {
  regenerateFeedback.value = ''
  regenerateDialogVisible.value = true
}

const submitRegeneration = () => {
  emit('regenerate', regenerateFeedback.value)
  regenerateDialogVisible.value = false
  dialog.value = false
}

const submitComment = async () => {
  if (!newComment.value.trim()) return

  processingComment.value = true

  try {
    const {data, error} = await userStoryStore.createComment(props.userStory.id, {
      text: newComment.value,
      status: 'active'
    })

    if (data && !error) {
      showSnackbar('Comment added successfully')
      newComment.value = ''
      const {data: refreshedUserStory} = await userStoryStore.fetchUserStoryById(props.userStory.id)
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
    const {success, error} = await userStoryStore.deleteComment(commentId)

    if (success && !error) {
      showSnackbar('Comment deleted successfully')
      const {data: refreshedUserStory} = await userStoryStore.fetchUserStoryById(props.userStory.id)
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
const truncateHtml = (html, length = 150) => {
  if (!html || html.length <= length) return html

  const textOnly = html.replace(/<[^>]*>/g, '')

  if (textOnly.length <= length) return html

  return textOnly.substring(0, length) + '...'
}

watch(() => props.userStory, (newVal) => {
  editedUserStory.value = {...newVal}
}, {deep: true})
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
          <h5 class="text-h5">{{ t('projects.user_stories.title.edit') }}</h5>
        </template>
        <template v-else>
          <h5 class="text-h5">{{ t('projects.user_stories.title.details') }}</h5>
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
            <VIcon size="18" icon="tabler-user-check" start/>
            {{ t('projects.requirements.tabs.details') }}
          </VTab>
          <VTab value="1">
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
          <VTab value="2">
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
          <VTab value="3">
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
              <VForm @submit.prevent="saveUserStory">
                <VRow class="mt-3">
                  <VCol cols="12">
                    <VTextField
                      v-model="editedUserStory.role"
                      :label="t('projects.user_stories.fields.role')"
                      required
                      :rules="[v => !!v || t('projects.user_stories.validation.role_required')]"
                    />
                  </VCol>

                  <VCol cols="12">
                    <VTextField
                      v-model="editedUserStory.action"
                      :label="t('projects.user_stories.fields.action')"
                      required
                      :rules="[v => !!v || t('projects.user_stories.validation.action_required')]"
                    />
                  </VCol>

                  <VCol cols="12">
                    <VTextField
                      v-model="editedUserStory.benefit"
                      :label="t('projects.user_stories.fields.benefit')"
                      required
                      :rules="[v => !!v || t('projects.user_stories.validation.benefit_required')]"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <VSelect
                      v-model="editedUserStory.status"
                      :label="t('projects.user_stories.fields.status')"
                      :items="statusOptions"
                      required
                    />
                  </VCol>

                  <VCol cols="12">
                    <div class="align-center justify-space-between mb-3">
                      <div class="text-subtitle-1 font-weight-medium">
                        {{ t('projects.user_stories.fields.acceptance_criteria') }}
                      </div>
                      <VRow
                        class="w-100"
                      >
                        <VCol
                          cols="10"
                          sm="8"
                        >
                          <VTextField
                            v-model="criteriaInput"
                            :placeholder="t('projects.user_stories.fields.add_criterion')"
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
                            {{ t('projects.user_stories.actions.add') }}
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
                          <VIcon icon="tabler-check" color="success"/>
                        </template>
                        <VListItemTitle>{{ criterion }}</VListItemTitle>
                        <template #append>
                          <IconBtn
                            color="error"
                            variant="text"
                            size="small"
                            @click="removeCriterion(index)"
                          >
                            <VIcon icon="tabler-trash" size="18"/>
                          </IconBtn>
                        </template>
                      </VListItem>
                    </VList>
                    <div
                      v-else
                      class="text-medium-emphasis text-center pa-4 rounded bg-grey-lighten-5"
                    >
                      {{ t('projects.user_stories.empty.acceptance_criteria.description') }}
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
                  {{ t(`projects.status.${userStory.status}`) }}
                </VChip>

                <VChip
                  color="secondary"
                  size="small"
                  label
                  class="ms-2"
                >
                  v{{ userStory.version_number }}
                </VChip>

              </div>
              <div class="d-flex align-center">

                <div class="text-medium-emphasis d-flex align-center">
                  <VIcon size="18" icon="tabler-calendar" class="me-1"/>
                  <span class="text-caption me-4">{{
                      t('projects.details.updated_at')
                    }}: {{ formatDate(userStory.updated_at) }}</span>

                  <VIcon size="18" icon="tabler-calendar-plus" class="me-1"/>
                  <span class="text-caption">{{ t('projects.details.created_at') }}: {{
                      formatDate(userStory.created_at)
                    }}</span>
                </div>
              </div>

              <div class="user-story-format mb-6">
                <div class="text-h5 mb-4">
                  <span class="text-primary">{{ t('projects.user_stories.fields.role') }}</span> {{ userStory.role }},
                </div>
                <div class="text-h5 mb-4">
                  <span class="text-primary">{{ t('projects.user_stories.fields.action') }}</span> {{
                    userStory.action
                  }},
                </div>
                <div class="text-h5 mb-4">
                  <span class="text-primary">{{ t('projects.user_stories.fields.benefit') }}</span> {{
                    userStory.benefit
                  }}.
                </div>
              </div>

              <VDivider class="mb-4"/>

              <div v-if="userStory.acceptance_criteria && userStory.acceptance_criteria.length > 0">
                <div class="text-h6 mb-3">{{ t('projects.user_stories.fields.acceptance_criteria') }}</div>
                <VList>
                  <VListItem
                    v-for="(criterion, index) in userStory.acceptance_criteria"
                    :key="index"
                    class="px-0"
                  >
                    <template #prepend>
                      <VIcon icon="tabler-check" color="success" class="me-2"/>
                    </template>
                    <VListItemTitle>{{ criterion }}</VListItemTitle>
                  </VListItem>
                </VList>
              </div>
              <div v-else class="text-medium-emphasis text-center pa-4">
                {{ t('projects.user_stories.empty.acceptance_criteria.description') }}
              </div>

              <div class="mt-6" v-if="userStory.generation_status === 'in_progress'">
                <VAlert
                  color="info"
                  variant="tonal"
                  icon="tabler-refresh"
                >
                  <VAlertTitle>{{ t('projects.user_stories.regeneration.title') }}</VAlertTitle>
                  <p>{{ t('projects.user_stories.regeneration.description') }}</p>
                </VAlert>
              </div>
            </div>
          </VWindowItem>

          <VWindowItem value="1">
            <div v-if="relatedMockups.length === 0" class="text-center pa-6">
              <VIcon icon="tabler-photo-off" size="64" color="secondary" class="mb-3"/>
              <h4 class="text-h6 mb-2">{{ t('projects.user_stories.mockups.empty.title') }}</h4>
              <p class="text-medium-emphasis">
                {{ t('projects.user_stories.mockups.empty.description') }}
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

                    <VDivider/>

                    <VCardText>
                      <div class="mockup-preview mb-3">
                        <div class="overflow-hidden position-relative rounded bg-grey-lighten-4" style="height: 150px;">
                          <div
                            v-if="mockup.generation_status === 'in_progress' || mockup.generation_status === 'pending'"
                            class="d-flex justify-center align-center h-100">
                            <div class="text-center">
                              <VProgressCircular indeterminate color="primary" size="40" class="mb-2"/>
                              <div class="text-caption">{{ t('projects.mockups.status.generating') }}</div>
                            </div>
                          </div>
                          <div v-else-if="mockup.html_content" class="html-preview">
                            <div v-html="truncateHtml(mockup.html_content)"></div>
                          </div>
                          <div v-else class="d-flex justify-center align-center h-100">
                            <VIcon icon="tabler-file-code" size="48" color="secondary"/>
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
                          <VIcon size="16" icon="tabler-calendar" class="me-1"/>
                          <span class="text-caption">{{ formatDate(mockup.created_at) }}</span>
                        </div>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </div>
          </VWindowItem>
          <VWindowItem value="2">
            <div v-if="history.length === 0" class="text-center pa-6">
              <VIcon icon="tabler-history" size="64" color="secondary" class="mb-3"/>
              <h4 class="text-h6 mb-2">{{ t('projects.user_stories.empty.history.title') }}</h4>
              <p class="text-medium-emphasis">
                {{ t('projects.user_stories.empty.history.description') }}
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
                          <VIcon icon="tabler-user-check"/>
                        </VAvatar>
                      </template>

                      <VCardTitle>
                        <span class="text-primary">{{ t('projects.user_stories.fields.role') }}</span> {{ item.role }}
                      </VCardTitle>

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
                      <p class="mb-2">
                        <span class="text-primary">{{ t('projects.user_stories.fields.action') }}</span> {{
                          item.action
                        }}
                      </p>
                      <p class="mb-4">
                        <span class="text-primary">{{ t('projects.user_stories.fields.benefit') }}</span>
                        {{ item.benefit }}
                      </p>

                      <div v-if="item.acceptance_criteria && item.acceptance_criteria.length > 0">
                        <div class="text-subtitle-2 font-weight-medium mb-2">
                          {{ t('projects.user_stories.fields.acceptance_criteria') }}:
                        </div>
                        <ul class="ms-3">
                          <li v-for="(criterion, idx) in item.acceptance_criteria" :key="idx">
                            {{ criterion }}
                          </li>
                        </ul>
                      </div>

                      <div class="text-caption mt-3">
                        {{ t('projects.requirements.history.changed_by') }}:
                        {{ item.changed_by ? item.changed_by.username : t('projects.requirements.history.unknown') }}
                      </div>
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
                    {{ t('projects.user_stories.actions.add_comment') }}
                  </VBtn>
                </div>
              </VCol>

              <VCol cols="12">
                <VDivider v-if="comments.length" class="mb-4"/>

                <div v-if="comments.length === 0" class="text-center pa-6">
                  <VIcon icon="tabler-messages" size="64" color="secondary" class="mb-3"/>
                  <h4 class="text-h6 mb-2">{{ t('projects.user_stories.empty.comments.title') }}</h4>
                  <p class="text-medium-emphasis">
                    {{ t('projects.user_stories.empty.comments.description') }}
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
                              <strong>{{
                                  comment.user ? comment.user.username : t('projects.requirements.comments.unknown_user')
                                }}</strong>
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
            {{ t('projects.user_stories.actions.cancel') }}
          </VBtn>

          <VSpacer/>

          <VBtn
            color="primary"
            @click="saveUserStory"
          >
            {{ t('projects.user_stories.actions.save') }}
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
            {{ t('projects.user_stories.actions.delete') }}
          </VBtn>

          <VBtn
            v-if="hasModeratorPermission"
            color="info"
            variant="tonal"
            prepend-icon="tabler-refresh"
            class="ms-2"
            @click="openRegenerateDialog"
          >
            {{ t('projects.user_stories.actions.regenerate') }}
          </VBtn>

          <VSpacer/>

          <VBtn
            v-if="hasModeratorPermission"
            color="primary"
            prepend-icon="tabler-edit"
            @click="toggleEditMode"
          >
            {{ t('projects.user_stories.actions.edit') }}
          </VBtn>
        </template>
      </VCardActions>
    </VCard>
    <VDialog
      v-model="regenerateDialogVisible"
      max-width="600"
      persistent
    >
      <VCard>
        <VCardTitle class="pt-3 pb-0">
          {{ t('projects.user_stories.regeneration.title') }}
        </VCardTitle>

        <VCardText>
          <p class="text-body-1 mb-3">
            {{ t('projects.user_stories.regeneration.description') }}
          </p>

          <VTextarea
            autofocus
            v-model="regenerateFeedback"
            :label="t('projects.user_stories.fields.feedback')"
            :hint="t('projects.user_stories.placeholders.feedback')"
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
            {{ t('projects.user_stories.actions.cancel') }}
          </VBtn>

          <VSpacer/>

          <VBtn
            color="primary"
            @click="submitRegeneration"
          >
            {{ t('projects.user_stories.actions.regenerate') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <MockupPreviewDialog
      v-if="selectedMockup"
      v-model="previewDialogVisible"
      :mockup="selectedMockup"
      :is-admin="isAdmin"
      :has-manager-permission="hasManagerPermission"
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
