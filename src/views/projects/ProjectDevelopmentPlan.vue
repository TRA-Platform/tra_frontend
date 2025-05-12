<script setup>
import { ref, computed } from 'vue'
import { useDevelopmentPlanStore } from '@/stores/useDevelopmentPlanStore'
import { useAuthStore } from '@/stores/useAuthStore'
import PlanVersionDialog from '@/views/projects/PlanVersionDialog.vue'
import PlanVersionCreateDialog from '@/views/projects/PlanVersionCreateDialog.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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

  return new Date(parseInt(dateString)).toLocaleDateString('en-US', {
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
      showSnackbar(t('projects.development_plan.notifications.version_created'))
      emit('refresh')
    } else {
      showSnackbar(t('projects.development_plan.notifications.version_create_failed'), 'error')
    }
  } catch (err) {
    showSnackbar(t('projects.development_plan.notifications.version_create_failed') + ': ' + err.message, 'error')
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
      showSnackbar(t('projects.development_plan.notifications.created'))
      emit('refresh')
    } else {
      showSnackbar(t('projects.development_plan.notifications.create_failed'), 'error')
    }
  } catch (err) {
    showSnackbar(t('projects.development_plan.notifications.create_failed') + ': ' + err.message, 'error')
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
      <h4 class="text-h6 mb-2">{{ t('projects.development_plan.empty.title') }}</h4>
      <p class="text-body-1 text-medium-emphasis mb-6">
        {{ t('projects.development_plan.empty.description') }}
      </p>

      <VBtn
        v-if="hasManagerPermission"
        color="primary"
        @click="createInitialPlan"
        :loading="processingAction"
      >
        {{ t('projects.development_plan.actions.create_plan') }}
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

              <VCardTitle>{{ t('projects.development_plan.current_plan') }}</VCardTitle>

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
                  {{ t(`projects.status.${developmentPlan.status}`) }}
                </VChip>
              </template>
            </VCardItem>

            <VDivider />

            <VCardText v-if="currentVersion">
              <VRow>
                <VCol cols="12" md="4">
                  <div class="d-flex flex-column">
                    <div class="text-h6 mb-2">{{ t('projects.development_plan.estimated_cost') }}</div>
                    <div class="text-h4 font-weight-bold">{{ formatCurrency(currentVersion.estimated_cost) }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ t('projects.development_plan.version.created') }}: {{ formatDate(currentVersion.created_at) }}
                    </div>
                  </div>
                </VCol>

                <VCol cols="12" md="8">
                  <div class="text-h6 mb-3">{{ t('projects.development_plan.version.roles_hours_breakdown') }}</div>

                  <VTable density="compact">
                    <thead>
                    <tr>
                      <th>{{ t('projects.development_plan.version.role') }}</th>
                      <th class="text-right">{{ t('projects.development_plan.version.hours') }}</th>
                      <th class="text-right">{{ t('projects.development_plan.version.cost') }}</th>
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
                    {{ t('projects.development_plan.actions.view_details') }}
                  </VBtn>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12">
          <div class="d-flex align-center justify-space-between mb-4">
            <h5 class="text-h5">{{ t('projects.development_plan.version_history') }}</h5>

            <VBtn
              v-if="hasManagerPermission"
              color="primary"
              prepend-icon="tabler-plus"
              @click="openCreateVersion"
              :disabled="processingAction"
            >
              {{ t('projects.development_plan.actions.new_version') }}
            </VBtn>
          </div>

          <VTable v-if="planVersions.length > 1">
            <thead>
            <tr>
              <th>{{ t('projects.development_plan.version.version') }}</th>
              <th>{{ t('projects.development_plan.version.created') }}</th>
              <th>{{ t('projects.details.status') }}</th>
              <th class="text-right">{{ t('projects.development_plan.estimated_cost') }}</th>
              <th class="text-right">{{ t('projects.actions.title') }}</th>
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
                    {{ t('projects.development_plan.version.current') }}
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
                  {{ t(`projects.status.${version.status}`) }}
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
              {{ t('projects.development_plan.version.only_one_version') }}
            </p>
          </div>

          <div v-else class="text-center pa-4">
            <p class="text-medium-emphasis">
              {{ t('projects.development_plan.version.no_versions') }}
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
