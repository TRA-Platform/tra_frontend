<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSrsTemplateStore } from '@/stores/useSrsTemplateStore'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  editMode: {
    type: Boolean,
    default: false
  },
  projectData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const srsTemplateStore = useSrsTemplateStore()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const project = ref({
  name: '',
  short_description: '',
  type_of_application: 'website',
  color_scheme: '',
  language: 'en',
  application_description: '',
  target_users: '',
  additional_requirements: '',
  non_functional_requirements: '',
  technology_stack: '',
  operating_system: '',
  priority_modules: '',
  deadline: null,
  preliminary_budget: null,
  srs_template: null,
  status: 'draft'
})

const nameRules = [
  v => !!v || 'Name is required',
  v => v.length <= 200 || 'Name must be less than 200 characters'
]

const shortDescriptionRules = [
  v => !!v || 'Short description is required'
]

const budgetRules = [
  v => !v || !isNaN(parseFloat(v)) || 'Budget must be a number'
]

const deadlineRules = [
  v => !v || new Date(v) > new Date() || 'Deadline must be in the future'
]

const currentStep = ref(0)
const formRef = ref(null)

const steps = [
  {
    title: 'Basic Information',
    subtitle: 'Project essentials',
    icon: 'tabler-info-circle'
  },
  {
    title: 'Detailed Description',
    subtitle: 'Application specifics',
    icon: 'tabler-file-description'
  },
  {
    title: 'Technical Requirements',
    subtitle: 'Implementation details',
    icon: 'tabler-code'
  },
  {
    title: 'Planning',
    subtitle: 'Timing and budget',
    icon: 'tabler-calendar'
  }
]

const typeOptions = [
  { title: 'Website', value: 'website' },
  { title: 'Mobile App', value: 'mobile' },
  { title: 'Desktop App', value: 'desktop' },
  { title: 'API Service', value: 'api' },
  { title: 'Other', value: 'other' }
]

const languageOptions = [
  { title: 'English', value: 'en' },
  { title: 'Russian', value: 'ru' },
  { title: 'German', value: 'de' }
]

const statusOptions = [
  { title: 'Draft', value: 'draft' },
  { title: 'Active', value: 'active' },
  { title: 'Archived', value: 'archived' },
  { title: 'Completed', value: 'completed' }
]

const templates = ref([])
const loadingTemplates = ref(false)

const fetchSrsTemplates = async () => {
  loadingTemplates.value = true
  try {
    const { data } = await srsTemplateStore.fetchTemplates()
    templates.value = data || []
  } catch (error) {
    console.error('Error fetching SRS templates:', error)
  } finally {
    loadingTemplates.value = false
  }
}

const resetForm = () => {
  Object.assign(project.value, {
    name: '',
    short_description: '',
    type_of_application: 'website',
    color_scheme: '',
    language: 'en',
    application_description: '',
    target_users: '',
    additional_requirements: '',
    non_functional_requirements: '',
    technology_stack: '',
    operating_system: '',
    priority_modules: '',
    deadline: null,
    preliminary_budget: null,
    srs_template: null,
    status: 'draft'
  })

  currentStep.value = 0
  if (formRef.value) formRef.value.resetValidation()
}

const handleCancel = () => {
  dialog.value = false
  resetForm()
}

const validateCurrentStep = async () => {
  if (!formRef.value) return true

  const { valid } = await formRef.value.validate()
  return valid
}

const nextStep = async () => {
  if (await validateCurrentStep()) {
    currentStep.value++
  }
}

const prevStep = () => {
  currentStep.value--
}

const submitForm = async () => {
  if (await validateCurrentStep()) {
    const formData = { ...project.value }

    if (formData.preliminary_budget) {
      formData.preliminary_budget = parseFloat(formData.preliminary_budget)
    }

    emit('submit', formData)
    dialog.value = false
    resetForm()
  }
}

onMounted(() => {
  fetchSrsTemplates()

  if (props.editMode && props.projectData) {
    console.log('Project Data:', props.projectData.deadline)
    const newDeadline = props.projectData.deadline ? (new Date(parseInt(props.projectData.deadline))).toISOString() : null
    console.log(`New Deadline: ${newDeadline}`)
    Object.assign(project.value, props.projectData, { deadline: newDeadline })
    // Object.assign(project.value, props.projectData)
  }
})

watch(dialog, (val) => {
  if (!val) resetForm()
})
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="800"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex pt-5 px-5">
        <h5 class="text-h5">{{ props.editMode ? 'Edit Project' : 'Create New Project' }}</h5>
        <VSpacer />
        <IconBtn @click="handleCancel">
          <VIcon icon="tabler-x" />
        </IconBtn>
      </VCardTitle>

      <VCardText class="px-5 pt-4">
        <AppStepper
          :items="steps"
          v-model:current-step="currentStep"
          :is-active-step-valid="true"
        />

        <VDivider class="my-5" />

        <VForm
          ref="formRef" @submit.prevent>
          <VWindow v-model="currentStep">
            <VWindowItem :value="0">
              <VRow
                class="mt-3">
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="project.name"
                    label="Project Name"
                    :rules="nameRules"
                    required
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <VSelect
                    v-model="project.type_of_application"
                    label="Application Type"
                    :items="typeOptions"
                    required
                  />
                </VCol>

                <VCol cols="12">
                  <VTextarea
                    v-model="project.short_description"
                    label="Short Description"
                    :rules="shortDescriptionRules"
                    required
                    rows="3"
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <VSelect
                    v-model="project.language"
                    label="Primary Language"
                    :items="languageOptions"
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <VTextField
                    v-model="project.color_scheme"
                    label="Color Scheme (e.g. #336699,#FFFFFF)"
                    hint="Comma-separated hex colors or style names"
                    persistent-hint
                  />
                </VCol>
              </VRow>
            </VWindowItem>

            <VWindowItem :value="1">
              <VRow
                class="mt-3">
                <VCol cols="12">
                  <VTextarea
                    v-model="project.application_description"
                    label="Detailed Application Description"
                    rows="4"
                  />
                </VCol>

                <VCol cols="12">
                  <VTextarea
                    v-model="project.target_users"
                    label="Target Users"
                    rows="3"
                    hint="Describe your target audience or user demographics"
                    persistent-hint
                  />
                </VCol>

                <VCol cols="12">
                  <VTextarea
                    v-model="project.additional_requirements"
                    label="Additional Requirements"
                    rows="3"
                  />
                </VCol>
              </VRow>
            </VWindowItem>

            <VWindowItem :value="2">
              <VRow
                class="mt-3">
                <VCol cols="12">
                  <VTextarea
                    v-model="project.non_functional_requirements"
                    label="Non-Functional Requirements"
                    hint="Performance, security, scalability, etc."
                    persistent-hint
                    rows="3"
                  />
                </VCol>

                <VCol cols="12">
                  <VTextarea
                    v-model="project.technology_stack"
                    label="Technology Stack"
                    hint="Preferred technologies, frameworks, libraries"
                    persistent-hint
                    rows="3"
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <VTextField
                    v-model="project.operating_system"
                    label="Operating System"
                    hint="Target OS or platform requirements"
                    persistent-hint
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <VSelect
                    v-model="project.srs_template"
                    label="SRS Template"
                    :items="templates.map(t => ({ title: t.name, value: t.id }))"
                    :loading="loadingTemplates"
                    clearable
                    hint="Select an optional SRS template"
                    persistent-hint
                  />
                </VCol>

                <VCol cols="12">
                  <VTextarea
                    v-model="project.priority_modules"
                    label="Priority Modules/Features"
                    rows="3"
                  />
                </VCol>
              </VRow>
            </VWindowItem>

            <VWindowItem :value="3">
              <VRow
                class="mt-3">
                <VCol cols="12" md="6">
                  <AppDateTimePicker
                    v-model="project.deadline"
                    placeholder="Project Deadline"
                    :rules="deadlineRules"
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <VTextField
                    v-model="project.preliminary_budget"
                    label="Preliminary Budget"
                    :rules="budgetRules"
                    prefix="$"
                    type="number"
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <VSelect
                    v-model="project.status"
                    label="Project Status"
                    :items="statusOptions"
                    required
                  />
                </VCol>
              </VRow>
            </VWindowItem>
          </VWindow>
        </VForm>
      </VCardText>

      <VDivider />

      <VCardActions>
        <VSpacer />

        <VBtn
          v-if="currentStep > 0"
          variant="tonal"
          color="secondary"
          @click="prevStep"
        >
          <VIcon start icon="tabler-arrow-left" />
          Previous
        </VBtn>

        <VBtn
          v-if="currentStep < 3"
          color="primary"
          class="ms-2"
          @click="nextStep"
        >
          Next
          <VIcon end icon="tabler-arrow-right" />
        </VBtn>

        <VBtn
          v-else
          color="success"
          class="ms-2"
          @click="submitForm"
        >
          {{ props.editMode ? 'Update' : 'Create' }} Project
          <VIcon end icon="tabler-check" />
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
