<script setup>
import { ref, computed } from 'vue'
import { useDevelopmentPlanStore } from '@/stores/useDevelopmentPlanStore'
import { useAuthStore } from '@/stores/useAuthStore'
import PlanVersionDialog from '@/views/projects/PlanVersionDialog.vue'
import PlanVersionCreateDialog from '@/views/projects/PlanVersionCreateDialog.vue'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  developmentPlan: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])

const planStore = useDevelopmentPlanStore()
const authStore = useAuthStore()

const selectedVersion = ref(null)
const versionDialogVisible = ref(false)
const createVersionDialogVisible = ref(false)
const processingAction = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const isAdmin = computed(() => authStore.is_admin())
const hasManagerPermission = computed(() => authStore.userData.role >= 2)

const hasPlan = computed(() => {
  return props.developmentPlan && props.developmentPlan.id
})

const planVersions = computed(() => {
  if (!hasPlan.value || !props.developmentPlan.versions) return []
  return [...props.developmentPlan.versions].sort((a, b) => b.version_number - a.version_number)
})

const currentVersion = computed(() => {
  if (!hasPlan.value) return null
  return planVersions.value.find(v => v.version_number === props.developmentPlan.current_version_number)
})

const formatDate = (dateString) => {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
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

const viewVersionDetails = (version) => {
  selectedVersion.value = version
  versionDialogVisible.value = true
}

const openCreateVersion = () => {
  createVersionDialogVisible.value = true
}

const handleCreateVersion = async (versionData) => {
  processingAction.value = true

  try {
    const { data, error } = await planStore.createPlanVersion(props.developmentPlan.id, versionData)

    if (data && !error) {
      showSnackbar('Plan version created successfully')
      emit('refresh')
    } else {
      showSnackbar('Failed to create plan version', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to create plan version: ' + err.message, 'error')
  } finally {
    processingAction.value = false
    createVersionDialogVisible.value = false
  }
}

const createInitialPlan = async () => {
  processingAction.value = true

  try {
    const { data, error } = await planStore.createDevelopmentPlan(props.projectId)

    if (data && !error) {
      showSnackbar('Development plan created successfully')
      emit('refresh')
    } else {
      showSnackbar('Failed to create development plan', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to create development plan: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
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
</script>

<template>
  <VCardText class="pa-6">
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <div v-else-if="!hasPlan" class="text-center pa-6">
      <VIcon icon="tabler-calendar-time" size="64" color="secondary" class="mb-4" />
      <h4 class="text-h6 mb-2">No Development Plan</h4>
      <p class="text-body-1 text-medium-emphasis mb-6">
        This project does not have a development plan yet.
      </p>

      <VBtn
        v-if="hasManagerPermission"
        color="primary"
        @click="createInitialPlan"
        :loading="processingAction"
      >
        Create Development Plan
      </VBtn>
    </div>

    <div v-else>
      <VRow>
        <VCol cols="12">
          <VCard border class="mb-4">
            <VCardItem>
              <template #prepend>
                <VAvatar
                  color="primary"
                  variant="tonal"
                  rounded
                  size="42"
                >
                  <VIcon icon="tabler-calendar-stats" />
                </VAvatar>
              </template>

              <VCardTitle>Current Development Plan</VCardTitle>

              <template #append>
                <VChip
                  color="primary"
                  size="small"
                  label
                  class="me-2"
                >
                  v{{ developmentPlan.current_version_number }}
                </VChip>

                <VChip
                  :color="developmentPlan.status === 'active' ? 'success' : 'warning'"
                  size="small"
                  label
                >
                  {{ developmentPlan.status }}
                </VChip>
              </template>
            </VCardItem>

            <VDivider />

            <VCardText v-if="currentVersion">
              <VRow>
                <VCol cols="12" md="4">
                  <div class="d-flex flex-column">
                    <div class="text-h6 mb-2">Estimated Cost</div>
                    <div class="text-h4 font-weight-bold">{{ formatCurrency(currentVersion.estimated_cost) }}</div>
                    <div class="text-caption text-medium-emphasis">
                      Last updated: {{ formatDate(currentVersion.created_at) }}
                    </div>
                  </div>
                </VCol>

                <VCol cols="12" md="8">
                  <div class="text-h6 mb-3">Roles & Hours Breakdown</div>

                  <VTable density="compact">
                    <thead>
                    <tr>
                      <th>Role</th>
                      <th class="text-right">Hours</th>
                      <th class="text-right">Cost</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(role, index) in parseRolesAndHours(currentVersion.roles_and_hours)" :key="index">
                      <td>{{ role.role }}</td>
                      <td class="text-right">{{ role.hours }}</td>
                      <td class="text-right">{{ formatCurrency(role.cost) }}</td>
                    </tr>
                    </tbody>
                  </VTable>

                  <VBtn
                    color="primary"
                    variant="tonal"
                    class="mt-4"
                    size="small"
                    @click="viewVersionDetails(currentVersion)"
                  >
                    View Full Details
                  </VBtn>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12">
          <div class="d-flex align-center justify-space-between mb-4">
            <h5 class="text-h5">Version History</h5>

            <VBtn
              v-if="hasManagerPermission"
              color="primary"
              prepend-icon="tabler-plus"
              @click="openCreateVersion"
              :disabled="processingAction"
            >
              New Version
            </VBtn>
          </div>

          <VTable v-if="planVersions.length > 1">
            <thead>
            <tr>
              <th>Version</th>
              <th>Created</th>
              <th>Status</th>
              <th class="text-right">Estimated Cost</th>
              <th class="text-right">Actions</th>
            </tr>
            </thead>
            <tbody>
            <tr
              v-for="version in planVersions"
              :key="version.id"
              :class="{ 'bg-primary-lighten-5': version.version_number === developmentPlan.current_version_number }"
              style="cursor: pointer;"
              @click="viewVersionDetails(version)"
            >
              <td>
                <div class="d-flex align-center">
                  <span class="font-weight-medium">v{{ version.version_number }}</span>
                  <VChip
                    v-if="version.version_number === developmentPlan.current_version_number"
                    color="primary"
                    size="x-small"
                    label
                    class="ms-2"
                  >
                    Current
                  </VChip>
                </div>
              </td>
              <td>{{ formatDate(version.created_at) }}</td>
              <td>
                <VChip
                  :color="version.status === 'active' ? 'success' : 'warning'"
                  size="small"
                  label
                >
                  {{ version.status }}
                </VChip>
              </td>
              <td class="text-right">{{ formatCurrency(version.estimated_cost) }}</td>
              <td class="text-right">
                <VBtn
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  @click.stop="viewVersionDetails(version)"
                >
                  <VIcon icon="tabler-eye" />
                </VBtn>
              </td>
            </tr>
            </tbody>
          </VTable>

          <div v-else-if="planVersions.length === 1" class="text-center pa-4">
            <p class="text-medium-emphasis">
              Only one version available. Create more versions to see the history.
            </p>
          </div>

          <div v-else class="text-center pa-4">
            <p class="text-medium-emphasis">
              No versions available yet.
            </p>
          </div>
        </VCol>
      </VRow>
    </div>

    <PlanVersionDialog
      v-if="selectedVersion"
      v-model="versionDialogVisible"
      :version="selectedVersion"
      :is-current="selectedVersion && developmentPlan && selectedVersion.version_number === developmentPlan.current_version_number"
      :is-admin="isAdmin"
      :has-manager-permission="hasManagerPermission"
      :plan-id="developmentPlan ? developmentPlan.id : null"
      @refresh="emit('refresh')"
    />

    <PlanVersionCreateDialog
      v-model="createVersionDialogVisible"
      :plan-id="developmentPlan ? developmentPlan.id : null"
      :current-version-number="developmentPlan ? developmentPlan.current_version_number : 0"
      @submit="handleCreateVersion"
    />

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
  </VCardText>
</template>
