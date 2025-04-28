<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSrsTemplateStore } from '@/stores/useSrsTemplateStore'
import AppDateTimePicker from "@core/components/app-form-elements/AppDateTimePicker.vue";

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
  color_scheme: [],
  language: 'en',
  application_description: '',
  target_users: [],
  additional_requirements: [],
  non_functional_requirements: [],
  technology_stack: [],
  operating_systems: [],
  priority_modules: [],
  deadline_start: null,
  deadline_end: null,
  preliminary_budget: null,
  srs_template: null,
  status: 'draft'
})

const newColor = ref('#000000')

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
    color_scheme: [],
    language: 'en',
    application_description: '',
    target_users: [],
    additional_requirements: [],
    non_functional_requirements: [],
    technology_stack: [],
    operating_systems: [],
    priority_modules: [],
    deadline_start: null,
    deadline_end: null,
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

const addColor = () => {
  if (!project.value.color_scheme.includes(newColor.value)) {
    project.value.color_scheme.push(newColor.value)
  }
  newColor.value = '#000000'
}

const removeColor = (color) => {
  project.value.color_scheme = project.value.color_scheme.filter(c => c !== color)
}

const submitForm = async () => {
  if (await validateCurrentStep()) {
    const formData = { ...project.value }

    // Convert arrays to comma-separated strings
    const arrayFields = [
      'color_scheme',
      'target_users',
      'additional_requirements',
      'non_functional_requirements',
      'technology_stack',
      'priority_modules'
    ]

    arrayFields.forEach(field => {
      if (Array.isArray(formData[field])) {
        formData[field] = formData[field].join(', ')
      }
    })

    if (formData.preliminary_budget) {
      formData.preliminary_budget = parseFloat(formData.preliminary_budget)
    }

    emit('submit', formData)
    dialog.value = false
    resetForm()
  }
}

const colorSchemeOptions = [
  'Light',
  'Dark',
  'Blue',
  'Green',
  'Red',
  'Yellow',
  'Purple',
  'Orange',
  'Custom'
]

const targetUserOptions = [
  'General Users',
  'Business Users',
  'Developers',
  'Administrators',
  'Students',
  'Teachers',
  'Healthcare Professionals',
  'Financial Professionals',
  'Other'
]

const additionalRequirementOptions = [
  'User Authentication',
  'Payment Integration',
  'Social Media Integration',
  'Analytics',
  'Reporting',
  'Export/Import',
  'Multi-language Support',
  'Accessibility',
  'Mobile Responsive',
  'API Integration',
  'Cloud Storage',
  'Real-time Updates'
]

const nonFunctionalRequirementOptions = [
  'Performance',
  'Security',
  'Scalability',
  'Reliability',
  'Maintainability',
  'Usability',
  'Compatibility',
  'Portability',
  'Availability',
  'Recoverability',
  'Testability',
  'Interoperability'
]

const technologyStackOptions = [
  'React',
  'Vue.js',
  'Angular',
  'Node.js',
  'Python',
  'Java',
  'C#',
  'PHP',
  'Ruby',
  'Go',
  'Swift',
  'Kotlin',
  'Flutter',
  'React Native',
  'Django',
  'Laravel',
  'Spring Boot',
  'Express.js',
  'MongoDB',
  'PostgreSQL',
  'MySQL',
  'Redis',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'Google Cloud'
]

const operatingSystemOptions = [
  'Windows',
  'macOS',
  'Linux',
  'iOS',
  'Android',
  'Cross-platform',
  'Web-based'
]

const priorityModuleOptions = [
  'User Management',
  'Content Management',
  'Dashboard',
  'Reporting',
  'Analytics',
  'Settings',
  'Notifications',
  'Search',
  'File Management',
  'Communication',
  'Payment Processing',
  'Security'
]

const convertStringToArray = (value) => {
  if (!value) return []
  return value.split(',').map(item => item.trim()).filter(item => item)
}

onMounted(() => {
  fetchSrsTemplates()


})
watchEffect(
  () => {
    if (props.editMode && props.projectData) {
      console.log('Project Data:', props.projectData.deadline_start)
      const newDeadlineStart = props.projectData.deadline_start ? (new Date(parseInt(props.projectData.deadline_start))).toISOString() : null
      console.log(`New Deadline Start: ${newDeadlineStart}`)
      console.log('Project Data:', props.projectData.deadline_end)
      const newDeadlineEnd = props.projectData.deadline_end ? (new Date(parseInt(props.projectData.deadline_end))).toISOString() : null
      console.log(`New Deadline End: ${newDeadlineEnd}`)

      // Convert string fields to arrays
      const arrayFields = [
        'color_scheme',
        'target_users',
        'additional_requirements',
        'non_functional_requirements',
        'technology_stack',
        'priority_modules'
      ]

      const processedData = { ...props.projectData }
      arrayFields.forEach(field => {
        if (typeof processedData[field] === 'string') {
          processedData[field] = convertStringToArray(processedData[field])
        }
      })

      Object.assign(project.value, processedData, { deadline_start: newDeadlineStart, deadline_end: newDeadlineEnd })
    }
  }
)

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
              <VRow class="mt-3">
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
                    label="Language"
                    :items="languageOptions"
                    required
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <VColorPicker
                    v-model="newColor"
                    label="Add Color"
                    mode="hex"
                    hide-inputs
                    class="mb-2"
                  />
                  <VTextField
                    v-model="newColor"
                    label="Color Code"
                    readonly
                    prepend-inner-icon="tabler-color-picker"
                    class="mb-2"
                  />
                  <VBtn
                    color="primary"
                    variant="tonal"
                    @click="addColor"
                    class="mb-4"
                  >
                    Add Color
                  </VBtn>
                  
                  <div class="d-flex flex-wrap gap-2">
                    <VChip
                      v-for="color in project.color_scheme"
                      :key="color"
                      :color="color"
                      closable
                      @click:close="removeColor(color)"
                      class="ma-1"
                    >
                      {{ color }}
                    </VChip>
                  </div>
                </VCol>
              </VRow>
            </VWindowItem>

            <VWindowItem :value="1">
              <VRow class="mt-3">
                <VCol cols="12">
                  <VTextarea
                    v-model="project.application_description"
                    label="Application Description"
                    required
                    rows="6"
                  />
                </VCol>

                <VCol cols="12">
                  <VCombobox
                    v-model="project.target_users"
                    label="Target Users"
                    :items="targetUserOptions"
                    multiple
                    chips
                    closable-chips
                    clearable
                  />
                </VCol>

                <VCol cols="12">
                  <VCombobox
                    v-model="project.additional_requirements"
                    label="Additional Requirements"
                    :items="additionalRequirementOptions"
                    multiple
                    chips
                    closable-chips
                    clearable
                  />
                </VCol>

                <VCol cols="12">
                  <VCombobox
                    v-model="project.non_functional_requirements"
                    label="Non-Functional Requirements"
                    :items="nonFunctionalRequirementOptions"
                    multiple
                    chips
                    closable-chips
                    clearable
                  />
                </VCol>
              </VRow>
            </VWindowItem>

            <VWindowItem :value="2">
              <VRow class="mt-3">
                <VCol cols="12">
                  <VCombobox
                    v-model="project.technology_stack"
                    label="Technology Stack"
                    :items="technologyStackOptions"
                    multiple
                    chips
                    closable-chips
                    clearable
                  />
                </VCol>

                <VCol cols="12">
                  <VCombobox
                    v-model="project.operating_systems"
                    label="Operating System"
                    :items="operatingSystemOptions"
                    multiple
                    chips
                    closable-chips
                    clearable
                  />
                </VCol>

                <VCol cols="12">
                  <VCombobox
                    v-model="project.priority_modules"
                    label="Priority Modules"
                    :items="priorityModuleOptions"
                    multiple
                    chips
                    closable-chips
                    clearable
                  />
                </VCol>

                <VCol cols="12">
                  <VSelect
                    v-model="project.srs_template"
                    label="SRS Template"
                    :items="templates"
                    item-title="name"
                    item-value="id"
                    :loading="loadingTemplates"
                    clearable
                  />
                </VCol>
              </VRow>
            </VWindowItem>

            <VWindowItem :value="3">
              <VRow class="mt-3">
                <VCol cols="12" md="6">
                  <AppDateTimePicker
                    v-model="project.deadline_start"
                    label="Deadline Start"
                    type="date"
                    :rules="deadlineRules"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <AppDateTimePicker
                    v-model="project.deadline_end"
                    label="Deadline End"
                    type="date"
                    :rules="deadlineRules"
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <VTextField
                    v-model="project.preliminary_budget"
                    label="Preliminary Budget"
                    type="number"
                    :rules="budgetRules"
                    prefix="$"
                  />
                </VCol>

                <VCol cols="12">
                  <VSelect
                    v-model="project.status"
                    label="Status"
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
          v-if="currentStep > 0"
          variant="tonal"
          color="secondary"
          @click="prevStep"
        >
          Previous
        </VBtn>

        <VBtn
          v-if="currentStep < steps.length - 1"
          color="primary"
          @click="nextStep"
        >
          Next
        </VBtn>

        <VBtn
          v-else
          color="primary"
          @click="submitForm"
        >
          {{ props.editMode ? 'Update' : 'Create' }} Project
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
