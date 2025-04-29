<script setup>
import { ref, computed, capitalize } from 'vue'
import { useDevelopmentPlanStore } from '@/stores/useDevelopmentPlanStore'
import { getStatusChipColor } from "@core/utils/formatters";

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
const processingAction = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
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
  }
  isEditMode.value = !isEditMode.value
}

const saveVersion = async () => {
  processingAction.value = true

  try {
    const { data, error } = await planStore.updatePlanVersion(props.version.id, editedVersion.value)

    if (data && !error) {
      showSnackbar('Plan version updated successfully')
      Object.assign(props.version, data)
      isEditMode.value = false
      emit('refresh')
    } else {
      showSnackbar('Failed to update plan version', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to update plan version: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const setAsCurrent = async () => {
  if (!props.planId) return

  processingAction.value = true

  try {
    const { data, error } = await planStore.setCurrentPlanVersion(props.planId, props.version.id)

    if (data && !error) {
      showSnackbar('Set as current version successfully')
      emit('refresh')
    } else {
      showSnackbar('Failed to set as current version', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to set as current version: ' + err.message, 'error')
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

const formatRolesAndHours = (rolesAndHours) => {
  try {
    return JSON.stringify(rolesAndHours, null, 2)
  } catch (e) {
    return ''
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
}, { deep: true })
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="900"
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex py-3 px-5">
        <template v-if="isEditMode">
          <h5 class="text-h5">Edit Plan Version</h5>
        </template>
        <template v-else>
          <h5 class="text-h5">
            Development Plan v{{ version.version_number }}
            <VChip
              v-if="isCurrent"
              color="primary"
              size="small"
              label
              class="ms-2"
            >
              Current
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
                <VTextField
                  v-model.number="editedVersion.estimated_cost"
                  label="Estimated Cost ($)"
                  type="number"
                  required
                  :rules="[v => !!v || 'Estimated cost is required']"
                />
              </VCol>

              <VCol cols="12" md="4">
                <VSelect
                  v-model="editedVersion.status"
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
                  v-model="editedVersion.notes"
                  label="Notes"
                  rows="4"
                />
              </VCol>

              <VCol cols="12">
                <p class="text-subtitle-1 font-weight-bold mb-2">Roles & Hours</p>
                <VTextarea
                  v-model="editedVersion.roles_and_hours"
                  label="Roles & Hours (JSON format)"
                  rows="8"
                  monospace
                  hint="Format: [{ 'role': 'Developer', 'hours': 40, 'cost': 4000 }]"
                  persistent-hint
                />
              </VCol>
            </VRow>
          </VForm>
        </div>
        <div v-else>
          <VRow class="mt-3">
            <VCol cols="12">
              <div class="d-flex flex-wrap justify-space-between mb-4">
                <div class="d-flex align-center">
                  <VChip
                    :color="getStatusChipColor(version.status)"
                    size="small"
                    label
                  >
                    {{ capitalize(version.status) }}
                  </VChip>
                </div>
                <div class="d-flex align-center">
                  <span class="text-caption">
                    Created: {{ formatDate(version.created_at) }}
                  </span>

                  <span class="text-caption ms-3" v-if="version.created_by">
                    Created by: {{ version.created_by.username }}
                  </span>
                </div>

                <div>
                  <h4 class="text-h4 font-weight-bold">{{ formatCurrency(version.estimated_cost) }}</h4>
                  <div class="text-caption text-medium-emphasis text-right">
                    Estimated total cost
                  </div>
                </div>
              </div>
            </VCol>

            <VCol cols="12">
              <VCard variant="outlined" class="mb-4">
                <VCardTitle>Roles & Hours Breakdown</VCardTitle>
                <VCardText>
                  <VTable>
                    <thead>
                    <tr>
                      <th>Role</th>
                      <th class="text-right">Hours</th>
                      <th class="text-right">Cost</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(role, index) in parseRolesAndHours(version.roles_and_hours)" :key="index">
                      <td>{{ role.role }}</td>
                      <td class="text-right">{{ role.hours }}</td>
                      <td class="text-right">{{ formatCurrency(role.cost) }}</td>
                    </tr>
                    <tr v-if="parseRolesAndHours(version.roles_and_hours).length === 0">
                      <td colspan="3" class="text-center">No roles and hours defined</td>
                    </tr>
                    </tbody>
                  </VTable>
                </VCardText>
              </VCard>
            </VCol>

            <VCol cols="12" v-if="version.notes">
              <VCard variant="outlined">
                <VCardTitle>Notes</VCardTitle>
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
          <VBtn
            color="secondary"
            variant="tonal"
            @click="toggleEditMode"
            :disabled="processingAction"
          >
            Cancel
          </VBtn>

          <VSpacer />

          <VBtn
            color="primary"
            @click="saveVersion"
            :loading="processingAction"
          >
            Save Changes
          </VBtn>
        </template>
        <template v-else>
          <VBtn
            v-if="!isCurrent && hasManagerPermission"
            color="primary"
            variant="tonal"
            @click="setAsCurrent"
            :loading="processingAction"
            prepend-icon="tabler-check"
          >
            Set as Current
          </VBtn>

          <VSpacer />

          <VBtn
            v-if="hasManagerPermission"
            color="primary"
            prepend-icon="tabler-edit"
            @click="toggleEditMode"
          >
            Edit
          </VBtn>
        </template>
      </VCardActions>
    </VCard>

    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="5000"
    >
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
