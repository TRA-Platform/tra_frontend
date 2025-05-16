import { defineStore } from 'pinia'
import instance from "@/services/api"

export const useProjectRoleStore = defineStore({
  id: 'ProjectRoleStore',
  state: () => ({
    projectRoles: {},
    loading: false,
    error: null
  }),
  actions: {
    async fetchProjectRoles(projectId) {
      this.loading = true
      try {
        const response = await instance.get(`/auth/projects/${projectId}/roles/`)
        if (response.status === 200) {
          this.projectRoles[projectId] = response.data
          return { data: response.data, error: null }
        }
        return { data: [], error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch project roles'
        return { 
          data: [], 
          error: error.response?.data || { detail: this.error }
        }
      } finally {
        this.loading = false
      }
    },

    async addProjectRole(projectId, roleData) {
      this.loading = true
      try {
        const response = await instance.post(`/auth/projects/${projectId}/roles/`, roleData)
        if (response.status === 201) {
          if (this.projectRoles[projectId]) {
            this.projectRoles[projectId].push(response.data)
          } else {
            this.projectRoles[projectId] = [response.data]
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to add project role'
        return { 
          data: null, 
          error: error.response?.data || { detail: this.error }
        }
      } finally {
        this.loading = false
      }
    },

    async updateProjectRole(projectId, roleId, roleData) {
      this.loading = true
      try {
        const response = await instance.put(`/auth/projects/${projectId}/roles/${roleId}/`, roleData)
        if (response.status === 200) {
          if (this.projectRoles[projectId]) {
            const index = this.projectRoles[projectId].findIndex(r => r.id === roleId)
            if (index !== -1) {
              this.projectRoles[projectId][index] = response.data
            }
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to update project role'
        return { 
          data: null, 
          error: error.response?.data || { detail: this.error }
        }
      } finally {
        this.loading = false
      }
    },

    async deleteProjectRole(projectId, roleId) {
      this.loading = true
      try {
        const response = await instance.delete(`/auth/projects/${projectId}/roles/${roleId}/`)
        if (response.status === 204) {
          if (this.projectRoles[projectId]) {
            this.projectRoles[projectId] = this.projectRoles[projectId].filter(r => r.id !== roleId)
          }
          return { success: true, error: null }
        }
        return { success: false, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to delete project role'
        return { 
          success: false, 
          error: error.response?.data || { detail: this.error }
        }
      } finally {
        this.loading = false
      }
    },

    clearProjectRoles(projectId) {
      if (projectId) {
        delete this.projectRoles[projectId]
      } else {
        this.projectRoles = {}
      }
    }
  }
}) 