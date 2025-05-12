<script setup>
import {ref, computed} from 'vue'
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
  userStoryData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const userStory = ref({
  role: props.editMode && props.userStoryData ? props.userStoryData.role : '',
  action: props.editMode && props.userStoryData ? props.userStoryData.action : '',
  benefit: props.editMode && props.userStoryData ? props.userStoryData.benefit : '',
  acceptance_criteria: props.editMode && props.userStoryData ? [...props.userStoryData.acceptance_criteria] : [],
  status: props.editMode && props.userStoryData ? props.userStoryData.status : 'draft'
})

const criteriaInput = ref('')
const formRef = ref(null)

const roleRules = [
  v => !!v || t('projects.user_stories.validation.role_required')
]

const actionRules = [
  v => !!v || t('projects.user_stories.validation.action_required')
]

const benefitRules = [
  v => !!v || t('projects.user_stories.validation.benefit_required')
]

const statusOptions = [
  {title: t('projects.status.draft'), value: 'draft'},
  {title: t('projects.status.active'), value: 'active'},
  {title: t('projects.status.archived'), value: 'archived'},
  {title: t('projects.status.completed'), value: 'completed'}
]

const addCriterion = () => {
  if (!criteriaInput.value.trim()) return

  if (!userStory.value.acceptance_criteria) {
    userStory.value.acceptance_criteria = []
  }

  userStory.value.acceptance_criteria.push(criteriaInput.value.trim())
  criteriaInput.value = ''
}

const removeCriterion = (index) => {
  userStory.value.acceptance_criteria.splice(index, 1)
}

const resetForm = () => {
  userStory.value = {
    role: '',
    action: '',
    benefit: '',
    acceptance_criteria: [],
    status: 'draft'
  }
  criteriaInput.value = ''

  if (formRef.value) formRef.value.resetValidation()
}

const handleCancel = () => {
  dialog.value = false
  resetForm()
}

const submitForm = async () => {
  const {valid} = await formRef.value.validate()

  if (valid) {
    emit('submit', userStory.value)
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
        <h5 class="text-h5">{{ props.editMode ? t('projects.user_stories.title.edit') : t('projects.user_stories.title.create') }}</h5>
        <VSpacer/>
        <IconBtn @click="handleCancel">
          <VIcon icon="tabler-x"/>
        </IconBtn>
      </VCardTitle>

      <VCardText class="px-5 pt-4">
        <VForm ref="formRef" @submit.prevent="submitForm">
          <VRow class="mt-3">
            <VCol cols="12">
              <VTextField
                v-model="userStory.role"
                :label="t('projects.user_stories.fields.role')"
                :rules="roleRules"
                :placeholder="t('projects.user_stories.placeholders.role')"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="userStory.action"
                :label="t('projects.user_stories.fields.action')"
                :rules="actionRules"
                :placeholder="t('projects.user_stories.placeholders.action')"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="userStory.benefit"
                :label="t('projects.user_stories.fields.benefit')"
                :rules="benefitRules"
                :placeholder="t('projects.user_stories.placeholders.benefit')"
                required
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="userStory.status"
                :label="t('projects.user_stories.fields.status')"
                :items="statusOptions"
                required
              />
            </VCol>

            <VCol cols="12">
              <div class="text-subtitle-1 font-weight-medium">{{ t('projects.user_stories.fields.acceptance_criteria') }}</div>
              <div class="d-flex align-center justify-space-between mb-3">
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

              <VList v-if="userStory.acceptance_criteria && userStory.acceptance_criteria.length > 0">
                <VListItem
                  v-for="(criterion, index) in userStory.acceptance_criteria"
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
      </VCardText>

      <VDivider/>

      <VCardActions class="pa-4">
        <VBtn
          variant="tonal"
          color="secondary"
          @click="handleCancel"
        >
          {{ t('projects.user_stories.actions.cancel') }}
        </VBtn>

        <VSpacer/>

        <VBtn
          color="primary"
          @click="submitForm"
        >
          {{ props.editMode ? t('projects.user_stories.actions.save') : t('projects.user_stories.actions.create') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
