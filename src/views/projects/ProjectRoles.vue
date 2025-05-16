<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectRoleStore } from '@/stores/useProjectRoleStore'
import { useAuthStore } from '@/stores/useAuthStore'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['updated'])

const { t } = useI18n()
const projectRoleStore = useProjectRoleStore()
const authStore = useAuthStore()

const roles = computed(() => projectRoleStore.projectRoles[props.projectId] || [])
const loading = ref(false)
const isCurrentAction = ref(false)
const addRoleDialog = ref(false)
const editRoleDialog = ref(false)
const deleteRoleDialog = ref(false)
const newRole = ref({ user_email: '', role: '' })
const editedRole = ref({ id: null, username: '', role: '' })
const selectedRole = ref(null)

const loggedInUsername = computed(() => authStore.userData.username)

const canManageRoles = ref(false)

const roleOptions = [
  { text: t('projects.roles.role_types.owner'), value: 'OWNER' },
  { text: t('projects.roles.role_types.admin'), value: 'ADMIN' },
  { text: t('projects.roles.role_types.manager'), value: 'MANAGER' },
  { text: t('projects.roles.role_types.member'), value: 'MEMBER' },
  { text: t('projects.roles.role_types.viewer'), value: 'VIEWER' }
]

const getRoleColor = (role) => {
  const colors = {
    'OWNER': 'purple',
    'ADMIN': 'red',
    'MANAGER': 'orange',
    'MEMBER': 'blue',
    'VIEWER': 'green'
  }
  return colors[role] || 'grey'
}

const openAddRoleDialog = () => {
  newRole.value = { user_email: '', role: 'VIEWER' }
  addRoleDialog.value = true
}

const openEditRoleDialog = (role) => {
  editedRole.value = {
    id: role.id,
    username: role.username,
    role: role.role
  }
  editRoleDialog.value = true
}

const openDeleteDialog = (role) => {
  selectedRole.value = role
  deleteRoleDialog.value = true
}

const snackbar = ref({
  show: false,
  text: '',
  color: 'error'
})

const showError = (error) => {
  let errorMessage = 'An unexpected error occurred'

  if (typeof error === 'string') {
    errorMessage = error
  } else if (error && error.detail) {
    errorMessage = error.detail
  } else if (error && error.user_email) {
    errorMessage = `Email error: ${error.user_email}`
  } else if (error && error.user) {
    errorMessage = `User error: ${error.user}`
  } else if (error && error.role) {
    errorMessage = `Role error: ${error.role}`
  } else if (error && error.non_field_errors) {
    errorMessage = error.non_field_errors[0]
  } else if (error && typeof error === 'object') {
    const firstErrorField = Object.keys(error)[0]
    if (firstErrorField && error[firstErrorField]) {
      const fieldError = Array.isArray(error[firstErrorField])
        ? error[firstErrorField][0]
        : error[firstErrorField]
      errorMessage = `${firstErrorField}: ${fieldError}`
    }
  }

  snackbar.value = {
    show: true,
    text: errorMessage,
    color: 'error'
  }
}

const showSnackbar = (text, color = 'error') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

const addRole = async () => {
  if (!newRole.value.user_email || !newRole.value.role) return

  isCurrentAction.value = true
  try {
    const { data, error } = await projectRoleStore.addProjectRole(props.projectId, newRole.value)

    if (data && !error) {
      showSnackbar(t('projects.roles.notifications.role_added'), 'success')
      setTimeout(() => {
        addRoleDialog.value = false
        emit('updated')
        authStore.clearProjectRoleCache(props.projectId)
      }, 1000)
    } else if (error) {
      showError(error)
    }
  } catch (err) {
    showError(err.message || 'Failed to add member')
  } finally {
    isCurrentAction.value = false
  }
}

const updateRole = async () => {
  if (!editedRole.value.id || !editedRole.value.role) return

  isCurrentAction.value = true
  try {
    const { data, error } = await projectRoleStore.updateProjectRole(
      props.projectId,
      editedRole.value.id,
      { role: editedRole.value.role }
    )

    if (data && !error) {
      showSnackbar(t('projects.roles.notifications.role_updated'), 'success')
      setTimeout(() => {
        editRoleDialog.value = false
        emit('updated')
        authStore.clearProjectRoleCache(props.projectId)
      }, 1000)
    } else if (error) {
      showError(error)
    }
  } catch (err) {
    showError(err.message || 'Failed to update role')
  } finally {
    isCurrentAction.value = false
  }
}

const deleteRole = async () => {
  if (!selectedRole.value?.id) return

  isCurrentAction.value = true
  try {
    const { success, error } = await projectRoleStore.deleteProjectRole(props.projectId, selectedRole.value.id)

    if (success && !error) {
      deleteRoleDialog.value = false
      selectedRole.value = null
      emit('updated')
      authStore.clearProjectRoleCache(props.projectId)
    } else if (error) {
      showError(error)
    }
  } catch (err) {
    showError(err.message || 'Failed to remove member')
  } finally {
    isCurrentAction.value = false
  }
}

const fetchRoles = async () => {
  loading.value = true
  try {
    const { data, error } = await projectRoleStore.fetchProjectRoles(props.projectId)
    if (error) {
      showError(error)
    }
  } catch (err) {
    showError(err.message || 'Failed to fetch project members')
  } finally {
    loading.value = false
  }
}

const checkPermissions = async () => {
  canManageRoles.value = await authStore.hasProjectRoleAtLeast(props.projectId, 'MANAGER')
}

watch(() => props.projectId, () => {
  if (props.projectId) {
    fetchRoles()
    checkPermissions()
  }
}, { immediate: true })

onMounted(async () => {
  if (props.projectId) {
    await fetchRoles()
    await checkPermissions()
  }
})
</script>

<template>
  <VCard>
    <VCardTitle class="d-flex justify-space-between align-center">
      {{ $t('projects.roles.title') }}
      <VBtn v-if="canManageRoles" color="primary" size="small" @click="openAddRoleDialog">
        <VIcon size="18" start icon="tabler-plus" />
        {{ $t('projects.roles.add_member') }}
      </VBtn>
    </VCardTitle>

    <VCardText>
      <VTable v-if="roles && roles.length > 0">
        <thead>
          <tr>
            <th>{{ $t('projects.roles.user') }}</th>
            <th>{{ $t('projects.roles.email') }}</th>
            <th>{{ $t('projects.roles.role') }}</th>
            <th v-if="canManageRoles">{{ $t('projects.roles.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in roles" :key="role.id">
            <td>{{ role.first_name }} {{ role.last_name }}</td>
            <td>{{ role.email }}</td>
            <td>
              <VChip v-if="canManageRoles && role.username !== loggedInUsername" :color="getRoleColor(role.role)"
                @click="openEditRoleDialog(role)" class="font-weight-medium cursor-pointer">
                {{ $t(`projects.roles.role_types.${role.role.toLowerCase()}`) }}
              </VChip>
              <VChip v-else :color="getRoleColor(role.role)" class="font-weight-medium">
                {{ $t(`projects.roles.role_types.${role.role.toLowerCase()}`) }}
              </VChip>
            </td>
            <td v-if="canManageRoles">
              <div class="d-flex gap-2">
                <VBtn v-if="role.username !== loggedInUsername && role.role !== 'OWNER'" density="compact" icon
                  variant="text" :disabled="isCurrentAction" @click="openDeleteDialog(role)">
                  <VIcon icon="tabler-trash" size="20" color="error" />
                </VBtn>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>

      <VAlert v-else-if="!loading" type="info" variant="tonal">
        {{ $t('projects.roles.no_members') }}
      </VAlert>

      <VProgressLinear v-if="loading" indeterminate />
    </VCardText>
    <VDialog v-model="addRoleDialog" max-width="600px">
      <VCard>
        <VCardTitle>{{ $t('projects.roles.add_member') }}</VCardTitle>
        <VCardText>
          <VForm ref="addRoleForm" @submit.prevent="addRole">
            <VRow>
              <VCol cols="12">
                <VTextField v-model="newRole.user_email" :label="$t('projects.roles.email')"
                  :rules="[v => !!v || $t('validation.required'), v => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || $t('validation.email')]"
                  required />
              </VCol>
              <VCol cols="12">
                <VSelect v-model="newRole.role" :items="roleOptions" item-title="text" item-value="value"
                  :label="$t('projects.roles.role')" :rules="[v => !!v || $t('validation.required')]" required />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="error" text @click="addRoleDialog = false">
            {{ $t('projects.actions.cancel') }}
          </VBtn>
          <VBtn color="primary" :loading="isCurrentAction" :disabled="!newRole.user_email || !newRole.role"
            @click="addRole">
            {{ $t('projects.actions.add') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
    <VDialog v-model="editRoleDialog" max-width="600px">
      <VCard>
        <VCardTitle>{{ $t('projects.roles.edit_role') }}</VCardTitle>
        <VCardText>
          <VForm ref="editRoleForm" @submit.prevent="updateRole">
            <VRow>
              <VCol cols="12">
                <VTextField v-model="editedRole.username" :label="$t('projects.roles.user')" disabled />
              </VCol>
              <VCol cols="12">
                <VSelect v-model="editedRole.role" :items="roleOptions" item-title="text" item-value="value"
                  :label="$t('projects.roles.role')" :rules="[v => !!v || $t('validation.required')]" required />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="error" text @click="editRoleDialog = false">
            {{ $t('projects.actions.cancel') }}
          </VBtn>
          <VBtn color="primary" :loading="isCurrentAction" :disabled="!editedRole.role" @click="updateRole">
            {{ $t('projects.actions.save') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
    <VDialog v-model="deleteRoleDialog" max-width="400px">
      <VCard>
        <VCardTitle>{{ $t('projects.roles.delete_role') }}</VCardTitle>
        <VCardText>
          {{ $t('projects.roles.delete_confirmation', {
            user: `${selectedRole?.first_name} ${selectedRole?.last_name}`
          }) }}
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="grey" text @click="deleteRoleDialog = false">
            {{ $t('projects.actions.cancel') }}
          </VBtn>
          <VBtn color="error" :loading="isCurrentAction" @click="deleteRole">
            {{ $t('projects.actions.delete') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="5000">
      {{ snackbar.text }}
      <template #actions>
        <VBtn icon @click="snackbar.show = false">
          <VIcon icon="tabler-x" />
        </VBtn>
      </template>
    </VSnackbar>
  </VCard>
</template>
