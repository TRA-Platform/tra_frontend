<script setup>
import { ref, computed, capitalize, onMounted, onUnmounted } from 'vue'
import { useDevelopmentPlanStore } from '@/stores/useDevelopmentPlanStore'
import { getStatusChipColor } from "@core/utils/formatters";
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  version: {
    type: Object,
    required: true
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  hasManagerPermission: {
    type: Boolean,
    default: false
  },
  planId: {
    type: String,
    default: null
  },
  projectId: {
    type: String,
    default: null
  },
  preliminaryBudget: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'refresh'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const planStore = useDevelopmentPlanStore()
const isEditMode = ref(false)
const editedVersion = ref({ ...props.version })
const roles = ref([])
const processingAction = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})
const refreshInterval = ref(null)

const totalCost = computed(() => {
  return roles.value.reduce((sum, role) => sum + role.cost, 0)
})

const isOverBudget = computed(() => {
  return props.preliminaryBudget > 0 && totalCost.value > props.preliminaryBudget
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

const formatCurrency = (value) => {
  if (!value && value !== 0) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

const toggleEditMode = () => {
  if (isEditMode.value) {
    editedVersion.value = { ...props.version }
    roles.value = parseRolesAndHours(props.version.roles_and_hours)
  }
  isEditMode.value = !isEditMode.value
}

const checkVersionStatus = () => {
  if (dialog.value) {
    planStore.fetchPlanVersionById(props.version.id)
      .then(({ data }) => {
        if (data) {
          Object.assign(props.version, data)
          if (!isEditMode.value) {
            roles.value = parseRolesAndHours(data.roles_and_hours)
          }
        }
      })
  }
}

onMounted(() => {
  roles.value = parseRolesAndHours(props.version.roles_and_hours)
  refreshInterval.value = setInterval(checkVersionStatus, 5000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

const addRole = () => {
  roles.value.push({ role: '', hours: 0, cost: 0 })
}

const removeRole = (index) => {
  roles.value.splice(index, 1)
}

const updateRoleCost = (role) => {
  role.cost = role.hours * (role.rate || 30)
}

const saveVersion = async () => {

  processingAction.value = true

  try {
    const versionData = {
      ...editedVersion.value,
      roles_and_hours: JSON.stringify(roles.value),
      estimated_cost: totalCost.value
    }

    const { data, error } = await planStore.updatePlanVersion(props.version.id, versionData)

    if (data && !error) {
      showSnackbar(t('projects.development_plan.notifications.version_updated'))
      Object.assign(props.version, data)
      isEditMode.value = false
      dialog.value = false
      emit('refresh')
    } else {
      showSnackbar(t('projects.development_plan.notifications.version_update_failed'), 'error')
    }
  } catch (err) {
    showSnackbar(t('projects.development_plan.notifications.version_update_failed') + ': ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const setAsCurrent = async () => {
  if (!props.planId) return

  processingAction.value = true

  try {
    const { data, error } = await planStore.setCurrentPlanVersion(props.planId, props.version.id, props.projectId)

    if (data && !error) {
      showSnackbar(t('projects.development_plan.notifications.set_current_success'))
      dialog.value = false
      emit('refresh')
    } else {
      showSnackbar(t('projects.development_plan.notifications.set_current_failed'), 'error')
    }
  } catch (err) {
    showSnackbar(t('projects.development_plan.notifications.set_current_failed') + ': ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const parseRolesAndHours = (rolesAndHours) => {
  if (!rolesAndHours) return []

  try {
    if (typeof rolesAndHours === 'string') {
      return JSON.parse(rolesAndHours)
    }
    return rolesAndHours
  } catch (e) {
    console.error('Error parsing roles and hours:', e)
    return []
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

watch(() => props.version, (newVal) => {
  editedVersion.value = { ...newVal }
  roles.value = parseRolesAndHours(newVal.roles_and_hours)
}, { deep: true })
</script>

<template>
  <VDialog v-model="dialog" max-width="900" scrollable>
    <VCard>
      <VCardTitle class="d-flex py-3 px-5">
        <template v-if="isEditMode">
          <h5 class="text-h5">{{ t('projects.development_plan.actions.edit') }}</h5>
        </template>
        <template v-else>
          <h5 class="text-h5">
            {{ t('projects.development_plan.version.version') }} {{ version.version_number }}
            <VChip v-if="isCurrent" color="primary" size="small" label class="ms-2">
              {{ t('projects.development_plan.version.current') }}
            </VChip>
          </h5>
        </template>

        <VSpacer />

        <IconBtn @click="dialog = false">
          <VIcon icon="tabler-x" />
        </IconBtn>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-6">
        <div v-if="isEditMode">
          <VForm @submit.prevent="saveVersion">
            <VRow class="mt-3">
              <VCol cols="12" md="4">
                <VTextField v-model.number="editedVersion.estimated_cost"
                  :label="t('projects.development_plan.estimated_cost')" type="number" required disabled
                  :model-value="totalCost" />
              </VCol>

              <VCol cols="12" md="4">
                <VSelect v-model="editedVersion.status" :label="t('projects.details.status')" :items="[
                  { title: t('projects.status.draft'), value: 'draft' },
                  { title: t('projects.status.active'), value: 'active' },
                  { title: t('projects.status.archived'), value: 'archived' },
                  { title: t('projects.status.completed'), value: 'completed' }
                ]" required />
              </VCol>

              <VCol cols="12">
                <VCard variant="outlined">
                  <VCardTitle class="d-flex align-center">
                    {{ t('projects.development_plan.version.roles_hours_breakdown') }}
                    <VSpacer />
                    <VBtn color="primary" variant="tonal" size="small" prepend-icon="tabler-plus" @click="addRole">
                      {{ t('projects.development_plan.actions.add_role') }}
                    </VBtn>
                  </VCardTitle>

                  <VCardText>
                    <VRow>
                      <VCol cols="12">
                        <VTable>
                          <thead>
                            <tr>
                              <th class="text-left" style="min-width: 200px">{{
                                t('projects.development_plan.version.role') }}
                              </th>
                              <th class="text-right" style="min-width: 120px">{{
                                t('projects.development_plan.version.hours')
                                }}</th>
                              <th class="text-right" style="min-width: 120px">{{
                                t('projects.development_plan.version.rate')
                                }}</th>
                              <th class="text-right" style="min-width: 120px">{{
                                t('projects.development_plan.version.cost')
                                }}</th>
                              <th class="text-right" style="width: 50px"></th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(role, index) in roles" :key="index">
                              <td>
                                <VTextField v-model="role.role" density="compact" hide-details variant="outlined" />
                              </td>
                              <td>
                                <VTextField v-model.number="role.hours" type="number" density="compact" hide-details
                                  variant="outlined" class="text-right" @update:model-value="updateRoleCost(role)" />
                              </td>
                              <td>
                                <VTextField v-model.number="role.rate" type="number" density="compact" hide-details
                                  variant="outlined" class="text-right" :model-value="role.rate || 30"
                                  @update:model-value="updateRoleCost(role)" />
                              </td>
                              <td>
                                <VTextField v-model.number="role.cost" type="number" density="compact" hide-details
                                  variant="outlined" class="text-right" readonly />
                              </td>
                              <td class="text-right">
                                <VBtn icon variant="text" color="error" size="small" @click="removeRole(index)">
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
                        <VAlert v-if="isOverBudget" type="warning" variant="tonal" class="mt-4">
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
                <VTextarea v-model="editedVersion.notes" :label="t('projects.development_plan.notes')" rows="4" />
              </VCol>
            </VRow>
          </VForm>
        </div>
        <div v-else>
          <VRow class="mt-3">
            <VCol cols="12">
              <div class="d-flex flex-wrap justify-space-between mb-4">
                <div class="d-flex align-center">
                  <VChip :color="getStatusChipColor(version.status)" size="small" label>
                    {{ capitalize(version.status) }}
                  </VChip>
                </div>
                <div class="d-flex align-center">
                  <span class="text-caption">
                    {{ t('projects.development_plan.version.created') }}: {{ formatDate(version.created_at) }}
                  </span>

                  <span class="text-caption ms-3" v-if="version.created_by">
                    {{ t('projects.development_plan.version.created_by') }}: {{ version.created_by.username }}
                  </span>
                </div>

                <div>
                  <h4 class="text-h4 font-weight-bold">{{ formatCurrency(version.estimated_cost) }}</h4>
                  <div class="text-caption text-medium-emphasis text-right">
                    {{ t('projects.development_plan.version.estimated_total_cost') }}
                  </div>
                </div>
              </div>
            </VCol>
            <VCol cols="12">
              <VAlert v-if="isOverBudget" type="warning" variant="tonal" class="mt-4">
                {{ t('projects.development_plan.validation.over_budget', {
                  total: totalCost.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                  budget: preliminaryBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                }) }}
              </VAlert>
            </VCol>

            <VCol cols="12">
              <VCard variant="outlined" class="mb-4">
                <VCardTitle>{{ t('projects.development_plan.version.roles_hours_breakdown') }}</VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTable>
                        <thead>
                          <tr>
                            <th class="text-left" style="min-width: 200px">{{
                              t('projects.development_plan.version.role') }}
                            </th>
                            <th class="text-right" style="min-width: 120px">{{
                              t('projects.development_plan.version.hours') }}
                            </th>
                            <th class="text-right" style="min-width: 120px">{{
                              t('projects.development_plan.version.rate') }}
                            </th>
                            <th class="text-right" style="min-width: 120px">{{
                              t('projects.development_plan.version.cost') }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(role, index) in roles" :key="index">
                            <td>{{ role.role }}</td>
                            <td class="text-right">{{ role.hours }}</td>
                            <td class="text-right">{{ role.rate || 30 }}</td>
                            <td class="text-right">{{ formatCurrency(role.cost) }}</td>
                          </tr>
                          <tr v-if="roles.length === 0">
                            <td colspan="4" class="text-center">{{ t('projects.development_plan.version.no_roles') }}
                            </td>
                          </tr>
                        </tbody>
                      </VTable>
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <VCol cols="12" v-if="version.notes">
              <VCard variant="outlined">
                <VCardTitle>{{ t('projects.development_plan.notes') }}</VCardTitle>
                <VCardText>
                  <div class="text-body-1 whitespace-pre-wrap">{{ version.notes }}</div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </div>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <template v-if="isEditMode">
          <VBtn color="secondary" variant="tonal" @click="toggleEditMode" :disabled="processingAction">
            {{ t('projects.actions.cancel') }}
          </VBtn>

          <VSpacer />

          <VBtn color="primary" @click="saveVersion" :loading="processingAction">
            {{ t('projects.actions.save') }}
          </VBtn>
        </template>
        <template v-else>
          <VBtn v-if="!isCurrent && hasManagerPermission" color="primary" variant="tonal" @click="setAsCurrent"
            :loading="processingAction" prepend-icon="tabler-check">
            {{ t('projects.development_plan.actions.set_current') }}
          </VBtn>

          <VSpacer />

          <VBtn v-if="hasManagerPermission" color="primary" prepend-icon="tabler-edit" @click="toggleEditMode">
            {{ t('projects.development_plan.actions.edit') }}
          </VBtn>
        </template>
      </VCardActions>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="5000">
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
.whitespace-pre-wrap {
  white-space: pre-wrap;
}
</style>
