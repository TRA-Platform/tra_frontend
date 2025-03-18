<script setup>
import { ref, computed, capitalize } from 'vue'
import { useMockupStore } from '@/stores/useMockupStore'
import { getStatusChipColor } from "@core/utils/formatters";

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

const emit = defineEmits(['update:modelValue', 'delete'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const mockupStore = useMockupStore()
const isFullscreen = ref(false)
const isEditMode = ref(false)
const editedMockup = ref({ ...props.mockup })
const processingAction = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
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
    const { data, error } = await mockupStore.updateMockup(props.mockup.id, editedMockup.value)

    if (data && !error) {
      showSnackbar('Mockup updated successfully')
      Object.assign(props.mockup, data)
      isEditMode.value = false
    } else {
      showSnackbar('Failed to update mockup', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to update mockup: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleDeleteMockup = () => {
  emit('delete')
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

watch(() => props.mockup, (newVal) => {
  editedMockup.value = { ...newVal }
}, { deep: true })
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
          <h5 class="text-h5">Edit Mockup</h5>
        </template>
        <template v-else>
          <h5 class="text-h5">{{ mockup.name }}</h5>
          <VChip
            :color="getStatusChipColor(mockup.status)"
            size="small"
            label
          >
            {{ capitalize(mockup.status) }}
          </VChip>
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
        :class="{'pa-0': !isEditMode, 'pa-6': isEditMode}"
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
                  label="Mockup Name"
                  required
                  :rules="[v => !!v || 'Name is required']"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VSelect
                  v-model="editedMockup.status"
                  label="Status"
                  :items="[
                    { title: 'Draft', value: 'draft' },
                    { title: 'Active', value: 'active' },
                    { title: 'Archived', value: 'archived' },
                    { title: 'Completed', value: 'completed' }
                  ]"
                  required
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="editedMockup.html_content"
                  label="HTML Content"
                  rows="15"
                  :rules="[v => !!v || 'HTML content is required']"
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
              <span class="text-caption">Created: {{ formatDate(mockup.created_at) }}</span>
            </div>

            <div class="d-flex align-center ms-4">
              <VIcon icon="tabler-calendar-event" class="me-2" size="18" />
              <span class="text-caption">Updated: {{ formatDate(mockup.updated_at) }}</span>
            </div>

            <div v-if="mockup.requirement" class="d-flex align-center ms-4">
              <VIcon icon="tabler-file-check" class="me-2" size="18" />
              <span class="text-caption">Requirement: {{ mockup.requirement }}</span>
            </div>
          </div>

          <VDivider />

          <div class="mockup-content pa-0">
            <iframe
              v-if="mockup.html_content"
              :srcdoc="mockup.html_content"
              class="mockup-iframe"
              style="width: 100%; border: none;"
              :style="{
                height: isFullscreen ? 'calc(100vh - 180px)' : 'calc(70vh - 110px)'
              }"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              title="Mockup Preview"
            ></iframe>

            <div v-else class="d-flex flex-column justify-center align-center pa-6" style="height: 400px;">
              <VIcon icon="tabler-code-off" size="64" color="secondary" class="mb-4" />
              <h4 class="text-h6 mb-2">No HTML Content</h4>
              <p class="text-medium-emphasis text-center">
                This mockup doesn't have any HTML content to display.
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
            Cancel
          </VBtn>

          <VSpacer />

          <VBtn
            color="primary"
            @click="saveMockup"
            :loading="processingAction"
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
            @click="handleDeleteMockup"
          >
            Delete
          </VBtn>

          <VSpacer />

          <VBtn
            v-if="hasManagerPermission"
            color="primary"
            prepend-icon="tabler-edit"
            @click="toggleEditMode"
          >
            Edit
          </VBtn>

          <VBtn
            class="ms-2"
            color="primary"
            variant="tonal"
            prepend-icon="tabler-code"
            @click="toggleEditMode"
            v-if="hasManagerPermission"
          >
            View HTML
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
</style>
