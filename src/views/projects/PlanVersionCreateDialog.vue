<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  planId: {
    type: String,
    required: true
  },
  currentVersionNumber: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const planVersion = ref({
  roles_and_hours: '[{"role": "Project Manager", "hours": 20, "cost": 2000}, {"role": "Developer", "hours": 80, "cost": 8000}]',
  estimated_cost: 10000,
  notes: '',
  status: 'draft'
})
const estimatedCostRules = [
  v => !!v || 'Estimated cost is required',
  v => !isNaN(parseFloat(v)) || 'Estimated cost must be a number'
]

const rolesAndHoursRules = [
  v => {
    try {
      JSON.parse(v)
      return true
    } catch (e) {
      return 'Roles and hours must be valid JSON'
    }
  }
]

const formRef = ref(null)

const resetForm = () => {
  planVersion.value = {
    roles_and_hours: '[{"role": "Project Manager", "hours": 20, "cost": 2000}, {"role": "Developer", "hours": 80, "cost": 8000}]',
    estimated_cost: 10000,
    notes: '',
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
    const formData = { ...planVersion.value }

    formData.estimated_cost = parseFloat(formData.estimated_cost)

    emit('submit', formData)
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
        <h5 class="text-h5">Create New Plan Version</h5>
        <VSpacer />
        <IconBtn @click="handleCancel">
          <VIcon icon="tabler-x" />
        </IconBtn>
      </VCardTitle>

      <VCardText class="px-5 pt-4">
        <p class="text-subtitle-1 mb-4">
          Creating version {{ currentVersionNumber + 1 }} for this development plan.
        </p>

        <VForm ref="formRef" @submit.prevent="submitForm">
          <VRow class="mt-3">
            <VCol cols="12" md="6">
              <VTextField
                v-model.number="planVersion.estimated_cost"
                label="Estimated Cost ($)"
                type="number"
                :rules="estimatedCostRules"
                required
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="planVersion.status"
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
                v-model="planVersion.roles_and_hours"
                label="Roles & Hours (JSON format)"
                :rules="rolesAndHoursRules"
                rows="6"
                monospace
                hint="Format: [{ 'role': 'Developer', 'hours': 40, 'cost': 4000 }]"
                persistent-hint
              />
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="planVersion.notes"
                label="Notes"
                rows="4"
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
          Create Version
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
