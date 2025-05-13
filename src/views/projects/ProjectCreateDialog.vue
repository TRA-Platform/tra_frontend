<script setup>
import {ref, computed, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {useSrsTemplateStore} from '@/stores/useSrsTemplateStore'
import AppDateTimePicker from "@core/components/app-form-elements/AppDateTimePicker.vue";

const {t} = useI18n()

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
  v => !!v || t('projects.create_dialog.validation.name_required'),
  v => v.length <= 200 || t('projects.create_dialog.validation.name_length')
]

const shortDescriptionRules = [
  v => !!v || t('projects.create_dialog.validation.description_required')
]

const budgetRules = [
  v => !v || !isNaN(parseFloat(v)) || t('projects.create_dialog.validation.budget_number')
]

const deadlineRules = [
  v => !v || new Date(v) > new Date() || t('projects.create_dialog.validation.deadline_future')
]

const currentStep = ref(0)
const formRef = ref(null)

const steps = [
  {
    title: t('projects.create_dialog.steps.basic_info.title'),
    subtitle: t('projects.create_dialog.steps.basic_info.subtitle'),
    icon: 'tabler-info-circle'
  },
  {
    title: t('projects.create_dialog.steps.detailed_description.title'),
    subtitle: t('projects.create_dialog.steps.detailed_description.subtitle'),
    icon: 'tabler-file-description'
  },
  {
    title: t('projects.create_dialog.steps.technical_requirements.title'),
    subtitle: t('projects.create_dialog.steps.technical_requirements.subtitle'),
    icon: 'tabler-code'
  },
  {
    title: t('projects.create_dialog.steps.planning.title'),
    subtitle: t('projects.create_dialog.steps.planning.subtitle'),
    icon: 'tabler-calendar'
  }
]

const typeOptions = [
  {title: t('projects.types.website'), value: 'website'},
  {title: t('projects.types.mobile'), value: 'mobile'},
  {title: t('projects.types.desktop'), value: 'desktop'},
  {title: t('projects.types.api'), value: 'api'},
  {title: t('projects.types.other'), value: 'other'}
]

const languageOptions = [
  {title: t('projects.languages.english'), value: 'en'},
  {title: t('projects.languages.russian'), value: 'ru'},
  {title: t('projects.languages.german'), value: 'de'}
]

const statusOptions = [
  {title: t('projects.status.draft'), value: 'draft'},
  {title: t('projects.status.active'), value: 'active'},
  {title: t('projects.status.archived'), value: 'archived'},
  {title: t('projects.status.completed'), value: 'completed'}
]

const templates = ref([])
const loadingTemplates = ref(false)

const fetchSrsTemplates = async () => {
  loadingTemplates.value = true
  try {
    const {data} = await srsTemplateStore.fetchTemplates()
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

  const {valid} = await formRef.value.validate()
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
    const formData = {...project.value}
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
  t('projects.target_users.general_users'),
  t('projects.target_users.business_users'),
  t('projects.target_users.developers'),
  t('projects.target_users.administrators'),
  t('projects.target_users.students'),
  t('projects.target_users.teachers'),
  t('projects.target_users.healthcare_professionals'),
  t('projects.target_users.financial_professionals'),
  t('projects.target_users.other')
]

const additionalRequirementOptions = [
  t('projects.additional_requirements.user_authentication'),
  t('projects.additional_requirements.payment_integration'),
  t('projects.additional_requirements.social_media_integration'),
  t('projects.additional_requirements.analytics'),
  t('projects.additional_requirements.reporting'),
  t('projects.additional_requirements.export_import'),
  t('projects.additional_requirements.multi_language_support'),
  t('projects.additional_requirements.accessibility'),
  t('projects.additional_requirements.mobile_responsive'),
  t('projects.additional_requirements.api_integration'),
  t('projects.additional_requirements.cloud_storage'),
  t('projects.additional_requirements.real_time_updates')
]

const nonFunctionalRequirementOptions = [
  t('projects.non_functional_requirements.performance'),
  t('projects.non_functional_requirements.security'),
  t('projects.non_functional_requirements.scalability'),
  t('projects.non_functional_requirements.reliability'),
  t('projects.non_functional_requirements.maintainability'),
  t('projects.non_functional_requirements.usability'),
  t('projects.non_functional_requirements.compatibility'),
  t('projects.non_functional_requirements.portability'),
  t('projects.non_functional_requirements.availability'),
  t('projects.non_functional_requirements.recoverability'),
  t('projects.non_functional_requirements.testability'),
  t('projects.non_functional_requirements.interoperability')
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
  t('projects.operating_systems.windows'),
  t('projects.operating_systems.macos'),
  t('projects.operating_systems.linux'),
  t('projects.operating_systems.ios'),
  t('projects.operating_systems.android'),
  t('projects.operating_systems.cross_platform'),
  t('projects.operating_systems.web_based')
]

const priorityModuleOptions = [
  t('projects.priority_modules.user_management'),
  t('projects.priority_modules.content_management'),
  t('projects.priority_modules.dashboard'),
  t('projects.priority_modules.reporting'),
  t('projects.priority_modules.analytics'),
  t('projects.priority_modules.settings'),
  t('projects.priority_modules.notifications'),
  t('projects.priority_modules.search'),
  t('projects.priority_modules.file_management'),
  t('projects.priority_modules.communication'),
  t('projects.priority_modules.payment_processing'),
  t('projects.priority_modules.security')
]

const convertStringToArray = (value) => {
  if (!value) return []
  return value.split(',').map(item => item.trim()).filter(item => item)
}

const generateRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

const generateColorPalette = () => {
  const baseColor = generateRandomColor()
  const hexToHSL = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2

    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break
        case g:
          h = (b - r) / d + 2;
          break
        case b:
          h = (r - g) / d + 4;
          break
      }

      h /= 6
    }

    return [h * 360, s * 100, l * 100]
  }

  const HSLToHex = (h, s, l) => {
    s /= 100
    l /= 100
    const k = n => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return `#${Math.round(255 * f(0)).toString(16).padStart(2, '0')}${Math.round(255 * f(8)).toString(16).padStart(2, '0')}${Math.round(255 * f(4)).toString(16).padStart(2, '0')}`
  }

  const [h, s, l] = hexToHSL(baseColor)
  const complementaryColor = HSLToHex((h + 180) % 360, s, l)
  const analogousColor = HSLToHex((h + 30) % 360, s, l)
  project.value.color_scheme = [baseColor, complementaryColor, analogousColor]
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
      const arrayFields = [
        'color_scheme',
        'target_users',
        'additional_requirements',
        'non_functional_requirements',
        'technology_stack',
        'priority_modules'
      ]

      const processedData = {...props.projectData}
      arrayFields.forEach(field => {
        if (typeof processedData[field] === 'string') {
          processedData[field] = convertStringToArray(processedData[field])
        }
      })

      Object.assign(project.value, processedData, {deadline_start: newDeadlineStart, deadline_end: newDeadlineEnd})
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
        <h5 class="text-h5">{{ props.editMode ? t('projects.create_dialog.title.edit') : t('projects.create_dialog.title.create') }}</h5>
        <VSpacer/>
        <IconBtn @click="handleCancel">
          <VIcon icon="tabler-x"/>
        </IconBtn>
      </VCardTitle>

      <VCardText class="px-5 pt-4">
        <AppStepper
          :items="steps"
          v-model:current-step="currentStep"
          :is-active-step-valid="true"
        />

        <VDivider class="my-5"/>

        <VForm
          ref="formRef" @submit.prevent>
          <VWindow v-model="currentStep">
            <VWindowItem :value="0">
              <VRow class="mt-3">
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="project.name"
                    :label="t('projects.create_dialog.fields.name')"
                    :rules="nameRules"
                    required
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <VSelect
                    v-model="project.type_of_application"
                    :label="t('projects.create_dialog.fields.type')"
                    :items="typeOptions"
                    required
                  />
                </VCol>

                <VCol cols="12">
                  <VTextarea
                    v-model="project.short_description"
                    :label="t('projects.create_dialog.fields.short_description')"
                    :rules="shortDescriptionRules"
                    required
                    rows="3"
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <VSelect
                    v-model="project.language"
                    :label="t('projects.create_dialog.fields.language')"
                    :items="languageOptions"
                    required
                  />
                </VCol>

                <VCol cols="12">
                  <VColorPicker
                    v-model="newColor"
                    :label="t('projects.create_dialog.fields.color_scheme.add_color')"
                    mode="hex"
                    prepend-icon="tabler-plus"
                    hide-inputs
                    class="mb-2"
                  />
                  <VRow>
                    <VCol
                      cols="12"
                      md="6"
                    >
                      <VTextField
                        v-model="newColor"
                        :label="t('projects.create_dialog.fields.color_scheme.color_code')"
                        readonly
                        prepend-inner-icon="tabler-color-picker"
                        class="w-100 mb-2"
                      />
                    </VCol>
                    <VCol
                      cols="6"
                      md="3"
                    >
                      <VBtn
                        class="w-100"
                        color="primary"
                        variant="tonal"
                        prepend-icon="tabler-plus"
                        @click="addColor"
                      >
                        {{ t('projects.create_dialog.fields.color_scheme.add_color') }}
                      </VBtn>
                    </VCol>
                    <VCol
                      cols="6"
                      md="3"
                    >
                      <VBtn
                        class="w-100"
                        color="secondary"
                        variant="tonal"
                        prepend-icon="tabler-palette"
                        @click="generateColorPalette"
                      >
                        {{ t('projects.create_dialog.fields.color_scheme.generate_palette') }}
                      </VBtn>
                    </VCol>
                  </VRow>

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
                    :label="t('projects.create_dialog.fields.application_description')"
                    required
                    rows="6"
                  />
                </VCol>

                <VCol cols="12">
                  <VCombobox
                    v-model="project.target_users"
                    :label="t('projects.create_dialog.fields.target_users')"
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
                    :label="t('projects.create_dialog.fields.additional_requirements')"
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
                    :label="t('projects.create_dialog.fields.non_functional_requirements')"
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
                    :label="t('projects.create_dialog.fields.technology_stack')"
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
                    :label="t('projects.create_dialog.fields.operating_systems')"
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
                    :label="t('projects.create_dialog.fields.priority_modules')"
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
                    :label="t('projects.create_dialog.fields.srs_template')"
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
                    :label="t('projects.create_dialog.fields.deadline.start')"
                    type="date"
                    :rules="deadlineRules"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <AppDateTimePicker
                    v-model="project.deadline_end"
                    :label="t('projects.create_dialog.fields.deadline.end')"
                    type="date"
                    :rules="deadlineRules"
                  />
                </VCol>

                <VCol cols="12" md="6">
                  <VTextField
                    v-model="project.preliminary_budget"
                    :label="t('projects.create_dialog.fields.preliminary_budget')"
                    type="number"
                    :rules="budgetRules"
                    prefix="$"
                  />
                </VCol>

                <VCol cols="12">
                  <VSelect
                    v-model="project.status"
                    :label="t('projects.create_dialog.fields.status')"
                    :items="statusOptions"
                    required
                  />
                </VCol>
              </VRow>
            </VWindowItem>
          </VWindow>
        </VForm>
      </VCardText>

      <VDivider/>

      <VCardActions class="pa-4">
        <VBtn
          variant="tonal"
          color="secondary"
          @click="handleCancel"
        >
          {{ t('projects.create_dialog.actions.cancel') }}
        </VBtn>

        <VSpacer/>

        <VBtn
          v-if="currentStep > 0"
          variant="tonal"
          color="secondary"
          @click="prevStep"
        >
          {{ t('projects.create_dialog.actions.previous') }}
        </VBtn>

        <VBtn
          v-if="currentStep < steps.length - 1"
          color="primary"
          @click="nextStep"
        >
          {{ t('projects.create_dialog.actions.next') }}
        </VBtn>

        <VBtn
          v-else
          color="primary"
          @click="submitForm"
        >
          {{ props.editMode ? t('projects.create_dialog.actions.update') : t('projects.create_dialog.actions.create') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
