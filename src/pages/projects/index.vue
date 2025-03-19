<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/useProjectStore'
import { useAuthStore } from '@/stores/useAuthStore'
import ProjectListItem from '@/views/projects/ProjectListItem.vue'
import ProjectCreateDialog from '@/views/projects/ProjectCreateDialog.vue'

const router = useRouter()
const projectStore = useProjectStore()
const authStore = useAuthStore()

const loading = ref(false)
const isCreateDialogOpen = ref(false)
const searchQuery = ref('')
const sortBy = ref('created_at')
const sortOrder = ref('desc')

const isAdmin = computed(() => authStore.is_admin())
const hasManagerPermission = computed(() => authStore.userData.role >= 2)

const filteredProjects = computed(() => {
  if (!projectStore.projects.length) return []

  return projectStore.projects
    .filter(project => {
      if (!searchQuery.value) return true
      const query = searchQuery.value.toLowerCase()
      return (
        project.name.toLowerCase().includes(query) ||
        project.short_description.toLowerCase().includes(query) ||
        project.type_of_application.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      let valA = a[sortBy.value]
      let valB = b[sortBy.value]

      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()

      if (sortOrder.value === 'asc') {
        return valA > valB ? 1 : -1
      } else {
        return valA < valB ? 1 : -1
      }
    })
})

const fetchProjects = async () => {
  loading.value = true
  try {
    await projectStore.fetchProjects()
  } catch (error) {
    console.error('Error fetching projects:', error)
  } finally {
    loading.value = false
  }
}

const handleCreateProject = async (projectData) => {
  isCreateDialogOpen.value = false
  const { data, error } = await projectStore.createProject(projectData)
  if (data && !error) {
    fetchProjects()
  }
}

const handleViewProject = (projectId) => {
  router.push({ name: 'projects-id', params: { id: projectId } })
}

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <VContainer fluid>
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between">
            <h5 class="text-h5">Projects</h5>
            <VBtn
              color="primary"
              @click="isCreateDialogOpen = true"
              prepend-icon="tabler-plus"
            >
              Create Project
            </VBtn>
          </VCardTitle>

          <VCardText>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="searchQuery"
                  label="Search Projects"
                  prepend-inner-icon="tabler-search"
                  clearable
                  hide-details
                />
              </VCol>
              <VCol cols="12" md="3">
                <VSelect
                  v-model="sortBy"
                  label="Sort By"
                  :items="[
                    { title: 'Name', value: 'name' },
                    { title: 'Created Date', value: 'created_at' },
                    { title: 'Status', value: 'status' },
                    { title: 'Type', value: 'type_of_application' },
                  ]"
                  hide-details
                />
              </VCol>
              <VCol cols="12" md="3">
                <VSelect
                  v-model="sortOrder"
                  label="Order"
                  :items="[
                    { title: 'Ascending', value: 'asc' },
                    { title: 'Descending', value: 'desc' },
                  ]"
                  hide-details
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <VRow v-if="loading">
              <VCol cols="12" class="text-center">
                <VProgressCircular indeterminate color="primary" />
              </VCol>
            </VRow>

            <VRow v-else-if="filteredProjects.length === 0">
              <VCol cols="12" class="text-center">
                <p class="text-medium-emphasis">No projects found. Create a new project to get started.</p>
              </VCol>
            </VRow>

            <VRow v-else>
              <VCol
                v-for="project in filteredProjects"
                :key="project.id"
                cols="12" md="6" lg="4"
              >
                <ProjectListItem
                  :project="project"
                  @view="handleViewProject"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <ProjectCreateDialog
      v-model="isCreateDialogOpen"
      @submit="handleCreateProject"
    />
  </VContainer>
</template>
