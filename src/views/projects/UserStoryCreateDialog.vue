<script setup>
import {ref, computed} from 'vue'

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
  v => !!v || 'Role is required'
]

const actionRules = [
  v => !!v || 'Action is required'
]

const benefitRules = [
  v => !!v || 'Benefit is required'
]

const statusOptions = [
  {title: 'Draft', value: 'draft'},
  {title: 'Active', value: 'active'},
  {title: 'Archived', value: 'archived'},
  {title: 'Completed', value: 'completed'}
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
        <h5 class="text-h5">{{ props.editMode ? 'Edit User Story' : 'Create New User Story' }}</h5>
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
                label="Role (As a...)"
                :rules="roleRules"
                placeholder="e.g. registered user, system administrator, customer"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="userStory.action"
                label="Action (I want to...)"
                :rules="actionRules"
                placeholder="e.g. search for products, export reports, reset my password"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="userStory.benefit"
                label="Benefit (So that...)"
                :rules="benefitRules"
                placeholder="e.g. I can find what I need quickly, I can analyze the data offline"
                required
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="userStory.status"
                label="Status"
                :items="statusOptions"
                required
              />
            </VCol>

            <VCol cols="12">
              <div class="text-subtitle-1 font-weight-medium">Acceptance Criteria</div>
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
                      placeholder="Add new criterion"
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
                      Add
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
                No acceptance criteria added yet. Add at least one criterion to help clarify when this user story is
                considered done.
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
          Cancel
        </VBtn>

        <VSpacer/>

        <VBtn
          color="primary"
          @click="submitForm"
        >
          {{ props.editMode ? 'Update' : 'Create' }} User Story
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
