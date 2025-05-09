<script setup>
import {onMounted, ref, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useProjectStore} from '@/stores/useProjectStore'
import {useUserStoryStore} from '@/stores/useUserStoryStore'
import {useUmlDiagramStore} from '@/stores/useUmlDiagramStore'
import {useAuthStore} from '@/stores/useAuthStore'
import ProjectCreateDialog from '@/views/projects/ProjectCreateDialog.vue'
import ProjectDetailsInfo from '@/views/projects/ProjectDetailsInfo.vue'
import ProjectRequirementsList from '@/views/projects/ProjectRequirementsList.vue'
import ProjectMockupsList from '@/views/projects/ProjectMockupsList.vue'
import ProjectDevelopmentPlan from '@/views/projects/ProjectDevelopmentPlan.vue'
import UserStoriesList from '@/views/projects/UserStoriesList.vue'
import UmlDiagramList from '@/views/projects/UmlDiagramList.vue'
import ProjectExportsList from '@/views/projects/ProjectExportsList.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const userStoryStore = useUserStoryStore()
const umlDiagramStore = useUmlDiagramStore()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref(null)
const activeTab = ref("0")
const isEditDialogOpen = ref(false)
const confirmDeleteDialog = ref(false)
const processingAction = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const projectId = computed(() => route.params.id)
const project = computed(() => projectStore.currentProject)
const isAdmin = computed(() => authStore.is_admin())
const hasManagerPermission = computed(() => authStore.userData.role >= 2)
const hasModeratorPermission = computed(() => authStore.userData.role >= 3)

const selectedRequirement = ref(null)

const exportMenu = ref(false)

const exportFormats = [
  {title: 'Markdown', value: 'md', icon: 'tabler-markdown'},
  {title: 'PDF', value: 'pdf', icon: 'tabler-file-text'},
  {title: 'HTML', value: 'html', icon: 'tabler-code'}
]

const fetchProjectDetails = async () => {
  loading.value = true
  error.value = null

  try {
    const {data, error: apiError} = await projectStore.fetchProjectById(projectId.value)

    if (apiError) {
      error.value = apiError
      showSnackbar('Failed to load project details', 'error')
    }
  } catch (err) {
    error.value = err.message || 'Failed to load project details'
    showSnackbar('Failed to load project details', 'error')
  } finally {
    loading.value = false
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

const handleEditProject = () => {
  isEditDialogOpen.value = true
}

const handleDeleteProject = async (deleting = false) => {
  if (!deleting) return
  confirmDeleteDialog.value = false
  processingAction.value = true

  try {
    const {success, error} = await projectStore.deleteProject(projectId.value)

    if (success && !error) {
      showSnackbar('Project deleted successfully')
      router.push({name: 'projects'})
    } else {
      showSnackbar('Failed to delete project', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to delete project: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleUpdateProject = async (updatedData) => {
  processingAction.value = true

  try {
    const {data, error} = await projectStore.updateProject(projectId.value, updatedData)

    if (data && !error) {
      showSnackbar('Project updated successfully')
    } else {
      showSnackbar('Failed to update project', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to update project: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}
const delayedFetchProjectDetails = async () => {
  setTimeout(() => {
    fetchProjectDetails()
  }, 9000)
}

const handleGenerateRequirements = async () => {
  processingAction.value = true

  try {
    const {data, error} = await projectStore.generateRequirements(projectId.value)

    if (data && !error) {
      showSnackbar('Requirements generation started successfully')
      delayedFetchProjectDetails()
    } else {
      showSnackbar('Failed to start requirements generation', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to start requirements generation: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleExportSrs = async (format = 'md') => {
  processingAction.value = true

  try {
    const {data, error} = await projectStore.exportSrs(projectId.value, format)

    if (data && !error) {
      showSnackbar('SRS export started successfully')
      activeTab.value = "6"
      delayedFetchProjectDetails()
    } else {
      showSnackbar('Failed to start SRS export', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to start SRS export: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleGeneratePlan = async () => {
  processingAction.value = true

  try {
    const {data, error} = await projectStore.generatePlan(projectId.value)

    if (data && !error) {
      showSnackbar('Development plan generation started successfully')
      delayedFetchProjectDetails()
    } else {
      showSnackbar('Failed to start development plan generation', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to start development plan generation: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleGenerateMockups = async () => {
  processingAction.value = true

  try {
    const {data, error} = await projectStore.generateMockups(projectId.value)

    if (data && !error) {
      showSnackbar('Mockups generation started successfully')
      delayedFetchProjectDetails()
    } else {
      showSnackbar('Failed to start mockups generation', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to start mockups generation: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleGenerateUserStories = async (requirementId = null) => {
  processingAction.value = true

  try {
    let response;
    if (requirementId) {
      const {data, error} = await projectStore.generateUserStories(projectId.value, requirementId)
      response = {data, error};
    } else {
      const {data, error} = await projectStore.generateUserStories(projectId.value)
      response = {data, error};
    }

    if (response.data && !response.error) {
      showSnackbar('User stories generation started successfully')
      delayedFetchProjectDetails()
    } else {
      showSnackbar('Failed to start user stories generation', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to start user stories generation: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const handleGenerateUmlDiagrams = async (diagramType = null) => {
  processingAction.value = true

  try {
    const {data, error} = await umlDiagramStore.generateDiagrams(
      projectId.value,
      diagramType
    )

    if (data && !error) {
      showSnackbar(`UML diagram generation started successfully`)
      delayedFetchProjectDetails()
    } else {
      showSnackbar('Failed to start UML diagram generation', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to start UML diagram generation: ' + err.message, 'error')
  } finally {
    processingAction.value = false
  }
}

const showRequirementUserStories = (requirement) => {
  selectedRequirement.value = requirement
  activeTab.value = "2"
}

onMounted(() => {
  fetchProjectDetails()
})
</script>

<template>
  <VContainer fluid>
    <VRow v-if="loading && !project">
      <VCol cols="12" class="d-flex justify-center align-center" style="min-height: 400px">
        <VProgressCircular indeterminate color="primary" size="64"/>
      </VCol>
    </VRow>

    <VRow v-else-if="error && !project">
      <VCol cols="12">
        <VAlert color="error" variant="tonal" title="Error Loading Project"
                text="There was an error loading the project details" class="mb-4"/>
        <div class="text-center">
          <VBtn color="primary" @click="fetchProjectDetails">
            Retry
          </VBtn>
          <VBtn color="secondary" variant="outlined" class="ms-2" :to="{ name: 'projects' }">
            Back to Projects
          </VBtn>
        </div>
      </VCol>
    </VRow>

    <template v-else-if="project">
      <VRow>
        <VCol cols="12">
          <div class="d-flex flex-wrap justify-space-between align-center">
            <div class="d-flex align-center">
              <VBtn icon variant="text" class="me-3" :to="{ name: 'projects' }">
                <VIcon icon="tabler-arrow-left"/>
              </VBtn>
              <h3 class="text-h3">{{ project.name }}</h3>
            </div>

            <div class="d-flex align-center mt-3 mt-sm-0">
              <VBtn color="info" variant="tonal" prepend-icon="tabler-refresh" class="me-2" @click="fetchProjectDetails"
                    :loading="processingAction">
                Refresh
              </VBtn>
              <VMenu v-if="hasModeratorPermission" v-model="exportMenu" location="top" :loading="processingAction">
                <template #activator="{ props }">

                  <VBtn v-bind="props" color="secondary" variant="outlined" prepend-icon="tabler-file-export"
                        class="me-2">
                    Export SRS
                  </VBtn>
                </template>
                <VList>
                  <VListItem
                    v-for="format in exportFormats"
                    :key="format.value"
                    :value="format.value"
                    @click="handleExportSrs(format.value); exportMenu = false"
                  >
                    <template #prepend>
                      <VIcon :icon="format.icon"/>
                    </template>
                    <VListItemTitle>{{ format.title }}</VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>

              <VBtn v-if="hasManagerPermission" color="primary" prepend-icon="tabler-edit" class="me-2"
                    @click="handleEditProject" :loading="processingAction">
                Edit
              </VBtn>

              <VBtn v-if="isAdmin" color="error" variant="tonal" prepend-icon="tabler-trash"
                    @click="confirmDeleteDialog = true" :loading="processingAction">
                Delete
              </VBtn>
            </div>
          </div>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12">
          <VCard>
            <VTabs v-model="activeTab" bg-color="primary" grow slider-color="white">
              <VTab value="0" color="white">
                <VIcon size="18" icon="tabler-info-circle" start/>
                Overview
              </VTab>

              <VTab value="1" color="white">
                <VIcon size="18" icon="tabler-list" start/>
                Requirements
                <VChip v-if="project.requirements?.length" size="x-small" color="white" class="ms-2">
                  {{ project.requirements.length }}
                </VChip>
              </VTab>

              <VTab value="2" color="white">
                <VIcon size="18" icon="tabler-user-check" start/>
                User Stories
                <VChip v-if="project.user_stories?.length" size="x-small" color="white" class="ms-2">
                  {{ project.user_stories?.length || 0 }}
                </VChip>
              </VTab>

              <VTab value="3" color="white">
                <VIcon size="18" icon="tabler-layout-kanban" start/>
                Mockups
                <VChip v-if="project.mockups?.length" size="x-small" color="white" class="ms-2">
                  {{ project.mockups.length }}
                </VChip>
              </VTab>

              <VTab value="4" color="white">
                <VIcon size="18" icon="tabler-chart-dots" start/>
                UML Diagrams
                <VChip v-if="project.uml_diagrams?.length" size="x-small" color="white" class="ms-2">
                  {{ project.uml_diagrams?.length || 0 }}
                </VChip>
              </VTab>

              <VTab value="5" color="white">
                <VIcon size="18" icon="tabler-chart-dots" start/>
                Development Plan
              </VTab>

              <VTab value="6" color="white">
                <VIcon size="18" icon="tabler-file-export" start/>
                Exports
                <VChip v-if="project.srs_exports?.length" size="x-small" color="white" class="ms-2">
                  {{ project.srs_exports?.length || 0 }}
                </VChip>
              </VTab>
            </VTabs>

            <VDivider/>

            <VWindow v-model="activeTab">
              <VWindowItem value="0">
                <ProjectDetailsInfo :project="project" :loading="loading"/>
              </VWindowItem>

              <VWindowItem value="1">
                <VCardActions class="pt-3 px-6">
                  <VSpacer/>
                  <VBtn v-if="hasModeratorPermission" color="primary" prepend-icon="tabler-refresh"
                        @click="handleGenerateRequirements" :loading="processingAction">
                    Generate Requirements
                  </VBtn>
                </VCardActions>

                <ProjectRequirementsList :project-id="projectId" :requirements="project.requirements || []"
                                         :loading="loading" @refresh="fetchProjectDetails"
                                         @view-user-stories="showRequirementUserStories"/>
              </VWindowItem>

              <VWindowItem value="2">
                <VCardActions class="pt-3 px-6">
                  <VBtn v-if="selectedRequirement" color="secondary" variant="tonal" prepend-icon="tabler-arrow-left"
                        @click="selectedRequirement = null">
                    Back to All User Stories
                  </VBtn>
                  <VSpacer/>
                  <VBtn v-if="hasModeratorPermission" color="primary" prepend-icon="tabler-refresh"
                        @click="handleGenerateUserStories(selectedRequirement ? selectedRequirement.id : null)"
                        :loading="processingAction">
                    {{
                      selectedRequirement ? 'Generate User Stories for this Requirement' : 'Generate All User Stories'
                    }}
                  </VBtn>
                </VCardActions>

                <UserStoriesList :project-id="projectId"
                                 :requirement-id="selectedRequirement ? selectedRequirement.id : null" :user-stories="selectedRequirement ?
                    (project.requirements?.find(r => r.id === selectedRequirement.id)?.user_stories || []) :
                    (project.user_stories || [])" :loading="loading" @refresh="fetchProjectDetails"/>
              </VWindowItem>

              <VWindowItem value="3">
                <VCardActions class="pt-3 px-6">
                  <VSpacer/>
                  <VBtn v-if="hasModeratorPermission" color="primary" prepend-icon="tabler-refresh"
                        @click="handleGenerateMockups" :loading="processingAction">
                    Generate Mockups
                  </VBtn>
                </VCardActions>

                <ProjectMockupsList :project-id="projectId" :mockups="project.mockups || []" :loading="loading"
                                    @refresh="fetchProjectDetails"/>
              </VWindowItem>

              <VWindowItem value="4">
                <VCardActions class="pt-3 px-6">
                  <VSpacer/>
                  <VBtn v-if="hasModeratorPermission" color="primary" prepend-icon="tabler-refresh"
                        @click="handleGenerateUmlDiagrams(null)" :loading="processingAction">
                    Generate UML Diagrams
                  </VBtn>
                </VCardActions>

                <UmlDiagramList :project-id="projectId" :diagrams="project.uml_diagrams || []" :loading="loading"
                                @refresh="fetchProjectDetails"/>
              </VWindowItem>

              <VWindowItem value="5">
                <VCardActions class="pt-3 px-6">
                  <VSpacer/>
                  <VBtn v-if="hasManagerPermission" color="primary" prepend-icon="tabler-refresh"
                        @click="handleGeneratePlan" :loading="processingAction">
                    Generate Development Plan
                  </VBtn>
                </VCardActions>

                <ProjectDevelopmentPlan :project-id="projectId" :development-plan="project.development_plan"
                                        :loading="loading" @refresh="fetchProjectDetails"/>
              </VWindowItem>

              <VWindowItem value="6">
                <ProjectExportsList :project-id="projectId" :exports="project.srs_exports || []" :loading="loading"
                                    @refresh="fetchProjectDetails"/>
              </VWindowItem>
            </VWindow>
          </VCard>
        </VCol>
      </VRow>
    </template>
    <ProjectCreateDialog v-if="project" v-model="isEditDialogOpen" edit-mode :project-data="project"
                         @submit="handleUpdateProject"/>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog v-model:isDialogVisible="confirmDeleteDialog"
                   confirmationMsg="Are you sure you want to delete this project? This action cannot be undone."
                   @confirm="handleDeleteProject"/>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="5000">
      {{ snackbar.text }}
      <template #actions>
        <IconBtn @click="snackbar.show = false">
          <VIcon icon="tabler-x"/>
        </IconBtn>
      </template>
    </VSnackbar>
  </VContainer>
</template>

<route lang="yaml">
meta:
layoutWrapperClasses: 'layout-content-width-boxed'
pageTitle: 'Project Details'
</route>
