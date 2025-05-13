<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useMockupStore } from '@/stores/useMockupStore'
import { getStatusChipColor } from "@core/utils/formatters"
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  mockup: {
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
  }
})

const emit = defineEmits(['update:modelValue', 'delete', 'regenerate'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const mockupStore = useMockupStore()

const isFullscreen = ref(false)
const isEditMode = ref(false)
const editedMockup = ref({ ...props.mockup })
const processingAction = ref(false)
const refreshInterval = ref(null)
const regenerateDialogVisible = ref(false)
const regenerateFeedback = ref('')
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const isLoading = computed(() => {
  return props.mockup.generation_status === 'in_progress' || 
         props.mockup.generation_status === 'pending' || 
         props.mockup.needs_regeneration
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

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const toggleEditMode = () => {
  if (isEditMode.value) {
    editedMockup.value = { ...props.mockup }
  }
  isEditMode.value = !isEditMode.value
}

const saveMockup = async () => {
  processingAction.value = true

  try {
    const { data, error } = await mockupStore.updateMockupById(props.mockup.id, editedMockup.value)

    if (data && !error) {
      showSnackbar(t('projects.mockups.notifications.updated'))
      Object.assign(props.mockup, data)
      isEditMode.value = false
      dialog.value = false
    } else {
      showSnackbar(t('projects.mockups.notifications.update_failed'), 'error')
    }
  } catch (err) {
    showSnackbar(t('projects.mockups.notifications.update_error', { error: err.message }), 'error')
  } finally {
    processingAction.value = false
  }
}

const handleDeleteMockup = () => {
  emit('delete')
  dialog.value = false
}

const handleRegenerateMockup = async () => {
  regenerateDialogVisible.value = true
}

const submitRegeneration = async () => {
  processingAction.value = true
  
  try {
    if (props.mockup.user_story) {
      await mockupStore.regenerateMockup(
        props.mockup.id,
        { 
          user_story_id: props.mockup.user_story.id,
          feedback: regenerateFeedback.value
        }
      )
    } else if (props.mockup.requirement) {
      await mockupStore.regenerateMockup(
        props.mockup.id,
        { 
          requirement_id: props.mockup.requirement.id,
          feedback: regenerateFeedback.value
        }
      )
    } else {
      await mockupStore.regenerateMockup(
        props.mockup.id,
        { feedback: regenerateFeedback.value }
      )
    }
    
    showSnackbar(t('projects.mockups.notifications.regeneration_started'))
    regenerateDialogVisible.value = false
    regenerateFeedback.value = ''
    dialog.value = false
    refreshInterval.value = setInterval(checkMockupStatus, 5000)
  } catch (err) {
    showSnackbar(t('projects.mockups.notifications.regeneration_error', { error: err.message }), 'error')
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

const checkMockupStatus = () => {
  if (isLoading.value && dialog.value) {
    mockupStore.fetchMockupById(props.mockup.id)
      .then(({ data }) => {
        if (data) {
          Object.assign(props.mockup, data)
        }
      })
  }
}

watch(() => props.mockup, (newVal) => {
  editedMockup.value = { ...newVal }
}, { deep: true })

onMounted(() => {
  refreshInterval.value = setInterval(checkMockupStatus, 5000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<template>
  <VDialog
    v-model="dialog"
    :fullscreen="isFullscreen"
    :max-width="isFullscreen ? '100%' : '900'"
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex py-3 px-5">
        <template v-if="isEditMode">
          <h5 class="text-h5">{{ t('projects.mockups.actions.edit') }}</h5>
        </template>
        <template v-else>
          <h5 class="text-h5">{{ mockup.name }}</h5>
          <VChip
            :color="getStatusChipColor(mockup.status)"
            size="small"
            label
          >
            {{ t(`projects.status.${mockup.status}`) }}
          </VChip>
          
          <div v-if="isLoading" class="ms-2 d-flex align-center">
            <VProgressCircular
              indeterminate
              color="primary"
              size="20"
              width="2"
              class="me-2"
            />
            <span class="text-caption">{{ mockup.generation_status === 'in_progress' ? t('projects.mockups.status.generating') : t('projects.mockups.status.pending') }}</span>
          </div>
        </template>

        <VSpacer />

        <VBtn
          icon
          variant="text"
          @click="toggleFullscreen"
        >
          <VIcon :icon="isFullscreen ? 'tabler-minimize' : 'tabler-maximize'" />
        </VBtn>

        <IconBtn @click="dialog = false">
          <VIcon icon="tabler-x" />
        </IconBtn>
      </VCardTitle>

      <VDivider />

      <VCardText
        :class="{'pa-0': !isEditMode && mockup.html_content, 'pa-6': isEditMode || !mockup.html_content}"
        :style="{
          height: isFullscreen ? 'calc(100vh - 120px)' : '70vh',
          maxHeight: '800px'
        }"
      >
        <div v-if="isEditMode">
          <VForm @submit.prevent="saveMockup">
            <VRow class="mt-3">
              <VCol cols="12">
                <VTextField
                  v-model="editedMockup.name"
                  :label="t('projects.mockups.name')"
                  required
                  :rules="[v => !!v || t('projects.mockups.validation.name_required')]"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VSelect
                  v-model="editedMockup.status"
                  :label="t('projects.details.status')"
                  :items="[
                    { title: t('projects.status.draft'), value: 'draft' },
                    { title: t('projects.status.active'), value: 'active' },
                    { title: t('projects.status.archived'), value: 'archived' },
                    { title: t('projects.status.completed'), value: 'completed' }
                  ]"
                  required
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="editedMockup.html_content"
                  :label="t('projects.mockups.html_content')"
                  rows="15"
                  :rules="[v => !!v || t('projects.mockups.validation.html_required')]"
                  monospace
                />
              </VCol>
            </VRow>
          </VForm>
        </div>
        <div v-else>
          <div class="mockup-metadata d-flex align-center px-6 py-3">
            <div class="d-flex align-center">
              <VIcon icon="tabler-calendar" class="me-2" size="18" />
              <span class="text-caption">{{ t('projects.details.created_at') }}: {{ formatDate(mockup.created_at) }}</span>
            </div>

            <div class="d-flex align-center ms-4">
              <VIcon icon="tabler-calendar-event" class="me-2" size="18" />
              <span class="text-caption">{{ t('projects.details.updated_at') }}: {{ formatDate(mockup.updated_at) }}</span>
            </div>

            <div v-if="mockup.requirement" class="d-flex align-center ms-4">
              <VIcon icon="tabler-file-check" class="me-2" size="18" />
              <span class="text-caption">{{ t('projects.details.requirement') }}: {{ mockup.requirement_name }}</span>
            </div>
            <div v-if="mockup.user_story" class="d-flex align-center ms-4">
              <VIcon icon="tabler-user-check" class="me-2" size="18" />
              <span class="text-caption">{{ t('projects.details.user_story') }}: {{ mockup.user_story_name }}</span>
            </div>
          </div>

          <VDivider />

          <div class="mockup-content pa-0">
            <div 
              v-if="isLoading" 
              class="d-flex flex-column justify-center align-center" 
              :style="{
                height: isFullscreen ? 'calc(100vh - 180px)' : 'calc(70vh - 110px)'
              }"
            >
              <VProgressCircular indeterminate color="primary" size="64" class="mb-4" />
              <h4 class="text-h6 mb-2">{{ mockup.generation_status === 'in_progress' ? t('projects.mockups.status.generating') : t('projects.mockups.status.preparing') }}</h4>
              <p class="text-body-1 text-medium-emphasis max-width-md text-center">
                {{ mockup.generation_status === 'in_progress' 
                   ? t('projects.mockups.status.generating_description')
                   : t('projects.mockups.status.preparing_description') }}
              </p>
            </div>
            <iframe
              v-else-if="mockup.html_content"
              :srcdoc="mockup.html_content"
              class="mockup-iframe"
              style="width: 100%; border: none;"
              :style="{
                height: isFullscreen ? 'calc(100vh - 180px)' : 'calc(70vh - 110px)'
              }"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              :title="t('projects.mockups.preview')"
            ></iframe>

            <div v-else class="d-flex flex-column justify-center align-center pa-6" style="height: 400px;">
              <VIcon icon="tabler-code-off" size="64" color="secondary" class="mb-4" />
              <h4 class="text-h6 mb-2">{{ t('projects.mockups.no_content.title') }}</h4>
              <p class="text-medium-emphasis text-center">
                {{ t('projects.mockups.no_content.description') }}
              </p>
            </div>
          </div>
        </div>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <template v-if="isEditMode">
          <VBtn
            color="secondary"
            variant="tonal"
            @click="toggleEditMode"
            :disabled="processingAction"
          >
            {{ t('projects.actions.cancel') }}
          </VBtn>

          <VSpacer />

          <VBtn
            color="primary"
            @click="saveMockup"
            :loading="processingAction"
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
            @click="handleDeleteMockup"
          >
            {{ t('projects.actions.delete') }}
          </VBtn>

          <VBtn 
            v-if="hasManagerPermission"
            color="warning"
            variant="tonal"
            prepend-icon="tabler-refresh"
            @click="handleRegenerateMockup"
            :loading="isLoading || processingAction"
            :disabled="isLoading"
            class="ms-2"
          >
            {{ t('projects.mockups.actions.regenerate') }}
          </VBtn>

          <VSpacer />


          <VBtn
            class="ms-2"
            color="primary"
            variant="tonal"
            prepend-icon="tabler-code"
            @click="toggleEditMode"
            v-if="hasManagerPermission"
          >
            {{ t('projects.mockups.actions.edit') }}
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
          {{ t('projects.mockups.regeneration.title') }}
        </VCardTitle>

        <VCardText>
          <p class="text-body-1 mb-3">
            {{ t('projects.mockups.regeneration.description') }}
          </p>

          <VTextarea
            autofocus
            v-model="regenerateFeedback"
            :label="t('projects.mockups.fields.feedback')"
            :hint="t('projects.mockups.placeholders.feedback')"
            aria-placeholder="t('projects.mockups.placeholders.feedback')"
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
            {{ t('projects.actions.cancel') }}
          </VBtn>

          <VSpacer />

          <VBtn
            color="primary"
            @click="submitRegeneration"
            :loading="processingAction"
          >
            {{ t('projects.mockups.actions.regenerate') }}
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
.mockup-iframe {
  background-color: white;
}

.max-width-md {
  max-width: 500px;
}
</style>
