<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  editMode: {
    type: Boolean,
    default: false
  },
  requirementData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const requirement = ref({
  title: props.editMode && props.requirementData ? props.requirementData.title : '',
  description: props.editMode && props.requirementData ? props.requirementData.description : '',
  category: props.editMode && props.requirementData ? props.requirementData.category : 'functional',
  status: props.editMode && props.requirementData ? props.requirementData.status : 'draft'
})

const titleRules = [
  v => !!v || 'Title is required',
  v => v.length <= 255 || 'Title must be less than 255 characters'
]

const descriptionRules = [
  v => !!v || 'Description is required'
]

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

const formRef = ref(null)

const resetForm = () => {
  requirement.value = {
    title: '',
    description: '',
    category: 'functional',
    status: 'draft'
  }

  if (formRef.value) formRef.value.resetValidation()
}

const handleCancel = () => {
  dialog.value = false
  resetForm()
}

const submitForm = async () => {
  const { valid } = await formRef.value.validate()

  if (valid) {
    emit('submit', requirement.value)
    dialog.value = false
    resetForm()
  }
}

watch(dialog, (val) => {
  if (!val) resetForm()
})
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="700"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex pt-5 px-5">
        <h5 class="text-h5">{{ props.editMode ? 'Edit Requirement' : 'Create New Requirement' }}</h5>
        <VSpacer />
        <IconBtn @click="handleCancel">
          <VIcon icon="tabler-x" />
        </IconBtn>
      </VCardTitle>

      <VCardText class="px-5 pt-4">
        <VForm ref="formRef" @submit.prevent="submitForm">
          <VRow class="mt-3">
            <VCol cols="12">
              <VTextField
                v-model="requirement.title"
                label="Requirement Title"
                :rules="titleRules"
                required
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="requirement.category"
                label="Category"
                :items="categoryOptions"
                required
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="requirement.status"
                label="Status"
                :items="statusOptions"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="requirement.description"
                label="Description"
                :rules="descriptionRules"
                required
                rows="6"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VBtn
          variant="tonal"
          color="secondary"
          @click="handleCancel"
        >
          Cancel
        </VBtn>

        <VSpacer />

        <VBtn
          color="primary"
          @click="submitForm"
        >
          {{ props.editMode ? 'Update' : 'Create' }} Requirement
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
