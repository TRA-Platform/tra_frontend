<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
  v => !!v || t('validation.required'),
  v => v.length <= 255 || t('projects.requirements.validation.title_length')
]

const descriptionRules = [
  v => !!v || t('validation.required')
]

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
        <h5 class="text-h5">{{ props.editMode ? t('projects.requirements.actions.edit') : t('projects.requirements.actions.add') }}</h5>
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
                :label="t('projects.requirements.title')"
                :rules="titleRules"
                required
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="requirement.category"
                :label="t('projects.requirements.category')"
                :items="categoryOptions"
                required
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="requirement.status"
                :label="t('projects.requirements.status')"
                :items="statusOptions"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="requirement.description"
                :label="t('projects.requirements.description')"
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
          {{ t('projects.actions.cancel') }}
        </VBtn>

        <VSpacer />

        <VBtn
          color="primary"
          @click="submitForm"
        >
          {{ props.editMode ? t('projects.actions.update') : t('projects.actions.create') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
