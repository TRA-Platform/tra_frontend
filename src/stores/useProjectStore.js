import { defineStore } from 'pinia'
import instance from "@/services/api"

export const useProjectStore = defineStore({
  id: 'ProjectStore',
  state: () => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null
  }),
  actions: {
    async fetchProjects() {
      this.loading = true
      try {
        const response = await instance.get('/service/projects/')
        if (response.status === 200) {
          this.projects = response.data
          return { data: response.data, error: null }
        }
        return { data: [], error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch projects'
        return { data: [], error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchProjectById(id) {
      this.loading = true
      try {
        const response = await instance.get(`/service/projects/${id}/`)
        if (response.status === 200) {
          this.currentProject = response.data
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch project'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createProject(projectData) {
      this.loading = true
      try {
        const response = await instance.post('/service/projects/', projectData)
        if (response.status === 201) {
          if (this.projects.length) {
            this.projects.push(response.data)
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to create project'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateProject(id, projectData) {
      this.loading = true
      try {
        const response = await instance.put(`/service/projects/${id}/`, projectData)
        if (response.status === 200) {
          if (this.projects.length) {
            const index = this.projects.findIndex(p => p.id === id)
            if (index !== -1) {
              this.projects[index] = response.data
            }
          }
          if (this.currentProject && this.currentProject.id === id) {
            this.currentProject = response.data
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to update project'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteProject(id) {
      this.loading = true
      try {
        const response = await instance.delete(`/service/projects/${id}/`)
        if (response.status === 204) {
          if (this.projects.length) {
            this.projects = this.projects.filter(p => p.id !== id)
          }
          if (this.currentProject && this.currentProject.id === id) {
            this.currentProject = null
          }
          return { success: true, error: null }
        }
        return { success: false, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to delete project'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async generateRequirements(id) {
      this.loading = true
      try {
        const response = await instance.post(`/service/projects/${id}/generate_requirements/`)
        if (response.status === 202) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to generate requirements'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async exportSrs(id, format = 'pdf') {
      this.loading = true
      try {
        const response = await instance.post(`/service/projects/${id}/export_srs/`, { format })
        if (response.status === 202) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to export SRS'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async generatePlan(id) {
      this.loading = true
      try {
        const response = await instance.post(`/service/projects/${id}/generate_plan/`)
        if (response.status === 202) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to generate development plan'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async generateMockups(id) {
      this.loading = true
      try {
        const response = await instance.post(`/service/projects/${id}/generate_mockups/`)
        if (response.status === 202) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to generate mockups'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },
    async generateUserStories(projectId, requirementId = null) {
      this.loading = true
      try {
        const response = await instance.post(`/service/projects/${projectId}/generate_user_stories/`, {
          requirement_id: requirementId,
        })

        if (response.status === 202) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to generate User stories'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },
  }
})
