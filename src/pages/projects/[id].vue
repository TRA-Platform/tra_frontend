<script setup>
import {onMounted, ref, computed, onBeforeUnmount} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
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
import ProjectRoles from '@/views/projects/ProjectRoles.vue'
import mitt from 'mitt'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const userStoryStore = useUserStoryStore()
const umlDiagramStore = useUmlDiagramStore()
const authStore = useAuthStore()
const {t} = useI18n()

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
const isProjectOwner = ref(false)
const canEditProject = ref(false)
const canDeleteProject = ref(false)
const canManageProject = ref(false)

const selectedRequirement = ref(null)

const exportMenu = ref(false)

const exportFormats = [
  {title: 'Markdown', value: 'md', icon: 'tabler-markdown'},
  {title: 'PDF', value: 'pdf', icon: 'tabler-file-text'},
  {title: 'HTML', value: 'html', icon: 'tabler-code'}
]

const eventBus = mitt()
const refreshInterval = ref(null)

const tabs = computed(() => [
  {title: t('projects.tabs.info'), icon: 'tabler-info-circle', value: "0"},
  {title: t('projects.tabs.requirements'), icon: 'tabler-list-check', value: "1"},
  {title: t('projects.tabs.user_stories'), icon: 'tabler-user-check', value: "2"},
  {title: t('projects.tabs.mockups'), icon: 'tabler-photo', value: "3"},
  {title: t('projects.tabs.uml_diagrams'), icon: 'tabler-chart-dots', value: "4"},
  {title: t('projects.tabs.development_plan'), icon: 'tabler-chart-bar', value: "5"},
  {title: t('projects.tabs.exports'), icon: 'tabler-file-export', value: "6"},
  {title: t('projects.tabs.roles'), icon: 'tabler-users', value: "7"}
])

const fetchProjectDetails = async () => {
  if (!project.value)
    loading.value = true
  error.value = null

  try {
    const {data, error: apiError} = await projectStore.fetchProjectById(projectId.value)

    if (apiError) {
      error.value = apiError
      showSnackbar('projects.errors.loading_failed')
    }
  } catch (err) {
    error.value = err.message || 'Failed to load project details'
    showSnackbar('projects.errors.loading_failed')
  } finally {
    loading.value = false
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text: t(text),
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
      showSnackbar('projects.notifications.deleted')
      router.push({name: 'projects'})
    } else {
      showSnackbar('projects.notifications.error')
    }
  } catch (err) {
    showSnackbar('projects.errors.delete_failed', 'error')
  } finally {
    processingAction.value = false
  }
}

const handleUpdateProject = async (updatedData) => {
  processingAction.value = true

  try {
    const {data, error} = await projectStore.updateProject(projectId.value, updatedData)

    if (data && !error) {
      showSnackbar('projects.notifications.updated')
    } else {
      showSnackbar('projects.notifications.error')
    }
  } catch (err) {
    showSnackbar('projects.errors.update_failed', 'error')
  } finally {
    processingAction.value = false
  }
}

const handleGenerateRequirements = async () => {
  processingAction.value = true

  try {
    const {data, error} = await projectStore.generateRequirements(projectId.value)

    if (data && !error) {
      showSnackbar('projects.notifications.requirements_generation_started')
    } else {
      showSnackbar('projects.notifications.requirements_generation_failed', 'error')
    }
  } catch (err) {
    showSnackbar('projects.notifications.requirements_generation_failed', 'error')
  } finally {
    processingAction.value = false
  }
}

const handleExportSrs = async (format = 'md') => {
  processingAction.value = true

  try {
    const {data, error} = await projectStore.exportSrs(projectId.value, format)

    if (data && !error) {
      showSnackbar('projects.notifications.srs_export_started')
      activeTab.value = "6"
    } else {
      showSnackbar('projects.notifications.srs_export_failed', 'error')
    }
  } catch (err) {
    showSnackbar('projects.notifications.srs_export_failed', 'error')
  } finally {
    processingAction.value = false
  }
}

const handleGeneratePlan = async () => {
  processingAction.value = true

  try {
    const {data, error} = await projectStore.generatePlan(projectId.value)

    if (data && !error) {
      showSnackbar('projects.notifications.plan_generation_started')
    } else {
      showSnackbar('projects.notifications.plan_generation_failed', 'error')
    }
  } catch (err) {
    showSnackbar('projects.notifications.plan_generation_failed', 'error')
  } finally {
    processingAction.value = false
  }
}

const handleGenerateMockups = async () => {
  processingAction.value = true

  try {
    const {data, error} = await projectStore.generateMockups(projectId.value)

    if (data && !error) {
      showSnackbar('projects.notifications.mockups_generation_started')
    } else {
      showSnackbar('projects.notifications.mockups_generation_failed', 'error')
    }
  } catch (err) {
    showSnackbar('projects.notifications.mockups_generation_failed', 'error')
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
      showSnackbar('projects.notifications.user_stories_generation_started')
    } else {
      showSnackbar('projects.notifications.user_stories_generation_failed', 'error')
    }
  } catch (err) {
    showSnackbar('projects.notifications.user_stories_generation_failed', 'error')
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
      showSnackbar('projects.notifications.uml_diagrams_generation_started')
    } else {
      showSnackbar('projects.notifications.uml_diagrams_generation_failed', 'error')
    }
  } catch (err) {
    showSnackbar('projects.notifications.uml_diagrams_generation_failed', 'error')
  } finally {
    processingAction.value = false
  }
}

const showRequirementUserStories = (requirement) => {
  selectedRequirement.value = requirement
  activeTab.value = "2"
}

const checkPermissions = async () => {
  isProjectOwner.value = await authStore.hasProjectRole(projectId.value, ['OWNER'])
  canEditProject.value = await authStore.hasProjectRoleAtLeast(projectId.value, 'MANAGER')
  canDeleteProject.value = await authStore.hasProjectRoleAtLeast(projectId.value, 'ADMIN')
  canManageProject.value = await authStore.hasProjectRoleAtLeast(projectId.value, 'MEMBER')
}

onMounted(async () => {
  await fetchProjectDetails()
  refreshInterval.value = setInterval(() => {
    eventBus.emit('project-refresh')
    fetchProjectDetails()
  }, 8000)

  await checkPermissions()
})

onBeforeUnmount(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
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
        <VAlert color="error" variant="tonal" :title="t('projects.errors.loading_failed')"
                :text="t('projects.errors.loading_failed')" class="mb-4"/>
        <div class="text-center">
          <VBtn color="primary" @click="fetchProjectDetails">
            {{ $t('projects.actions.retry') }}
          </VBtn>
          <VBtn color="secondary" variant="outlined" class="ms-2" :to="{ name: 'projects' }">
            {{ $t('projects.actions.back_to_projects') }}
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
            <VSpacer/>
            <VRow class="d-flex align-center mt-3 mt-sm-0">
              <VCol
                cols="6"
                sm="3"
              >
                <VBtn color="info" variant="tonal" prepend-icon="tabler-refresh" class="w-100 me-2"
                      @click="fetchProjectDetails"
                      :loading="processingAction">
                  {{ $t('projects.actions.refresh') }}
                </VBtn>
              </VCol>
              <VCol
                v-if="canManageProject"
                cols="6"
                sm="3"
              >
                <VMenu
                  class="w-100" v-model="exportMenu" location="top" :loading="processingAction">
                  <template #activator="{ props }">

                    <VBtn v-bind="props" color="secondary" variant="outlined" prepend-icon="tabler-file-export"
                          class="me-2 w-100">
                      {{ $t('projects.actions.export_srs') }}
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

              </VCol>
              <VCol v-if="canEditProject"
                    cols="6"
                sm="3"
              >
                <VBtn color="primary" prepend-icon="tabler-edit" class="me-2 w-100"
                      @click="handleEditProject" :loading="processingAction">
                  {{ $t('projects.actions.edit') }}
                </VBtn>

              </VCol>
              <VCol
                v-if="canDeleteProject"
                cols="6"
                sm="3"
              >
                <VBtn
                  class="w-100"
                  color="error" variant="tonal" prepend-icon="tabler-trash"
                      @click="confirmDeleteDialog = true" :loading="processingAction">
                  {{ $t('projects.actions.delete') }}
                </VBtn>
              </VCol>
              </VRow>
          </div>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12">
          <VCard>
            <VTabs v-model="activeTab" bg-color="primary" grow slider-color="white">
              <VTab value="0" color="white">
                <VIcon size="18" icon="tabler-info-circle" start/>
                {{ $t('projects.tabs.overview') }}
              </VTab>

              <VTab value="1" color="white">
                <VIcon size="18" icon="tabler-list" start/>
                {{ $t('projects.tabs.requirements') }}
                <VChip v-if="project.requirements?.length" size="x-small" color="white" class="ms-2">
                  {{ project.requirements.length }}
                </VChip>
              </VTab>

              <VTab value="2" color="white">
                <VIcon size="18" icon="tabler-user-check" start/>
                {{ $t('projects.tabs.user_stories') }}
                <VChip v-if="project.user_stories?.length" size="x-small" color="white" class="ms-2">
                  {{ project.user_stories?.length || 0 }}
                </VChip>
              </VTab>

              <VTab value="3" color="white">
                <VIcon size="18" icon="tabler-layout-kanban" start/>
                {{ $t('projects.tabs.mockups') }}
                <VChip v-if="project.mockups?.length" size="x-small" color="white" class="ms-2">
                  {{ project.mockups.length }}
                </VChip>
              </VTab>

              <VTab value="4" color="white">
                <VIcon size="18" icon="tabler-chart-dots" start/>
                {{ $t('projects.tabs.uml_diagrams') }}
                <VChip v-if="project.uml_diagrams?.length" size="x-small" color="white" class="ms-2">
                  {{ project.uml_diagrams?.length || 0 }}
                </VChip>
              </VTab>

              <VTab value="5" color="white">
                <VIcon size="18" icon="tabler-chart-dots" start/>
                {{ $t('projects.tabs.development_plan') }}
              </VTab>

              <VTab value="6" color="white">
                <VIcon size="18" icon="tabler-file-export" start/>
                {{ $t('projects.tabs.exports') }}
                <VChip v-if="project.srs_exports?.length" size="x-small" color="white" class="ms-2">
                  {{ project.srs_exports?.length || 0 }}
                </VChip>
              </VTab>

              <VTab value="7" color="white">
                <VIcon size="18" icon="tabler-users" start/>
                {{ $t('projects.tabs.roles') }}
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
                  <VBtn v-if="canManageProject" color="primary" prepend-icon="tabler-refresh"
                        @click="handleGenerateRequirements" :loading="processingAction">
                    {{ t('projects.requirements.actions.generate') }}
                  </VBtn>
                </VCardActions>

                <ProjectRequirementsList
                  :project-id="project.id"
                  :requirements="project.requirements || []"
                  :can-manage="canManageProject" @selected="selectedRequirement = $event"
                  @view-user-stories="showRequirementUserStories"/>
              </VWindowItem>

              <VWindowItem value="2">
                <VCardActions class="pt-3 px-6">
                  <VBtn v-if="selectedRequirement" color="secondary" variant="tonal" prepend-icon="tabler-arrow-left"
                        @click="selectedRequirement = null">
                    {{ $t('projects.actions.back_to_all_user_stories') }}
                  </VBtn>
                  <VSpacer/>
                  <VBtn v-if="canManageProject" color="primary" prepend-icon="tabler-refresh"
                        @click="handleGenerateUserStories(selectedRequirement ? selectedRequirement.id : null)"
                        :loading="processingAction">
                    {{
                      $t(selectedRequirement ? 'projects.actions.generate_user_stories_for_requirement' : 'projects.actions.generate_all_user_stories')
                    }}
                  </VBtn>
                </VCardActions>

                <UserStoriesList :project-id="project.id"
                                 :requirement-id="selectedRequirement ? selectedRequirement.id : null"
                                 :user-stories="selectedRequirement ?
                    (project.requirements?.find(r => r.id === selectedRequirement.id)?.user_stories || []) :
                    (project.user_stories || [])"
                                 :can-manage="canManageProject"/>
              </VWindowItem>

              <VWindowItem value="3">
                <VCardActions class="pt-3 px-6">
                  <VSpacer/>
                  <VBtn v-if="canManageProject" color="primary" prepend-icon="tabler-refresh"
                        @click="handleGenerateMockups" :loading="processingAction">
                    {{ t('projects.mockups.actions.generate') }}
                  </VBtn>
                </VCardActions>

                <ProjectMockupsList
                  :project-id="project.id"
                  :can-manage="canManageProject"
                  :mockups="project.mockups || []"
                  @refresh="fetchProjectDetails"
                />
              </VWindowItem>

              <VWindowItem value="4">
                <UmlDiagramList :project-id="project.id"
                                :diagrams="project.uml_diagrams || []"
                                :can-manage="canManageProject"
                                @refresh="fetchProjectDetails"
                />
              </VWindowItem>

              <VWindowItem value="5">
                <VCardActions class="pt-3 px-6">
                  <VSpacer/>
                  <VBtn v-if="canManageProject" color="primary" prepend-icon="tabler-refresh"
                        @click="handleGeneratePlan" :loading="processingAction">
                    {{ $t('projects.development_plan.actions.generate') }}
                  </VBtn>
                </VCardActions>

                <ProjectDevelopmentPlan :project-id="project.id"
                                        :development-plan="project.development_plan"
                                        :can-manage="canManageProject"
                                        @refresh="fetchProjectDetails"
                />
              </VWindowItem>

              <VWindowItem value="6">
                <ProjectExportsList :project-id="project.id"
                                    :exports="project.srs_exports || []"
                                    @refresh="fetchProjectDetails"
                />
              </VWindowItem>

              <VWindowItem value="7">
                <ProjectRoles :project-id="project.id" @updated="checkPermissions"
                              @refresh="fetchProjectDetails"
                />
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
                   :confirmationMsg="t('projects.delete_confirm.message')"
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
