import { defineStore } from 'pinia'
import instance from "@/services/api"

export const useRequirementStore = defineStore({
  id: 'RequirementStore',
  state: () => ({
    requirements: [],
    currentRequirement: null,
    loading: false,
    error: null
  }),
  actions: {
    async fetchRequirements(projectId = null) {
      this.loading = true
      try {
        let url = '/service/requirements/'
        if (projectId) {
          url += `?project=${projectId}`
        }

        const response = await instance.get(url)
        if (response.status === 200) {
          this.requirements = response.data
          return { data: response.data, error: null }
        }
        return { data: [], error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch requirements'
        return { data: [], error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchRequirementById(id) {
      this.loading = true
      try {
        const response = await instance.get(`/service/requirements/${id}/`)
        if (response.status === 200) {
          this.currentRequirement = response.data
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch requirement'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createRequirement(requirementData) {
      this.loading = true
      try {
        const response = await instance.post('/service/requirements/', requirementData)
        if (response.status === 201) {
          if (this.requirements.length) {
            this.requirements.push(response.data)
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to create requirement'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateRequirement(id, requirementData) {
      this.loading = true
      try {
        const response = await instance.put(`/service/requirements/${id}/`, requirementData)
        if (response.status === 200) {
          if (this.requirements.length) {
            const index = this.requirements.findIndex(r => r.id === id)
            if (index !== -1) {
              this.requirements[index] = response.data
            }
          }
          if (this.currentRequirement && this.currentRequirement.id === id) {
            this.currentRequirement = response.data
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to update requirement'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteRequirement(id) {
      this.loading = true
      try {
        const response = await instance.delete(`/service/requirements/${id}/`)
        if (response.status === 204) {
          if (this.requirements.length) {
            this.requirements = this.requirements.filter(r => r.id !== id)
          }
          if (this.currentRequirement && this.currentRequirement.id === id) {
            this.currentRequirement = null
          }
          return { success: true, error: null }
        }
        return { success: false, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to delete requirement'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createComment(requirementId, commentData) {
      this.loading = true
      try {
        const response = await instance.post('/service/requirement-comments/', {
          requirement: requirementId,
          text: commentData.text,
          status: commentData.status || 'active',
          responsible_user: commentData.responsibleUser || null
        })

        if (response.status === 201) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to create comment'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteComment(commentId) {
      this.loading = true
      try {
        const response = await instance.delete(`/service/requirement-comments/${commentId}/`)
        if (response.status === 204) {
          return { success: true, error: null }
        }
        return { success: false, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to delete comment'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})
