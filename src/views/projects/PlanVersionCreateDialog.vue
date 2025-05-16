<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  planId: {
    type: String,
    required: true
  },
  projectId: {
    type: String,
    required: true
  },
  currentVersionNumber: {
    type: Number,
    default: 0
  },
  preliminaryBudget: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const roles = ref([
  { role: 'Product Manager', hours: 60, cost: 1800 },
  { role: 'System Analyst', hours: 40, cost: 1000 },
  { role: 'UX/UI Designer', hours: 90, cost: 2250 },
  { role: 'Flutter Developer (Middle)', hours: 240, cost: 4800 },
  { role: 'Backend Developer', hours: 120, cost: 2400 },
  { role: 'QA Engineer', hours: 80, cost: 1440 },
  { role: 'DevOps/Deployment Specialist', hours: 20, cost: 400 },
  { role: 'Support/Documentation Specialist', hours: 16, cost: 320 }
])

const planVersion = ref({
  estimated_cost: 10000,
  notes: '',
  status: 'draft'
})

const totalCost = computed(() => {
  return roles.value.reduce((sum, role) => sum + role.cost, 0)
})

const isOverBudget = computed(() => {
  return props.preliminaryBudget > 0 && totalCost.value > props.preliminaryBudget
})

const estimatedCostRules = [
  v => !!v || t('projects.development_plan.validation.estimated_cost_required'),
  v => !isNaN(parseFloat(v)) || t('projects.development_plan.validation.estimated_cost_number')
]

const formRef = ref(null)

const resetForm = () => {
  roles.value = [
    { role: 'Product Manager', hours: 60, cost: 1800 },
    { role: 'System Analyst', hours: 40, cost: 1000 },
    { role: 'UX/UI Designer', hours: 90, cost: 2250 },
    { role: 'Flutter Developer (Middle)', hours: 240, cost: 4800 },
    { role: 'Backend Developer', hours: 120, cost: 2400 },
    { role: 'QA Engineer', hours: 80, cost: 1440 },
    { role: 'DevOps/Deployment Specialist', hours: 20, cost: 400 },
    { role: 'Support/Documentation Specialist', hours: 16, cost: 320 }
  ]
  planVersion.value = {
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

const addRole = () => {
  roles.value.push({ role: '', hours: 0, cost: 0 })
}

const removeRole = (index) => {
  roles.value.splice(index, 1)
}

const updateRoleCost = (role) => {
  role.cost = role.hours * (role.rate || 30)
}

const submitForm = async () => {
  const { valid } = await formRef.value.validate()

  if (valid) {
    const formData = { 
      ...planVersion.value,
      roles_and_hours: JSON.stringify(roles.value),
      estimated_cost: totalCost.value
    }

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
    max-width="900"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex pt-5 px-5">
        <h5 class="text-h5">{{ t('projects.development_plan.actions.new_version') }}</h5>
        <VSpacer />
        <IconBtn @click="handleCancel">
          <VIcon icon="tabler-x" />
        </IconBtn>
      </VCardTitle>

      <VCardText class="px-5 pt-4">
        <p class="text-subtitle-1 mb-4">
          {{ t('projects.development_plan.creating_version', { version: currentVersionNumber + 1 }) }}
        </p>

        <VForm ref="formRef" @submit.prevent="submitForm">
          <VRow class="mt-3">
            <VCol cols="12" md="6">
              <VTextField
                v-model.number="planVersion.estimated_cost"
                :label="t('projects.development_plan.estimated_cost')"
                type="number"
                :rules="estimatedCostRules"
                required
                disabled
                :model-value="totalCost"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="planVersion.status"
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
              <VCard variant="outlined">
                <VCardTitle class="d-flex align-center">
                  {{ t('projects.development_plan.version.roles_hours_breakdown') }}
                  <VSpacer />
                  <VBtn
                    color="primary"
                    variant="tonal"
                    size="small"
                    prepend-icon="tabler-plus"
                    @click="addRole"
                  >
                    {{ t('projects.development_plan.actions.add_role') }}
                  </VBtn>
                </VCardTitle>

                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTable>
                        <thead>
                          <tr>
                            <th class="text-left" style="min-width: 200px">{{ t('projects.development_plan.version.role') }}</th>
                            <th class="text-right" style="min-width: 120px">{{ t('projects.development_plan.version.hours') }}</th>
                            <th class="text-right" style="min-width: 120px">{{ t('projects.development_plan.version.rate') }}</th>
                            <th class="text-right" style="min-width: 120px">{{ t('projects.development_plan.version.cost') }}</th>
                            <th class="text-right" style="width: 50px"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(role, index) in roles" :key="index">
                            <td>
                              <VTextField
                                v-model="role.role"
                                density="compact"
                                hide-details
                                variant="outlined"
                              />
                            </td>
                            <td>
                              <VTextField
                                v-model.number="role.hours"
                                type="number"
                                density="compact"
                                hide-details
                                variant="outlined"
                                class="text-right"
                                @update:model-value="updateRoleCost(role)"
                              />
                            </td>
                            <td>
                              <VTextField
                                v-model.number="role.rate"
                                type="number"
                                density="compact"
                                hide-details
                                variant="outlined"
                                class="text-right"
                                :model-value="role.rate || 30"
                                @update:model-value="updateRoleCost(role)"
                              />
                            </td>
                            <td>
                              <VTextField
                                v-model.number="role.cost"
                                type="number"
                                density="compact"
                                hide-details
                                variant="outlined"
                                class="text-right"
                                readonly
                              />
                            </td>
                            <td class="text-right">
                              <VBtn
                                icon
                                variant="text"
                                color="error"
                                size="small"
                                @click="removeRole(index)"
                              >
                                <VIcon icon="tabler-trash" />
                              </VBtn>
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colspan="3" class="text-right font-weight-bold">
                              {{ t('projects.development_plan.version.total') }}:
                            </td>
                            <td class="text-right font-weight-bold">
                              {{ totalCost.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </VTable>
                    </VCol>

                    <VCol cols="12">
                      <VAlert
                        v-if="isOverBudget"
                        type="warning"
                        variant="tonal"
                        class="mt-4"
                      >
                        {{ t('projects.development_plan.validation.over_budget', { 
                          total: totalCost.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                          budget: preliminaryBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                        }) }}
                      </VAlert>
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="planVersion.notes"
                :label="t('projects.development_plan.notes')"
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
          {{ t('projects.actions.cancel') }}
        </VBtn>

        <VSpacer />

        <VBtn
          color="primary"
          @click="submitForm"
        >
          {{ t('projects.development_plan.actions.create_version') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
